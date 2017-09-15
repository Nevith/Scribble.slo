function logIn(){
	$.ajax({
		url: "PHP/login/login.php",
		method: "GET",
		data: { name:$("#nameInput").val()}
	}).done(function(msg){
		$("#logInDiv").hide();
		$(document.body).load("Canvas/canvas.html", function(){
			loadCanvas()
		});
	});
}
