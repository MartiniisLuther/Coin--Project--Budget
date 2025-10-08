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


    // fetch and display the summary data
    async function setupSummary() {
        const { spent, total } = await fetchSummaryData();
        const percent = Math.round((spent / total) * 100);

        const summaryText = document.getElementById("summaryText");
        if (summaryText) {
            summaryText.textContent = `${percent}% of €${total} spent.`;
        }

        const doughnutCanvas = document.getElementById("summaryDoughnut");
        if (doughnutCanvas) {
            drawDoughnutChart(doughnutCanvas.getContext("2d"), spent, total);
        }
    }
    // call the function to setup the summary
    setupSummary();


    // display the BAR CHART for the monthly spending
    function loadChartJs(callback) {
        if (window.Chart) {
            return callback();
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = callback;
        document.head.appendChild(script);
    }

    //  create the bar charts
    async function setupBarChart() {
        const spending = await fetchMonthlySpending();
        const months = Array.from({ length: 12}, (_, i) => {
            const d = new Date(new Date().getFullYear(), new Date().getMonth() - 11 + i, 1);
            return d.toLocaleDateString("default", { month: "short"});
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
                            idx === months.length - 1 ? "rgba(54,162,235,0.8" : "rgba(201,203,207,0.6)"
                        ),
                    }]
                },
                options: {
                    plugins: { legend: { display: false }, scales: { y: { beginAtZero: true } } }
                }
            });
        });
    }
    // call the function to setup the bar chart
    setupBarChart();


    //choosing/adding categories, includes popup logics for different actions
    const categoryPopup = document.getElementById("addCategoryPopup");
    const addCategoryBtn = document.getElementById("add_categories_btn");
    const closeCategoryBtn = document.getElementById("closeCategoryForm");

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener("click", () => {
            categoryPopup.classList.toggle("hidden");
        });
    }
    if (closeCategoryBtn) {
        closeCategoryBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm ("Are you sure you want to quit?")) {
                categoryPopup.classList.add("hidden");
            }
        });
    }

    // create categories, with delete functionality
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
            }
        });

        categoryDiv.appendChild(deleteBtn);
        return categoryDiv;
    }

    
    // display the created categories onto the page
    const submitCategoryBtn = document.getElementById("submitCategory");
    if (submitCategoryBtn) {
        submitCategoryBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const name = document.getElementById("category_name").value.trim();
            const amount = parseFloat(document.getElementById("category_amount").value.trim() || 0);
            if (!name || !amount) return alert ("Please fill in both fields.");

            const exists = [...document.querySelectorAll(".category_added .category_title")]
                .some(el => el.textContent.trim().toLowerCase() === name.toLowerCase());
            if (exists) return alert("Category already exists!");

            const newCategory = createCategoryElement(name, amount);
            document.getElementById("categories_container").appendChild(newCategory);

            document.getElementById("category_name").value = "";
            document.getElementById("category_amount").value = "";
            categoryPopup.classList.add("hidden");

            // Update save button state after adding a category
            updateSaveButtonState(); 
        });
    }


    // expense tracking section, also includes popup logic
    const addExpenseBtn = document.getElementById("add_expense_btn");
    const expenseForm = document.getElementById("addExpenseForm");
    const closeExpenseBtn = document.getElementById("closeExpenseForm");
    const submitExpenseBtn = document.getElementById("submitExpense");

    const setBudgetBtn = document.getElementById("set_budget_btn");

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

    // submit and update categories on the page
    function updateCategoryAmount(category, amount) {
        document.querySelectorAll(".each_exp_overview").forEach(cat => {
            if (cat.querySelector(".exp_name").textContent.trim() === category) {
                const current = parseFloat(cat.querySelector(".exp_amount").textContent.replace(/[^0-9.]/g, "")) || 0;
                cat.querySelector(".exp_amount").innerHTML = `<span id="currency_option">€</span>${(current + amount).toFixed(2)}`;
            };
        });
    }

    // submit the expense form and add the expense to the overview
    if (submitExpenseBtn) {
        submitExpenseBtn.addEventListener("click", () => {
            const category = document.getElementById("category").value;
            const amount = parseFloat(document.getElementById("amount").value);
            if (!amount || amount <= 0) return alert ("Please enter a valid amount.");
            updateCategoryAmount(category, amount);
            expenseForm.classList.add("hidden");
        });
    }

    // check if there are allocated categories
    function hasAllocatedCategories() {
        const categoriesContainer = document.getElementById("categories_container");
        const allocatedCategories = categoriesContainer.querySelectorAll(".category_added");
        return allocatedCategories.length > 0; // returns true if there are categories
    }

    // Update save button state based on category allocation
    function updateSaveButtonState() {
        const saveButton = document.getElementById("set_budget_btn");
        const hasCategories = hasAllocatedCategories();

        if (saveButton) {
            saveButton.disabled = !hasCategories;
            if (!hasCategories) {
                saveButton.style.opacity = "0.5";
                saveButton.style.cursor = "not-allowed";
                saveButton.title = "Please add at least one category to enable saving.";
            } else {
                saveButton.style.opacity = "1";
                saveButton.style.cursor = "pointer";
                saveButton.title = "Save Budget";
            }
        }
    }

    // handle save button click validation
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener("click", async (e) => {
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

            // Save to database
            try {
                const formData = new FormData();
                formData.append('action', 'save_budget');
                formData.append('month', selectedMonth);
                formData.append('amount', budgetAmount);
                formData.append('categories', JSON.stringify(categories));

                const response = await fetch('php/budget_operations.php', {
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


    // Monitor category changes to update save button state
    const categoriesContainer = document.getElementById("categories_container");
    if (categoriesContainer) {
        // create a MutationObserver to watch for changes in the categories container
        const observer = new MutationObserver(() => {
            updateSaveButtonState();
        });

        // Start observing the categories container for child list changes
        observer.observe(categoriesContainer, { childList: true, subtree: true });
    }

    // Function to load budget data for a specific month
    async function loadBudgetForMonth(month) {
        try {
            const response = await fetch(`php/budget_operations.php?action=load_budget&month=${encodeURIComponent(month)}`);
            const result = await response.json();
            
            if (result.success) {
                // Clear existing categories
                const categoriesContainer = document.getElementById("categories_container");
                const existingCategories = categoriesContainer.querySelectorAll(".category_added");
                existingCategories.forEach(cat => cat.remove());
                
                // Set budget amount
                const budgetInput = document.getElementById("budget_amount");
                if (budgetInput) {
                    budgetInput.value = result.data.amount || "";
                }
                
                // Set month dropdown
                const monthSelect = document.getElementById("month_select");
                if (monthSelect) {
                    monthSelect.value = month;
                }
                
                // Add categories if they exist
                if (result.data.categories && result.data.categories.length > 0) {
                    result.data.categories.forEach(category => {
                        const newCategory = createCategoryElement(category.name, category.amount);
                        categoriesContainer.appendChild(newCategory);
                    });
                }
                
                // Update save button state
                updateSaveButtonState();
                
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