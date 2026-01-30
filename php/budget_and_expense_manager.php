<?php
// budget_and_expense_manager.php
header('Content-Type: application/json; charset=utf-8');

// NOTE: display_errors = 0 to prevent HTML output in JSON responses
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set JSON header before any output
header('Content-Type: application/json; charset=utf-8');

include "database.php";
session_start();

// For simplicity, assume user is logged in and we have user_id
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}
$user_id = $_SESSION['user_id'];

// Helper: send JSON and exit
function send_json($data) {
    echo json_encode($data);
    exit;
}

// Get action
$action = $_REQUEST['action'] ?? '';

// Choose what action to take
switch ($action) {
    case 'load_budget':
        loadBudget($conn, $user_id);
        break;
    case 'save_budget':
        saveBudget($conn, $user_id);
        break;
    case 'fetch_month_summary':
        fetchMonthSummary($conn, $user_id);
        break;
    case 'fetch_12_months_spending':
        fetch12MonthsSpending($conn, $user_id);
        break;
    default:
        send_json(['success' => false, 'message' => 'Invalid action']);
}


// ------------------------------- SAVE BUDGET --------------------------------
function saveBudget($conn, $user_id) {
    $month = $_POST['month'] ?? null;
    $budgetTotal = $_POST['budgetTotal'] ?? 0;
    $categoriesJson = $_POST['categories'] ?? '[]';

    // Validate that month is provided
    if (empty($month)) {
        echo json_encode(['success' => false, 'message' => 'Month is required']);
        return;
    }

    // Decode and validate categories JSON
    $categories = json_decode($categoriesJson, true);
    if (!is_array($categories)) {
        echo json_encode(['success' => false, 'message' => 'Invalid categories data']);
        return;
    }

    // Convert "January 2026" to "2026-01-01" format for MySQL
    try {
        $dateObj = DateTime::createFromFormat('F Y', $month);
        if (!$dateObj) {
            throw new Exception("Invalid month format");
        }
        $month = $dateObj->format('Y-m-01');
    } catch (Exception $e) {
        // Try if already in YYYY-MM or YYYY-MM-DD format
        if (preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month .= '-01';
        } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $month)) {
            echo json_encode(['success' => false, 'message' => 'Invalid month format']);
            return;
        }
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Check if monthly budget exists
        $stmt = $conn->prepare(
            "SELECT monthly_sums_id FROM monthly_sums
            WHERE user_id = ? AND month_value = ?"
        );
        $stmt->bind_param("is", $user_id, $month);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // Update existing monthly budget
            $row = $result->fetch_assoc();
            $monthly_sums_id = $row['monthly_sums_id'];

            $stmt = $conn->prepare(
                "UPDATE monthly_sums
                SET monthly_budget = ?
                WHERE monthly_sums_id = ?"
            );
            $stmt->bind_param("di", $budgetTotal, $monthly_sums_id);
            $stmt->execute();

            // Delete existing categories
            $stmt = $conn->prepare(
                "DELETE FROM budgets_categories
                WHERE monthly_sums_id = ?"
            );
            $stmt->bind_param("i", $monthly_sums_id);
            $stmt->execute();

        } else {
            // Insert new monthly budget
            $stmt = $conn->prepare(
                "INSERT INTO monthly_sums (user_id, month_value, monthly_budget)
                VALUES (?, ?, ?)"
            );
            $stmt->bind_param("isd", $user_id, $month, $budgetTotal);
            $stmt->execute();
            
            // Get the inserted ID
            $monthly_sums_id = $conn->insert_id;
        }

        // Insert categories
        $stmt = $conn->prepare(
            "INSERT INTO budgets_categories (user_id, monthly_sums_id, budget_category, budget_amount)
            VALUES(?, ?, ?, ?)"
        );

        foreach ($categories as $category) {
            $name = $category['name'] ?? '';
            $amount = $category['amount'] ?? 0;

            if (empty($name) || $amount <= 0) {
                continue; // Skip invalid categories
            }

            $stmt->bind_param("iisd", $user_id, $monthly_sums_id, $name, $amount);
            $stmt->execute();
        }

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'monthly_sums_id' => $monthly_sums_id,
            'message' => 'Budget saved successfully'
        ]);

    } catch(Exception $err) {
        $conn->rollback();
        echo json_encode([
            'success' => false,
            'message' => 'Error saving budget: ' . $err->getMessage()
        ]);
    }
}


