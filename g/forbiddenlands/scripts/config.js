var roomConfig = {
    gameName:'Svärdets Sång',
    gameRoot:'forbiddenlands',
    enemyNamePrefix : '',
    enemyNameSuffix : ' ( SLP )',
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

var quarterDay = {};
quarterDay[0] = 'Morgon';
quarterDay[1] = 'Dag';
quarterDay[2] = 'Kväll';
quarterDay[3] = 'Natt';

var fighterInitiative = [1,2,3,4,5,6,7,8,9,10];
var artefactDiceSuccess = [0,0,0,0,0,1,1,2,2,3,3,4];

var CARD_IMAGE_ROOT_URL = 'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2F';

var fightingCards = {};
fightingCards[typeOfCards.attackera] = { 'name': 'Attack', 'src': CARD_IMAGE_ROOT_URL +  'attackera.jpg?alt=media&token=3e07ec6f-8e32-44f7-86f0-02bdb9e57922' };
fightingCards[typeOfCards.avvakta] = { 'name': 'Avvakta', 'src': CARD_IMAGE_ROOT_URL + 'avvakta.jpg?alt=media&token=37b4cedd-1ff6-4714-bd6b-7747490b0d2e' };
fightingCards[typeOfCards.dubblera] = { 'name': 'Dubblera', 'src': CARD_IMAGE_ROOT_URL + 'dubblera.jpg?alt=media&token=dcb20707-f798-48c7-b134-bb6384d5f471' };
fightingCards[typeOfCards.forbereda] = { 'name': 'Förbereda', 'src': CARD_IMAGE_ROOT_URL + 'forbereda.jpg?alt=media&token=49ab0e81-f254-43e6-b662-02879afacbc7' };
fightingCards[typeOfCards.forsvara] = { 'name': 'Försvara', 'src': CARD_IMAGE_ROOT_URL+ 'forsvara.jpg?alt=media&token=189d8484-3238-41b2-a359-03e2394d1e3d' };
fightingCards[typeOfCards.hindra] = { 'name': 'Hindra', 'src': CARD_IMAGE_ROOT_URL+ 'hindra.jpg?alt=media&token=373be894-7f57-4537-b895-25136c26249a' };
fightingCards[typeOfCards.manovrera] = { 'name': 'Manövrera', 'src': CARD_IMAGE_ROOT_URL +  'manovrera.jpg?alt=media&token=4d6ea3b6-ab7a-49d7-842b-81815628520a' };
fightingCards[typeOfCards.baksida] = { 'name': 'Baksida', 'src': CARD_IMAGE_ROOT_URL +  'baksida.jpg?alt=media&token=53401f1f-aee5-43bc-89d0-a0a06ca6fe5c' };


