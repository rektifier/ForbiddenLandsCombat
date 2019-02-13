
var showAlert = function () { }
showAlert.displayInfo = function (message) {
    $("#alerttext").text(message);
    $("#info-alert").slideDown('slow').delay(2000).slideUp('slow')
}
showAlert.setInfo = function (message) {

    if (message !== latestMessage) {
        latestMessage = message;

        var newMessageRef = database.ref('rooms/' + currentRoom + '/messages/').push();
        newMessageRef.set({
            "sender": "robot",
            "message": message,
            "sentOn": Date.toString()
        });
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}