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

// ============================================================================
// TABLE 1: USERS
// ============================================================================
$createUsersTable = 
"CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question VARCHAR(255) NOT NULL,
    security_answer VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createUsersTable) !== TRUE) {
    die("Error creating users table: " . $conn->error);
}

// ============================================================================
// TABLE 2: MONTHLY_BUDGETS (One row per user per month)
// ============================================================================
$createMonthlyBudgetsTable =  
"CREATE TABLE IF NOT EXISTS monthly_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    budget_month DATE NOT NULL COMMENT 'First day of month: 2026-01-01',
    total_budget DECIMAL(10, 2) NOT NULL,
    UNIQUE KEY uniq_user_month (user_id, budget_month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_month (user_id, budget_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createMonthlyBudgetsTable) !== TRUE) {
    die("Error creating monthly_budgets table: " . $conn->error);
}

// ============================================================================
// TABLE 3: BUDGET_CATEGORIES (Multiple categories per monthly budget)
// ============================================================================
$createCategoriesTable =
"CREATE TABLE IF NOT EXISTS budget_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monthly_budget_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(10, 2) NOT NULL,
    UNIQUE KEY uniq_budget_category (monthly_budget_id, category_name),
    FOREIGN KEY (monthly_budget_id) REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    INDEX idx_monthly_budget (monthly_budget_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createCategoriesTable) !== TRUE) {
    die("Error creating budget_categories table: " . $conn->error);
}

// ============================================================================
// TABLE 4: EXPENSES (Tracks actual spending)
// ============================================================================
$createExpensesTable =
"CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    expense_date DATE NOT NULL COMMENT 'Date when expense occurred',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, expense_date),
    INDEX idx_category_date (category_id, expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($createExpensesTable) !== TRUE) {
    die("Error creating expenses table: " . $conn->error);
}

// ============================================================================
// RESET AUTO_INCREMENT FOR USERS TABLE IF EMPTY
// ============================================================================
$result = $conn->query("SELECT COUNT(*) AS count FROM users");
if ($result && $row = $result->fetch_assoc()) {
    if ((int)$row['count'] === 0) {
        $conn->query("ALTER TABLE users AUTO_INCREMENT = 1");
    }
}
?>