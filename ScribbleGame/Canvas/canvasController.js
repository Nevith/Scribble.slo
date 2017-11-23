var scnX;
var scnY;
var isDrawingShape=false;
var mousedown=false;
var socket = null;
var drawing = null;
var colorLayer;


//Initialize canvas basic funcionality
function canvas_canvasLoad(webSocketInstance){
	socket = webSocketInstance;

	var canv=document.getElementById("canv");
	canv.width = 600;
	canv.height = 600;
	canv.style.width = "600px";
	canv.style.height = "600px";

	//Basic set-up for drawing
	//We also save the initial coordinates
	canv.onmousedown=function(m){mousedown=true; scnX=m.clientX -$("#canv").offset().left; scnY=m.clientY -$("#canv").offset().top; /*paintBucketPaint(drawing=="paintBuckedTool");*/ socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());}
	canv.onmousemove=draw;
	canv.onmouseup=function(m){mousedown=false; isDrawingShape=true; socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());}
	$("#clearButton").click(canvas_clearCanvas);

	//Brush is not selected by default
	canvas_brushDeselected();
}

function draw(m){
	//Sets up basic data for the drawing function
	if(mousedown || isDrawingShape){
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
		ctx.fillStyle=document.getElementById("color_stroke").value;
		canvas_finishDrawing(ctx, big, false);
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

//When player selects the brush
function canvas_brushSelected(){
	drawing = "brush"
	//Update current canvas picture
	socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());

	$("#size").prop("disabled",true);
	$("#color_fill").prop("disabled",true);
	$("#color_fill").css("opacity","0.3");
	$("#size").css("opacity","0.3");
	$("#Extra").show();
}

//Player deselects the brush
function canvas_brushDeselected(e){
	//Getting the desired shape
	var radios = document.getElementsByName('drawing');
	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			drawing = radios[i].value;
			//Only one radio can be logically checked, we don't check the rest
			break;
			}
	}
	//Update current canvas picture
	socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());

	$("#size").prop("disabled",false);
	$("#size").css("opacity","1");
	if(drawing != "line"){
		$("#color_fill").prop("disabled",false);
		$("#color_fill").css("opacity","1");
	}
	else {
		$("#color_fill").prop("disabled",true);
		$("#color_fill").css("opacity","0.3");
	}
	$("#Extra").hide();
}

function canvas_clearCanvas(){
	var canv=document.getElementById("canv");
	var ctx=canv.getContext("2d");
	ctx.clearRect(0, 0, canv.width, canv.height);
	ctx.beginPath();
	socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());
}

//Adds the passed in canvas contex to the img and emits the data if desired
function canvas_finishDrawing(ctx, brushWidth, UpdateCanvasPicture){
	ctx.lineWidth = brushWidth;
	ctx.stroke();
	ctx.fill();
	if(UpdateCanvasPicture)
		socket.emit("updateCanvasPicture", document.getElementById("canv").toDataURL());
}


/* Trying to write an algorithm to have a paint bucket tool
function paintBucketPaint(doWeFill){
	console.log(doWeFill);
	if(!doWeFill) {return};
	var canvas = document.getElementById("canv");
	var pixelStack = [];
	var firstPixelData = null;
	var ctx=canv.getContext("2d");
	var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	pixelStack.push([scnX,scnY]);
	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	firstPixelData = ctx.getImageData(scnX,scnY,1,1);

	while(pixelStack.length){
		var newPos, x, y, pixelPos, reachLeft, reachRight;
		newPos = pixelStack.pop();
		var x = newPos[0];
		var y = newPos[1];

		pixelPos = (y*canvasWidth + x) * 4;
		while(y-- >= 0 && matchStartColor(pixelPos, firstPixelData, imgData))
			{
				pixelPos -= canvasWidth * 4;
			}
		pixelPos += canvasWidth * 4;
  	++y;
  	reachLeft = false;
  	reachRight = false;
		while(y++ < canvasHeight-1 && matchStartColor(pixelPos, firstPixelData, imgData)){
    	colorPixel(pixelPos,firstPixelData, imgData);
    	if(x > 0){
      	if(matchStartColor(pixelPos - 4, firstPixelData, imgData)){
        	if(!reachLeft){
          	pixelStack.push([x - 1, y]);
          	reachLeft = true;
        		}
      		}
      	else if(reachLeft){
        	reachLeft = false;
      	}
    	}
    	if(x < canvasWidth-1){
      	if(matchStartColor(pixelPos + 4, firstPixelData, imgData)){
        	if(!reachRight){
          	pixelStack.push([x + 1, y]);
          	reachRight = true;
        	}
      	}
      	else if(reachRight){
        	reachRight = false;
      	}
    	}
    	pixelPos += canvasWidth * 4;
  	}
	}
	ctx.putImageData(imgData, 0, 0);
	}

function matchStartColor(pixelPos, originalPixel, imgData){
	console.log(pixelPos);
  var r = imgData.data[pixelPos];
  var g = imgData.data[pixelPos+1];
  var b = imgData.data[pixelPos+2];
	console.log("r: "+ r +"g: "+g+"b"+b);
  return (r == originalPixel.data[0] && g == originalPixel.data[1] && b == originalPixel.data[2]);
}

function colorPixel(pixelPos,originalPixel, imgData){
	var color = document.getElementById("color_fill").value;
	console.log(color);
  imgData.data[0] = originalPixel.data[0];
  imgData.data[1] = originalPixel.data[1];
  imgData.data[2] = originalPixel.data[2];
  imgData.data[3] = 255;
}
*/
