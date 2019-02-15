var config = {
    apiKey: "AIzaSyAB0e1I8EbIuBqXQmXOzegJFJgOx76_PVE",
    authDomain: "fbcombat-11ea1.firebaseapp.com",
    databaseURL: "https://fbcombat-11ea1.firebaseio.com",
    projectId: "fbcombat-11ea1",
    storageBucket: "fbcombat-11ea1.appspot.com",
    messagingSenderId: "984580986109"
};
firebase.initializeApp(config);

var database = firebase.database();
var roomConfig = {
    enemyNamePrefix : '',
    enemyNameSuffix : ' ( enemy )',
    maxNrOfPlayersInFight : 2
};

var fightingCards = {};
fightingCards['attackera'] = { 'name': 'Attack', 'src':'images/attackera.jpg' };
fightingCards['avvakta'] = { 'name': 'Avvakta', 'src':'images/avvakta.jpg' };
fightingCards['dubblera'] = { 'name': 'Dubblera', 'src':'images/dubblera.jpg' };
fightingCards['forbereda'] = { 'name': 'Förbereda', 'src':'images/forbereda.jpg' };
fightingCards['forsvara'] = { 'name': 'Försvara', 'src':'images/forsvara.jpg' };
fightingCards['hindra'] = { 'name': 'Hindra', 'src':'images/hindra.jpg' };
fightingCards['manovrera'] = { 'name': 'Manövrera', 'src':'images/manovrera.jpg' };
fightingCards['baksida'] = { 'name': 'Baksida', 'src':'images/baksida.jpg' };