<?php 
// enable error reporting for debugging
error_reporting(E_ALL);
ini_set("display_errors", 1);

include 'database.php'; // includes the database connection file

// check if the form is submitted
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
        header("Location: ../welcomepage.html?error=userexists");
        exit();
    } else {
        // insert new user
        $stmt = $conn -> prepare("INSERT INTO users (name, username, password, security_question, security_answer) VALUES (?, ?, ?, ?, ?)");
        $stmt -> bind_param("sssss", $name, $username, $password, $security_question, $security_answer);

        // execute the statement
        if ($stmt -> execute()) {
            header("Location: ../homepage.php?success=signup");
            exit();
        } else {
            header("Location: ../welcomepage.html?error=server");
            exit();
        }
    }
}
?>