var socket = null

function logIn(){
	socket = io.connect();
	socket.emit("newUser", $("#nameInput").val(), function(isNameNotTaken){
		if(isNameNotTaken){
			$("#logInDiv").hide();
			$("#lobbyContainer").load("ScribbleGame/Lobby/lobby.html", function(){
				lobby_lobbyLoad(socket);
				socket.emit("newUserLoaded", function(isUserAdmin){
					if(isUserAdmin){
						$("#adminForm").show();
					}
					else{
						$("#adminForm").hide();
					}
				});
			});
		}
		else{
			alert("Takšno ime že obstaja ali pa igra že poteka");
		}
		});
		$("#nameInput").val("");
		socket.on("gameStart", gameStart);
}


function gameStart(){
	$("#lobbyContainer").hide();
	$("#canvasContainer").load("ScribbleGame/Canvas/canvas.html", function(){
		canvas_canvasLoad(socket);
	});
	$("#chatContainer").load("ScribbleGame/Chat/guessChat.html", function(){
		chat_guessChatLoad(socket);
		socket.emit("newUserLoaded")
	});
}
