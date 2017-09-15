var scnX;
var scnY;
var bool=false;
var mousedown=false;

function loadCanvas(){
	var canv=document.getElementById("canv");
	canv.width=500;
	canv.height=500;
	//Basic set-up for drawing
	canv.onmousedown=function(m){mousedown=true; scnX=m.clientX -200; scnY=m.clientY -10} 
	//We also save the initial coordinates, if we will need them for shapes.
	canv.onmousemove=draw;
	canv.onmouseup=function(m){mousedown=false; bool=true;} 
	//We also call draw and we set bool to true, so we can draw the shapes(we need the bool, so we don't always draw shapes, if we have them selected)
	$("#clearButton").click(clearCanvas);
}
	
function draw(m){
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
		var x=m.clientX -200;
		var y=m.clientY -10;
		var fat=document.getElementById("size").value;
		//Defining the canvas
		var canv=this;
		var ctx=canv.getContext("2d");
		//Getting the colors
		ctx.fillStyle=document.getElementById("color_fill").value;
		ctx.strokeStyle=document.getElementById("color_stroke").value;
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
		ctx.lineWidth = fat;
		ctx.fill();
		ctx.stroke();
		}
	}
	//We called the function by letting go of the mouse(Used for shapes)
	else if(bool){
		//Circle
		if(drawing=="circle"){
			ctx.beginPath();
			var lengthOF=Math.sqrt(Math.pow((scnX-x),2)+Math.pow((scnY-y),2));
			ctx.arc((scnX+x)/2,(scnY+y)/2,lengthOF/2,0,2*Math.PI);
			ctx.lineWidth = fat;			
			ctx.stroke();
			ctx.fill();
		}
		//Rectangle
		else if(drawing=="rectangle"){
			ctx.beginPath();
			var lengthOFX=(x-scnX);
			var lengthOFY=(y-scnY);
			ctx.rect(scnX,scnY,lengthOFX, lengthOFY);
			ctx.lineWidth = fat;			
			ctx.stroke();
			ctx.fill();
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
			ctx.lineWidth = fat;			
			ctx.stroke();
			ctx.fill();
		}
		//Line
		else if(drawing=="line"){
			ctx.beginPath();
			var lengthOFX=(x-scnX);
			var lengthOFY=(y-scnY);
			ctx.moveTo(scnX,scnY);
			ctx.lineTo(x, y);
			ctx.lineWidth = fat;			
			ctx.stroke();
			ctx.fill();
		}
	bool=false;
	}
}

function specialBR(){
	var dv=document.getElementById("Extra");
	dv.innerHTML='Brush shape:<br> <input type="radio" name="brush" value="norm" checked> Normal <br><input type="radio" name="brush" value="rec"> Rectangle <br><input type="radio" name="brush" value="sqr"> Square <br><input type="radio" name="brush" value="cir"> Circle <br> Brush Size: <br> <input type="number" min="1" max="50" id="size2" class="inpt" value="1">';
	}
	
function special(){
	var dv=document.getElementById("Extra");
	dv.innerHTML="";
	}

function clearCanvas(){
	var canv=document.getElementById("canv");
	var ctx=canv.getContext("2d");
	ctx.clearRect(0, 0, canv.width, canv.height);
	ctx.beginPath();
}