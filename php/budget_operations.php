<?php
session_start(); // Start the session to access session variables
require_once 'database.php'; // Include the database connection

header('Content-Type: application/json'); 

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'User not authenticated!']);
    exit();
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? $_GET['action'] ?? ''; // Get action from POST or GET

switch ($action) {
    case 'save_budget':
        saveBudget($conn, $user_id);
        break;
    case 'load_budget':
        loadBudget($conn, $user_id);
        break;
    default:
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Invalid action!']);
        break;
}

// Function to save or update the budget
function saveBudget($conn, $user_id) {
    try {
        //  get dat from POST request
        $month = $_POST['month'] ?? '';
        $amount = floatval($_POST['amount'] ?? 0);
        $categories = json_decode($_POST['categories'] ?? '[]', true);

        if (empty($month) || $amount <= 0 || empty($categories)) {
            throw new Exception('Invalid budget data provided.');
        }

        // Start transaction
        $conn -> begin_transaction();

        // Insert or update the monthly budget
        $stmt = $conn -> prepare(
            "INSERT INTO monthly_budget_amount (user_id, month, amount)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE amount = VALUES(amount)
        ");
        $stmt -> bind_param("isd", $user_id, $month, $amount);
        $stmt -> execute();

        // Delete existing categories for the month
        $stmt = $conn -> prepare(
            "DELETE FROM category_budget_allocations WHERE user_id = ? AND month = ?");
        $stmt -> bind_param("is", $user_id, $month);
        $stmt -> excecute();

        // Insert new category allocations
        $stmt = $conn -> prepare(
            "INSERT INTO category_budget_allocations (user_id, month, category_name, allocated_amount)
            VALUES (?, ?, ?, ?)
        ");

        // Bind parameters and execute for each category
        foreach ($categories as $category) {
            $stmt -> bind_param("issd", $user_id, $month, $category['name'], $category['amount']);
            $stmt -> execute();
        }

        // Commit transaction
        $conn -> commit();
        echo json_encode([
            'success' => true,
            'message' => 'Budget saved successfully.',
            'data' => ['month' => $month, 'amount' => $amount, 'categories' => $categories]
        ]);

    } catch (Exception $e) {
        $conn -> rollback(); // Rollback transaction on error
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => $e -> getMessage()]);
    }
}


// Function to load the budget for a specific month
function loadBudget($conn, $user_id) {
    try {
        $month = $_GET['month'] ?? '';

        if (empty($month)) {
            throw new Exception('Month parameter is required.');
        }

        // Get budget amount for the month
        $stmt = $conn -> prepare("SELECT amount FROM monthly_budget_amount WHERE user_id = ? AND month = ?");
        $stmt -> bind_param("is", $user_id, $month); // Bind parameters
        $stmt -> execute(); // Execute the prepared statement
        $result = $stmt -> get_result(); // Get the result set
        $budget_data = $result -> fetch_assoc(); // Fetch the budget data

        // Get category allocations for the month
        $stmt = $conn -> prepare(
            "SELECT category_name, allocated_amount
            FROM category_budget_allocations
            WHERE user_id = ? AND month = ?
            ORDER BY category_name
        ");
        $stmt -> bind_param("is", $user_id, $month);
        $stmt -> execute();
        $result = $stmt -> get_result();

        // Fetch all categories
        $categories = [];
        while ($row = $result -> fetch_assoc()) {
            $categories[] = [
                'name' => $row['category_name'],
                'amount' => floatval($row['allocated_amount'])
            ];
        }

        // Prepare response data
        echo json_encode([
            'success' => true,
            'data' => [
                'month' => $month,
                'amount' => $budget_data ? floatval($budget_data['amount']) : 0,
                'categories' => $categories
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => $e -> getMessage()]);        
    }
}

$conn -> close(); // Close the database connection

?>