var roomConfig = {
    gameName:'Svärdets Sång',
    gameRoot:'forbiddenlands',
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
fightingCards[typeOfCards.attackera] = { 'name': 'Attack', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Fattackera.jpg?alt=media&token=3e07ec6f-8e32-44f7-86f0-02bdb9e57922' };
fightingCards[typeOfCards.avvakta] = { 'name': 'Avvakta', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Favvakta.jpg?alt=media&token=37b4cedd-1ff6-4714-bd6b-7747490b0d2e' };
fightingCards[typeOfCards.dubblera] = { 'name': 'Dubblera', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Fdubblera.jpg?alt=media&token=dcb20707-f798-48c7-b134-bb6384d5f471' };
fightingCards[typeOfCards.forbereda] = { 'name': 'Förbereda', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Fforbereda.jpg?alt=media&token=49ab0e81-f254-43e6-b662-02879afacbc7' };
fightingCards[typeOfCards.forsvara] = { 'name': 'Försvara', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Fforsvara.jpg?alt=media&token=189d8484-3238-41b2-a359-03e2394d1e3d' };
fightingCards[typeOfCards.hindra] = { 'name': 'Hindra', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Fhindra.jpg?alt=media&token=373be894-7f57-4537-b895-25136c26249a' };
fightingCards[typeOfCards.manovrera] = { 'name': 'Manövrera', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Fmanovrera.jpg?alt=media&token=4d6ea3b6-ab7a-49d7-842b-81815628520a' };
fightingCards[typeOfCards.baksida] = { 'name': 'Baksida', 'src':'https://firebasestorage.googleapis.com/v0/b/fbcombat-11ea1.appspot.com/o/g%2Fforbiddenlands%2Fcards%2Fbaksida.jpg?alt=media&token=53401f1f-aee5-43bc-89d0-a0a06ca6fe5c' };


