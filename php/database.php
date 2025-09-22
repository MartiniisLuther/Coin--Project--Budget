<?php
// MySQL connection parameters
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
    $createDB = "CREATE DATABASE IF NOT EXISTS `$database` 
                CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci";
    if (!$conn -> query($createDB)) {
        die("Error creating database: " . $conn -> error);
    }
    $conn -> select_db($database);
}

// create USERS table if it doesn't exist
$createUsersTable = "
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question VARCHAR(255) NOT NULL,
    security_answer VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// execute the query for the users table
if ($conn -> query($createUsersTable) !== TRUE) {
    die("Error creating users table: " . $conn -> error);
}

//reset AUTO_INCREMENT for users table if empty
$result = $conn -> query("SELECT COUNT(*) as count FROM users");
if ($result && $row = $result -> fetch_assoc()) {
    if ((int)$row['count'] === 0) {
        $conn -> query("ALTER TABLE users AUTO_INCREMENT = 1");
    }
}


// create BUDGETS table if not exists
$createBudgetsTable = "
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the budgets table
if ($conn -> query($createBudgetsTable) !== TRUE) {
    die("Error creating budgets table: " . $conn -> error);
}


// create CATEGORIES table if not exists
$createCategoriesTable = "
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the categories table
if ($conn -> query($createCategoriesTable) !== TRUE) {
    die('Error creating categories table: ' . $conn -> error);
}


//create EXPENSES table if not exists
$createExpenseTable = "
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_data DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the expenses table
if ($conn -> query($createExpenseTable) !== TRUE) {
    die ('Error creating expense table: ' . $conn -> error);
}

