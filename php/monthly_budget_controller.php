<?php
require_once "database.php";
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$userId = $_SESSION['user_id'];

// Handle GET request for loading budget
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'load_budget') {
    if (empty($_GET['month'])) {
        http_response_code(400);
        echo json_encode(["error" => "Month parameter required"]);
        exit;
    }

    $month = $_GET['month'];

    try {
        $stmt = $conn->prepare(
            "SELECT budget_per_month, category_name, budget_per_category, total_spent_per_category 
             FROM budgets 
             WHERE user_id = ? AND month = ?"
        );
        $stmt->bind_param("is", $userId, $month);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode([
                "amount" => 0,
                "categories" => []
            ]);
            exit;
        }

        $categories = [];
        $totalBudget = 0;

        while ($row = $result->fetch_assoc()) {
            $totalBudget = $row['budget_per_month'];
            $categories[] = [
                "name" => $row['category_name'],
                "amount" => (float)$row['budget_per_category'],
                "spent" => (float)$row['total_spent_per_category']
            ];
        }

        echo json_encode([
            "amount" => $totalBudget,
            "categories" => $categories
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to load budget"]);
    }
    exit;
}

// Handle POST request for saving budget
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? null;

    if ($action === 'save_budget') {
        $month = $_POST['month'] ?? null;
        $budgetTotal = $_POST['budgetTotal'] ?? null;
        $categoriesJson = $_POST['categories'] ?? null;

        if (empty($month) || empty($categoriesJson)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid input"]);
            exit;
        }

        $categories = json_decode($categoriesJson, true);

        if (!$categories || !is_array($categories)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid categories format"]);
            exit;
        }

        $totalBudget = 0;
        foreach ($categories as $cat) {
            $totalBudget += (float)$cat['amount'];
        }

        $conn->begin_transaction();

        try {
            // Remove existing categories for that user + month
            $deleteStmt = $conn->prepare(
                "DELETE FROM budgets WHERE user_id = ? AND month = ?"
            );
            $deleteStmt->bind_param("is", $userId, $month);
            $deleteStmt->execute();

            // Insert categories
            $insertStmt = $conn->prepare(
                "INSERT INTO budgets
                (user_id, month, budget_per_month, total_spent_per_month,
                 category_name, budget_per_category, total_spent_per_category)
                VALUES (?, ?, ?, 0, ?, ?, 0)"
            );

            foreach ($categories as $cat) {
                $name = trim($cat['name']);
                $amount = (float)$cat['amount'];

                if ($name === "" || $amount <= 0) {
                    continue;
                }

                $insertStmt->bind_param(
                    "isdsd",
                    $userId,
                    $month,
                    $totalBudget,
                    $name,
                    $amount
                );
                $insertStmt->execute();
            }

            $conn->commit();
            echo json_encode([
                "success" => true,
                "total_budget" => $totalBudget
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["error" => "Failed to save budget"]);
        }
        exit;
    }
}

http_response_code(400);
echo json_encode(["error" => "Invalid request"]);
?>