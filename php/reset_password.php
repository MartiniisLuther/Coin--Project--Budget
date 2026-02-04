<?php 
include "database.php"; // includes the database connection file

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = trim($_POST["reset_username"]);
    $security_answer = trim($_POST["reset_security_asnwer"]);
    $newPassword = password_hash($_POST["new_password"], PASSWORD_DEFAULT);

    // fetch stored question and answer
    $stmt = $conn -> prepare("SELECT id, security_answer FROM users WHERE username = ?");
    $stmt -> bind_param("s", $username);
    $stmt -> execute();
    $stmt -> store_result();

    // check if username exists
    if ($stmt -> num_rows === 1) {
        $stmt -> bind_result($user_id, $storedAnswer);
        $stmt -> fetch();

        // verify the security answer
        if (password_verify($security_answer, $storedAnswer)) {
            // corect answer -> update the password
            $update = $conn -> prepare(
                "UPDATE users SET password = ? WHERE id = ?
            ");
            
            $update -> bind_param("si", $newPassword, $user_id);

            // execute the update statement and go to login page
            if ($update -> execute()) {
                echo "Password reset successful! You can log in now.";
                header("Location: login.php");
                exit();
                
            } else {
                echo "Error updating password.";
            }
        }  else {
            echo "Incorrect answer to the security question.";
        }
    } else {
        echo "Username does not exist.";
    }
}

?>