var socket = null;

function lobby_lobbyLoad(webSocketInstance){
  socket = webSocketInstance;

  socket.on("updateUsers", function(data){
    var orderedListHTML = '';
    //Fill in users
    for(var i=0; i<data.length; i++){
      var username = data[i].username;

      //Users ID
      var hash = "[#" + data[i].countID + "]"

      //If username is to long
      if(username.length > 6)
        username = username.substring(0,6);

      //Create <li> tag for the user and add it to the html
      orderedListHTML += "<li style='background-color: rgba(215,200,255, 0.15)' class='list-group-item'><strong>"+username+"</strong><small>"+hash+"</small></li>"
    }
    //Add html to the players container
    $("#lobbyPlayers").html(orderedListHTML);
  });

  $("#adminForm").submit(function(e){
    e.preventDefault();
    socket.emit("loadGame", $("#numberOfRounds").val());
  });
}
