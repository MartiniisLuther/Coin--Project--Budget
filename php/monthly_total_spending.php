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

$user_id = $_SESSION['user_id']; // Get user ID from session
$action = $_POST['action'] ?? $_GET['action'] ?? ''; // Get action from POST or GET

// Handle requested action: route 'fetch_monthly_total_n_budget' to its handler and return 400 for invalid actions
switch ($action) {
    case 'fetch_monthly_total_n_budget':
        fetch_monthly_total_n_budget($conn, $user_id);
        break;
    default:
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Invalid action!']);
        break;
}

// Function to fetch monthly summary data
//fetch_monthly_summary_data -> fetch_monthly_total_n_budget
function fetch_monthly_total_n_budget($conn, $user_id) {
    try {
        // Prepare query to get month and total_spent for the authenticated user
        $sql = 
        "SELECT month, total_spent_per_month, budget_per_month
            FROM budgets 
            WHERE user_id = ? 
            ORDER BY STR_TO_DATE(CONCAT('2025 ', month), '%Y %M') DESC
        ";

        // Prepare and execute the statement
        if (!$stmt = $conn->prepare($sql)) {
            throw new Exception('Database prepare failed: ' . $conn->error);
        }

        // Bind parameters
        if (!$stmt->bind_param('i', $user_id)) {
            throw new Exception('Parameter binding failed: ' . $stmt->error);
        }

        // Execute the statement
        if (!$stmt->execute()) {
            throw new Exception('Query execution failed: ' . $stmt->error);
        }

        // Fetch results
        $result = $stmt->get_result();
        $rows = [];

        while ($row = $result->fetch_assoc()) {
            $rows[] = [
                'month' => $row['month'],
                'total_spent_per_month' => (float)$row['total_spent_per_month'],
                'budget_per_month' => (float)$row['budget_per_month']
            ];
        }

        $stmt->close();

        //  Return the results as JSON
        if (empty($rows)) {
            echo json_encode(['success' => true, 'data' => []]);
        } else {
            echo json_encode(['success' => true, 'data' => $rows]);
        }

    } catch (Throwable $e) {
        if (isset($stmt) && $stmt instanceof mysqli_stmt) {
            @$stmt->close();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    }

    exit();
}
