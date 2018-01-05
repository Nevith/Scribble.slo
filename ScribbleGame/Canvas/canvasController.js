var scnX;
var scnY;
var isDrawingShape=false;
var mousedown=false;
var socket = null;
var drawing = null;
var colorLayer;
var canvasOffset;
var canvasWidth = 600;
var canvasHeight = 600;


//Initialize canvas basic funcionality
function canvas_canvasLoad(webSocketInstance){
	socket = webSocketInstance;

	var canv=document.getElementById("canv");
	canv.width = canvasWidth;
	canv.height = canvasHeight;
	canv.style.width = canvasWidth+"px";
	canv.style.height = canvasHeight+"px";
	canvasOffset = $("#canv").offset();
	console.log(canvasOffset);

	//Basic set-up for drawing
	//We also save the initial coordinates
	canv.onmousedown = function(m){mousedown=true; scnX=m.clientX -canvasOffset.left; scnY=m.clientY -canvasOffset.top; /*paintBucketPaint(drawing=="paintBuckedTool")*/; socket.emit("updateCanvasPicture",  CryptoJS.AES.encrypt(document.getElementById("canv").toDataURL(), socket.key).toString());};
	canv.onmousemove = draw;
	canv.onmouseup = function(m){mousedown=false; isDrawingShape=true; socket.emit("updateCanvasPicture",  CryptoJS.AES.encrypt(document.getElementById("canv").toDataURL(), socket.key).toString());};
	canv.onmouseleave = function(m){mousedown=false; socket.emit("updateCanvasPicture",  CryptoJS.AES.encrypt(document.getElementById("canv").toDataURL(), socket.key).toString());};
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
		if(fat < 0 || fat > 1000)
			return;
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
		if(big < 2 || big > 1000)
			return;
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
	socket.emit("updateCanvasPicture",  CryptoJS.AES.encrypt(document.getElementById("canv").toDataURL(), socket.key).toString());

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
	socket.emit("updateCanvasPicture",  CryptoJS.AES.encrypt(document.getElementById("canv").toDataURL(), socket.key).toString());

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
	socket.emit("updateCanvasPicture",  CryptoJS.AES.encrypt(document.getElementById("canv").toDataURL(), socket.key).toString());
}

//Adds the passed in canvas contex to the img and emits the data if desired
function canvas_finishDrawing(ctx, brushWidth, UpdateCanvasPicture){
	ctx.lineWidth = brushWidth;
	ctx.stroke();
	ctx.fill();
	if(UpdateCanvasPicture)
		socket.emit("updateCanvasPicture",  CryptoJS.AES.encrypt(document.getElementById("canv").toDataURL(), socket.key).toString());
}



/*
var maxColorLayerIndex;
// Trying to write an algorithm to have a paint bucket tool
function paintBucketPaint(doWeFill){
	if(!doWeFill)
		return;

	var canv=document.getElementById("canv");
	var ctx=canv.getContext("2d");

	var chosenPixelData = ctx.getImageData(scnY, scnX, 1, 1);


	var startR = chosenPixelData[0];
	var startG = chosenPixelData[1];
	var startB = chosenPixelData[2];




	colorLayer = ctx.getImageData(0,0, canvasHeight, canvasWidth);
	console.log(colorLayer.data);
	console.log(chosenPixelData.data);

	var newPos,
					x,
					y,
					pixelPos,
					reachLeft,
					reachRight,
					drawingBoundLeft = 0,
					drawingBoundTop = 0,
					drawingBoundRight = canv.width - 1,
					drawingBoundBottom = canv.height - 1,
					pixelStack = [[scnX, scnY]];

				while (pixelStack.length) {

					newPos = pixelStack.pop();
					x = newPos[0];
					y = newPos[1];

					// Get current pixel position
					pixelPos = (y * canvasWidth + x) * 4;
					colorLayer.data[pixelPos] = 255;
					colorLayer.data[pixelPos+1] = 0;
					colorLayer.data[pixelPos+2] = 0;
					colorLayer.data[pixelPos+3] = 125;

					// Go up as long as the color matches and are inside the canvas
					while (y >= drawingBoundTop && matchStartColor(pixelPos, startR, startG, startB)) {
						y -= 1;
						pixelPos -= canvasWidth * 4;
					}

					pixelPos += canvasWidth * 4;
					y += 1;
					reachLeft = false;
					reachRight = false;

					// Go down as long as the color matches and in inside the canvas
					while (y <= drawingBoundBottom && matchStartColor(pixelPos, startR, startG, startB)) {
						y += 1;

						if(pixelPos > 0 && (pixelPos+3)<colorLayer.data.length){
							colorLayer.data[pixelPos] = 0;
							colorLayer.data[pixelPos+1] = 0;
							colorLayer.data[pixelPos+2] = 0;
							colorLayer.data[pixelPos+3] = 255;
						}

						if (x > drawingBoundLeft) {
							if (matchStartColor(pixelPos - 4, startR, startG, startB)) {
								if (!reachLeft) {
									// Add pixel to stack
									pixelStack.push([x - 1, y]);
									reachLeft = true;
								}
							} else if (reachLeft) {
								reachLeft = false;
							}
						}

						if (x < drawingBoundRight) {
							if (matchStartColor(pixelPos + 4, startR, startG, startB)) {
								if (!reachRight) {
									// Add pixel to stack
									pixelStack.push([x + 1, y]);
									reachRight = true;
								}
							} else if (reachRight) {
								reachRight = false;
							}
						}

						pixelPos += canvasWidth * 4;
					}
	}
	console.log("end");
	ctx.putImageData(colorLayer, 0, 0);
	}

	function matchStartColor(pixelPos, startR, startG, startB)
	{
	  var r = colorLayer.data[pixelPos];
	  var g = colorLayer.data[pixelPos+1];
	  var b = colorLayer.data[pixelPos+2];

	  return (r == startR && g == startG && b == startB);
	}

	function colorPixel(pixelPos, startR, startG, startB)
	{
	  colorLayer.data[pixelPos] = 255;
	  colorLayer.data[pixelPos+1] = 50;
	  colorLayer.data[pixelPos+2] = 40;
	  colorLayer.data[pixelPos+3] = 255;
	}
/**/
