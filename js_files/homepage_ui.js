/**
 * homepage_ui.js — UI logic for the homepage.php page
 * 
 * Handles dynamic category management, budget saving/loading,
 * expense addition, and UI updates on the homepage.
 */


/* ---------------- STATE TRACKING ---------------- */
/**
 * Stores the last saved month and categories to detect unsaved changes.
 */
let lastSavedState = {
    month: null,
    categories: []
};

// Global variable to track currently active monthly_sums_id
window.currentMonthlySumsId = null;


/* ---------------- NAVBAR DROPDOWN ---------------- */
/**
 * Toggles the About dropdown in the navbar and closes it on outside clicks.
 * @returns {void}
 */
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
/**
 * Displays the current date in a readable weekday–month-date–year format.
 * @return {void}
 */
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


/* ---------------- ADD CATEGORY POPUP  ---------------- */
/**
 * Handles opening and closing of the “Add Category” popup,
 * when the "+ Allocate Amount" button is clicked.
 * @return {void}
 */
function setupCategoryPopup() {
    const categoryPopup = document.getElementById("addCategoryPopup");
    const addCategoryBtn = document.getElementById("add_categories_btn");
    const closeCategoryBtn = document.getElementById("closeCategoryForm");
    
    if (!addCategoryBtn || !categoryPopup) return;

    // Show popup
    addCategoryBtn.addEventListener("click", () => {
        //console.log("Opening category popup");
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
/**
 * Creates a budget category DOM element with allocated and spent data.
 * @param {string} name - The name of the category.
 * @param {number} allocated - The allocated amount for the category.
 * @param {number} [spent=0] - The spent amount for the category.
 * @param {string} [currency="€"] - The currency symbol.
 * @returns {HTMLElement} The created category element.
 */
function createCategoryElement(name, allocated, spent = 0, currency = "€") {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category_added";
    
    // Store data attributes for use elsewhere
    categoryDiv.dataset.spent = spent;
    categoryDiv.dataset.allocated = allocated;
    
    // create element HTML
    categoryDiv.innerHTML = `
        <div class="category_title">${name}</div>
        <div class="category_amount">
            <span class="currency_option">${currency}</span>${allocated.toFixed(2)}
        </div>
    `;

    // Delete 'x' button
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
/**
 * Handles submission of new categories and updates the UI.
 * @returns {void}
 */
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
/**
 * Recalculates and updates the total allocated budget from all categories.
 * @returns {void}
 */
function updateAllocatedTotal() {
    const budgetInput = document.getElementById("budget_amount");
    if (!budgetInput) return;

    const total = [...document.querySelectorAll(".category_amount")]
        .map(el => parseFloat(el.textContent.replace(/[^\d.-]/g, "")) || 0)
        .reduce((a, b) => a + b, 0);

    budgetInput.value = total.toFixed(2);
}


/* ---------------- COLLECT CATEGORIES FROM DOM ---------------- */
/**
 * Collects category data from the DOM.
 * @returns {{name: string, amount: number}[]}
 */
function collectCategoriesFromUI() {
    return [...document.querySelectorAll(".category_added")].map(cat => ({
        name: cat.querySelector(".category_title").textContent,
        amount: parseFloat(
            cat.querySelector(".category_amount").textContent.replace(/[^\d.-]/g, "")
        )
    }));
}


/* ---------------- COMPARE CATEGORIES ---------------- */
/**
 * Compares two category arrays to detect changes.
 * @param {Array} current - Current category list
 * @param {Array} saved - Last saved category list
 * @returns {boolean}
 */
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
/**
 * Enables or disables the Save Budget button based on state changes.
 * @returns {void}
 */
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
/**
 * Converts various month formats into "Month Year".
 * @param {string} monthStr - Input month string
 * @returns {string|null} Formatted month or null if invalid
 */
function convertToMonthYear(monthStr) {
    if (!monthStr) return null;
    
    // If in YYYY-MM-DD format, convert to "Month Year"
    if (/^\d{4}-\d{2}-\d{2}$/.test(monthStr)) {
        const date = new Date(monthStr);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    // If in YYYY-MM format, convert to "Month Year"
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
        const date = new Date(`${monthStr}-01`);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    // If already in "Month Year" format, return as-is
    if (/^[A-Za-z]+ \d{4}$/.test(monthStr)) {
        return monthStr;
    }
    
    // Try to parse as date and convert to "Month Year" format
    try {
        const date = new Date(monthStr);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
        console.error("Could not parse month:", monthStr);
        return null;
    }
}


/* ---------------- SAVE BUDGET ---------------- */
/**
 * Handles saving the budget and categories to the backend.
 * @returns {void}
 */
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

        // Convert to month year (e.g., "January 2026") format for backend
        const month = convertToMonthYear(monthSelect.value);
        
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

                // Dispatch event to update charts instantly
                const budgetSavedEvent = new CustomEvent('budgetSaved', {
                    detail: {
                        monthlySumsId: result.monthly_sums_id,
                        budgetTotal: budgetAmount,
                        month: month
                    }
                });
                window.dispatchEvent(budgetSavedEvent);

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
/**
 * Loads budget data for a given month and populates the UI.
 * @param {string} monthStr - Selected month value
 * @returns {Promise<void>}
 */
async function loadBudgetForMonth(monthStr) {
    const categoriesContainer = document.getElementById("categories_container");
    const budgetInput = document.getElementById("budget_amount");

    // Debug
    //console.log("Loading budget for month:", monthStr);

    // Convert month to month year format for API call
    const month = convertToMonthYear(monthStr);
    
    if (!month) {
        console.error("Invalid month format:", monthStr);
        return;
    }
    
    try {
        const data = await BudgetAPI.loadBudget(month);
        
        //console.log("Loaded budget data:", data);
        
        // Store currently active monthly_sums_id globally
        window.currentMonthlySumsId = data?.monthly_sums_id || null;
        //console.log("Set currentMonthlySumsId to:", window.currentMonthlySumsId);

        // Handle null or error response
        if (!data || !data.success) {
            //console.log("No budget data found for", month);
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
            updateExpenditureCards(); // Clear expense cards
            return;
        }

        // Clear existing categories completely
        if (categoriesContainer) {
            categoriesContainer.innerHTML = "";
        }
        
        // Set total budget amount
        if (budgetInput) {
            budgetInput.value = data.total_budget || "";
        }

        const loadedCategories = [];

        // Check if categories exist and is an array
        if (data.categories && Array.isArray(data.categories) && categoriesContainer) {
            data.categories.forEach(cat => {
                const allocated = parseFloat(cat.allocated) || 0;
                const spent = parseFloat(cat.spent) || 0;
                
                //console.log(`Category: ${cat.name}, Allocated: ${allocated}, Spent: ${spent}`);
                
                // Create category element with the correct spent amount
                const categoryElement = createCategoryElement(cat.name, allocated, spent);
                categoriesContainer.appendChild(categoryElement);

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
        updateExpenditureCards(); // Update the overview cards with fresh data

        // Dispatch custom event to notify other components that month data has loaded
        const monthLoadedEvent = new CustomEvent('monthDataLoaded', {
            detail: {
                monthlySumsId: window.currentMonthlySumsId,
                month: monthStr
            }
        });
        window.dispatchEvent(monthLoadedEvent);

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
        updateExpenditureCards(); // Clear expense cards
    }
}


/* --------------- UPDATE BUDGETED AMOUNT (IN EXPENSE POPUP) ---------------- */
/**
 * Updates the budgeted amount field for a selected category.
 * @param {string} categoryName
 * @returns {void}
 */
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


/* --------------- UPDATE EXPENDITURE CARDS ---------------- */
/**
 * Updates expenditure overview cards(on homepage) with current spent values.
 * @returns {void}
 */
function updateExpenditureCards() {
    const categories = document.querySelectorAll(".category_added");
    
    //console.log(`Updating expenditure cards for ${categories.length} categories`);
    
    // First, reset all expense cards to €0.00
    const overviewCards = document.querySelectorAll(".each_exp_overview");
    overviewCards.forEach(card => {
        const amountDisplay = card.querySelector(".expense-amount");
        if (amountDisplay) {
            amountDisplay.textContent = "€0.00";
        }
    });
    
    // Then update with actual spent amounts
    categories.forEach(cat => {
        const categoryName = cat.querySelector(".category_title")?.textContent.trim();
        const spent = parseFloat(cat.dataset.spent) || 0;
        
        //console.log(`Card update - Category: ${categoryName}, Spent: €${spent.toFixed(2)}`);
        
        if (!categoryName) return;
        
        // Find the overview card by matching the exp_name
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


/* --------------- POPULATE EXPENSE CATEGORY DROPDOWN ---------------- */
/**
 * Populates the expense category dropdown with active categories.
 * @returns {void}
 */
function populateExpenseCategoryDropdown() {
    const categorySelect = document.getElementById("category");
    if (!categorySelect) return;

    // Clear existing options
    categorySelect.innerHTML = '<option value="">Select Category</option>';

    // Get all category elements
    const categoryElements = document.querySelectorAll(".category_added");
    
    // Extract category names that have non-zero allocated amounts
    const categories = [...categoryElements]
        .filter(cat => {
            const allocated = parseFloat(cat.dataset.allocated) || 0;
            return allocated > 0;
        })
        .map(cat => {
            const titleElement = cat.querySelector(".category_title");
            return titleElement ? titleElement.textContent.trim() : null;
        })
        .filter(Boolean); // Remove null/empty values

    // Add category options
    categories.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        categorySelect.appendChild(option);
    });
    
    //console.log(`Populated ${categories.length} categories in expense dropdown`);
}


/* --------------- UPDATE CATEGORY DISPLAY WITH SPENT AMOUNT ---------------- */
/**
 * Updates the displayed spent amount for a category.
 * @param {string} categoryName 
 * @param {number} spentAmount
 * @returns {void}
 */
function updateCategorySpentDisplay(categoryName, spentAmount) {
    const categories = document.querySelectorAll(".category_added");
    
    for (const cat of categories) {
        const titleElement = cat.querySelector(".category_title");
        if (titleElement && titleElement.textContent.trim() === categoryName) {
            // Update the data attribute
            cat.dataset.spent = spentAmount;
            
            // TODO: Add visual feedback for spent amount update
            // FUTURE feature:
            // - Flash/highlight the added category element
            // - Animate the spent amount display

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
/**
 * Initializes the Add Expense popup and related UI behavior.
 * @returns {void}
 */
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
        //console.log("Opening expenses popup");
        expenseForm.classList.toggle("hidden");
        
        // Populate category dropdown with current categories
        populateExpenseCategoryDropdown();
        
        // Reset form inputs
        if (spentAmountInput) spentAmountInput.value = "";
        if (totalSpentInput) totalSpentInput.value = "";
        if (categorySelect) categorySelect.value = "";
        if (budgetedAmountInput) budgetedAmountInput.value = "";
        
        // Update budgeted amount when popup opens if category is selected
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
                
                // Reset form inputs manually
                if (spentAmountInput) spentAmountInput.value = "";
                if (totalSpentInput) totalSpentInput.value = "";
                if (categorySelect) categorySelect.value = "";
                if (budgetedAmountInput) budgetedAmountInput.value = "";
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
/**
 * Updates the 'total spent' field for a selected category.
 * @param {string} categoryName
 * @returns {void}
 */
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
/**
 * Submits a new expense and updates UI and backend state.
 * @returns {Promise<void>}
 */
async function submitExpense() {
    const categorySelect = document.getElementById("category");
    const spentAmountInput = document.getElementById("spent_amount");
    const expenseForm = document.getElementById("addExpenseForm");

    const categoryName = categorySelect.value;
    const spentAmount = parseFloat(spentAmountInput.value);

    // Debug logs
    //console.log("Submit Expense - Category:", categoryName);
    //console.log("Submit Expense - Amount:", spentAmount);
    //console.log("Submit Expense - Current Monthly Sums ID:", window.currentMonthlySumsId);

    // Validate inputs
    if (!categoryName) {
        alert("Please select a category");
        return;
    }

    // Validate spent amount
    if (!spentAmount || spentAmount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    // Check if we have an active budget
    if (!window.currentMonthlySumsId) {
        alert("No active budget selected. Please save a budget first.");
        console.error("currentMonthlySumsId is null - no budget loaded");
        return;
    }

    // Call ExpensesAPI to add expense
    try {
        // Debug log
        // console.log("Calling ExpensesAPI.addExpense with:", {
        //     monthlySumsId: window.currentMonthlySumsId,
        //     categoryName: categoryName,
        //     amount: spentAmount
        // });

        const result = await ExpensesAPI.addExpense({
            monthlySumsId: window.currentMonthlySumsId,
            categoryName: categoryName,
            amount: spentAmount
        });

        // Debug log
        //console.log("ExpensesAPI.addExpense result:", result);

        if (!result?.success) {
            alert(result?.message || "Failed to add expense");
            return;
        }

        // Update UI with new total spent
        //console.log("Updating UI with new total spent:", result.new_total_spent);
        updateCategorySpentDisplay(categoryName, result.new_total_spent);
        updateExpenditureCards();

        // Hide form
        expenseForm.classList.add("hidden");
        
        // Reset form inputs manually
        if (spentAmountInput) spentAmountInput.value = "";
        if (categorySelect) categorySelect.value = "";
        const totalSpentInput = document.getElementById("total_spent");
        if (totalSpentInput) totalSpentInput.value = "";
        const budgetedAmountInput = document.getElementById("budgeted_amount");
        if (budgetedAmountInput) budgetedAmountInput.value = "";

        alert(`€${spentAmount.toFixed(2)} added to ${categoryName}`);

        // Dispatch event to update charts instantly
        const expenseAddedEvent = new CustomEvent('expenseAdded', {
            detail: {
                monthlySumsId: window.currentMonthlySumsId,
                categoryName: categoryName,
                amount: spentAmount,
                newTotalSpent: result.new_total_spent
            }
        });
        window.dispatchEvent(expenseAddedEvent);

    } catch (err) {
        console.error("Error submitting expense:", err);
        alert("Error adding expense: " + err.message);
    }
}


/* ---------------- SETUP MONTH SELECTOR ---------------- */
/**
 * Sets up the month selector change handler.
 * @returns {HTMLSelectElement|undefined}
 */
function setupMonthSelector() {
    const monthSelect = document.getElementById("month_select");
    
    if (!monthSelect) return;

    monthSelect.addEventListener("change", e => {
        loadBudgetForMonth(e.target.value);
    });
    
    return monthSelect;
}


/* ---------------- INITIALIZATION ---------------- */
// Initialize homepage UI components on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    //console.log("Initializing homepage UI...");
    
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