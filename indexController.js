var socket = null
var infoBoxTimeout = null;
var isDrawingCur = false;

function logIn(){
	$("#yourNameContainer").html("Ime: "+ $("#nameInput").val());
	socket = io.connect();
	socket.emit("newUser", $("#nameInput").val(), function(isNameNotTaken){
		if(isNameNotTaken){
			$("#logInDiv").hide();
			$("#lobbyContainer").load("ScribbleGame/Lobby/lobby.html", function(){
				lobby_lobbyLoad(socket);
				socket.emit("newUserLoaded", function(isUserAdmin, isGameRuning){
					if(isGameRuning){
						gameStart()
						socket.emit("giveMeClue", function(data){
							$("#wordContainer").html("");
							for(var i=0; i< data.lng; i++){
								if(i == data.space)
									$("#wordContainer").append("[--]");
								else
									$("#wordContainer").append(" _ ");
							}
						});
					}
					else{
					if(isUserAdmin){
						$("#adminForm").show();
					}
					else{
						$("#adminForm").hide();
					}
					}
				});
			});
		}
		else{
			alert("Takšno ime že obstaja ali pa je igra polna");
		}
		});
		$("#nameInput").val("");
		socket.on("gameStart", gameStart);
		socket.on("newRound", newRound);
		socket.on("displayTimer", function(data){
			$("#timerContainer").html("Preostali čas: "+data);
		});
		socket.on("correctGuess", function(data){
			if(infoBoxTimeout)
				clearTimeout(infoBoxTimeout);
			$("#infoBox").show()
			$("#infoBox").html(data + " je ugotovil besedo!");
			infoBoxTimeout = setTimeout(function(){$("#infoBox").hide(); $("#infoBox").html(""); infoBoxTimeout = null;}, 3000);
		})
		socket.on("WordClueLength", function(data){
			if(!isDrawingCur){
				$("#wordContainer").html("");
				for(var i=0; i< data.lng; i++){
					if(i == data.space)
						$("#wordContainer").append("[--]");
					else
						$("#wordContainer").append(" _ ");
				}
			}
		})
		socket.on("gameEnded", function(data){
			$(document.body).load("ScribbleGame/EndScreen/endScreen.html", function(){
				for(var i = 0; i<data.length; i++){
					$("#endScreenDiv").append("<p>"+(i-(-1))+". "+data[i].username+": "+data[i].pointsScored+"</p>")
				}
			});
		})
		socket.on("theWordWas", function(data){
			if(!isDrawingCur){
				$("#wordContainer").html(data.toUpperCase());
			}
		});
		socket.on("givingExtraClue", function(data){
			if(!isDrawingCur){
				$("#wordContainer").html("");
				for(var i=0; i< data.lng; i++){
					if(i == data.space)
						$("#wordContainer").append("[--]");
					else if(data.clueSpot.indexOf(i) != -1)
						$("#wordContainer").append(" "+data.latters[data.clueSpot.indexOf(i)].toUpperCase()+" ");
					else
						$("#wordContainer").append(" _ ");
				}
			}
		})
}

function wordChosen(){
	var pickedWord = "";
	var radios = document.getElementsByName('wordPick');
	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			pickedWord = radios[i].value;
			//Only one radio can be logically checked, we don't check the rest
			break;
			}
	}
	$("#WordPicker").hide();
	$("#WordPicker").html("");
	$("#wordContainer").html("");
	$("#wordContainer").append(pickedWord.toUpperCase());
	socket.emit("wordPicked", pickedWord);
}

function gameStart(){
	$("#timerAndWordContainer").show();
	$("#lobbyContainer").hide();
	$("#chatContainer").load("ScribbleGame/Chat/guessChat.html", function(){
		chat_guessChatLoad(socket);
		socket.emit("newUserLoaded");
		newRound();
	});
};

	function newRound(){
		socket.emit("getRoundData", function(isDrawing, roundInformation){
			isDrawingCur = isDrawing;
			$("#roundInformationContainer").html("Runda: "+roundInformation)
			if(isDrawing){
				$("#canvasOrPictureContainer").load("ScribbleGame/Canvas/canvas.html", function(){
					canvas_canvasLoad(socket);
					var pickedWord = ""
					$("#wordContainer").html("");
					socket.emit("getWordChoices", function(data){
						$("#WordPicker").show();
						$("#WordPicker").html("");
						for(var i = 0; i<data.length; i++){
							var appendingHTML = '<input type="radio"  name="wordPick" value="'+data[i]+'"> '+data[i].toUpperCase()+' <br>'
							$("#WordPicker").append(appendingHTML);
						}
						$("#WordPicker").append("<br><button onclick='wordChosen()' class='btn btn-primary'>Izberi</button>")
					})
				});
			}
			else{
				$("#canvasOrPictureContainer").load("ScribbleGame/Picture/picture.html", function(){
					picture_pictureLoad(socket);
				});
			}
	});
};
