<?php
include "database.php"; // includes the database connection file
session_start(); // start the session

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST["login_username"]);
    $password = $_POST["login_password"];

    // Prepare statement
    $stmt = $conn->prepare("SELECT user_id, password FROM users WHERE username = ?");
    if (!$stmt) {
        die("Prepare failed (SELECT): " . $conn->error);
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();

    // Fetch result as associative array
    $result = $stmt->get_result();
    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        $user_id = $row['user_id'];
        $hashed_password = $row['password'];

        // Verify password
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