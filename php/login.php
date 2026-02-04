<?php
// login.php — Handles user authentication
// Responsibilities:
//  - Validate login credentials
//  - Verify password using password hashing
//  - Initialize authenticated session
//  - Redirect user to homepage on success

include "database.php"; //Database connection file
session_start(); // Start user session

// Only handle POST-based login requests
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST["login_username"]);
    $password = $_POST["login_password"];

    // -----------------------------------------------------------------------
    // FETCH USER CREDENTIALS
    // Retrieve stored password hash for the given username
    $stmt = $conn->prepare(
        "SELECT user_id, password 
        FROM users 
        WHERE username = ?
    ");

    if (!$stmt) {
        die("Prepare failed (SELECT): " . $conn->error);
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();

    $result = $stmt->get_result();

    // -----------------------------------------------------------------------
    // AUTHENTICATION CHECK
    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        $user_id = $row['user_id'];
        $hashed_password = $row['password'];

        // Verify plaintext password against stored hash
        if (password_verify($password, $hashed_password)) {
            $_SESSION["user_id"] = $user_id;
            $_SESSION["username"] = $username;

            header("Location: ../homepage.php");
            exit();
            
        } else {
            echo "Incorrect password.";
        }
    } else {
        echo "Username does not exist.";
    }

    $stmt->close();
    $conn->close();
}
?>