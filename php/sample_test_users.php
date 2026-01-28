<?php
require 'database.php'; // $conn = mysqli connection

// Dummy users data
// Security_question values:
// pet_name, favorite_color, mother_maiden, nick_name

// users table values: user_id(pk), name, username, password, security_question, security_answer
// monthly_sums table values: monthly_sums_id(pk), user_id(fk), month_value, monthly_budget, monthly_expense
// budgets_categories table values: budgets_categories_id(pk), user_id(fk), monthly_sums(fk), budget_category(categories), budget_amount
// expenses_categories table values: expenses_categories_id(pk), monthly_sums_id(fk), expense_category(categories), expense_amount
// categories: 'Groceries', 'Rent', 'Entertainment', 'Shopping', 'Transport', 'Restaurant', 'Insurance', 'Health', 'Impromptu', 'Others'

$ALLOWED_CATEGORIES = [
    'Groceries',
    'Rent',
    'Entertainment',
    'Shopping',
    'Transport',
    'Restaurant',
    'Insurance',
    'Health',
    'Impromptu',
    'Others'
];

$users = [

    // USER 1
    [
        'name' => 'Alice Doe',
        'username' => 'alice',
        'password' => 'alice123',
        'security_question' => 'pet_name',
        'security_answer' => 'fluffy',
        'months' => [
            '2026-03-01' => [
                'categories' => [
                    'Groceries' => 100,
                    'Rent' => 700,
                    'Entertainment' => 200,
                    'Insurance' => 150,
                    'Restaurant' => 99,
                    'Shopping' => 70,
                    'Health' => 150
                ],
                'expenses' => [
                    ['Groceries', 45.50],
                    ['Groceries', 60.00],
                    ['Entertainment', 25.00],
                    ['Health', 99.00],
                    ['Insurance', 150.00],
                    ['Shopping', 31.90],
                    ['Groceries', 23.32],
                    ['Rent', 705.00]
                ]
            ]
        ]
    ],

    // USER 2
    [
        'name' => 'Nina Bauer',
        'username' => 'ninab',
        'password' => 'nona145',
        'security_question' => 'favorite_color',
        'security_answer' => 'lilac',
        'months' => [
            '2026-01-01' => [
                'categories' => [
                    'Rent' => 300,
                    'Health' => 20,
                    'Groceries' => 300,
                    'Impromptu' => 500,
                    'Transport' => 67.90,
                    'Insurance' => 60.90,
                    'Shopping' => 22.98
                ],
                'expenses' => [
                    ['Groceries', 25.50],
                    ['Health', 39.00],
                    ['Insurance', 60.90],
                    ['Transport', 31.90],
                    ['Groceries', 23.32],
                    ['Rent', 300.00],
                    ['Groceries', 20.00],
                    ['Impromptu', 300.00],
                    ['Groceries', 150.00],
                    ['Shopping', 78.00]
                ]
            ]
        ]
    ],

    // USER 3
    [
        'name' => 'Mark Weber',
        'username' => 'markw',
        'password' => 'markpass',
        'security_question' => 'nick_name',
        'security_answer' => 'webo',
        'months' => [
            '2026-03-01' => [
                'categories' => [
                    'Rent' => 800,
                    'Groceries' => 250,
                    'Transport' => 90,
                    'Entertainment' => 120
                ],
                'expenses' => [
                    ['Rent', 800],
                    ['Groceries', 60],
                    ['Groceries', 90],
                    ['Transport', 45],
                    ['Entertainment', 70]
                ]
            ]
        ]
    ],

    // USER 4
    [
        'name' => 'Julia Klein',
        'username' => 'jklein',
        'password' => 'secure321',
        'security_question' => 'mother_maiden',
        'security_answer' => 'hoffmann',
        'months' => [

            // PAST MONTHS (last 6 months)
            '2025-07-01' => [
                'categories' => [
                    'Rent' => 600,
                    'Groceries' => 190,
                    'Transport' => 55,
                    'Entertainment' => 80
                ],
                'expenses' => [
                    ['Rent', 600],
                    ['Groceries', 175],
                    ['Transport', 50],
                    ['Entertainment', 60]
                ]
            ],

            '2025-08-01' => [
                'categories' => [
                    'Rent' => 610,
                    'Groceries' => 195,
                    'Transport' => 60,
                    'Entertainment' => 85
                ],
                'expenses' => [
                    ['Rent', 610],
                    ['Groceries', 180],
                    ['Transport', 58],
                    ['Entertainment', 90]
                ]
            ],

            '2025-09-01' => [
                'categories' => [
                    'Rent' => 620,
                    'Groceries' => 200,
                    'Transport' => 60,
                    'Entertainment' => 90
                ],
                'expenses' => [
                    ['Rent', 620],
                    ['Groceries', 195],
                    ['Transport', 62],
                    ['Entertainment', 85]
                ]
            ],

            '2025-10-01' => [
                'categories' => [
                    'Rent' => 620,
                    'Groceries' => 205,
                    'Transport' => 65,
                    'Entertainment' => 95
                ],
                'expenses' => [
                    ['Rent', 620],
                    ['Groceries', 210],
                    ['Transport', 70],
                    ['Entertainment', 110]
                ]
            ],

            '2025-11-01' => [
                'categories' => [
                    'Rent' => 630,
                    'Groceries' => 210,
                    'Transport' => 65,
                    'Entertainment' => 100
                ],
                'expenses' => [
                    ['Rent', 630],
                    ['Groceries', 205],
                    ['Transport', 60],
                    ['Entertainment', 95]
                ]
            ],

            '2025-12-01' => [
                'categories' => [
                    'Rent' => 620,
                    'Groceries' => 200,
                    'Transport' => 60,
                    'Entertainment' => 90
                ],
                'expenses' => [
                    ['Rent', 620],
                    ['Groceries', 180],
                    ['Transport', 55],
                    ['Entertainment', 110]
                ]
            ],

            // CURRENT MONTH
            '2026-01-01' => [
                'categories' => [
                    'Rent' => 650,
                    'Groceries' => 220,
                    'Health' => 80,
                    'Shopping' => 100
                ],
                'expenses' => [
                    ['Rent', 650],
                    ['Groceries', 210],
                    ['Health', 40],
                    ['Shopping', 95],
                    ['Groceries', 35]
                ]
            ],

            // FUTURE MONTH (no expenses yet – tests empty state & graphs)
            '2026-02-01' => [
                'categories' => [
                    'Rent' => 650,
                    'Groceries' => 240,
                    'Health' => 100,
                    'Restaurant' => 120,
                    'Entertainment' => 80
                ],
                'expenses' => [
                    // intentionally empty
                ]
            ],

            // FAR FUTURE (partial expenses)
            '2026-03-01' => [
                'categories' => [
                    'Rent' => 650,
                    'Groceries' => 260,
                    'Transport' => 90,
                    'Entertainment' => 120
                ],
                'expenses' => [
                    ['Groceries', 45],
                    ['Transport', 30]
                ]
            ]
        ]
    ]
];

