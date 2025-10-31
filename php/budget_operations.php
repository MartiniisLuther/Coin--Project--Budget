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

// --- SAVE BUDGET FUNCTION ---
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
            "INSERT INTO monthly_budgets (user_id, month, budget_per_month)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE budget_per_month = VALUES(budget_per_month)
        ");
        $stmt->bind_param("isd", $user_id, $month, $amount);
        $stmt->execute();

        // Get the monthly_budget_id
        $monthly_budget_id = $conn->insert_id;
        if ($monthly_budget_id == 0) {
            // If no new row inserted, fetch the existing id
            $stmt = $conn->prepare("SELECT id FROM monthly_budgets WHERE user_id = ? AND month = ?");
            $stmt->bind_param("is", $user_id, $month);
            $stmt->execute();
            $result = $stmt->get_result();
            $monthly_budget_id = $result->fetch_assoc()['id'];
        }

        // Delete existing categories for the month
        $stmt = $conn->prepare(
            "DELETE FROM category_budgets WHERE monthly_budget_id = ? ");
        $stmt->bind_param("i", $monthly_budget_id);
        $stmt->execute();
        
        // Insert new category allocations
        if (!empty($categories)) {
            $stmt = $conn->prepare(
                "INSERT INTO category_budgets (monthly_budget_id, category_name, budget_per_category) 
                VALUES (?, ?, ?)
            ");
            foreach ($categories as $category) {
                $stmt->bind_param("isd", $monthly_budget_id, $category['name'], $category['amount']);
                $stmt->execute();
            }
        }

        // Commit transaction
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

        // Fetch monthly total budget
        $stmt = $conn->prepare(
            "SELECT budget_per_month
            FROM monthly_budgets
            WHERE user_id = ? AND month = ?
            LIMIT 1
        ");
        $stmt->bind_param("is", $user_id, $month);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $budget_per_month = $row ? floatval($row['budget_per_month']) : 0;

        // Fetch category allocations *cb-> category budget table mb-> monthly budget table
        $stmt = $conn->prepare(
            "SELECT cb.category_name, cb.budget_per_category
            FROM category_budgets cb
            JOIN monthly_budgets mb ON cb.monthly_budget_id = mb.id
            WHERE mb.user_id = ? AND mb.month = ?
            ORDER BY cb.category_name
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