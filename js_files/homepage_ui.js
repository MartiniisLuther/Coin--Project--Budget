// homepage_ui.js — UI logic only

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

    addCategoryBtn.addEventListener("click", () => {
        console.log("Opening category popup"); // Debug log
        categoryPopup.classList.remove("hidden");
    });

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


/* ---------------- SAVE BUDGET ---------------- */
function setupBudgetSave() {
    const setBudgetBtn = document.getElementById("set_budget_btn");
    
    if (!setBudgetBtn) return;

    setBudgetBtn.addEventListener("click", async (e) => {
        e.preventDefault();

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
            return;
        }

        if (categoriesContainer) {
            categoriesContainer.innerHTML = "";
        }
        
        const budgetInput = document.getElementById("budget_amount");
        if (budgetInput) {
            budgetInput.value = data.amount || "";
        }

        // Check if categories exist and is an array
        if (data.categories && Array.isArray(data.categories) && categoriesContainer) {
            data.categories.forEach(cat => {
                categoriesContainer.appendChild(
                    createCategoryElement(cat.name, cat.amount)
                );
            });
        }

        updateAllocatedTotal();
    } catch (err) {
        console.error("Error loading budget:", err);
        if (categoriesContainer) {
            categoriesContainer.innerHTML = "";
        }
        const budgetInput = document.getElementById("budget_amount");
        if (budgetInput) {
            budgetInput.value = "";
        }
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

    // Load initial budget data
    if (monthSelect) {
        await loadBudgetForMonth(monthSelect.value);
    }
});