// -------------------------- LOAD BUDGET ----------------------------------
function loadBudget($conn, $user_id) {
    try {
        $month = $_GET['month'] ?? null;
        if (!$month) {
            send_json(['success' => false, 'message' => 'Month required']);
        }

        // Convert "January 2026" to "2026-01-01" format
        try {
            $dateObj = DateTime::createFromFormat('F Y', $month);
            if (!$dateObj) {
                throw new Exception("Invalid month format");
            }
            $month = $dateObj->format('Y-m-01');
        } catch (Exception $e) {
            // Try if already in YYYY-MM or YYYY-MM-DD format
            if (preg_match('/^\d{4}-\d{2}$/', $month)) {
                $month .= '-01';
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $month)) {
                send_json(['success' => false, 'message' => 'Invalid month format']);
            }
        }

        // Get monthly budget
        $stmt = $conn->prepare(
            "SELECT monthly_sums_id, month_value, monthly_budget
            FROM monthly_sums 
            WHERE user_id = ? AND month_value = ?"
        );

        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("is", $user_id, $month);

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            // No budget found for this month
            send_json([
                'success' => false,
                'message' => 'No budget found for this month'
            ]);
        }

        $monthly_budget = $result->fetch_assoc();
        $monthly_sums_id = $monthly_budget['monthly_sums_id'];
        $total_budget = (float)$monthly_budget['monthly_budget'];

        // Get categories with their allocated amounts
        $stmt = $conn->prepare(
            "SELECT budget_category, budget_amount
            FROM budgets_categories
            WHERE user_id = ? AND monthly_sums_id = ?"
        );
        $stmt->bind_param("ii", $user_id, $monthly_sums_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $result = $stmt->get_result();
        $categories = [];

        while ($row = $result->fetch_assoc()) {
            $categoryName = $row['budget_category'];
            $allocated = (float)$row['budget_amount'];

            // Get total spent for this category
            $stmtSpent = $conn->prepare(
                "SELECT COALESCE(SUM(expense_amount), 0) AS total_spent
                FROM expenses_categories
                WHERE monthly_sums_id = ? AND expense_category = ?"
            );
            $stmtSpent->bind_param("is", $monthly_sums_id, $categoryName);
            $stmtSpent->execute();
            $spentResult = $stmtSpent->get_result();
            $spentRow = $spentResult->fetch_assoc();
            $spent = (float)$spentRow['total_spent'];

            $categories[] = [
                'name' => $categoryName,
                'allocated' => $allocated,
                'spent' => $spent
            ];
        }

        // Return data
        send_json([
            'success' => true,
            'month' => $month,
            'monthly_sums_id' => $monthly_sums_id,
            'total_budget' => $total_budget,
            'categories' => $categories
        ]);

    } catch (Exception $e) {
        send_json([
            'success' => false,
            'message' => 'Error loading budget: ' . $e->getMessage()
        ]);
    }
}


// -------------------------- FETCH MONTH SUMMARY - TOTAL BUDGET & TOTAL EXPENSES --------------------------
function fetchMonthSummary($conn, $user_id) {
    try {
        $monthly_sums_id = $_GET['monthly_sums_id'] ?? null;

        if (!$monthly_sums_id) {
            send_json(['success' => false, 'message' => 'monthly_sums_id required']);
        }

        // Verify ownership and get summary data
        $stmt = $conn->prepare(
            "SELECT monthly_budget, monthly_expense
            FROM monthly_sums
            WHERE monthly_sums_id = ? AND user_id = ?"
        );

        // Error log
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("ii", $monthly_sums_id, $user_id);

        // Error failed to execute statement
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            send_json([
                'success' => false,
                'message' => 'No data found for this month'
            ]);
        }

        $row = $result->fetch_assoc();

        send_json([
            'success' => true,
            'monthly_budget' => (float)$row['monthly_budget'],
            'monthly_expense' => (float)$row['monthly_expense']
        ]);

    } catch (Exception $error) {
        send_json([
            'success' => false,
            'message' => 'Error fetching summary: ' .$error->getMessage()
        ]);
    }
}


// -------------------------- FETCH 12 MONTHS SPENDING --------------------------
function fetch12MonthsSpending($conn, $user_id) {
    try {
        // Get spending data for last 6 months for this user
        $stmt = $conn->prepare(
            "SELECT 
                DATE_FORMAT(ms.month_value, '%Y-%m') AS month_key,
                ms.month_value,
                COALESCE(SUM(ec.expense_amount), 0) AS total_spent,
                ms.monthly_budget AS total_budget
            FROM monthly_sums ms
            LEFT JOIN expenses_categories ec
                ON ec.monthly_sums_id = ms.monthly_sums_id
            WHERE ms.user_id = ?
              AND ms.month_value <= CURRENT_DATE
            GROUP BY ms.monthly_sums_id, ms.monthly_budget
            ORDER BY ms.month_value DESC
            LIMIT 6"
        );

        $stmt->bind_param("i", $user_id);
        $stmt->execute();

        $result = $stmt->get_result();
        $months = [];

        while ($row = $result->fetch_assoc()) {
            $months[] = [
                'month_key'    => $row['month_key'],
                'month_value'  => $row['month_value'],
                'total_spent'  => (float)$row['total_spent'],
                'total_budget' => (float)$row['total_budget']
            ];
        }

        echo json_encode([
            'success' => true,
            'months' => $months
        ]);
        exit;

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
        exit;
    }
}

?>