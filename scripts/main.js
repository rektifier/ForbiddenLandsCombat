
var currentUser;
var currentRoom;

var database = firebase.database();

var cards = {

};


// Shortcuts to DOM Elements.
//var messageForm = document.getElementById('message-form');
var loginDiv = document.getElementById('login');
var roomDiv = document.getElementById('room');
var roomselect = document.getElementById('login-rooms-select');
var usernameInput = document.getElementById('login-username-input');
var signInButton = document.getElementById('login-button');
var leaveRoomButton = document.getElementById('leave-room-button');
var latestMessage = '';
var userMessages = {};







function updateUserListOrder() {
    console.log('updateUserListOrder()');
    //populate new users object
    //
    var users = {};
    if ($("#userslist li").each(function (index) {
        var text = $(this).text();
        users[text] = { "name": text, "sortOrder": index }
    }));

    database.ref('rooms/' + currentRoom + '/users/').update(users);
}


function addUserToList(username) {
    console.log('addUserToList(' + username + ')');

    var exists = false;
    if ($("#userslist li").each(function (index) {
        var text = $(this).text();
        if (text == username) {
            exists = true;
        }
    }));

    console.log('addUserToList(' + username + ') exists: ' + exists);

    if (exists === false) {
        $("#userslist").append('<li class="list-group-item">' + username + '</li>');
    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');
    $('#userslist li').filter(function () { return $.text([this]) === username; }).remove();
}

function initGame() {



    //loadUsersList();

    //initUserListeners(currentUser);
    //
    var messageRef = database.ref('rooms/' + currentRoom + '/message/');
    var usersRef = database.ref('rooms/' + currentRoom + '/users/');
    var currentUserRef = database.ref('rooms/' + currentRoom + '/users/' + currentUser);




    //get user if we have one
    //
    currentUserRef.once("value").then(function (snapshot) {

        if (snapshot.exists()) {

            var user = snapshot.val();
            userMessages = user.messages;

        } else {
            database.ref('rooms/' + currentRoom + '/users/' + currentUser).set({ "name": currentUser, "messages": {}, "sortOrder": 99 });
        }

    });

    currentUserRef.onDisconnect().remove();



    messageRef.on('value', function (snapshot) {
        console.log('message.on');
        var message = snapshot.val();

        if (message !== latestMessage) {
            //showAlert.displayInfo(message);
            showAlert.displayInfo(message);
        }
    });

    //remove user when disconnected
    //
    usersRef.on("child_removed", function (snapshot) {
        console.log('child_removed');
        var removedUser = snapshot.val();

        removeUserFromList(removedUser.name);

        if (removedUser.name !== currentUser) {
            //showAlert.displayInfo(removedUser.name + " left the fight!");
            //showAlert.setInfo(removedUser.name + " left the fight!");
        }
    });

    //when a new user i connected
    usersRef.on("child_added", function (snapshot, prevChildKey) {
        console.log('child_added');
        var newUser = snapshot.val();

        //addUserToList(newUser.name);

        if (newUser.name !== currentUser) {
            //showAlert.displayInfo(newUser.name + " joined the fight!");
            //showAlert.setInfo(newUser.name + " joined the fight!");
        }

    });

    usersRef.orderByChild("sortOrder").on("value", function (querySnapshot) {
        console.log('sortOrder');

        $("#userslist").empty();

        querySnapshot.forEach(function (userSnapshot) {
            var user = userSnapshot.val();
            console.log(user);

            addUserToList(user.name);
        });

    });



}

//################ LOGIN  ###########################

function loadRoomDropdown() {
    database.ref('rooms').once("value").then(function (snapshot) {

        console.log('loadRoomDropdown()');

        //var key = snapshot.key; 
        if (snapshot.exists()) {

            snapshot.forEach(function (child) {
                var room = child.val();
                $("#login-rooms-select").append($("<option></option>").attr("value", room.name).text(room.name));
            });
        }
    });
}






function showRoom() {
    loginDiv.style.display = 'none';
    roomDiv.style.display = 'block';
}

// #################### LOGIN END ###############################

function initLogin() {
    loginDiv.style.display = 'block';
    roomDiv.style.display = 'none';

    loadRoomDropdown();

}


//$(function () {
$(document).ready(function () {

    var room = sessionStorage.getItem("room");
    var user = sessionStorage.getItem("user");

    if (room !== null) {
        currentRoom = room;
    }

    if (user !== null) {
        currentUser = user;
    }

    if (room !== null && user != null) {
        loginDiv.style.display = 'none';
        roomDiv.style.display = 'block';

        initGame();
        return;
    }

    roomDiv.style.display = 'none';

    loadRoomDropdown();


    $("#login-rooms-select").change(function () {

        var selectedRoom = $(this).children("option:selected").val();
        currentRoom = selectedRoom;

        sessionStorage.setItem("room", currentRoom);

        console.log("You have selected the room - " + selectedRoom);

    });

});

$(function () {

    firebase.auth().onAuthStateChanged(function (user) {

        if (user) {

            window.user = user;


        } else {
            window.location.href = "login.html";
        }
    });

    leaveRoomButton.addEventListener('click', function () {

        var user = firebase.auth().currentUser;
        if (user) {
            database.ref('rooms/' + currentRoom + '/users/' + user.displayName).remove();
        }

        firebase.auth().signOut();
        //removeUserFromRoom(currentUser);



        //clear local session data
        //
        sessionStorage.clear();
    });


    $("#info-alert").hide();
    $("#userslist").sortable({
        update: function (event, ui) {
            updateUserListOrder();
        }
    });
    $("#userslist").disableSelection();
    $("#droppable").droppable({
        drop: function (event, ui) {
            $(this)
                .addClass("ui-state-highlight")
                .find("p")
                .html("Dropped!");
        }
    });
});


