<?php
// signup.php — Handle user signup form submission

// enable error reporting for debugging
error_reporting(E_ALL);
ini_set("display_errors", 1);

include 'database.php'; // includes the database connection file

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // --- Sanitize input ---
    $name = trim($_POST["signup_name"]);
    $username = trim($_POST["signup_username"]);
    $password_raw = $_POST["signup_password"];
    $security_question = trim($_POST["security_question"]);
    $security_answer_raw = trim($_POST["security_answer"]);

    // --- Validate input ---
    $errors = [];

    if (empty($name)) $errors[] = "Name is required.";
    if (empty($username)) $errors[] = "Username is required.";
    if (empty($password_raw)) $errors[] = "Password is required.";
    if (empty($security_question)) $errors[] = "Security question is required.";
    if (empty($security_answer_raw)) $errors[] = "Security answer is required.";

    if (!empty($errors)) {
        // Redirect back with errors (or handle how you prefer)
        $error_query = implode(',', $errors);
        header("Location: ../welcomepage.html?error=" . urlencode($error_query));
        exit();
    }

    // --- Hash sensitive fields ---
    $password = password_hash($password_raw, PASSWORD_DEFAULT);
    $security_answer = password_hash($security_answer_raw, PASSWORD_DEFAULT);

    // --- Check database connection ---
    if (!$conn) {
        die("Database connection failed: " . mysqli_connect_error());
    }

    // --- Check if username exists ---
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE username = ?");
    if (!$stmt) {
        die("Prepare failed (SELECT): " . $conn->error);
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->close();
        header("Location: ../welcomepage.html?error=userexists");
        exit();
    }
    $stmt->close();

    // --- Insert new user ---
    $stmt = $conn->prepare(
        "INSERT INTO users (name, username, password, security_question, security_answer) 
    VALUES (?, ?, ?, ?, ?)");

    if (!$stmt) {
        die("Prepare failed (INSERT): " . $conn->error);
    }

$stmt->bind_param("sssss", $name, $username, $password, $security_question, $security_answer);

    if ($stmt->execute()) {
        $stmt->close();
        $conn->close();
        header("Location: ../homepage.php?success=signup");
        exit();
    } else {
        die("Execute failed: " . $stmt->error);
    }
}