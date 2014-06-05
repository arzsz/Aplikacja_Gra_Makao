/*jshint globalstrict: true, devel: true, browser: true, jquery: true */
/*global io*/

var KARTY = "img/karty/";
var socket = io.connect('http://' + location.host);
var currentModifiers = {cardsToDraw:1,
                        cardLimiter: false,
                        colorLimiter: false,
                        wayOfPlay:1
                       };
var MyName = '';
var DragNDropFlag = false;


function cardsModifiers(cardName){
	//switch dla kart i ich funkcji
	switch(cardName){
        case 'as1':
		case 'as2':
		case 'as3':
		case 'as4':
		var color = prompt("Podaj kolor karty (karo-1, kier-2, pik-3, trefl-4):", "");
		socket.emit("Color", color);
		return {cardsToDraw: 1, cardLimiter: false, colorLimiter: color, wayOfPlay: 1};
		//as - zmiana koloru
		case 'dwa1':
		case 'dwa2':
		case 'dwa3':
		case 'dwa4':
		return {cardsToDraw: 2, cardLimiter: ['dwa1', 'dwa2', 'dwa3', 'dwa4', 'trzy1', 'trzy2', 'trzy3', 'trzy4'], colorLimiter: false, wayOfPlay: 1};
		/*2 - jeżeli kolejny gracz nie ma 2 lub 3 w tym samym kolorze
		- dobiera 2 karty, jeśli ma i wyłoży to broni się i karty przechodzą na następnego sumując ich wartości*/
		case 'trzy1':
		case 'trzy2':
		case 'trzy3':
		case 'trzy4':
		return {cardsToDraw: 3, cardLimiter: ['dwa1', 'dwa2', 'dwa3', 'dwa4', 'trzy1', 'trzy2', 'trzy3', 'trzy4'], colorLimiter: false, wayOfPlay: 1};
		/*3 - jeżeli kolejny gracz nie ma 3 lub 2 w tym samym kolorze
		- dobiera 3 karty, jeśli ma i wyłoży to broni się i karty przechodzą na następnego sumując ich wartości*/
		case 'król1':
		return {cardsToDraw: 5, cardLimiter: ['król1', 'król2', 'król3', 'król4'], colorLimiter: false, wayOfPlay: -1};
		case 'król3':
		return {cardsToDraw: 5, cardLimiter: ['król1', 'król2', 'król3', 'król4'], colorLimiter: false, wayOfPlay: 1};
		/*Króle - 5 kart do przodu lub do tyłu*/
		case 'walet1':
		case 'walet2':
		case 'walet3':
		case 'walet4':
		var card = prompt('Podaj jaką kartę chcesz zarządać:', "");
		cards = new Array(card+'1', card+'2', card+'3', card+'4', 'walet1', 'walet2', 'walet3', 'walet4');
		socket.emit("Request", card);
		return {cardsToDraw: 1, cardLimiter: cards, colorLimiter: false, wayOfPlay: 1};
		/*Walet - gracz może zarządać dowolnej karty,
		jeśli następny gracz wyłoży waleta może zmienić rządanie*/
		case 'cztery1':
		case 'cztery2':
		case 'cztery3':
		case 'cztery4':
		return {cardsToDraw: 1, cardLimiter: false, colorLimiter: false, wayOfPlay: 2};
		default:
		return {cardsToDraw: 1, cardLimiter: false, colorLimiter: false, wayOfPlay: 1};
		}
	}

	function allowDrop(ev){
		ev.preventDefault();
	}

	function drag(ev){
		ev.dataTransfer.setData("Text",$(ev.target).attr("src"));
	}

