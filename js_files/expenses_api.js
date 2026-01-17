// expenses_api.js
// Handles expense-related backend communication
const ExpensesAPI = (() => {
    const BASE_URL = "/myapp/php/expenses_controller.php";

    /**
     * Add a new expense (adds to total spent for category)
     * @param {Object} expenseData
     * @param {number} expenseData.categoryId - Budget category ID
     * @param {number} expenseData.amount - Expense amount to add
     * @param {string} expenseData.expenseDate - Date in YYYY-MM-DD format
     * @returns {Promise<Object>} Response with success status and updated totals
     */
    function addExpense({ categoryId, amount, expenseDate }) {
        const formData = new FormData();
        formData.append("action", "add_expense");
        formData.append("category_id", categoryId);
        formData.append("amount", amount);
        formData.append("expense_date", expenseDate);

        return fetch(BASE_URL, {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            // Expected response:
            // {
            //   success: true,
            //   expense_id: 1,
            //   category_name: "Shopping",
            //   new_total_spent: "145.50",
            //   message: "Expense added successfully"
            // }
            return data;
        })
        .catch(err => {
            console.error("Add expense error:", err);
            return { success: false, message: err.message };
        });
    }

    return {
        addExpense
    };
})();