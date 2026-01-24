<?php
// database.php — Database connection and setup (No timestamps version)

// MySQL connection parameters
$host = '127.0.0.1:3307';
$user = "root";
$password = "1357987";
$database = "myCoinApp";

// Create connection, first without selecting database
$conn = new mysqli($host, $user, $password);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database if it doesn't exist
if (!$conn->select_db($database)) {
    $createDB = "CREATE DATABASE IF NOT EXISTS `$database` 
                CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci";
    if (!$conn->query($createDB)) {
        die("Error creating database: " . $conn->error);
    }
    $conn->select_db($database);
}
// ---------------------------------------------------------------------------
// TABLE 1: USERS
// This table stores user credentials and security info
$createUsersTable = 
"CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question VARCHAR(255) NOT NULL,
    security_answer VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createUsersTable) !== TRUE) {
    die("Error creating users table: " . $conn->error);
}

// ---------------------------------------------------------------------------
// TABLE 2: MONTHLY_SUMS
// This table manages total monthly budgets and expenses per user
$createMonthlyBudgetsTable =  
"CREATE TABLE IF NOT EXISTS monthly_sums (
    monthly_sums_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month_value DATE NOT NULL,
    monthly_budget DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monthly_expense DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    UNIQUE KEY uniq_user_month (user_id, month_value),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createMonthlyBudgetsTable) !== TRUE) {
    die("Error creating monthly_sums table: " . $conn->error);
}


// ----------------------------------------------------------------------------
// TABLE 3: BUDGET_CATEGORIES (Multiple categories)
// This table stores individual categories for each month
$createBudgetCategoriesTable =
"CREATE TABLE IF NOT EXISTS budgets_categories (
    budgets_categories_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    monthly_sums_id INT NOT NULL,
    budget_category VARCHAR(100) NOT NULL,
    budget_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    UNIQUE KEY uniq_month_category (monthly_sums_id, budget_category),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (monthly_sums_id) REFERENCES monthly_sums(monthly_sums_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createBudgetCategoriesTable) !== TRUE) {
    die("Error creating budgets_categories table: " . $conn->error);
}

// ---------------------------------------------------------------------------
// TABLE 4: EXPENSES_CATEGORIES
// This table records category expenses for each month
$createExpensesTable =
"CREATE TABLE IF NOT EXISTS expenses_categories (
    expenses_categories_id INT AUTO_INCREMENT PRIMARY KEY,
    monthly_sums_id INT NOT NULL,
    expense_category VARCHAR(100) NOT NULL,
    expense_amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (monthly_sums_id) REFERENCES monthly_sums(monthly_sums_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createExpensesTable) !== TRUE) {
    die("Error creating expenses_categories table: " . $conn->error);
}

// RESET AUTO_INCREMENT FOR USERS TABLE IF EMPTY
$result = $conn->query("SELECT COUNT(*) AS count FROM users");
if ($result && $row = $result->fetch_assoc()) {
    if ((int)$row['count'] === 0) {
        $conn->query("ALTER TABLE users AUTO_INCREMENT = 1");
    }
}
?>