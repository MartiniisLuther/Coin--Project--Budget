// homepage_ui.js — UI logic only

/* ---------------- STATE TRACKING ---------------- */
// Track the last saved state to compare current state
let lastSavedState = {
    month: null,
    categories: []
};


/* ---------------- NAVBAR DROPDOWN ---------------- */
// This provides the About options in the navbar
function setupNavbarDropdown() {
    const linkAbout = document.querySelector(".linkAbout");
    const dropdownMenu = document.querySelector(".nav-item-dropdown");
    
    if (!linkAbout || !dropdownMenu) return;

    linkAbout.addEventListener("click", (e) => {
        e.preventDefault();
        dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!linkAbout.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove("show");
        }
    });
}


/* ---------------- TODAY'S DATE ELEMENT ---------------- */
// Update date display
function updateDateDisplay() {
    const dateElement = document.getElementById("date");
    if (!dateElement) return;
    
    dateElement.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}


/* ---------------- ALLOCATE AMOUNT BUTTON FUNCTIONS ---------------- */
// This section entails the logic for the "Add Category" button and popup.
function setupCategoryPopup() {
    const categoryPopup = document.getElementById("addCategoryPopup");
    const addCategoryBtn = document.getElementById("add_categories_btn");
    const closeCategoryBtn = document.getElementById("closeCategoryForm");
    
    if (!addCategoryBtn || !categoryPopup) return;

    // Show popup
    addCategoryBtn.addEventListener("click", () => {
        console.log("Opening category popup"); // Debug log
        categoryPopup.classList.remove("hidden");
    });

    // Close popup
    if (closeCategoryBtn) {
        closeCategoryBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to quit?")) {
                categoryPopup.classList.add("hidden");
            }
        });
    }
}


/* ---------------- CREATE CATEGORY ELEMENT ---------------- */
// This section adds the Budget categories to the homepage dynamically
function createCategoryElement(name, amount, currency = "€") {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category_added";
    categoryDiv.innerHTML = `
        <div class="category_title">${name}</div>
        <div class="category_amount"><span class="currency_option">${currency}</span>${amount}</div>
    `;

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete_category_btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.addEventListener("click", () => {
        if (confirm("Delete this category?")) {
            categoryDiv.remove();
            updateAllocatedTotal();
            updateSaveButtonState();
        }
    });

    categoryDiv.appendChild(deleteBtn);
    return categoryDiv;
}


/* ---------------- DISPLAY CATEGORIES ON THE HOMEPAGE ---------------- */
// This section adds/removes categories on the homepage.
function setupCategorySubmission() {
    const submitCategoryBtn = document.getElementById("submitCategory");
    const categoriesContainer = document.getElementById("categories_container");
    const categoryPopup = document.getElementById("addCategoryPopup");
    
    if (!submitCategoryBtn || !categoriesContainer) return;

    // Submit new category
    submitCategoryBtn.addEventListener("click", (e) => {
        e.preventDefault();

        const name = document.getElementById("category_name").value.trim();
        const amount = parseFloat(document.getElementById("category_amount").value);

        if (!name || !amount || amount <= 0) {
            alert("Please fill in both fields.");
            return;
        }

        const exists = [...document.querySelectorAll(".category_title")]
            .some(el => el.textContent.toLowerCase() === name.toLowerCase());

        if (exists) {
            alert("Category already exists!");
            return;
        }

        categoriesContainer.appendChild(createCategoryElement(name, amount));

        document.getElementById("category_name").value = "";
        document.getElementById("category_amount").value = "";
        if (categoryPopup) {
            categoryPopup.classList.add("hidden");
        }

        updateAllocatedTotal();
        updateSaveButtonState();
    });
}


/* ---------------- SUM ALLOCATED TOTAL ---------------- */
function updateAllocatedTotal() {
    const budgetInput = document.getElementById("budget_amount");
    if (!budgetInput) return;

    const total = [...document.querySelectorAll(".category_amount")]
        .map(el => parseFloat(el.textContent.replace(/[^\d.-]/g, "")) || 0)
        .reduce((a, b) => a + b, 0);

    budgetInput.value = total.toFixed(2);
}


