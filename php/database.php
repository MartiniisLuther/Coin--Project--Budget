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
$createUsersTable = 
"CREATE TABLE IF NOT EXISTS users (
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

// create MONTHLY BUDGETS table if not exists
$createBudgetsTable =  
"CREATE TABLE IF NOT EXISTS monthly_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    budget_per_month DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_spent_per_month DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_month (user_id, month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the budgets table
if ($conn -> query($createBudgetsTable) !== TRUE) {
    die("Error creating budgets table: " . $conn -> error);
}

// reset AUTO_INCREMENT for budgets table if empty
$result = $conn -> query("SELECT COUNT(*) as count FROM budgets");
if ($result && $row = $result -> fetch_assoc()) {
    if ((int)$row['count'] === 0) {
        $conn -> query("ALTER TABLE budgets AUTO_INCREMENT = 1");
    }
}

// create BUDGET & EXPENSES CATEGORIES table if not exists
$createCategoriesTable = 
"CREATE TABLE IF NOT EXISTS category_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monthly_budget_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    budget_per_category DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_spent_per_category DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_month_category (monthly_budget_id, category_name),
    FOREIGN KEY (monthly_budget_id) REFERENCES monthly_budgets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the categories table
if ($conn -> query($createCategoriesTable) !== TRUE) {
    die("Error creating categories table: " . $conn -> error);
}

// reset AUTO_INCREMENT for categories table if empty
$result = $conn -> query("SELECT COUNT(*) as count FROM category_budgets");
if ($result && $row = $result -> fetch_assoc()) {
    if ((int)$row['count'] === 0) {
        $conn -> query("ALTER TABLE category_budgets AUTO_INCREMENT = 1");
    }
}