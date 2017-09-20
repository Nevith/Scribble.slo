var socket = null;

function lobby_lobbyLoad(webSocketInstance){
  socket = webSocketInstance;

  socket.on("updateUsers", function(data){
    var orderedListHTML = '';
    for(var i=0; i<data.length; i++){
      var username = data[i].username;
      var hash = "[#" + data[i].countID + "]"
      if(username.length > 6)
        username = username.substring(0,6);
      orderedListHTML += "<li style='background-color: rgba(215,200,255, 0.15)' class='list-group-item'><strong>"+username+"</strong><small>"+hash+"</small></li>"
    }
    $("#lobbyPlayers").html(orderedListHTML);
  });

  $("#adminForm").submit(function(e){
    e.preventDefault();
    socket.emit("loadGame", $("#numberOfRounds").val());
  });
}
