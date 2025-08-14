<?php 
include 'database.php'; // includes the database connection file

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get the form data
    $name = $_POST["signup_name"];
    $username = trim($_POST["signup_username"]);
    $password = password_hash($_POST["signup_password"], PASSWORD_DEFAULT);

    // check if username exists
    $check = $conn -> prepare("SELECT id FROM users WHERE username = ?");
    $check -> bind_param("s", $username);
    $check -> execute();
    $check -> store_result();

    // If username already exists, redirect to signup page with error
    if ($check ->num_rows > 0) {
        echo "Username already exists.";
        exit();
    }

    // Insert new user into the database
    $stmt = $conn -> prepare("INSERT INTO users (name, username, password) VALUES (?, ?, ?)");
    $stmt -> bind_param("sss", $name, $username, $password);

    // if the insert is successful, redirect to welcome page
    if ($stmt -> execute()) {
        // redirect to welcome page after successful signup
        header("Location: ../homepage.html");
        exit();
    } else {
        echo "Error: " . $stmt -> error;
    }

}

?>