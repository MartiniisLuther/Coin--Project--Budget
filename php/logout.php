<?php 
// Initialize the session
session_start();
// Unset all of the session variables
session_unset();
// Destroy the session.
session_destroy();

//redirect back to welcome page
header("Location: ../welcomepage.html");
exit();
?>