<?php 
session_start(); // start the session
require_once 'database.php'; // Include the database connection

header('Content-Type: application/json'); // Set response type to JSON

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'User not authenticated!']);
    exit();
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? $_GET['action'] ?? ''; // Get action from POST or GET

// Handle requested action: route 'all_months_total_spending' to its handler and return 400 for invalid actions
switch ($action) {
    case 'all_months_total_spending': 
        all_months_total_spending($conn, $user_id);
        break;
    default:
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Invalid action!']);
        break;
}

// Function to fetch all months' total spending and budget data
function all_months_total_spending($conn, $user_id) {
    try {
        // Ensure user_id is an integer
        $user_id = (int)$user_id;

        // Buld last 12 months
        $months = [];
        $startMonth = new DateTime('first day of this month');
        $startMonth -> modify('-11 months') -> setTime(0, 0, 0); // 11 months ago

        for ($i = 0; $i < 12; $i++) {
            $m = clone $startMonth;
            $m->modify("+{$i} months");
            $months[] = $m->format('F'); // Full month name
        }

        // Query to get total spending per month for the user
        $sql = 
        "   SELECT month AS ym,
                COALESCE(SUM(total_spent_per_month), 0) AS total_spent_per_month
            FROM monthly_budgets
            WHERE user_id = ?
            GROUP BY month
            ORDER BY STR_TO_DATE(CONCAT('2025 ', month), '%Y %M') DESC
        ";

        $stmt = $conn -> prepare($sql); // Prepare the statement
        if ($stmt === false) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        $stmt -> execute();
        $result = $stmt -> get_result(); // Get the result set

        $totals = [];
        while ($row = $result -> fetch_assoc()) {
            $totals[$row['ym']] = (float) $row['total_spent_per_month'];
        }

        $stmt -> close(); // Close the statement

        // Align totals with months array, filling missing months with 0.0
        $values = [];
        foreach ($months as $ym) {
            $values[] = isset($totals[$ym]) ? $totals[$ym] : 0.0;
        }

        // Return JSON: months and total_spent_per_month (both arrays length 12)
        echo json_encode([
            'success' => true,
            'months' => $months,
            'total_spent_per_month' => $values
        ]);
    } catch (Exception $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => 'Error fetching data: ' . $e->getMessage()]);
    }
}