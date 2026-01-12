// budget_api.js
// Handles backend communication ONLY
const BudgetAPI = (() => {
    const BASE_URL = "/myapp/php/monthly_budget_controller.php";

    function loadBudget(month) {
        // Fixed: Added missing parenthesis and proper GET request
        return fetch(`${BASE_URL}?action=load_budget&month=${encodeURIComponent(month)}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .catch(err => {
                console.error("Load budget error:", err);
                return null;
            });
    }

    function saveBudget({ month, budgetTotal, categories }) {
        // Fixed: Changed 'amount' to 'budgetTotal' to match UI
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
        .catch(err => {
            console.error("Save budget error:", err);
            return { success: false };
        });
    }

    return {
        loadBudget,
        saveBudget
    };
})();