<?php

// monthly_budget_controller.php
session_start();

// Enable error logging for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1); // Temporarily show errors
ini_set('log_errors', 1);

require_once 'database.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'load_budget':
        loadBudget($conn, $user_id);
        break;
    case 'save_budget':
        saveBudget($conn, $user_id);
        break;
    case 'delete_budget':
        deleteBudget($conn, $user_id);
        break;
    case 'get_budget_months':
        getBudgetMonths($conn, $user_id);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

/**
 * Load budget data for a specific month
 */
function loadBudget($conn, $user_id) {
    try {
        $month = $_GET['month'] ?? '';
        
        if (empty($month)) {
            echo json_encode(['success' => false, 'message' => 'Month parameter required']);
            return;
        }

        // Convert to first day of month format if needed
        $month = date('Y-m-01', strtotime($month));

        // Get monthly budget
        $stmt = $conn->prepare("
            SELECT id, budget_month, total_budget
            FROM monthly_budgets
            WHERE user_id = ? AND budget_month = ?
        ");
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("is", $user_id, $month);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Budget not found']);
            return;
        }

        $monthly_budget = $result->fetch_assoc();
        $monthly_budget_id = $monthly_budget['id'];

        // Get categories with spent amounts
        $stmt = $conn->prepare(
            "SELECT 
                bc.id,
                bc.category_name,
                bc.allocated_amount,
                COALESCE(SUM(e.amount), 0) as total_spent
            FROM budget_categories bc
            LEFT JOIN expenses e ON e.category_id = bc.id
                AND YEAR(e.expense_date) = YEAR(?)
                AND MONTH(e.expense_date) = MONTH(?)
            WHERE bc.monthly_budget_id = ?
            GROUP BY bc.id, bc.category_name, bc.allocated_amount
            ORDER BY bc.id ASC
        ");
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("ssi", $month, $month, $monthly_budget_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();

        $categories = [];
        $total_spent = 0;

        while ($row = $result->fetch_assoc()) {
            $categories[] = [
                'id' => (int)$row['id'],
                'name' => $row['category_name'],
                'allocated' => number_format($row['allocated_amount'], 2, '.', ''),
                'spent' => number_format($row['total_spent'], 2, '.', '')
            ];
            $total_spent += $row['total_spent'];
        }

        echo json_encode([
            'success' => true,
            'monthly_budget_id' => (int)$monthly_budget_id,
            'month' => $monthly_budget['budget_month'],
            'total_budget' => number_format($monthly_budget['total_budget'], 2, '.', ''),
            'categories' => $categories,
            'total_spent' => number_format($total_spent, 2, '.', '')
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error loading budget: ' . $e->getMessage()
        ]);
    }
}

/**
 * Save or update monthly budget and categories
 */
function saveBudget($conn, $user_id) {
    $month = $_POST['month'] ?? '';
    $budgetTotal = $_POST['budgetTotal'] ?? 0;
    $categoriesJson = $_POST['categories'] ?? '[]';

    if (empty($month)) {
        echo json_encode(['success' => false, 'message' => 'Month parameter required']);
        return;
    }

    $categories = json_decode($categoriesJson, true);
    if (!is_array($categories)) {
        echo json_encode(['success' => false, 'message' => 'Invalid categories data']);
        return;
    }

    // Convert to first day of month
    $month = date('Y-m-01', strtotime($month));

    // Start transaction
    $conn->begin_transaction();

    try {
        // Check if monthly budget exists
        $stmt = $conn->prepare("
            SELECT id FROM monthly_budgets 
            WHERE user_id = ? AND budget_month = ?
        ");
        $stmt->bind_param("is", $user_id, $month);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // Update existing monthly budget
            $row = $result->fetch_assoc();
            $monthly_budget_id = $row['id'];

            $stmt = $conn->prepare("
                UPDATE monthly_budgets 
                SET total_budget = ? 
                WHERE id = ?
            ");
            $stmt->bind_param("di", $budgetTotal, $monthly_budget_id);
            $stmt->execute();

            // Delete existing categories (cascade will handle expenses FK)
            $stmt = $conn->prepare("
                DELETE FROM budget_categories 
                WHERE monthly_budget_id = ?
            ");
            $stmt->bind_param("i", $monthly_budget_id);
            $stmt->execute();
        } else {
            // Insert new monthly budget
            $stmt = $conn->prepare("
                INSERT INTO monthly_budgets (user_id, budget_month, total_budget) 
                VALUES (?, ?, ?)
            ");
            $stmt->bind_param("isd", $user_id, $month, $budgetTotal);
            $stmt->execute();
            $monthly_budget_id = $conn->insert_id;
        }

        // Insert categories
        $stmt = $conn->prepare("
            INSERT INTO budget_categories (monthly_budget_id, category_name, allocated_amount) 
            VALUES (?, ?, ?)
        ");

        foreach ($categories as $category) {
            $name = $category['name'] ?? '';
            $amount = $category['amount'] ?? 0;

            if (empty($name) || $amount <= 0) {
                continue; // Skip invalid categories
            }

            $stmt->bind_param("isd", $monthly_budget_id, $name, $amount);
            $stmt->execute();
        }

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'monthly_budget_id' => $monthly_budget_id,
            'message' => 'Budget saved successfully'
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        echo json_encode([
            'success' => false,
            'message' => 'Error saving budget: ' . $e->getMessage()
        ]);
    }
}

/**
 * Delete a monthly budget and all its categories
 */
function deleteBudget($conn, $user_id) {
    $month = $_POST['month'] ?? '';

    if (empty($month)) {
        echo json_encode(['success' => false, 'message' => 'Month parameter required']);
        return;
    }

    // Convert to first day of month
    $month = date('Y-m-01', strtotime($month));

    // Delete monthly budget (categories will cascade delete)
    $stmt = $conn->prepare("
        DELETE FROM monthly_budgets 
        WHERE user_id = ? AND budget_month = ?
    ");
    $stmt->bind_param("is", $user_id, $month);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Budget deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Budget not found'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error deleting budget: ' . $conn->error
        ]);
    }
}

/**
 * Get list of all months with budgets for current user
 */
function getBudgetMonths($conn, $user_id) {
    $stmt = $conn->prepare("
        SELECT budget_month 
        FROM monthly_budgets 
        WHERE user_id = ? 
        ORDER BY budget_month DESC
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $months = [];
    while ($row = $result->fetch_assoc()) {
        $months[] = $row['budget_month'];
    }

    echo json_encode([
        'success' => true,
        'months' => $months
    ]);
}
?>