// homepage_ui.js — UI logic for normalized database schema

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
        console.log("Opening category popup");
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
// Simple display - only shows category name and allocated amount
function createCategoryElement(name, allocated, spent = 0, categoryId = null, currency = "€") {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category_added";
    
    // Store data attributes for use elsewhere
    categoryDiv.dataset.spent = spent;
    categoryDiv.dataset.allocated = allocated;
    if (categoryId) {
        categoryDiv.dataset.categoryId = categoryId; // Store category ID from database
    }
    
    categoryDiv.innerHTML = `
        <div class="category_title">${name}</div>
        <div class="category_amount">
            <span class="currency_option">${currency}</span>${allocated.toFixed(2)}
        </div>
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

        // When adding new category, spent is 0
        categoriesContainer.appendChild(createCategoryElement(name, amount, 0));

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


/* ---------------- CONVERT MONTH FORMAT ---------------- */
// Helper function to convert month string to first day of month format
// Handles formats like "2026-January" or "January 2026" -> "2026-01-01"
function convertToFirstDayOfMonth(monthStr) {
    if (!monthStr) return null;
    
    // If already in YYYY-MM-DD format, convert to first day
    if (/^\d{4}-\d{2}-\d{2}$/.test(monthStr)) {
        const parts = monthStr.split('-');
        return `${parts[0]}-${parts[1]}-01`;
    }
    
    // If in YYYY-MM format, add -01
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
        return `${monthStr}-01`;
    }
    
    // Try to parse as date and convert
    try {
        const date = new Date(monthStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    } catch (e) {
        console.error("Could not parse month:", monthStr);
        return null;
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
        const monthSelect = document.getElementById("month_select");
        
        if (!monthSelect) return;

        if (!budgetAmount || budgetAmount <= 0) {
            alert("Add at least one category.");
            return;
        }

        const categories = collectCategoriesFromUI();
        
        if (categories.length === 0) {
            alert("Add at least one category.");
            return;
        }

        // Convert month to first day format (e.g., "2026-01-01")
        const month = convertToFirstDayOfMonth(monthSelect.value);
        
        if (!month) {
            alert("Invalid month format.");
            return;
        }

        try {
            const result = await BudgetAPI.saveBudget({
                month: month,
                budgetTotal: budgetAmount,
                categories: categories
            });

            if (result && result.success) {
                // Update last saved state
                lastSavedState = {
                    month: monthSelect.value, // Store original format
                    categories: categories.map(cat => ({ ...cat })) // Deep copy
                };

                updateSaveButtonState();
                alert("Budget saved successfully!");
                
                // Reload to show updated spent amounts
                await loadBudgetForMonth(monthSelect.value);
            } else {
                alert(result?.message || "Failed to save budget.");
            }

        } catch (err) {
            console.error(err);
            alert("Error saving budget.");
        }
    });
}


/* ---------------- LOAD BUDGET ---------------- */
// UPDATED: Now handles the new schema response format
async function loadBudgetForMonth(monthStr) {
    const categoriesContainer = document.getElementById("categories_container");
    const budgetInput = document.getElementById("budget_amount");
    
    // Convert month to first day format for API call
    const month = convertToFirstDayOfMonth(monthStr);
    
    if (!month) {
        console.error("Invalid month format:", monthStr);
        return;
    }
    
    try {
        const data = await BudgetAPI.loadBudget(month);
        
        // Handle null or error response
        if (!data || !data.success) {
            console.log("No budget data found for", month);
            if (categoriesContainer) {
                categoriesContainer.innerHTML = "";
            }
            if (budgetInput) {
                budgetInput.value = "";
            }

            // Reset last saved state
            lastSavedState = {
                month: monthStr,
                categories: []
            };
            updateSaveButtonState();
            return;
        }

        // Clear existing categories
        if (categoriesContainer) {
            categoriesContainer.innerHTML = "";
        }
        
        // Set total budget amount
        if (budgetInput) {
            budgetInput.value = data.total_budget || "";
        }

        const loadedCategories = [];

        // NEW SCHEMA: data structure is now:
        // {
        //   success: true,
        //   total_budget: "243.00",
        //   categories: [
        //     { id: 1, name: "Shopping", allocated: "120.00", spent: "0.00" },
        //     { id: 2, name: "Health", allocated: "123.00", spent: "0.00" }
        //   ],
        //   total_spent: "0.00"
        // }

        // Check if categories exist and is an array
        if (data.categories && Array.isArray(data.categories) && categoriesContainer) {
            data.categories.forEach(cat => {
                const allocated = parseFloat(cat.allocated) || 0;
                const spent = parseFloat(cat.spent) || 0;
                const categoryId = cat.id; // Get category ID from backend
                
                categoriesContainer.appendChild(
                    createCategoryElement(cat.name, allocated, spent, categoryId)
                );

                // Track loaded categories for state comparison (allocated amounts only)
                loadedCategories.push({
                    name: cat.name,
                    amount: allocated
                });
            });
        }

        // Update last saved state
        lastSavedState = {
            month: monthStr,
            categories: loadedCategories
        };

        updateAllocatedTotal();
        updateSaveButtonState();
        updateExpenditureCards(); // Update the overview cards

    } catch (err) {
        console.error("Error loading budget:", err);
        if (categoriesContainer) {
            categoriesContainer.innerHTML = "";
        }

        if (budgetInput) {
            budgetInput.value = "";
        }

        // Reset last saved state
        lastSavedState = {
            month: monthStr,
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


/* --------------- POPULATE EXPENSE CATEGORY DROPDOWN ---------------- */
// NEW: Populate the expense form category dropdown with current budget categories
function populateExpenseCategoryDropdown() {
    const categorySelect = document.getElementById("category");
    if (!categorySelect) return;

    // Get all current categories
    const categories = [...document.querySelectorAll(".category_title")]
        .map(el => el.textContent.trim())
        .filter(name => name); // Remove empty strings

    // Clear existing options
    categorySelect.innerHTML = '<option value="">Select Category</option>';

    // Add category options
    categories.forEach(categoryName => {
        const option = document.createElement("option");
        option.value = categoryName;
        option.textContent = categoryName;
        categorySelect.appendChild(option);
    });
}


/* --------------- UPDATE EXPENDITURE CARDS ---------------- */
// Update the expenditure overview cards with spent amounts
function updateExpenditureCards() {
    const categories = document.querySelectorAll(".category_added");
    
    categories.forEach(cat => {
        const categoryName = cat.querySelector(".category_title")?.textContent.trim();
        const spent = parseFloat(cat.dataset.spent) || 0;
        
        if (!categoryName) return;
        
        // Find the overview card by matching the exp_name
        const overviewCards = document.querySelectorAll(".each_exp_overview");
        overviewCards.forEach(card => {
            const cardName = card.querySelector(".exp_name")?.textContent.trim();
            if (cardName === categoryName) {
                const amountDisplay = card.querySelector(".expense-amount");
                if (amountDisplay) {
                    amountDisplay.textContent = `€${spent.toFixed(2)}`;
                }
            }
        });
    });
}

/* --------------- GET CATEGORY ID BY NAME ---------------- */
// Helper to get category ID from the DOM based on category name
function getCategoryIdByName(categoryName) {
    const categories = document.querySelectorAll(".category_added");
    
    for (const cat of categories) {
        const titleElement = cat.querySelector(".category_title");
        if (titleElement && titleElement.textContent.trim() === categoryName) {
            // Category ID is stored in the data from backend when loaded
            return cat.dataset.categoryId ? parseInt(cat.dataset.categoryId) : null;
        }
    }
    
    return null;
}

/* --------------- UPDATE CATEGORY DISPLAY WITH SPENT AMOUNT ---------------- */
// Update the spent amount display for a category on the main page
function updateCategorySpentDisplay(categoryName, spentAmount) {
    const categories = document.querySelectorAll(".category_added");
    
    for (const cat of categories) {
        const titleElement = cat.querySelector(".category_title");
        if (titleElement && titleElement.textContent.trim() === categoryName) {
            // Update the data attribute
            cat.dataset.spent = spentAmount;
            
            // You can add visual feedback here if needed
            // For example, flash the category or update a progress bar
            cat.style.transition = "background-color 0.3s";
            const originalBg = cat.style.backgroundColor;
            cat.style.backgroundColor = "#4CAF50";
            setTimeout(() => {
                cat.style.backgroundColor = originalBg;
            }, 300);
            
            break;
        }
    }
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
    const spentAmountInput = document.getElementById("spent_amount");
    const totalSpentInput = document.getElementById("total_spent");

    if (!addExpenseBtn || !expenseForm) return;

    // Show popup
    addExpenseBtn.addEventListener("click", () => {
        console.log("Opening expenses popup");
        expenseForm.classList.toggle("hidden");
        
        // Populate category dropdown with current categories
        populateExpenseCategoryDropdown();
        
        // Reset form
        if (spentAmountInput) spentAmountInput.value = "";
        if (totalSpentInput) totalSpentInput.value = "";
        
        // Update budgeted amount when popup opens
        if (categorySelect && budgetedAmountInput && categorySelect.value) {
            updateBudgetedAmount(categorySelect.value);
            updateTotalSpent(categorySelect.value);
        }
    });

    // Close popup
    if (closeExpenseBtn) {
        closeExpenseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to quit?")) {
                expenseForm.classList.add("hidden");
                // Reset form
                if (expenseForm.tagName === "FORM") {
                    expenseForm.reset();
                }
            }
        });
    }

    // Update budgeted amount and total spent when category changes
    if (categorySelect && budgetedAmountInput) {
        categorySelect.addEventListener("change", (e) => {
            updateBudgetedAmount(e.target.value);
            updateTotalSpent(e.target.value);
        });
    }

    // Submit expense
    if (submitExpenseBtn) {
        submitExpenseBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await submitExpense();
        });
    }
}

/* --------------- UPDATE TOTAL SPENT ---------------- */
// Get and display the current total spent for a category
function updateTotalSpent(categoryName) {
    const totalSpentInput = document.getElementById("total_spent");
    if (!totalSpentInput) return;

    const categories = document.querySelectorAll(".category_added");
    
    for (const cat of categories) {
        const titleElement = cat.querySelector(".category_title");
        if (titleElement && titleElement.textContent.trim() === categoryName) {
            const spent = parseFloat(cat.dataset.spent) || 0;
            totalSpentInput.value = spent.toFixed(2);
            break;
        }
    }
}

/* --------------- SUBMIT EXPENSE ---------------- */
// Handle expense submission - adds amount to total spent
async function submitExpense() {
    const categorySelect = document.getElementById("category");
    const spentAmountInput = document.getElementById("spent_amount");
    const monthSelect = document.getElementById("month_select");
    const expenseForm = document.getElementById("addExpenseForm");

    if (!categorySelect || !spentAmountInput || !monthSelect) {
        alert("Form elements not found");
        return;
    }

    const categoryName = categorySelect.value;
    const spentAmount = parseFloat(spentAmountInput.value);
    const currentMonth = monthSelect.value;

    // Validate inputs
    if (!categoryName) {
        alert("Please select a category");
        return;
    }

    if (!spentAmount || spentAmount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    // Get category ID
    const categoryId = getCategoryIdByName(categoryName);
    
    if (!categoryId) {
        alert("Could not find category ID. Please reload the page.");
        return;
    }

    // Use current date for expense
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
        // Add expense via API
        const result = await ExpensesAPI.addExpense({
            categoryId: categoryId,
            amount: spentAmount,
            expenseDate: today
        });

        if (result && result.success) {
            alert(`Expense of €${spentAmount.toFixed(2)} added to ${categoryName}!`);
            
            // Update the category's spent data attribute
            const categories = document.querySelectorAll(".category_added");
            categories.forEach(cat => {
                const titleElement = cat.querySelector(".category_title");
                if (titleElement && titleElement.textContent.trim() === categoryName) {
                    // Update with new total from backend
                    cat.dataset.spent = result.new_total_spent;
                }
            });
            
            // Update expenditure overview cards
            updateExpenditureCards();
            
            // Close the popup
            if (expenseForm) {
                expenseForm.classList.add("hidden");
            }
            
            // Reset form
            if (spentAmountInput) spentAmountInput.value = "";
            const totalSpentInput = document.getElementById("total_spent");
            if (totalSpentInput) totalSpentInput.value = "";
            
        } else {
            alert(result?.message || "Failed to add expense");
        }

    } catch (err) {
        console.error("Error submitting expense:", err);
        alert("Error adding expense. Please try again.");
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
    console.log("Initializing homepage UI...");
    
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