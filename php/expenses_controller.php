<?php
// expenses_controller.php
// Handles adding expenses to categories

session_start();
require_once 'database.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? '';

if ($action === 'add_expense') {
    addExpense($conn, $user_id);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

/**
 * Add a new expense (adds to total spent for a category)
 */
function addExpense($conn, $user_id) {
    try {
        $category_id = $_POST['category_id'] ?? '';
        $amount = $_POST['amount'] ?? 0;
        $expense_date = $_POST['expense_date'] ?? '';

        // Validate inputs
        if (empty($category_id) || empty($amount) || $amount <= 0 || empty($expense_date)) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            return;
        }

        // Verify the category belongs to the user
        $stmt = $conn->prepare(
            "SELECT bc.id, bc.category_name
            FROM budget_categories bc
            INNER JOIN monthly_budgets mb ON bc.monthly_budget_id = mb.id
            WHERE bc.id = ? AND mb.user_id = ?
        ");
        $stmt->bind_param("ii", $category_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid category or access denied']);
            return;
        }

        $category = $result->fetch_assoc();
        $category_name = $category['category_name'];

        // Insert expense into database
        $stmt = $conn->prepare(
            "INSERT INTO expenses (user_id, category_id, amount, description, expense_date)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $description = "Expense for {$category_name}";
        $stmt->bind_param("iidss", $user_id, $category_id, $amount, $description, $expense_date);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to insert expense: " . $stmt->error);
        }

        $expense_id = $conn->insert_id;

        // Get the new total spent for this category in the current month
        $stmt = $conn->prepare(
            "SELECT COALESCE(SUM(e.amount), 0) as total_spent
            FROM expenses e
            WHERE e.user_id = ? 
                AND e.category_id = ?
                AND YEAR(e.expense_date) = YEAR(?)
                AND MONTH(e.expense_date) = MONTH(?)
        ");
        $stmt->bind_param("iiss", $user_id, $category_id, $expense_date, $expense_date);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $new_total_spent = $row['total_spent'];

        echo json_encode([
            'success' => true,
            'expense_id' => $expense_id,
            'category_name' => $category_name,
            'new_total_spent' => number_format($new_total_spent, 2, '.', ''),
            'message' => 'Expense added successfully'
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error adding expense: ' . $e->getMessage()
        ]);
    }
}
?>