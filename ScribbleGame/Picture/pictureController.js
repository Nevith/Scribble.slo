var socket = null;

function picture_pictureLoad(webSocketInstance){
  socket = webSocketInstance;

  socket.on("getCanvasPicture", function(data){
    $("#pictureCanvasImage").prop("src", data);
  });
}