$conn->begin_transaction();

try {

    // PREPARED STATEMENTS (ONCE)
    // Table 1: users
    $userStmt = $conn->prepare(
        "INSERT INTO users (name, username, password, security_question, security_answer)
         VALUES (?, ?, ?, ?, ?)"
    );

    // Table 2: monthly_sums
    $monthStmt = $conn->prepare(
        "INSERT INTO monthly_sums (user_id, month_value, monthly_budget, monthly_expense)
         VALUES (?, ?, ?, 0)"
    );

    // Table 3: budgets_categories
    $budgetStmt = $conn->prepare(
        "INSERT INTO budgets_categories
         (user_id, monthly_sums_id, budget_category, budget_amount)
         VALUES (?, ?, ?, ?)"
    );

    // Table 4: expenses_categories
    $expenseStmt = $conn->prepare(
        "INSERT INTO expenses_categories
         (user_id, monthly_sums_id, expense_category, expense_amount)
         VALUES (?, ?, ?, ?)"
    );

    $updateMonthStmt = $conn->prepare(
        "UPDATE monthly_sums
         SET monthly_expense = ?
         WHERE monthly_sums_id = ?"
    );

    foreach ($users as $u) {

        // INSERT USER
        $userStmt->bind_param(
            "sssss",
            $u['name'],
            $u['username'],
            password_hash($u['password'], PASSWORD_DEFAULT),
            $u['security_question'],
            password_hash($u['security_answer'], PASSWORD_DEFAULT)
        );
        $userStmt->execute();
        $userId = $userStmt->insert_id;

        foreach ($u['months'] as $month => $data) {

            // CATEGORY VALIDATION + BUDGET CALC
            foreach ($data['categories'] as $cat => $_) {
                if (!in_array($cat, $ALLOWED_CATEGORIES, true)) {
                    throw new Exception("Invalid category: $cat");
                }
            }

            $monthlyBudget = array_sum($data['categories']);

            // INSERT MONTH
            $monthStmt->bind_param("isd", $userId, $month, $monthlyBudget);
            $monthStmt->execute();
            $monthlySumsId = $monthStmt->insert_id;

            // INSERT BUDGET CATEGORIES
            foreach ($data['categories'] as $cat => $amount) {
                $budgetStmt->bind_param("iisd", $userId, $monthlySumsId, $cat, $amount);
                $budgetStmt->execute();
            }

            // INSERT EXPENSES
            $totalSpent = 0;
            foreach ($data['expenses'] as [$cat, $amount]) {
                $expenseStmt->bind_param("iisd", $userId, $monthlySumsId, $cat, $amount);
                $expenseStmt->execute();
                $totalSpent += $amount;
            }

            // UPDATE MONTH TOTAL
            $updateMonthStmt->bind_param("di", $totalSpent, $monthlySumsId);
            $updateMonthStmt->execute();
        }
    }

    $conn->commit();
    echo "Dummy user data seeded successfully.";

} catch (Exception $e) {
    $conn->rollback();
    die("Seeder failed: " . $e->getMessage());
}