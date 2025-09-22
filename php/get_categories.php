<?php
session_start(); // Start session
require_once "database.php"; // Include the database connection file
header("Content-Type: application/json"); // Set content type to JSON

if (!isset($_SESSION["user_id"])) {
    echo json_encode([]); // Return empty array if not logged in
    exit;
}

$user_id = $_SESSION["user_id"]; // Get user ID from session
$out = []; // Initialize data array
$result = $conn -> query("SELECT name, allocated_amount FROM categories WHERE user_id = $user_id");
while ($result && $row = $result -> fetch_assoc()) {
    $out[] = $row;
}
echo json_encode($out); //
