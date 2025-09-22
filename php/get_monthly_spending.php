<?php 
session_start(); // Start session
require_once "database.php";
header("Content-Type: applicaton/json"); // Set content type to JSON

// Set user id at log in
if (!isset($_SESSION["user_id"])) {
    echo json_encode([]); // Return empty array if not logged in
    exit;
}

$user_id = $_SESSION["user_id"]; // Get user ID from session
$data = []; // Initialize data array
$sql = "
    SELECT DATE_FORMAT(expense_date, '%b' ) AS month, SUM(amount) AS total
    FROM expenses
    WHERE user_id = $user_id
        AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY YEAR(expense_date), MONTH(expense_date)
    ORDER BY expense_date
";

$result = $conn -> query($sql);
while ($result && $row = $result -> fetch_assoc()) {
    $data[] = (float)$row['total'];
}
echo json_encode($data); // Return data as JSON