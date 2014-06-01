const KARTY = "img/karty/";

$(document).ready(function () {
	    var socket = io.connect('http://' + location.host);

function allowDrop(ev)
{
	ev.preventDefault();
}

function drag(ev)
{
	ev.dataTransfer.setData("Text",$(ev.target).attr("src"));
}

function drop(ev)
{
	ev.preventDefault();
	var data=ev.dataTransfer.getData("Text");
	$('img[src="'+data+'"]').remove();
	$(ev.target).children('img').attr("src",data);
//ev.target.appendChild(document.getElementById(data));
}

//drop na karte
function dropOnCard(ev) {
	ev.preventDefault();
	var data=ev.dataTransfer.getData("Text");
	$('img[src="'+data+'"]').remove();
	$(ev.target).attr("src",data);

	var regex = /img\/karty\/(.*).png/i;

	wylozona = regex.exec(data);
	wylozona = wylozona[1];
	socket.emit("KartaNaStole", wylozona);
}

function getPicsOfCards(cards) {
	var pics = new Array();

	$.each(cards, function (index, element) {
		pics.push(KARTY + element + ".png")
	})

	return pics;
}

//nowe karty gracza "w dloni"
function generateNewCardInHand(src) {
	var element = '<img src="'+src+'" draggable="true" ondragstart="drag(event)">';
	var currentCards = $('#proba').html();
	$('#proba').html(currentCards+element);
}

//nowa karta glowna
function newTopDeck(src) {
	var element = '<img src="'+src+'" ondrop="dropOnCard(event)" ondragover="allowDrop(event)">';
	$('#zrzut').html(element);
}


	//obsluga socketow
	    socket.on("Glowna karta", function(nowa){
	    	var topCardSource = getPicsOfCards(nowa);
			$.each(topCardSource, function (index, element) {
			newTopDeck(element);
			});
	    });

	    socket.on("Nowe karty", function(nowe){
	    	var sources = getPicsOfCards(nowe);
			$.each(sources, function (index, element) {
			generateNewCardInHand(element);
			});
	    });

	    $('#dobierz').on('click', function() {
		    socket.emit("Dobieram", true);
	    });

	    socket.on("Podaje", function(nowa){
	    	var sources = getPicsOfCards(nowa);
			$.each(sources, function (index, element) {
			generateNewCardInHand(element);
			});
	    });

	    socket.on("Zalogowani gracze", function(players){
	    	console.log(players);
	    	for(var i=0; i<players.length; i++){
	    		$("tr[player-id="+(i+1)+"]").children(".player").html(players[i].username);
	    	}
	    });
});