//drop na karte
function dropOnCard(ev){
	ev.preventDefault();

	if(!DragNDropFlag){
		return false;
	}
	
	var data=ev.dataTransfer.getData("Text");	
	var regex = /img\/karty\/(.*).png/i;
	
	var wylozona = regex.exec(data);
	wylozona = wylozona[1];

	//id koloru i typ karty wykladanej
	var colorId = wylozona.substring(wylozona.length-1);
	var cardType = wylozona.substring(0, wylozona.length-1);
	
	//id koloru i typ karty na stole
	var cardOnTable = regex.exec($(ev.target).attr("src"));//zwraca dwa arg
	cardOnTable = cardOnTable[1];
	var tableColorId = cardOnTable.substring(cardOnTable.length-1);
	var tableCardType = cardOnTable.substring(0, cardOnTable.length-1);

	var cardColorOk = tableColorId == colorId;
	var cardTypeOk = tableCardType == cardType;
	var colorLimit = currentModifiers.colorLimiter === false;
	var cardLimit = currentModifiers.cardLimiter === false;

	if(currentModifiers.colorLimiter !== false){
		if(colorId != currentModifiers.colorLimiter){
			return false;
		}
	}

	if(currentModifiers.cardLimiter !== false){
		if(!$.inArray(wylozona, currentModifiers.cardLimiter)){
			//czy dana karta znajduje sie w tablicy
			return false;
		}
	}

	if((colorLimit) && (cardLimit)){//jesli nie ma ograniczen to
		if(!(cardColorOk || cardTypeOk)){ //sprawdz zgodnosc typu/koloru karty
			return false; //jak nie zgodne to false
		}
	}

	var modifiers = cardsModifiers(wylozona);

	$('img[src="'+data+'"]').remove();
	$(ev.target).attr("src",data);

	socket.emit("KartaNaStole", [wylozona]);
	socket.emit("NewModifiers", modifiers);
  
  var cardsInHand = $('#proba').children('img');

	if (cardsInHand.length == 0) {
		socket.emit("EndOfGame", MyName);
	}
}

function getPicsOfCards(cards){
	var pics = [];

	$.each(cards, function (index, element){
		pics.push(KARTY + element + ".png");//KARTY + nazwa + .png
	});

	return pics;
}

//nowe karty gracza "w dloni"
function generateNewCardInHand(src){
	var element = '<img src="'+src+'" draggable="true" ondragstart="drag(event)">';
	var currentCards = $('#proba').html();
	
	$('#proba').html(currentCards+element);
}

//nowa karta glowna
function newTopDeck(src){
	var element = '<img src="'+src+'" ondrop="dropOnCard(event)" ondragover="allowDrop(event)">';
	
	$('#zrzut').html(element);
}


$(document).ready(function (){

	//obsluga socketow
	socket.on("Glowna karta", function(nowa){
		var topCardSource = getPicsOfCards(nowa);

		$.each(topCardSource, function (index, element){
			newTopDeck(element);
		});
	});

	socket.on("Nowe karty", function(nowe){
		var sources = getPicsOfCards(nowe);

		$.each(sources, function (index, element){
			generateNewCardInHand(element);
		});
	});

	$('#dobierz').on('click', function(){
		socket.emit("Dobieram", currentModifiers.cardsToDraw);
	});

	socket.on("Podaje", function(nowa){
		var sources = getPicsOfCards(nowa);

		$.each(sources, function (index, element){
			generateNewCardInHand(element);
		});
	});

	socket.on("Zalogowani gracze", function(players){
		for(var i=0; i<players.length; i++){
			$("tr[player-id="+(i+1)+"]").children(".player").html(players[i].username);
		}
	});


	socket.on("YourName", function(player){
		MyName = player.username;
	});

	socket.on("CurrentModifiers", function(modifiers){
		currentModifiers = modifiers;
	});

	socket.on("ActivePlayer", function(activePlayer){
		if(MyName == activePlayer.username){
			DragNDropFlag = true;
			$("#dobierz").removeAttr('disabled');
		}
		else{
			DragNDropFlag = false;
			$("#dobierz").attr('disabled', 'true');
		}
	});

	socket.on("ColorRequest", function(color){
		alert("Zmiana koloru na "+color);
	});

	socket.on("CardRequest", function(card){
		alert("Gracz żąda "+card);
	});
  
    socket.on("Winner", function(win){
		alert("Wygrał gracz "+win);
		DragNDropFlag = false;
		$("#dobierz").attr('disabled', 'true');
	});
});