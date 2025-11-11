// overall page loader to monitor the page load
document.addEventListener("DOMContentLoaded", async () => {
    // NAVBAR dropdown
    const linkAbout = document.querySelector(".linkAbout");
    const dropdownMenu = document.querySelector(".nav-item-dropdown");

    function setupDropdown(link, menu) {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            menu.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (!link.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove("show");
            }
        });
    }
    // make dropdown work, when About is clicked
    if(linkAbout && dropdownMenu) setupDropdown(linkAbout, dropdownMenu);


    // data for the date and days progress
    function setupDateAndProgress() {
        const dateElement = document.getElementById("date");
        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString("en-US", {
                weekday: "long", day: "2-digit", month: "long", year: "numeric"
            });
        }

        // set the current month in the header
        const monthElement = document.getElementById("current_month");
        if(monthElement) {
            monthElement.textContent = new Date().toLocaleDateString("en-US", {
                month: "long"
            });
        }

        // calculate the days left in the month
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const today = now.getDate();
        const daysLeft = lastDay - today;

        // set the progress bar and text
        const progress = document.getElementById("daysProgress");
        const daysLeftText = document.getElementById("daysLeftText");
        if (progress && daysLeftText) {
            progress.max = lastDay;
            progress.value = today;
            daysLeftText.textContent = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;
        }
    }
    // call the function to fetch data and setup the page
    setupDateAndProgress();


    // Setup logic for the "Add Category" button and popup.
    // Ensures listeners are attached only once and not duplicated.
    function setupAddCategoryButton() {
        const addCategoryBtn = document.getElementById("add_categories_btn");
        const categoryPopup = document.getElementById("addCategoryPopup");
        const closeCategoryBtn = document.getElementById("closeCategoryForm");

        if (!addCategoryBtn || !categoryPopup) {
            // Required DOM elements not found.
            // console.warn("Add Category button or popup not found in the DOM.");
            return;
        }

        // Helper to ensure event listeners are attached only once 
        // by tracking a custom property.
        if (!addCategoryBtn._listenerAttached) {
            addCategoryBtn.addEventListener("click", () => {
                categoryPopup.classList.toggle("hidden");
            });
            addCategoryBtn._listenerAttached = true;
        }

        if (closeCategoryBtn && !closeCategoryBtn._listenerAttached) {
            closeCategoryBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (confirm("Are you sure you want to quit?")) {
                    categoryPopup.classList.add("hidden");
                }
            });
            closeCategoryBtn._listenerAttached = true;
        }
    }

    // Initialize the add category button functionality
    setupAddCategoryButton();


    // set up for the summary doughnut style pie chart
    function drawDoughnutChart(ctx, spent, total) {
        const radius = 80, centerX = 100, centerY = 90;
        const spentAngle = (2 * Math.PI) * (spent / total);

        // draws the background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#d4af37"; // gold color
        ctx.fill();

        // draws the spent portion of the doughnut
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, spentAngle - 0.5 * Math.PI, false);
        ctx.closePath();
        ctx.fillStyle = "teal";
        ctx.fill();
    }


    // fetch the monthly summary data and display it on a doughnut chart
    async function setupPerMonthDonut() {
        const { total_spent_per_month, budget_per_month } = await fetchPerMonthSummaryData();

        // handle edge case where total budget is 0 to avoid division by zero
        if (!budget_per_month || budget_per_month <= 0) {
            const summaryText = document.getElementById("summaryText");
            if (summaryText) {
                summaryText.textContent = "No spending data available.";
            }

            // clear the canvas if it exists
            const doughnutCanvas = document.getElementById("summaryDoughnut");
            if (doughnutCanvas) {
                const ctx = doughnutCanvas.getContext("2d");
                ctx.clearRect(0, 0, doughnutCanvas.clientWidth, doughnutCanvas.height);
            }
            return; // exit the function early to prevent errors
        }

        // calculate the and draw donut chart
        const percent = Math.round((total_spent_per_month / budget_per_month) * 100);
        const summaryText = document.getElementById("summaryText");
        if (summaryText) {
            summaryText.textContent = `${percent}% of € ${budget_per_month} spent.`;
        }

        // draw the doughnut chart
        const doughnutCanvas = document.getElementById("summaryDoughnut");
        if (doughnutCanvas) {
            drawDoughnutChart(doughnutCanvas.getContext("2d"), total_spent_per_month, budget_per_month);
        }
    }
    setupPerMonthDonut();  // call the function to setup the summary


    // fetch summary data from the backend
    async function fetchPerMonthSummaryData() {
        try {
            const response = await fetch('/myapp/php/monthly_total_spending.php?action=fetch_monthly_total_n_budget');
            
            // handle non-OK responses
            if (!response.ok) {
                console.warn(`fetchPerMonthSummaryData: Server responded with ${response.status}`);
                return { total_spent_per_month: 0, budget_per_month: 0 };
            }
            
            const data = await response.json(); // parse JSON response

            // validate the data
            if (!data || !data.success || !Array.isArray(data.data) || data.data.length === 0) {
                console.warn('fetchPerMonthSummaryData: Invalid or empty data received', data);
                return { total_spent_per_month: 0, budget_per_month: 0 };
            }

            // use the most recent month's data
            const latest = data.data[0];
            const total_spent_per_month = Number(latest.total_spent_per_month) || 0; // default to 0 if invalid
            const budget_per_month = Number(latest.budget_per_month) || 0; // default to 0 if invalid

            return { total_spent_per_month, budget_per_month };

        } catch (error) {
            console.error('Error fetching summary data:', error);
            return { total_spent_per_month: 0, budget_per_month: 0 };
        }
    }


    // display the BARCHART for the monthly spending
    function loadChartJs(callback) {
        if (window.Chart) {
            return callback();
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = callback;
        document.head.appendChild(script);
    }

    //  create the 12 MOBTH-BAR charts
    async function setupBarChart() {
        let spending = []; // array to hold spending data for all 12 months
        try {
            spending = await fetchAllMonthsSummaryData();
        } catch (error) {
            console.error("Error fetching monthly spending:", error);
            spending = [];
        }

        // ensure always have 12 values (fill with 0 if none)
        if (!Array.isArray(spending) || spending.length === 0) {
            spending = Array(12).fill(0);
        } else if (spending.length < 12) {
            const missing = 12 - spending.length;
            spending = [...Array(missing).fill(0), ...spending];
        }

        //ensure -reverse order, so rightmost is the current month
        spending = spending.reverse();
        // months.reverse();

        // generate month labels for the last 12 months
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(new Date().getFullYear(), new Date().getMonth() - 11 + i, 1);
            return d.toLocaleDateString("default", { month: "short" });
        });

        loadChartJs(() => {
            const ctx = document.getElementById("monthsBarChart")?.getContext("2d");
            if (!ctx) return;

            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: months,
                    datasets: [{
                        label: "Spending (€)",
                        data: spending,
                        backgroundColor: months.map((_, idx) =>
                            idx === months.length - 1 ? "rgba(54,162,235,0.8)" : "rgba(201,203,207,0.6)"
                        ),
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        });
    }
    // call the function to setup the bar chart
    setupBarChart();

    // fetch all months' spending data from the backend
    async function fetchAllMonthsSummaryData() {
        try {
            const response = await fetch('/myapp/php/all_months_total_spending.php?action=all_months_total_spending');

            // handle non-OK responses by returning an array of 12 zeros
            if (!response.ok) {
                console.warn(`fetchAllMonthsSummaryData: Server responded with ${response.status}`);
                return Array(12).fill(0);
            }

            const data = await response.json(); // parse JSON response
            // validate the data
            if (!data || !data.success || !Array.isArray(data.data) || data.data.length === 0) {
                console.warn("fetchAllMonthsSummaryData Error: Invalid or empty data received");
                return Array(12).fill(0);
            }

            // extract and sort the data by month
            const spending = data.total_spent_per_month.map(item => Number(item) || 0);

            // Ensure 12 values
            if (spending.length < 12) {
                const missing = 12 - spending.length;
                return [...Array(missing).fill(0), ...spending];
            }

            return spending.slice(-12); // return only the last 12 months

        } catch (error) {
            console.log("Error fetching all months' summary data:", error);
            return Array(12).fill(0); // return an array of 12 zeros on error
        }
    } 


    // create BUDGET CATEGORIES, with delete functionality
    function createCategoryElement (name, amount, currency = "€") {
        const categoryDiv = document.createElement("div");
        categoryDiv.className = "category_added";
        categoryDiv.innerHTML = `
            <div class="category_title">${name}</div>
            <div class="category_amount"><span class="currency_option">${currency}</span>${amount}</div>
        `;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete_category_btn";
        deleteBtn.title = "Delete Category";
        deleteBtn.innerHTML = "&times;";
        deleteBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete this category?")) {
                categoryDiv.remove();
                updateSaveButtonState(); // Update save button state after deletion
                syncBudgetWithCategories(); // Sync budget after deletion of category
            }
        });

        categoryDiv.appendChild(deleteBtn);
        return categoryDiv;
    }

    // Function to sum budgets for categories
    function calculateTotalCategoryBudget() {
        const amounts = Array.from(document.querySelectorAll(".category_added .category_amount"));
        let total = 0;
        amounts.forEach(el => {
            //remove non-numeric except dots
            const val = parseFloat(el.textContent.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(val)) total += val;
        });
        return total;
    }

    // Function to sync budget input with category budgets
    function syncBudgetWithCategories() {
        const budgetInput = document.getElementById("budget_amount");
        if (!budgetInput) return;
        const totalCategoryBudget = calculateTotalCategoryBudget();
        const categoryCount = document.querySelectorAll(".category_added").length;
        const currentBudgetValue = parseFloat(budgetInput.value) || "0";

        // If total category budget > budget input, set budget input to total
        if (totalCategoryBudget > currentBudgetValue) {
            budgetInput.value = totalCategoryBudget;
        }

        // If 10 categories and total != current budget, set budget to total
        if (categoryCount >= 10 && totalCategoryBudget !== currentBudgetValue) {
            budgetInput.value = totalCategoryBudget; 
        }
    }

    
    // display the created categories onto the page
    const submitCategoryBtn = document.getElementById("submitCategory");
    if (submitCategoryBtn) {
        submitCategoryBtn.addEventListener("click", (e) => { 
            e.preventDefault();

            try {
                console.log("Submit Category Clicked"); // Debug log, remove later

                const name = document.getElementById("category_name").value.trim();
                const amountInput = document.getElementById("category_amount");
                const amount = parseFloat(amountInput.value.trim() || 0);
                const categoryPopup = document.getElementById("addCategoryPopup");

                if (!name || amount <= 0)  {
                    alert ("Please fill in both fields."); 
                    return;
                }

                // check for duplicate category names (case-insensitive)
                const exists = [...document.querySelectorAll(".category_added .category_title")]
                    .some(el => el.textContent.trim().toLowerCase() === name.toLowerCase());
                if (exists) return alert("Category already exists!");

                // create and append the new category
                const newCategory = createCategoryElement(name, amount);
                document.getElementById("categories_container").appendChild(newCategory);

                // Clear input fields and close popup
                amountInput.value = "";
                document.getElementById("category_name").value = "";
                categoryPopup.classList.add("hidden");

                /*  Update save button state after adding a category
                    Short delay to ensure DOM updates before focusing 
                */
                setTimeout(() => {
                    updateSaveButtonState();
                    syncBudgetWithCategories();
                }, 100);

            } catch (error) {
                console.log("Error adding category:", error);
            }
        });
    }



    // Global storage for category budgets per month
    let categoryBudgets = {};

    // Expense tracking section, also includes popup logic
    const addExpenseBtn = document.getElementById("add_expense_btn");
    const expenseForm = document.getElementById("addExpenseForm");
    const closeExpenseBtn = document.getElementById("closeExpenseForm");
    const submitExpenseBtn = document.getElementById("submitExpense");

    const expenseCategorySelect = document.getElementById("expense_categories");
    const budgetAmountField = document.getElementById("budgeted_amount");

    // Function to render budget amount into expense form based on selected category
    function renderBudgetAmountForCategory(category) {
        if (!budgetAmountField) return;

        const budgetValue = (category && categoryBudgets && categoryBudgets[category] !== undefined) 
            ? Number(categoryBudgets[category]) : 0;

        // show with 2 decimal places and no currency symbol
        budgetAmountField.textContent = budgetValue ? budgetValue.toFixed(2) : "0.00";
    }

    // Listen for changes on EXPENSE Popup menu and load Budget amount into field
    if (expenseCategorySelect) {
        expenseCategorySelect.addEventListener("change", (e) => {
            renderBudgetAmountForCategory(e.target.value);
        });
    }

    // Set initial value for currently selected category if any
    if (expenseCategorySelect.value) {
        renderBudgetAmountForCategory(expenseCategorySelect.value);
    }

    // When opening the expense form, ensure displayed budget amount is current
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener("click", () => {
            // Ensure categoryBudgets has been populated by loadBudgetForMonth
            const selExpCat = expenseCategorySelect ? expenseCategorySelect.value : null;
            if (selExpCat) {
                renderBudgetAmountForCategory(selExpCat);
            }
        });
    }

    // Ensure submitExpenseBtn reads the selected category value & numeric input correctly
    if (submitExpenseBtn) {
        submitExpenseBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const expenseCategory = expenseCategorySelect ? expenseCategorySelect.value : null;
            const amountInput = document.getElementById("new_expense_amount");
            const amount = amountInput ? parseFloat(amountInput.value) : 0;

            // validate amount
            if (!amount || amount <= 0) return ("Please enter a valid amount.");

            // update the category amount in the overview
            if (expenseCategory)  updateCategoryAmount(expenseCategory, amount);

            // close the expense form
            if (expenseForm) expenseForm.classList.add("hidden");
        });
    }


    // Close form on confirm
    function closeFormWithConfirm (form) {
        if (confirm("Are you sure you want to quit?")) form.classList.add("hidden");
    }

    // close the expense form when the background is clicked
    if (addExpenseBtn && expenseForm) {
        addExpenseBtn.addEventListener("click", () => expenseForm.classList.toggle("hidden"));
        expenseForm.addEventListener("click", (e) => {
            if (e.target === expenseForm) closeFormWithConfirm(expenseForm);
        });
    }

    // close the expense form when the close button is clicked
    if (closeExpenseBtn && expenseForm) {
        closeExpenseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeFormWithConfirm(expenseForm);
        });
    }

    
    // Submit and Update EXPENSE categories on the page
    function updateCategoryAmount(expenseCategory, amount) {
        document.querySelectorAll(".each_exp_overview").forEach(cat => {
            if (cat.querySelector(".exp_name").textContent.trim() === expenseCategory) {
                const current = parseFloat(cat.querySelector("#expense_amount").textContent.replace(/[^0-9.]/g, "")) || 0;
                cat.querySelector("#expense_amount").innerHTML = `<span id="currency_option">€</span>${(current + amount).toFixed(2)}`;
            };
        });
    }

    // submit the expense form and add the expense to the overview
    if (submitExpenseBtn) {
        submitExpenseBtn.addEventListener("click", () => {
            const expenseCategory = document.getElementById("expense_category").value;
            const amount = parseFloat(document.getElementById("new_expense_amount").value);
            if (!amount || amount <= 0) return alert ("Please enter a valid amount.");
            // update the category amount in the overview
            updateCategoryAmount(expenseCategory, amount);
            expenseForm.classList.add("hidden");
        });
    }


    // check if there are allocated categories under + Allocate Amount 
    function hasAllocatedCategories() {
        const categoriesContainer = document.getElementById("categories_container");
        const allocatedCategories = categoriesContainer.querySelectorAll(".category_added");
        return allocatedCategories.length > 0; // returns true if there are categories
    }

    // Reference to the save budget button
    const saveBudgetBtn = document.getElementById("set_budget_btn");

    // Update saveBudgetBtn state based on category allocation
    function updateSaveButtonState() {
        // const saveButton = document.getElementById("set_budget_btn");
        const hasCategories = hasAllocatedCategories();

        if (saveBudgetBtn) {
            saveBudgetBtn.disabled = !hasCategories;
            if (!hasCategories) {
                saveBudgetBtn.style.opacity = "0.5";
                saveBudgetBtn.style.cursor = "not-allowed";
                saveBudgetBtn.title = "Please add at least one category to enable saving.";
            } else {
                saveBudgetBtn.style.opacity = "1";
                saveBudgetBtn.style.cursor = "pointer";
                saveBudgetBtn.title = "Save Budget";
            }
        }
    }


    // handle saveBudgetBtn click validation
    if (saveBudgetBtn) {
        saveBudgetBtn.addEventListener("click", async (e) => {
            e.preventDefault(); // prevent default form submission

            if (!hasAllocatedCategories()) {
                alert("Please add at least one category before saving.");
                return;
            }

            const budgetAmount = document.getElementById("budget_amount").value.trim();
            const selectedMonth = document.getElementById("month_select").value;

            if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
                alert("Please enter a valid budget amount.");
                return;
            }

            // Collect category data
            const categories = Array.from(document.querySelectorAll(".category_added")).map(cat => ({
                name: cat.querySelector(".category_title").textContent,
                amount: parseFloat(cat.querySelector(".category_amount").textContent.replace(/[^0-9.]/g, ""))
            }));

            // Ensure total category amounts matches budget input value
            const totalCategoryBudget = calculateTotalCategoryBudget();
            if (Math.abs(totalCategoryBudget - parseFloat(budgetAmount)) > 0.01) {
                alert(`The total of category budget amounts: €${totalCategoryBudget.toFixed(2)} \n  must match budget amount: €${parseFloat(budgetAmount).toFixed(2)}.`);
                syncBudgetWithCategories();
                return;
            }

            // Save to database
            try {
                const formData = new FormData();
                formData.append('action', 'save_budget');
                formData.append('month', selectedMonth);
                formData.append('amount', budgetAmount);
                formData.append('categories', JSON.stringify(categories));

                const response = await fetch('/myapp/php/budget_operations.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    alert("Budget saved successfully!");
                } else {
                    alert("Error saving budget: " + result.message);
                }
            } catch (error) {
                console.error('Error saving budget:', error);
                alert("Error saving budget. Please try again.");
            }
        });
    }


    // Monitor category changes to update save button state and sync budget
    const categoriesContainer = document.getElementById("categories_container");
    if (categoriesContainer) {
        // create a MutationObserver to watch for changes in the categories container
        const observer = new MutationObserver(() => {
            updateSaveButtonState();
            syncBudgetWithCategories();
        });

        // Start observing the categories container for child list changes
        observer.observe(categoriesContainer, { childList: true, subtree: true });
    }

    // function to collect budget amount for a specific month and feed it to the page input
    function loadBudgetIntoForm(data = {}) {
        const budgetInput = document.getElementById("budget_amount");
        const saveBtn = document.getElementById("set_budget_btn");

        if (!budgetInput || !saveBtn) return;

        // extract budget value or default to empty string
        const budgetValue = data?.budget_per_month ?? "";
        budgetInput.value = budgetValue;         // fill existing values
        saveBtn.disabled = true;

        // Enable save button only if amount changes
        budgetInput.addEventListener("input", () => {
            const changed = budgetInput.value !== String(budgetValue);
            saveBtn.disabled = !changed;
        });
    }

    // Function to load budget data for a specific month
    async function loadBudgetForMonth(month) {
        try {
            const response = await fetch(`/myapp/php/budget_operations.php?action=load_budget&month=${encodeURIComponent(month)}`);
            
            // handle non-OK responses
            if (!response.ok) {
                console.error(`Error loading budget: Server responded with ${response.status}`);
                return null;
            }
            // parse JSON response
            const result = await response.json();
            
            // process the result
            if (result.success) {
                // Cache DOM elements
                const elements = {
                    container: document.getElementById("categories_container"),
                    budgetInput: document.getElementById("budget_amount"),
                    monthSelect: document.getElementById("month_select")
                }

                // Ensure all required elements are present before proceeding
                if (!elements.container || !elements.budgetInput || !elements.monthSelect) {
                    console.error("One or more required DOM elements are missing.");
                    return null;
                }

                // Use a safe default for data
                const data = result.data || {};
                elements.container.innerHTML = ''; // Clear existing categories
                loadBudgetIntoForm(data); // Populate amount into form

                // Reset global categoryBudgets each time month changes
                categoryBudgets = {};

                // Rebuild categories if they exist & store their budget
                if (Array.isArray(data.categories)) {
                    const fragment = document.createDocumentFragment();
                    data.categories.forEach(budgetCategory => {
                        fragment.appendChild(createCategoryElement(budgetCategory.name, budgetCategory.amount));
                        categoryBudgets[budgetCategory.name] = budgetCategory.amount; // store category budget
                    });
                    // Append the fragment to the container
                    elements.container.appendChild(fragment);
                }

                elements.monthSelect.value = month; // Set the selected month
                updateSaveButtonState(); // Update save button state

                return result.data;
            } else {
                console.error('Error loading budget:', result.message);
                return null;
            }
        } catch (error) {
            console.error('Error loading budget:', error);
            return null;
        }
    }

    // Handle month dropdown change
    const monthSelect = document.getElementById("month_select");
    if (monthSelect) {
        monthSelect.addEventListener("change", async (e) => {
            const selectedMonth = e.target.value;
            await loadBudgetForMonth(selectedMonth);
        });
    }

    // Load current month's budget on page initialization
    const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });
    await loadBudgetForMonth(currentMonth);

    // Initial check to set the save button state on page load
    updateSaveButtonState();

});