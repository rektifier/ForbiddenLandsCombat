var isRoomAdmin = false;
var currentUser;
var currentAdventureMember;
var adventureId;
var currentAdventure;
// var adminAction = '';
// var isInCombat = false;
var currentCharacterSheet;

var latestDiceRoll = null;
// var latestDiceRoll = {
//     message:'',
//     owner:'',
//     createdOn:''
// };



// var stat_attribute = {
//     category:'attribute',
//     name:'dexterity',
//     type:'physical',
//     value:'5'
// }

// var stat_stress = {
//     category:'stress',
//     type:'physical',
//     value:'-'
// }

// var stat_feature = {
//     category:'feature',
//     name:'Bara ett ben..',
//     type:'physical',
//     value:'-'
// }

// var stat_trauma = {
//     category:'trauma',
//     createdday:2,
//     name:'Bruten fot',
//     type:'physical',
//     value:'7'
// }



function addUserToList(key, user) {

    console.log('addUserToList(' + user.displayName + ')');

    var exists = false;
    if ($("#userslist div").each(function (index) {

        var text = $(this).attr('id');
        if (text == key) {
            exists = true;
        }
    }));

    console.log('addUserToList(' + user.displayName + ') exists: ' + exists);

    if (exists === false) {

        if (isRoomAdmin) {
            $("#userslist").append('<div id="' + key + '" class="btn-group dropright"><button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + user.displayName + ' <small><i>( '+user.userName+' )</i></small></button><div class="dropdown-menu"><button class="dropdown-item" type="button">Add to fight</button><button class="dropdown-item" type="button">Send message</button><div class="dropdown-divider"></div><button class="dropdown-item btn-kick-member" data-uid="'+key+'" type="button">Kick from room</button></div></div>');
        } else {
            $("#userslist").append('<div id="' + key + '" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">' + user.displayName + ' <small><i>( '+user.userName+' )</i></small></div>');
        }

    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');

    var user = $("#userslist").find('div#' + username);
    if (user !== 'undefined' && user !== null && user.length > 0) {
        $(user).remove();
    }
}



function sendDiceRoll(text) {

    var owner = currentUser.displayName;
    if(currentAdventureMember !== undefined)
    {
        if(isEmpty(currentAdventureMember.displayName) === false){
            owner = currentAdventureMember.displayName;
        }
    }


    database.ref('/rolls/').push({

        adventureId:adventureId,
        createdOn: firebase.database.ServerValue.TIMESTAMP,
        message: text,
        owner: owner

    }).catch(function (error) {
        console.error('Error writing new message to Firebase Database', error);
    });
}


function createDiceRollsMessage(sender, message, createdOn, isLatest) {
    var messageTemplate = '';

    if (isLatest) {
        messageTemplate = '<li><div class="card bg-light mb-3"><div class="card-header">' + sender + ' <small><i>(' + createdOn + ')</i></small></div><div class="card-body"><p class="card-text">' + message + '</p></div></div></li>';
    }
    else {
        messageTemplate = '<li><div class="card"><div class="card-body small"><p class="card-text">' + sender + ' <small><i>' + createdOn + '</i></small><br>' + message + '</p></div></div></li>';
    }
    return messageTemplate;
}

function appendDiceRollsMessage(message, owner, createdOn, isLatest) {
    var messDate = moment(createdOn).format('YYYY-MM-DD kk:mm');
    var result = createDiceRollsMessage(owner, message, messDate, isLatest);

    if (latestDiceRoll !== null) {
        $('#dicerolls-messages li:first-child').remove();
        var resultOfLatest = createDiceRollsMessage(latestDiceRoll.owner, latestDiceRoll.message, latestDiceRoll.createdOn, false);
        $('#dicerolls-messages').prepend(resultOfLatest);
    }

    latestDiceRoll = { message: message, owner: owner, createdOn: messDate };

    $('#dicerolls-messages').prepend(result);
}

function createTraumaItem(key,value,name){
    var notation = '1M';    
    if(value <= 3){
        notation = '1D';
    }else if(value <= 6){
        notation = '1V';
    }
    return '<li id="'+key+'" class="list-group-item py-1 list-group-item-danger"><input type="checkbox" data-value="'+value+'"> '+name+'('+notation+')<button type="button" class="close"><span class="delete-trauma" aria-hidden="true">&times;</span></button></li>';
}

function createFeatureItem(key,value,name){

    var colorClass = 'danger';
    if(value === '+'){
        colorClass = 'success';
    }

    return '<li id="'+key+'" class="list-group-item py-1 list-group-item-'+colorClass+'"><input type="checkbox" data-typeofdice="'+value+'"> '+name+'<button type="button" class="close"><span class="delete-feature" aria-hidden="true">&times;</span></button></li>';
}

function printStat(key,stat,eventtype){

    switch (stat.category) {

        case 'attribute':
            $("#attribute_"+stat.type+'_'+stat.name).html(stat.value);
            $('[name="radio'+stat.name+'"]').removeAttr('checked');
            $("input[name=radio"+stat.name+"][value=" + stat.value + "]").prop('checked', true);
            $('#th_'+stat.type + '_'+stat.name).data('statvalue',stat.value); //setter  img_physical_vitality
           
            break;

        case 'stress':

            //uncheck all stress
            //
            $('.checkbox-stress-'+stat.type).prop("checked",false); 
           
            //set right amount of stress
            //
            if(isEmpty(stat.value) === false && stat.value > 0)
            {
                for (let index = 1; index <= stat.value; index++) {                
                    $('#'+stat.type+'-stress-'+index).prop("checked", true);
                } 
            }           
            break;
        
        case 'trauma':

            switch (eventtype) {
                case 'removed':
                    $('#'+key).remove();     
                break;

                case 'added':
                    var newTrauma = createTraumaItem(key,stat.value,stat.name);
                    $('#'+stat.type+'-trauma-items').append(newTrauma);
                break;     

                case 'changed':
                
                break;                    
            
                default:
                    break;
            }
            
            
            break;
        
        case 'feature':
            // physical-features-items
            switch (eventtype) {
                case 'removed':                
                    $('#'+key).remove();                
                break;

                case 'added':
                    var newFeature = createFeatureItem(key,stat.value,stat.name);
                    $('#'+stat.type+'-features-items').append(newFeature);
                
                break;         

                case 'changed':            
                break;                    
            
                default:
                    break;
            }
            
            break;                    
    
        default:
            break;
    }

}

function initGame() {

    console.log('init game');

    var diceRollsRef = database.ref('rolls').orderByChild('adventureId').equalTo(adventureId);
    var usersRef = database.ref('/adventures/' + adventureId + '/members/');

    if (isRoomAdmin === false) {        

        var currentUserRef = database.ref('/adventures/' + adventureId + '/members/' + currentUser.uid);
        currentUserRef.once('value', function (snapshot){
            if(snapshot.exists()){
                // var member = snapshot.val();
                currentAdventureMember = snapshot.val();
                $("#inputDisplayName").val(currentAdventureMember.displayName);
            }else{
                redirectToLogin();
            }
        });

        //currentUserRef.onDisconnect().remove();
        
        var characterSheetRef = database.ref('/charactersheets/' + adventureId +'/' + currentUser.uid);
        currentCharacterSheet = [];
        //get user if we have one
        //
        characterSheetRef.on('child_added',function (snapshot) {
            console.log('characterSheetRef.on.child.added');

            if (snapshot.exists()) {               
                    var userstat = snapshot.val();
                    var statkey = snapshot.key;
                    console.log(userstat);

                    currentCharacterSheet.push({key:statkey,stat:userstat});
                    printStat(statkey,userstat,'added');   
            }else{
                console.log('Could not find a charactersheet. Lets create one!');

                for (let index = 0; index < characterAttributes.length; index++) {
                    const stat = characterAttributes[index];

                    database.ref('/charactersheets/' + adventureId +'/' + currentUser.uid).push({

                        category:'attribute',
                        name: stat.name,
                        type: stat.type,
                        value: 1
                
                    }).catch(function (error) {
                        console.error('Error writing new message to Firebase Database', error);
                    });
                }
            }
        });

        characterSheetRef.on("child_removed", function (snapshot) {
            console.log('on.child_removed');
            var removedKey = snapshot.key;
            var removedStat = snapshot.val();

            removeCharacterSheetObject(removedKey);

            printStat(removedKey,removedStat,'removed');    
            
        });

        characterSheetRef.on("child_changed", function (snapshot) {
            console.log('characterSheetRef.on.child_changed');
            var changedStat = snapshot.val();
            var changedKey = snapshot.key;

            replaceCharacterObject(changedKey,changedStat);

            printStat(changedKey,changedStat,'changed');            
        });
        
    }

    
    diceRollsRef.limitToLast(roomConfig.maxNrOfDiceRollsInList).on('child_added', function (snapshot) {
        console.log('diceRollsRef.orderByChild(createdOn).limitToLast(roomConfig.maxNrOfDiceRollsInList).on(child_added');
        var mess = snapshot.val();

        appendDiceRollsMessage(mess.message, mess.owner, mess.createdOn, true);
    });


    //remove user when disconnected
    //
    usersRef.on("child_removed", function (snapshot) {
        console.log('on.child_removed');
        var removedUser = snapshot.val();
        var removedKey = snapshot.key;

        console.log(removedUser);

        removeUserFromList(removedKey);

        if (snapshot.key === currentUser.uid && isRoomAdmin === false) {
            redirectToLogin();
        }
    });
    

    usersRef.on("child_changed", function (snapshot) {
        console.log('on.child_changed');
        
        var userId = snapshot.key;
        var user = snapshot.val();

        console.log(user);

        
        if ($('#'+userId+':has(:button)').length > 0) {
            $('div#'+userId + ' button:first').text(user.displayName);
        }else{
            $("#"+userId).text(user.displayName);
        }


        if(userId === currentUser.uid){
            $("#inputDisplayName").val(user.displayName);
        }
        console.log(user);
    });

    usersRef.on("child_added", function (snapshot) {
        console.log('on.child_added');
        
        var userId = snapshot.key;
        var member = snapshot.val();
        console.log(member);

        if (!(isRoomAdmin && userId === currentUser.uid)) {
            addUserToList(userId, member);
            if(userId === currentUser.uid){
                $("#inputDisplayName").val(member.displayName);
            }
        }


    });

    

}

// //ToDo: kan ej ha flera index i samma struktur. se över datat så att 
// // vi kan rensa gamla dice rolls
// function cleanDBData() {
//     console.log('Clean old db data.')

//     //clear old room data 24 hours ago
//     //
//     var cutOff = moment().subtract(24, 'hours').valueOf();
//     database.ref('/rolls/').orderByChild('createdOn').endAt(cutOff).once("value").then(function (snapshot) {
//         if (snapshot.exists()) {
//             console.log('we have old dice rolls. removing..');
//             snapshot.ref.remove();
//         }
//     });
// }

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

function authStateObserver(user) {

    if (user) {
        console.log('User is logged in');
        currentUser = firebase.auth().currentUser;

        if(user.isAnonymous === true){
            redirectToLogin('Please register to play TEOTW.');
        };
        //load current adventure
        //
        database.ref('/adventures/' + adventureId).once("value").then(function (snapshot) {

            if (snapshot.exists()) {

                currentAdventure = snapshot.val();

                $(".adventure_owner").text(currentAdventure.owner);
                $(".adventure_title").text(currentAdventure.title);
                $(".adventure_game").text(currentAdventure.game);
                //load current user
                //
                // vi tar det här vid ett senare tillfälle..
                //cleanDBData();


                //is the logged in user the room admin?
                //
                if (currentAdventure.owner === currentUser.displayName) {
                    isRoomAdmin = true;

                    $("#settingsRoomOwner").val(currentAdventure.owner);
                    $("#settingsRoomName").val(currentAdventure.name);
                    $("#settingsRoomTitle").val(currentAdventure.title);

                    activateAdminFeatures();
                }

                initGame();

            } else {
                redirectToLogin();
            }
        });
    } else {
        console.log('User is not logged in');
        redirectToLogin();
    }

}

//admin fearur41
//
function activateAdminFeatures() {

    $(".admingroup").show();
    $("#add-enemy-button").prop("disabled", true);

    $('#add-enemy-input').keyup(validateAddEnemyButton);

    function validateAddEnemyButton() {

        if ($('#add-enemy-input').val().length > 0) {
            $("#add-enemy-button").prop("disabled", false);
        }
        else {
            $("#add-enemy-button").prop("disabled", true);
        }
    }

    $("#userslist").sortable({
        delay: 150,
        axis: "y",
        opacity: 0.8,
        connectWith: "ul",
        sort: function () {
            if ($(this).hasClass("cancel")) {
                $(this).sortable("cancel");
            }
        },
        update: function (event, ui) {
            console.log('userslist.sortable update event ');
            // if (adminAction === '') {
            //     updateDbWithUserListOrder();
            // }
        },
        // stop: function (event, ui) {
        //     console.log('userslist.sortable stop event ');
        //     if (adminAction === 'killFighter') {
        //         $(this).sortable("cancel");


        //     }

        // },
        receive: function (event, ui) {
            console.log('userslist.sortable stop event ');
        },
        remove: function (event, ui) {
            console.log('userslist.sortable remove event ');
        }

    }).disableSelection();

    $(".list-group-item").draggable({
        helper: 'clone',
        revert: 'invalid',
        connectToSortable: "#userslist"
    }).disableSelection();





    // ############## click events ##############
    //



    // //fight button in users list
    // //
    // $("#userslist").on('click', 'a', function () {

    //     console.log('click.btn-user-fight');

    //     var li = $(this).parent();

    //     $(li).toggleClass('incombat');

    //     var nrOfPlayersInFight = $("#userslist .incombat").length;
    //     if (nrOfPlayersInFight > roomConfig.maxNrOfPlayersInFight) {
    //         //toggle back the combat class
    //         //
    //         $(li).toggleClass('incombat');

    //     } else {
    //         var isInCombat = $(li).hasClass('incombat');
    //         var user = $(li).attr('id');

    //         firebase.database().ref().child(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/users/' + user).update({ inCombat: isInCombat });

    //         if (isInCombat === true) {
    //             //add user to combat
    //             firebase.database().ref().child(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/conflict/' + user).set({ "userid": user });
    //         } else {
    //             //remove user from combat
    //             firebase.database().ref().child(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/conflict/' + user).remove();
    //         }
    //     }

    //     console.log(li);
    // });

    $("#add-enemy-button").click(function (e) {

        console.log('add-enemy-button.click ');
        e.preventDefault();

        var enemyName = $("#add-enemy-input").val();

        //add enemy to room
        //
        database.ref(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/users/' + enemyName).set({ "name": roomConfig.enemyNamePrefix + enemyName + roomConfig.enemyNameSuffix, "sortOrder": 99, "inCombat": false }).then(() => {
            $("#add-enemy-input").val('');
        });
    });
}

function setCharacterSheetValue(category,type,name,value){

    for (var item in currentCharacterSheet) {
        if (currentCharacterSheet[item].stat.category == category 
            && currentCharacterSheet[item].stat.type == type
            && currentCharacterSheet[item].stat.name == name ) {

                currentCharacterSheet[item].stat.value = value;
                return;
            }
    }

    //is it new?
    var newStat = {};
    if(isEmpty(category) == false && category !== undefined)
        newStat.category = category;

    if(isEmpty(type) == false && type !== undefined)
        newStat.type = type;
    
    if(isEmpty(name) == false && name !== undefined)
        newStat.name = name;
    
    if(isEmpty(value) == false && value !== undefined)
        newStat.value = value;      

    var newRef = database.ref('/charactersheets/' + adventureId + '/' + currentUser.uid).push();
    
    currentCharacterSheet.push({key:newRef.key,stat:newStat});


    newRef.set(newStat).catch(function (error) {
        console.error('Error writing new stat to charactersheet in Firebase Database', error);
    });
}

function addCharacterSheetObject(newStat){

    for (var item in currentCharacterSheet) {
        if (currentCharacterSheet[item].key == newStat.key) {
            return;
        }
      }

    var newRef = database.ref('/charactersheets/' + adventureId + '/' + currentUser.uid).push();
    
    currentCharacterSheet.push({key:newRef.key,stat:newStat});

    newRef.set(newStat).catch(function (error) {
        console.error('Error writing new stat to charactersheet in Firebase Database', error);
    });
}

function removeCharacterSheetObject(key){
    currentCharacterSheet = currentCharacterSheet.filter(function(returnableObjects){
        return returnableObjects.key !== key;
    });
}

function replaceCharacterObject(key,stat){
    for (var item in currentCharacterSheet) {
        if (currentCharacterSheet[item].key == key) {
            currentCharacterSheet[item].stat = stat;
            break; //Stop this loop, we found it!
        }
      }
}

function updateCharacterSheet(){

    console.log('update.charcter.sheet');

    var updates = {};
    currentCharacterSheet.forEach((change) => {
        updates[change.key] = change.stat;
    });

    database.ref('/charactersheets/' + adventureId + '/' + currentUser.uid).update(updates);
}

$(document).ready(function () {

    const roller = new DiceRoller();

    adventureId = getParameterByName('id');
    if(isEmpty(adventureId)){
        redirectToLogin();
    }

    $("#info-alert").hide();
    $(".admingroup").hide();

    // initialize Firebase
    initFirebaseAuth();

    $('#checkbox1').change(function() {
        if(this.checked) {
            var returnVal = confirm("Are you sure?");
            $(this).prop("checked", returnVal);
        }
        $('#textbox1').val(this.checked);        
    });

    //leave the room
    //
    $("#leave-room-button").click(function (e) {
        console.log('leave room');
        e.preventDefault();

        $("body").css("cursor", "progress");

        //if its a regular user, remove user from the room
        //and redirect to index
        //
        if (isRoomAdmin === false) {
            //database.ref('/adventures/' + currentAdventure.name + '/members/' + currentUser.displayName).remove().then();
        }
        redirectToLogin();
    });

    $("#btn-throw-dice").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();
        var positiveDice = [];
        var negativeDice = [];

        //get nr of red
        var nrOfPositive = $('input[name=dice-positive]:checked').val();
        var nrOfNegative = $('input[name=dice-negative]:checked').val();
        var totalResult = '';

        if (isEmpty(nrOfPositive) == false && nrOfPositive !== "0") {
            diceRollPositive = new DiceRoll(nrOfPositive);
            diceRollPositive.rolls[0].forEach(function (result) {
                positiveDice.push(result);
            });

            totalResult = 'Positive: [' + positiveDice.join(",") + ']';
        }

        if (isEmpty(nrOfNegative) == false && nrOfNegative !== "0") {
            diceRollNegative = new DiceRoll(nrOfNegative);
            diceRollNegative.rolls[0].forEach(function (result) {
                negativeDice.push(result);
            });
            totalResult += '<br>Negative: [' + negativeDice.join(",") + ']';
        }

        if (positiveDice.length > 1 && negativeDice.length > 1) {
            var p = positiveDice.length
            while (p--) {
                var n = negativeDice.length;
                while (n--) {
                    if (positiveDice[p] == negativeDice[n]) {
                        positiveDice.splice(p, 1);
                        negativeDice.splice(n, 1);
                    }
                }
            }
            totalResult += '<br><br>Result: Positive [' + positiveDice.join(",") + ']<br>Stress: ' + negativeDice.length + ' point';
        }

        if (totalResult.length > 0) {
            sendDiceRoll(totalResult);
        }

        //reset all active labels
        //
        $(".btn-group input").prop("checked", false);
        $(".btn-group").find(">:first-child").addClass('active').siblings().removeClass('active');
        $(".btn-group").find(">:first-child").children('input').first().prop("checked", true);
    });

    $("#btn-attributes-save").click(function (e) {
        console.log('btn-attributes-save.click');
       e.preventDefault();        

        var characterName = $("#inputDisplayName").val();

        database.ref('/adventures/' + adventureId + '/members/' + currentUser.uid).update({ displayName: characterName});

        var radiovitality = $("input[name='radiovitality']:checked").val();
        var radiodexterity = $("input[name='radiodexterity']:checked").val();
        var radiowillpower = $("input[name='radiowillpower']:checked").val();
        var radiologic = $("input[name='radiologic']:checked").val();        
        var radiocharisma = $("input[name='radiocharisma']:checked").val();    
        var radioempathy = $("input[name='radioempathy']:checked").val();    

        //is character sheet initiated?
        //
        if(currentCharacterSheet)
        {
            setCharacterSheetValue('attribute','physical','vitality',radiovitality);
            setCharacterSheetValue('attribute','physical','dexterity',radiodexterity);

            setCharacterSheetValue('attribute','mental','willpower',radiowillpower);
            setCharacterSheetValue('attribute','mental','logic',radiologic);

            setCharacterSheetValue('attribute','social','charisma',radiocharisma);
            setCharacterSheetValue('attribute','social','empathy',radioempathy);
        }        

        updateCharacterSheet();
        
        $('#settingsModal').modal('toggle');
    });    



    $('.selectable_attribute').click(function (e) {
        
        console.log('.selectable_attribute.click')

        var statvalue = $(this).data('statvalue');
        var stattype = $(this).data('stattype');

        //remove all selected attribute
        //
        $('.selectable_attribute span').removeClass('selectedAttribute');

        console.log('value: ' + statvalue)
        console.log('type: ' + stattype)

        $(this).siblings('span:first').addClass('selectedAttribute');


    });

    $('label').click(function () {
        $('span', this).text(function (i, text) {
            return text === "-" ? "+" : "-";
        });
    });

    $('.btn-add-feature').click(function (e) {
        console.log('.btn-add-feature.clicked ');

        var featureName = $(this).parent('div').siblings('div').find('.input-add-feature').val();
        console.log(featureName);

        if(isEmpty(featureName) == false){
            var stattype = $(this).data('stattype');
            var positiveOrNegative = $(this).parent('div').siblings('div').find('.span-add-feature').text();

            console.log(stattype);
            console.log(positiveOrNegative);

            setCharacterSheetValue('feature',stattype,featureName,positiveOrNegative);        
            updateCharacterSheet();
        }
        else{
            e.stopPropagation();
        }
    });

    $('.btn-add-trauma').click(function (e) {
        console.log('.btn-add-trauma.clicked ');

        var traumaName = $(this).parent('div').siblings('div').find('.input-add-trauma').val();
        console.log(traumaName);

        if(isEmpty(traumaName) == false){
            var stattype = $(this).data('stattype');

            console.log(stattype);

            //get nr of stress to remove
            //            
            var nrOfStress = $('.checkbox-stress-'+stattype+':checked').length;

            setCharacterSheetValue('trauma',stattype,traumaName,nrOfStress);      
            setCharacterSheetValue('stress',stattype,undefined,0);     

            updateCharacterSheet();
        }
        else{
            e.stopPropagation();
        }
    });


    $('.checkbox-stress').click(function(e){
        console.log('checkbox-stress.click');

        var type = $(this).data('stattype');
        var category = $(this).data('category');

        var divider = '-';
        var id = $(this).prop('id');
        var lastIndex = id.lastIndexOf(divider)+1;
        var nrOfChecked = id.toString().substring(lastIndex);

        setCharacterSheetValue(category,type,undefined,nrOfChecked);        
        updateCharacterSheet();
    });


    //efterson knappen är dynamiskt genererad funkar inte jquery
    //
    $(document).on('click', '.btn-kick-member', function(e)
    {
        console.log('btn-kick-member.click');
        e.preventDefault();

        var uidToKick = $(this).data("uid");

        if(isEmpty(uidToKick) === false){
            database.ref('/adventures/' + adventureId + '/members/' + uidToKick).remove();
        }
    });

    $(document).on('click', '.delete-feature', function(e){
        console.log('delete-feature.click');
        e.preventDefault();

        var featureId = $(this).closest('li').attr('id');
        database.ref('/charactersheets/' + adventureId + '/' + currentUser.uid+'/'+featureId).remove();
    });

    $(document).on('click', '.delete-trauma', function(e){
        console.log('delete-trauma.click');
        e.preventDefault();

        var traumaId = $(this).closest('li').attr('id');
        database.ref('/charactersheets/' + adventureId + '/' + currentUser.uid+'/'+traumaId).remove();
    });


});