var scnX;
var scnY;
var isDrawingShape=false;
var mousedown=false;
var socket = null;

var brushDrawings = 0;

function canvas_canvasLoad(webSocketInstance){
	socket = webSocketInstance;
	var canv=document.getElementById("canv");
	canv.width = 600;
	canv.height = 600;
	canv.style.width = "600px";
	canv.style.height = "600px";
	//Basic set-up for drawing
	//We also save the initial coordinates
	canv.onmousedown=function(m){mousedown=true; scnX=m.clientX -$("#canv").offset().left; scnY=m.clientY -$("#canv").offset().top}
	canv.onmousemove=draw;
	canv.onmouseup=function(m){mousedown=false; isDrawingShape=true;}
	$("#clearButton").click(canvas_clearCanvas);
	canvas_brushDeselected();
	var updateCanvasTime = function(){
		socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL())
		setTimeout(updateCanvasTime, 5000);
	};
	//updateCanvasTime();
}

function draw(m){
	//Sets up basic data for the drawing function
	if(mousedown || isDrawingShape){
	//Getting the desired shape
	var radios = document.getElementsByName('drawing');
	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			var drawing = radios[i].value;
			//Only one radio can be logically checked, we don't check the rest
			break;
			}
		}
		//Getting the position of the cursor and accounting for the position of the canvas
		var x=m.clientX -$("#canv").offset().left;
		var y=m.clientY -$("#canv").offset().top;
		var fat=document.getElementById("size").value;
		//Defining the canvas
		var canv=document.getElementById("canv");
		var ctx=canv.getContext("2d");
		//Getting the colors
		ctx.fillStyle=document.getElementById("color_fill").value;
		ctx.strokeStyle=document.getElementById("color_stroke").value;
	}
	//If we called the function while the mouse is held down(only used for drawing with the brush)
	if(mousedown){
		//Basic brush
		if(drawing=="brush"){
		//Getting the desired shape
		var radios = document.getElementsByName('brush');
		for (var i = 0, length = radios.length; i < length; i++) {
			if (radios[i].checked) {
				var shapeOfBrush = radios[i].value;
				//Only one radio can be logically checked, we don't check the rest
				break;
				}
			}
		//Getting the desired sizeOfBrush
		var big=document.getElementById("size2").value;
		//Starting
		ctx.beginPath();
			//Normal Brush
			if(shapeOfBrush=="norm"){
				ctx.moveTo(x,y);
				ctx.lineTo(x-big/2, y+big/2);
				ctx.lineTo(x+big/2, y-big/2);
			}
			//Rectangular brush
			else if(shapeOfBrush=="rec"){
				ctx.rect(x,y,big, big*2);
			}
			//Square brush
			else if(shapeOfBrush=="sqr"){
				ctx.rect(x,y,big, big);
			}
			//Circle Brush
			else if(shapeOfBrush=="cir"){
				ctx.arc(x,y, big,0,2*Math.PI);
			}
		//Drawing
		brushDrawings++;
		canvas_finishDrawing(ctx, fat, (brushDrawings%30 == 0));
		}
	}
	//We called the function by letting go of the mouse(Used for shapes)
	else if(isDrawingShape){
		//Circle
		if(drawing=="circle"){
			ctx.beginPath();
			var lengthOF=Math.sqrt(Math.pow((scnX-x),2)+Math.pow((scnY-y),2));
			ctx.arc((scnX+x)/2,(scnY+y)/2,lengthOF/2,0,2*Math.PI);
			canvas_finishDrawing(ctx, fat, true);
		}
		//Rectangle
		else if(drawing=="rectangle"){
			ctx.beginPath();
			var lengthOFX=(x-scnX);
			var lengthOFY=(y-scnY);
			ctx.rect(scnX,scnY,lengthOFX, lengthOFY);
			canvas_finishDrawing(ctx, fat, true);
		}
		//Square
		else if(drawing=="square"){
			ctx.beginPath();
			var lengthOF=(x-scnX);
			//So we can also set a precise direction for the square
			if((y-scnY)*lengthOF>0)
				ctx.rect(scnX,scnY,lengthOF, lengthOF);
			else
				ctx.rect(scnX,scnY,lengthOF, -lengthOF);
			canvas_finishDrawing(ctx, fat, true);
		}
		//Line
		else if(drawing=="line"){
			ctx.beginPath();
			var lengthOFX=(x-scnX);
			var lengthOFY=(y-scnY);
			ctx.moveTo(scnX,scnY);
			ctx.lineTo(x, y);
			canvas_finishDrawing(ctx, fat, true);
		}
		isDrawingShape = false;
	}
}

function canvas_brushSelected(){
	socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());
	$("#Extra").show();
	}
function canvas_brushDeselected(){
	socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());
	$("#Extra").hide();
	}
function canvas_clearCanvas(){
	var canv=document.getElementById("canv");
	var ctx=canv.getContext("2d");
	ctx.clearRect(0, 0, canv.width, canv.height);
	ctx.beginPath();
	socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());
}
function canvas_finishDrawing(ctx, brushWidth, updateImg){
	ctx.lineWidth = brushWidth;
	ctx.stroke();
	ctx.fill();
	if(updateImg)
		socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());
}
