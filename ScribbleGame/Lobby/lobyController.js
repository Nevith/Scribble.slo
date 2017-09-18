var socket = null;

function lobby_lobbyLoad(webSocketInstance){
  socket = webSocketInstance;

  socket.on("updateUsers", function(data){
    var orderedListHTML = '';
    for(var i=0; i<data.length; i++){
      orderedListHTML += "<li style='background-color: rgba(215,200,255, 0.3)' class='list-group-item'><strong>"+data[i]+"</strong></li>"
    }
    $("#lobbyPlayers").html(orderedListHTML);
  });

  $("#adminForm").submit(function(e){
    e.preventDefault();
    socket.emit("loadGame", $("#numberOfRounds").val());
  });
}
