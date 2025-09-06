// overall page loader to monitor the page load
document.addEventListener("DOMContentLoaded", async () => {
    // use some hardcoded data for test purposes
    async function fetchSummaryData() {
        return { spent: 1000, total: 1300};
    }

    // sim DB fetch
    async function fetchMonthlySpending() {
        return [800, 950, 700, 1200, 1100, 900, 1000, 1300, 1400, 1500, 1600, 1700];
    }

    // sim DB fetch
    async function fetchCategories() {
        return [];
    }


    // navbar dropdown
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


    // display the bar chart for the monthly spending
    function loadChartJs(callback) {
        if (window.Chart) {
            return callback();
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = callback;
        document.head.appendChild(script);
    }

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
            if (confirm("Are you sure you want to delete this category?")) categoryDiv.remove();
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
        });
    }



    // expense tracking section, also includes popup logic
    const addExpenseBtn = document.getElementById("add_expense_btn");
    const expenseForm = document.getElementById("addExpenseForm");
    const closeExpenseBtn = document.getElementById("closeExpenseForm");
    const submitExpenseBtn = document.getElementById("submitExpense");

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

});