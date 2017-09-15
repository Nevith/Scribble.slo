<?php
session_start();
$_SESSION["name"]=$_GET["name"];
echo $_SESSION["name"];
?>
