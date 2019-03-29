// Dice rolls
// dependencies:
//    Moment
//    LZString ( compression )
//    Firebase
//
// constructor:
//    rollsDbRef = a ref to firebase rolls/adventureId
//    maxNrOfDiceRollsInList = max nr of rolls to show in list
//    startOfDay = fromDate to listen for
//    appendMsgFunction = delegate function to run when a new roll arrives
//
var DiceRolls = function (rollsDbRef,maxNrOfDiceRollsInList,startOfDay, appendMsgFunction) {


    //set up listeners
    //
    rollsDbRef.orderByChild('c').limitToLast(maxNrOfDiceRollsInList).startAt(startOfDay).on('child_added', function(snapshot) {
        console.log('DiceRolls.rollsDbRef.orderByChild(c).startAt(startOfDay).on(child_added');
        var mess = snapshot.val();

        var decompmessage = LZString.decompressFromUTF16(mess.m);
        var decompowner = LZString.decompressFromUTF16(mess.o);

        appendMsgFunction(decompmessage,decompowner,mess.c,true);
    });



    this.sendDiceRoll = function (text, owner) {
        console.log('Send dice roll to db.');

        if(rollsDbRef === undefined){
            console.error('The Firebase object "database" is undefined in diceRolls.sendDiceRoll');
            return;
        }

        var compressed = LZString.compressToUTF16(text);
        var coOwner = LZString.compressToUTF16(owner);

        //database.ref('rolls/' + adventureId).push({
        rollsDbRef.push({
            c: firebase.database.ServerValue.TIMESTAMP,
            m: compressed,
            o: coOwner
        }).catch(function (error) {
            console.error('Error writing new message to Firebase Database', error);
        });
    }

    this.cleanOldData = function () {
        console.log('Clean old db data.');

        if(rollsDbRef === undefined){
            console.error('The Firebase object "database" is undefined in diceRolls.cleanOldData');
            return;
        }
        //clear old adventure data 24 hours ago
        //        
        var cutOff = moment().subtract(24, 'hours').valueOf();
        rollsDbRef.orderByChild('c').endAt(cutOff).once("value").then(function (snapshot) {
            if (snapshot.exists()) {
                console.log('we have old dice rolls. removing..');
                snapshot.ref.remove();
            }
        });
        
    }

}