/* ---------------- COLLECT CATEGORIES FROM DOM ---------------- */
// Helper function to collect categories from the DOM
function collectCategoriesFromUI() {
    return [...document.querySelectorAll(".category_added")].map(cat => ({
        name: cat.querySelector(".category_title").textContent,
        amount: parseFloat(
            cat.querySelector(".category_amount").textContent.replace(/[^\d.-]/g, "")
        )
    }));
}


/* ---------------- COMPARE CATEGORIES ---------------- */
// Check if current categories match last saved state
function categoriesMatch(current, saved) {
    if (current.length !== saved.length) return false;

    // Sort both arrays by category name for comparison
    const sortedCurrent = [...current].sort((a, b) => a.name.localeCompare(b.name));
    const sortedSaved = [...saved].sort((a, b) => a.name.localeCompare(b.name));

    return sortedCurrent.every((cat, i) => {
        return cat.name === sortedSaved[i].name &&
            cat.amount === sortedSaved[i].amount;
    });
}


/* ---------------- UPDATE SAVE BUTTON STATE ---------------- */
// Enable/disable save button based on whether categories have changed
function updateSaveButtonState() {
    const setBudgetBtn = document.getElementById("set_budget_btn");
    const monthSelect = document.getElementById("month_select");

    if (!setBudgetBtn || !monthSelect) return;

    const currentMonth = monthSelect.value;
    const currentCategories = collectCategoriesFromUI();

    // Check if current selection is on same month
    const shouldDisable = 
        lastSavedState.month === currentMonth && 
        categoriesMatch(currentCategories, lastSavedState.categories);

    setBudgetBtn.disabled = shouldDisable;

    // Visual feedback
    if (shouldDisable) {
        setBudgetBtn.style.cursor = "not-allowed";
        setBudgetBtn.style.opacity = "0.5";
    } else {
        setBudgetBtn.style.cursor = "pointer";
        setBudgetBtn.style.opacity = "1";
    }
}


/* ---------------- SAVE BUDGET ---------------- */
function setupBudgetSave() {
    const setBudgetBtn = document.getElementById("set_budget_btn");
    
    if (!setBudgetBtn) return;

    setBudgetBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        // Double-check button isnt disabled
        if (setBudgetBtn.disabled) return;

        const budgetAmount = document.getElementById("budget_amount").value;
        const month = document.getElementById("month_select").value;

        if (!budgetAmount || budgetAmount <= 0) {
            alert("Add at least one category.");
            return;
        }

        const categories = collectCategoriesFromUI();

        try {
            const result = await BudgetAPI.saveBudget({
                month,
                budgetTotal: budgetAmount,
                categories
            });

            if (result && result.success) {
                // Update last saved state
                lastSavedState = {
                    month: month,
                    categories: categories.map(cat => ({ ...cat })) // Deep copy
                };

                updateSaveButtonState();
                alert("Budget saved successfully!");
            } else {
                alert("Failed to save budget.");
            }

        } catch (err) {
            console.error(err);
            alert("Error saving budget.");
        }
    });
}


/* ---------------- LOAD BUDGET ---------------- */
async function loadBudgetForMonth(month) {
    const categoriesContainer = document.getElementById("categories_container");
    
    try {
        const data = await BudgetAPI.loadBudget(month);
        
        // Handle null or error response
        if (!data) {
            console.log("No budget data found for", month);
            if (categoriesContainer) {
                categoriesContainer.innerHTML = "";
            }
            const budgetInput = document.getElementById("budget_amount");
            if (budgetInput) {
                budgetInput.value = "";
            }

            // Reset last saved state
            lastSavedState = {
                month: month,
                categories: []
            };
            updateSaveButtonState();
            return;
        }

        // Clear existing categories
        if (categoriesContainer) {
            categoriesContainer.innerHTML = "";
        }
        
        const budgetInput = document.getElementById("budget_amount");
        if (budgetInput) {
            budgetInput.value = data.amount || "";
        }

        const loadedCategories = [];

        // Check if categories exist and is an array
        if (data.categories && Array.isArray(data.categories) && categoriesContainer) {
            data.categories.forEach(cat => {
                categoriesContainer.appendChild(
                    createCategoryElement(cat.name, cat.amount)
                );

                // Track loaded categories for state comparison
                loadedCategories.push({
                    name: cat.name,
                    amount: cat.amount
                });
            });
        }

        // Update last saved state
        lastSavedState = {
            month: month,
            categories: loadedCategories
        };

        updateAllocatedTotal();
        updateSaveButtonState();

    } catch (err) {
        console.error("Error loading budget:", err);
        if (categoriesContainer) {
            categoriesContainer.innerHTML = "";
        }

        const budgetInput = document.getElementById("budget_amount");
        if (budgetInput) {
            budgetInput.value = "";
        }

        // Reset last saved state
        lastSavedState = {
            month: month,
            categories: []
        };
        updateSaveButtonState();
    }
}


