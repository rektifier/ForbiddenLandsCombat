var firebaseConfig = {
    apiKey: "AIzaSyAB0e1I8EbIuBqXQmXOzegJFJgOx76_PVE",
    authDomain: "fbcombat-11ea1.firebaseapp.com",
    databaseURL: "https://fbcombat-11ea1.firebaseio.com",
    projectId: "fbcombat-11ea1",
    storageBucket: "fbcombat-11ea1.appspot.com",
    messagingSenderId: "984580986109"
};
firebase.initializeApp(firebaseConfig);

var database = firebase.database();
var roomConfig = {
    enemyNamePrefix : '',
    enemyNameSuffix : ' ( enemy )',
    maxNrOfPlayersInFight : 2,
    diceApiUrl:'https://rolz.org/api/?'
};

var typeOfCards = {
    attackera:'attackera',
    avvakta:'avvakta',
    dubblera:'dubblera',
    forbereda:'forbereda',
    forsvara:'forsvara',
    hindra:'hindra',
    manovrera:'manovrera',
    baksida:'baksida'
}

var roomDice = {

}

var fightingCards = {};
fightingCards[typeOfCards.attackera] = { 'name': 'Attack', 'src':'images/attackera.jpg' };
fightingCards[typeOfCards.avvakta] = { 'name': 'Avvakta', 'src':'images/avvakta.jpg' };
fightingCards[typeOfCards.dubblera] = { 'name': 'Dubblera', 'src':'images/dubblera.jpg' };
fightingCards[typeOfCards.forbereda] = { 'name': 'Förbereda', 'src':'images/forbereda.jpg' };
fightingCards[typeOfCards.forsvara] = { 'name': 'Försvara', 'src':'images/forsvara.jpg' };
fightingCards[typeOfCards.hindra] = { 'name': 'Hindra', 'src':'images/hindra.jpg' };
fightingCards[typeOfCards.manovrera] = { 'name': 'Manövrera', 'src':'images/manovrera.jpg' };
fightingCards[typeOfCards.baksida] = { 'name': 'Baksida', 'src':'images/baksida.jpg' };