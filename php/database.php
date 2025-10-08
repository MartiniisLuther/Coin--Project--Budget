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
"CREATE TABLE IF NOT EXISTS monthly_budget_amount (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    UNIQUE KEY uniq_user_month (user_id, month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the budgets table
if ($conn -> query($createBudgetsTable) !== TRUE) {
    die("Error creating budgets table: " . $conn -> error);
}


// create CATEGORY BUDGET ALLOCATIONS table if not exists for the per month allocated amounts
$createCategoryAllocationsTable = 
"CREATE TABLE IF NOT EXISTS category_budget_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    UNIQUE KEY uniq_user_month_category (user_id, month, category_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the category allocations table
if ($conn -> query($createCategoryAllocationsTable) !== TRUE) {
    die('Error creating category allocations table: ' . $conn -> error);
}


// create MONTHLY SPENDING SUMMARY table if not exists
$createMonthlySpendingTable = 
"CREATE TABLE IF NOT EXISTS monthly_spending_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_month (user_id, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the monthly spending summary table
if ($conn -> query($createMonthlySpendingTable) !== TRUE) {
    die("Error creating monthly spending summary table: " . $conn -> error);
}

// create EXPENDITURE RECORDS table if not exists
$createExpenditureTable = 
"CREATE TABLE IF NOT EXISTS expenditure_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
// execute the query for the expenditure records table
if ($conn -> query($createExpenditureTable) !== TRUE) {
    die("Error creating expenditure records table: " . $conn -> error);
}