/* --------------- UPDATE BUDGETED AMOUNT ---------------- */
// Get the budgeted amount for a selected category and feed it to the expense popup
function updateBudgetedAmount(categoryName) {
    const budgetedAmountInput = document.getElementById("budgeted_amount");
    if (!budgetedAmountInput) return;

    // Find the category in the DOM
    const categories = document.querySelectorAll(".category_added");
    let budgetedAmount = 0;

    for (const cat of categories) {
        const titleElement = cat.querySelector(".category_title");
        if (titleElement && titleElement.textContent.trim() === categoryName) {
            const amountElement = cat.querySelector(".category_amount");
            if (amountElement) {
                budgetedAmount = parseFloat(
                    amountElement.textContent.replace(/[^\d.-]/g, "")
                ) || 0;
            }
            break;
        }
    }

    budgetedAmountInput.value = budgetedAmount > 0 ? budgetedAmount.toFixed(2) : "0.00";
}


/* --------------- ADD EXPENSES POPUP SETUP ---------------- */
// This section entails the logic for the "Add Expenses" button and popup.
function setupExpensesPopup() {
    const addExpenseBtn = document.getElementById("add_expense_btn");
    const expenseForm = document.getElementById("addExpenseForm");
    const closeExpenseBtn = document.getElementById("closeExpenseForm");
    const submitExpenseBtn = document.getElementById("submitExpense");
    const categorySelect = document.getElementById("category");
    const budgetedAmountInput = document.getElementById("budgeted_amount");

    if (!addExpenseBtn || !expenseForm) return;

    // Show popup
    addExpenseBtn.addEventListener("click", () => {
        console.log("Opening expenses popup"); // Debug log
        expenseForm.classList.toggle("hidden");
        
        // Update budgeted amount when popup opens
        if (categorySelect && budgetedAmountInput) {
            updateBudgetedAmount(categorySelect.value);
        }
    });

    // Close popup
    if (closeExpenseBtn) {
        closeExpenseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to quit?")) {
                expenseForm.classList.add("hidden");
            }
        });
    }

    // Update budgeted amount when category changes
    if (categorySelect && budgetedAmountInput) {
        categorySelect.addEventListener("change", (e) => {
            updateBudgetedAmount(e.target.value);
        });
    }

    // Submit expense (placeholder logic)
    if (submitExpenseBtn) {
        submitExpenseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            alert("Expense submission not yet implemented.");
        });
    }
}


/* ---------------- SETUP MONTH SELECTOR ---------------- */
function setupMonthSelector() {
    const monthSelect = document.getElementById("month_select");
    
    if (!monthSelect) return;

    monthSelect.addEventListener("change", e => {
        loadBudgetForMonth(e.target.value);
    });
    
    return monthSelect;
}


/* ---------------- INITIALIZATION ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Initializing homepage UI..."); // Debug log
    
    // Setup UI components
    setupNavbarDropdown();
    updateDateDisplay();
    setupCategoryPopup();
    setupCategorySubmission();
    setupBudgetSave();
    const monthSelect = setupMonthSelector();
    setupExpensesPopup();

    // Load initial budget data
    if (monthSelect) {
        await loadBudgetForMonth(monthSelect.value);
    }
});