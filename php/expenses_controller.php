<?php
/*
* expenses_controller.php
* Handles creation of expense entries tied to a specific monthly_sums_id.
* Responsibilities: 
* - Validate request and session
* - Ensure user owns the referenced monthly budget
* - Insert expense record
* - Update aggregated monthly expense
* - Return updated per-category total
*/

session_start();
require_once 'database.php';

header('Content-Type: application/json');


// ---------------------------------------------------------------------------
// AUTHENTICATION CHECK
// All expense operations require a logged-in user
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];


// ---------------------------------------------------------------------------
// INPUT VALIDATION
// Required POST fields: monthly_sums_id, expense_category, expense_amount
if (empty($_POST['monthly_sums_id']) || empty($_POST['expense_category']) || empty($_POST['expense_amount'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$monthly_sums_id = (int)$_POST['monthly_sums_id'];
$expense_category = trim($_POST['expense_category']);
$expense_amount = (float)$_POST['expense_amount'];

if ($expense_amount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Expense amount must be positive']);
    exit;
}


// ---------------------------------------------------------------------------
// STEP 1: AUTHORIZE MONTHLY BUDGET ACCESS
// Ensure the monthly_sums_id belongs to the authenticated user
$stmtCheck = $conn->prepare(
    "SELECT monthly_expense 
    FROM monthly_sums 
    WHERE monthly_sums_id = ? AND user_id = ?");
$stmtCheck->bind_param("ii", $monthly_sums_id, $user_id);
$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();

if ($resultCheck->num_rows !== 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid monthly_sums reference']);
    exit;
}


// ---------------------------------------------------------------------------
// STEP 2: INSERT EXPENSE ENTRY
$stmtInsert = $conn->prepare(
    "INSERT INTO expenses_categories 
    (user_id, monthly_sums_id, expense_category, expense_amount)
    VALUES (?, ?, ?, ?)
");
$stmtInsert->bind_param("iisd", $user_id, $monthly_sums_id, $expense_category, $expense_amount);

if (!$stmtInsert->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error inserting expense: ' . $conn->error]);
    exit;
}


// ---------------------------------------------------------------------------
// STEP 3: UPDATE AGGREGATED MONTHLY TOTAL
// Increment monthly_expense atomically
$stmtUpdate = $conn->prepare(
    "UPDATE monthly_sums
    SET monthly_expense = monthly_expense + ?
    WHERE monthly_sums_id = ? AND user_id = ?
");
$stmtUpdate->bind_param("dii", $expense_amount, $monthly_sums_id, $user_id);
$stmtUpdate->execute();


// ---------------------------------------------------------------------------
// STEP 4: CALCULATE NEW CATEGORY TOTAL
// Return updated total spent for this category in the selected month
$stmtTotal = $conn->prepare(
    "SELECT SUM(expense_amount) AS total_spent
    FROM expenses_categories
    WHERE monthly_sums_id = ? AND expense_category = ?
");
$stmtTotal->bind_param("is", $monthly_sums_id, $expense_category);
$stmtTotal->execute();
$totalResult = $stmtTotal->get_result();
$totalRow = $totalResult->fetch_assoc();
$new_total_spent = (float)$totalRow['total_spent'];

// ---------------------------------------------------------------------------
// RESPONSE
echo json_encode([
    'success' => true,
    'message' => 'Expense added successfully',
    'new_total_spent' => $new_total_spent
]);
exit;
?>