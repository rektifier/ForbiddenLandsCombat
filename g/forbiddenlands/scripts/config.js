var roomConfig = {
    enemyNamePrefix : '',
    enemyNameSuffix : ' ( enemy )',
    maxNrOfPlayersInFight : 2,
    maxNrOfDiceRollsInList : 35
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


var fighterInitiative = [1,2,3,4,5,6,7,8,9,10];
var artefactDiceSuccess = [0,0,0,0,0,1,1,2,2,3,3,4];

var fightingCards = {};
fightingCards[typeOfCards.attackera] = { 'name': 'Attack', 'src':'images/attackera.jpg' };
fightingCards[typeOfCards.avvakta] = { 'name': 'Avvakta', 'src':'images/avvakta.jpg' };
fightingCards[typeOfCards.dubblera] = { 'name': 'Dubblera', 'src':'images/dubblera.jpg' };
fightingCards[typeOfCards.forbereda] = { 'name': 'Förbereda', 'src':'images/forbereda.jpg' };
fightingCards[typeOfCards.forsvara] = { 'name': 'Försvara', 'src':'images/forsvara.jpg' };
fightingCards[typeOfCards.hindra] = { 'name': 'Hindra', 'src':'images/hindra.jpg' };
fightingCards[typeOfCards.manovrera] = { 'name': 'Manövrera', 'src':'images/manovrera.jpg' };
fightingCards[typeOfCards.baksida] = { 'name': 'Baksida', 'src':'images/baksida.jpg' };