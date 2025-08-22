<?php 
include 'database.php'; // includes the database connection file

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get the form data
    $name = $_POST["signup_name"];
    $username = trim($_POST["signup_username"]);
    $password = password_hash($_POST["signup_password"], PASSWORD_DEFAULT);
    $security_question = $_POST["security_question"];
    $security_answer = password_hash(trim($_POST["security_answer"]), PASSWORD_DEFAULT);

    // check if username exists
    $stmt = $conn -> prepare("SELECT id FROM users WHERE username = ?");
    $stmt -> bind_param("s", $username);
    $stmt -> execute();
    $stmt -> store_result();

    // If username already exists, redirect to login page with error
    if ($stmt -> num_rows > 0) {
        echo "Username already exists.";
        // exit();
    } else {
        // insert new user
        $stmt = $conn -> prepare("INSERT INTO users (name, username, passwors, security_question, security_answer) VALUES (?, ?, ?, ?)");
        $stmt -> bind_param("ssss", $name, $username, $password, $security_question, $security_answer);

        // execute the statement
        if ($stmt -> execute()) {
            echo "Signup successful! You can now login.";
            header("Location: ../welcomepage.html");
            exit();
        } else {
            echo "Error: " . $stmt -> error;
        }
    }
}
?>