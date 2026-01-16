// budget_api.js
// Handles backend communication with normalized database schema
const BudgetAPI = (() => {
    const BASE_URL = "/myapp/php/monthly_budget_controller.php";

    /**
     * Load budget data for a specific month
     * @param {string} month - Format: "2026-01-01" (first day of month)
     * @returns {Promise<Object|null>} Budget data or null on error
     */
    function loadBudget(month) {
        return fetch(`${BASE_URL}?action=load_budget&month=${encodeURIComponent(month)}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    // Expected structure from backend:
                    // {
                    //   success: true,
                    //   monthly_budget_id: 1,
                    //   month: "2026-01-01",
                    //   total_budget: "243.00",
                    //   categories: [
                    //     { id: 1, name: "Shopping", allocated: "120.00", spent: "0.00" },
                    //     { id: 2, name: "Health", allocated: "123.00", spent: "0.00" }
                    //   ],
                    //   total_spent: "0.00"
                    // }
                    return data;
                } else {
                    console.warn("Load budget returned unsuccessful:", data.message);
                    return null;
                }
            })
            .catch(err => {
                console.error("Load budget error:", err);
                return null;
            });
    }

    /**
     * Save/Update monthly budget and categories
     * @param {Object} budgetData
     * @param {string} budgetData.month - Format: "2026-01-01"
     * @param {number} budgetData.budgetTotal - Total monthly budget
     * @param {Array} budgetData.categories - [{name: "Shopping", amount: 120}, ...]
     * @returns {Promise<Object>} Success response
     */
    function saveBudget({ month, budgetTotal, categories }) {
        const formData = new FormData();
        formData.append("action", "save_budget");
        formData.append("month", month);
        formData.append("budgetTotal", budgetTotal);
        formData.append("categories", JSON.stringify(categories));

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
            // { success: true, monthly_budget_id: 1, message: "Budget saved successfully" }
            // OR
            // { success: false, message: "Error message" }
            return data;
        })
        .catch(err => {
            console.error("Save budget error:", err);
            return { success: false, message: err.message };
        });
    }

    /**
     * Delete a monthly budget and all its categories
     * @param {string} month - Format: "2026-01-01"
     * @returns {Promise<Object>} Success response
     */
    function deleteBudget(month) {
        const formData = new FormData();
        formData.append("action", "delete_budget");
        formData.append("month", month);

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
            return data;
        })
        .catch(err => {
            console.error("Delete budget error:", err);
            return { success: false, message: err.message };
        });
    }

    /**
     * Get list of all months with budgets for the current user
     * @returns {Promise<Array|null>} Array of month strings or null
     */
    function getBudgetMonths() {
        return fetch(`${BASE_URL}?action=get_budget_months`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    // Expected: { success: true, months: ["2026-01-01", "2026-02-01"] }
                    return data.months;
                }
                return null;
            })
            .catch(err => {
                console.error("Get budget months error:", err);
                return null;
            });
    }

    return {
        loadBudget,
        saveBudget,
        deleteBudget,
        getBudgetMonths
    };
})();