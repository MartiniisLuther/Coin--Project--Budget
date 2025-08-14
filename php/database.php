<?php
$host = '127.0.0.1'; // host for the MySQL database
$user = "root";
$password = "1357987trex"; //password for the MySQL database.
$database = "myCoinApp"; //name of the database

// create connection
$conn = new mysqli($host, $user, $password, $database);

if ($conn -> connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>