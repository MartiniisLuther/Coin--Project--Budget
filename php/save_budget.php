<?php 
session_start(); //start session
require_once "database.php"; // include the database connection file
header("Content-Type: text/plain"); //

if (!isset($_SESSION["user_id"])) {
    http_response_code(403);
    echo "Not logged in.";
    exit;
}

$data = json_decode(file_get_contents("php://input"), true); //
$amount = (float)($data["amount"] ?? 0);
$month = $conn -> real_escape_string($data["month"] ?? "");

//
if ($amount <= 0 || !$month) {
    http_response_code(400);
    echo "Invalid data.";
    exit;
}

//
$user_id = $_SESSION["user_id"];
$stmt = $conn -> prepare("INSERT INTO budgets (user_id, month, amount) VALUES (?,?,?");
$stmt -> bind_param("isd", $user_id, $month, $amount);
echo $stmt -> execute() ? "Budget saved successfully." : "Error: " .$conn -> error;

