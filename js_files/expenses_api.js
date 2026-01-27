// expenses_api.js — Handles expense-related backend communication
const ExpensesAPI = (() => {
    const BASE_URL = "/myapp/php/expenses_controller.php";

    /**
     * Add a new expense for a category
     * @param {Object} expenseData
     * @param {number} expenseData.monthlySumsId - The active monthly_sums_id
     * @param {string} expenseData.categoryName - Category name e.g. "Shopping"
     * @param {number} expenseData.amount - Expense amount
     * @returns {Promise<Object>} Backend response
     */
    function addExpense({ monthlySumsId, categoryName, amount }) {
        console.log("ExpensesAPI.addExpense called with:", {userID, monthlySumsId, categoryName, amount });
        
        const formData = new FormData();
        formData.append("user_id", userID)
        formData.append("monthly_sums_id", monthlySumsId);
        formData.append("expense_category", categoryName);
        formData.append("expense_amount", amount);

        // Debug: Log FormData contents
        console.log("FormData contents:");
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        return fetch(BASE_URL, {
            method: "POST",
            body: formData
        }) 
        .then(res => {
            console.log("Response status:", res.status);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Response data:", data);
            return data;
        })
        .catch(err => {
            console.error("Add expense error:", err);
            return { success: false, message: err.message };
        });
    }

    return { addExpense };
})();