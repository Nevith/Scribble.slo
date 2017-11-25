var socket = null;

function picture_pictureLoad(webSocketInstance){
  socket = webSocketInstance;

  socket.on("getCanvasPicture", function(data){
    data = (CryptoJS.AES.decrypt(data, socket.key));
    $("#pictureCanvasImage").prop("src", data.toString(CryptoJS.enc.Utf8));
  });
}
