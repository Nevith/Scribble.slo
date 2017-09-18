var socket = null

function logIn(){
		$("#logInDiv").hide();
		socket = io.connect();
		$("#canvasContainer").load("ScribbleGame/Canvas/canvas.html", function(){
			canvas_loadCanvas();
		});
		$("#chatContainer").load("ScribbleGame/Chat/guessChat.html", function(){
			chat_guessChatLoad(socket);
		});
}
