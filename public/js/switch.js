//switch dla kart i ich funkcji

switch(){
	case 'ace1':
	case 'ace2':
	case 'ace3':
	case 'ace4':
		var color = prompt("Podaj kolor 1,2,3,4", "");
		return {cardsToDraw: 1, cardLimiter: false, colorLimiter: color, wayOfPlay: 1};
		//as - zmiana koloru 
	break;
	case 'two1':
	case 'two2':
	case 'two3':
	case 'two4':
		return {cardsToDraw: 2, cardLimiter: ['two1', 'two2', 'two3', 'two4', 'three1', 'three2', 'three3', 'three4', 'king1', 'king3'], colorLimiter: false, wayOfPlay: 1};
		/*2 - jeżeli kolejny gracz nie ma 2 lub 3 w tym samym kolorze
		- dobiera 2 karty, jeśli ma i wyłoży to broni się i karty przechodzą na następnego sumując ich wartości*/
	break;
	case 'three1':
	case 'three2':
	case 'three3':
	case 'three4':
		return {cardsToDraw: 3, cardLimiter: ['two1', 'two2', 'two3', 'two4', 'three1', 'three2', 'three3', 'three4', 'king1', 'king3'], colorLimiter: false, wayOfPlay: 1};
		/*3 - jeżeli kolejny gracz nie ma 3 lub 2 w tym samym kolorze
		- dobiera 3 karty, jeśli ma i wyłoży to broni się i karty przechodzą na następnego sumując ich wartości*/
	break;
	case 'king1':
		return {cardsToDraw: 5, cardLimiter: ['two1', 'two2', 'two3', 'two4', 'three1', 'three2', 'three3', 'three4', 'king1', 'king3'], colorLimiter: false, wayOfPlay: -1};
	break;
	case 'king3':
		return {cardsToDraw: 5, cardLimiter: ['two1', 'two2', 'two3', 'two4', 'three1', 'three2', 'three3', 'three4', 'king1', 'king3'], colorLimiter: false, wayOfPlay: 1};
		/*Walet - gracz może zarządać dowolnej karty,
		jeśli następny gracz wyłoży waleta może zmienić rządanie*/
	break;
	case 'jack1':
	case 'jack2':
	case 'jack3':
	case 'jack4':
		var card = prompt('podaj karte', "");

		cards = new Array(card+'1', card+'2', card+'3', card+'4', 'jack1', 'jack2', 'jack3', 'jack4');

		return {cardsToDraw: 1, cardLimiter: cards, colorLimiter: false, wayOfPlay: 1};
	break;
	case 'four1':
	case 'four2':
	case 'four3':
	case 'four4':
		return {cardsToDraw: 1, cardLimiter: false, colorLimiter: false, wayOfPlay: 2};
	break;
}