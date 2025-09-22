<?php 
session_start(); //start session
require_once "database.php"; // Include the database connection file
header("Content-Type: application/json"); // Set content type to JSON

// Set user id at log in
if (!isset($_SESSION["user_id"])) { 
    echo json_encode(["spent" => 0, "total" => 0]);
    exit;
}

$user_id = $_SESSION["user_id"]; // Get user ID from session
$spent = 0; 
$total = 0;

// Fetch total budget for the user
$result = $conn -> query("SELECT SUM(amount) AS total_spent FROM expenses WHERE user_id = $user_id");
if ($result && $row = $result -> fetch_assoc()) {
    $spent = (float)$row["total_spent"];
}

// Fetch total allocated budget for the user
$result = $conn -> query("SELECT SUM(amount) AS total_budget FROM budgets WHERE user_id = $user_id");
if ($result && $row = $result -> fetch_assoc()) {
    $total = (float)$row["total_budget"];
}

// Return the summary as JSON
echo json_encode(["spent" => $spent, "total" => $total]);

