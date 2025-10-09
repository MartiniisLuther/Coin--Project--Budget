<?php 
include "database.php"; // includes the database connection file
session_start(); // start the session

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST["login_username"]);
    $password = $_POST["login_password"];

    // Check username and password from the database
    $stmt = $conn -> prepare("SELECT id, password FROM users WHERE username = ?");
    $stmt -> bind_param("s", $username);
    $stmt -> execute();
    $stmt -> store_result();

    // 
    if ($stmt -> num_rows === 1) {
        $stmt -> bind_result($user_id, $hashed_password);
        $stmt -> fetch();

        // verify the password
        if (password_verify($password, $hashed_password)) {
            // Password is correct, set session variables
            $_SESSION["user_id"] = $user_id;
            $_SESSION["username"] = $username;

            // redirect to the homepage after successful login
            header("Location: ../homepage.php");
            exit();
        } else {
            // Password is incorrect
            echo "Incorrect password.";
        }
    } else {
        echo "Username does not exist.";
    }
}

?>