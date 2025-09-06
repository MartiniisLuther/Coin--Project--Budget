<?php
$host = '127.0.0.1:3307'; // host for the MySQL database
$user = "root";
$password = "1357987"; //password for the MySQL database.
$database = "myCoinApp"; //name of the database

// create connection, first without connection to DB
$conn = new mysqli($host, $user, $password);
if ($conn -> connect_error) {
    die("Connection failed: " . $conn -> connect_error);
}

// create database if it doesn't exist
if (!$conn -> select_db($database)) {
    $createDB = "CREATE DATABASE IF NOT EXISTS $databse CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci";
    if ($conn -> query($createDB) === TRUE) {
        $conn -> select_db($database);
    } else {
        die("Error creating databse: " . $conn -> error);
    }
} else {
    $conn -> select_db($database);
}

// create users table if it doesn't exist
$createUsersTable = "
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question VARCHAR(255) NOT NULL,
    security_answer VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// execute the query
if ($conn -> query($createUsersTable) !== TRUE) {
    die("Error creating users table: " . $conn -> error);
}
?>