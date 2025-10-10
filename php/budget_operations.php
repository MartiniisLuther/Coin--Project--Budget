<?php
session_start();
require_once 'database.php';

header('Content-Type: application/json');

// --- AUTH CHECK ---
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not authenticated!']);
    exit();
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

// --- ROUTING ---
switch ($action) {
    case 'save_budget':
        saveBudget($conn, $user_id);
        break;
    case 'load_budget':
        loadBudget($conn, $user_id);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action!']);
        break;
}

// --- SAVE FUNCTION ---
function saveBudget($conn, $user_id) {
    try {
        $month = $_POST['month'] ?? '';
        $amount = floatval($_POST['amount'] ?? 0);
        $categories = json_decode($_POST['categories'] ?? '[]', true);

        if (empty($month) || $amount <= 0) {
            throw new Exception('Invalid or missing budget data.');
        }

        $conn->begin_transaction();

        // Save or update monthly budget total
        $stmt = $conn->prepare(
            "INSERT INTO budgets (user_id, month, budget_per_month)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE budget_per_month = VALUES(budget_per_month)
        ");
        $stmt->bind_param("isd", $user_id, $month, $amount);
        $stmt->execute();

        // Delete existing categories for the month
        $stmt = $conn->prepare("DELETE FROM budgets WHERE user_id = ? AND month = ? AND category_name IS NOT NULL");
        $stmt->bind_param("is", $user_id, $month);
        $stmt->execute();

        // Insert new category allocations
        if (!empty($categories)) {
            $stmt = $conn->prepare(
                "INSERT INTO budgets (user_id, month, category_name, budget_per_category, budget_per_month, total_spent_per_month)
                VALUES (?, ?, ?, ?, ?, 0)
            ");
            foreach ($categories as $category) {
                $stmt->bind_param("issdd", $user_id, $month, $category['name'], $category['amount'], $amount);
                $stmt->execute();
            }
        }

        $conn->commit();
        echo json_encode([
            'success' => true,
            'message' => 'Budget saved successfully.',
            'data' => [
                'month' => $month,
                'budget_per_month' => $amount,
                'categories' => $categories
            ]
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// --- LOAD FUNCTION ---
function loadBudget($conn, $user_id) {
    try {
        $month = $_GET['month'] ?? '';
        if (empty($month)) {
            throw new Exception('Month parameter is required.');
        }

        // Fetch monthly total
        $stmt = $conn->prepare(
            "SELECT budget_per_month
            FROM budgets
            WHERE user_id = ? AND month = ?
            LIMIT 1
        ");
        $stmt->bind_param("is", $user_id, $month);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $budget_per_month = $row ? floatval($row['budget_per_month']) : 0;

        // Fetch category allocations
        $stmt = $conn->prepare(
            "SELECT category_name, budget_per_category
            FROM budgets
            WHERE user_id = ? AND month = ? AND category_name IS NOT NULL
            ORDER BY category_name
        ");
        $stmt->bind_param("is", $user_id, $month);
        $stmt->execute();
        $result = $stmt->get_result();

        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = [
                'name' => $row['category_name'],
                'amount' => floatval($row['budget_per_category'])
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'month' => $month,
                'budget_per_month' => $budget_per_month,
                'categories' => $categories
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

$conn->close();
?>