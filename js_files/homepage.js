// creates date on the homepage
document.addEventListener('DOMContentLoaded', function() {
    // add event listener to navbar linkAbout
    const linkAbout = document.querySelector('.linkAbout');
    const dropdownMenu = document.querySelector('.nav-item-dropdown');
    
    // Toggle dropdown menu on click
    linkAbout.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior
        dropdownMenu.classList.toggle('show'); // add/remove the dropdown menu visibility class
    }); 
    // Close dropdown if clicked outside
    document.addEventListener('click', function(event) {
        if (!linkAbout.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show'); // remove the dropdown menu visibility class
        }
    });


    // Set today's date
    const dateElement = document.getElementById('date');
    const currentMonth = document.getElementById('current_month');
    if (dateElement) {
        const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', options);
        dateElement.textContent = today;
    }

    // Set current month
    const monthElement = document.getElementById('current_month');
    if (monthElement) {
        const options = { month: 'long' };
        const currentMonth = new Date().toLocaleDateString('en-US', options);
        monthElement.textContent = currentMonth;
    }

    // provisionally amount spent so far - should be replaced with data from budget page
    const spent = 1000;
    const total = 1300;
    const percent = Math.round((spent / total) * 100);

    // Update summary text
    document.getElementById('summaryText').textContent = `${percent} % of $${total} spent.`;

    // Draw doughnut chart
    const ctx = document.getElementById('summaryDoughnut').getContext('2d');
    const radius = 80;
    const centerX = 100;
    const centerY = 90;
    const spentAngle = (2 * Math.PI) * (spent / total);

    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#d4af37'; // gold color shade
    ctx.fill();

    // Spent arc
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, spentAngle - 0.5 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = 'teal';
    ctx.fill();

    // Calculate days left in the current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const daysLeft = lastDay - today;
    const daysPassed = today;

    const progress = document.getElementById('daysProgress');
    const daysLeftText = document.getElementById('daysLeftText');
    progress.max = lastDay;
    progress.value = daysPassed;
    daysLeftText.textContent = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
});


// this creates the bar chart of the last 12 months spending
document.addEventListener("DOMContentLoaded", function() {
    // Example data for the last 12 months
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleString('default', { month: 'short' }));
    }
    const spending = [800, 950, 700, 1100, 1200, 900, 1000, 1050, 980, 1150, 1300, 1250]; // Example data

    // Highlight the current month
    const backgroundColors = months.map((m, idx) =>
        idx === months.length - 1 ? 'rgba(54, 162, 235, 0.8)' : 'rgba(201, 203, 207, 0.6)'
    );

    // Load Chart.js from CDN if not already loaded
    function loadChartJs(callback) {
        if (window.Chart) { callback(); return; }
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = callback;
        document.head.appendChild(script);
    }

    loadChartJs(function() {
        const ctx = document.getElementById('monthsBarChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Spending ($)',
                    data: spending,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(c => c.replace('0.6', '1').replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 200 }
                    }
                }
            }
        });
    });
});

// popup for selecting categories
document.addEventListener("DOMContentLoaded", () => {
    // add categories form
    const addCategoryBtn = document.getElementById("add_categories_btn");
    const categoryPopup = document.getElementById("addCategoryPopup");
    const closeCategoryBtn = document.getElementById("closeCategoryForm");

    // Show category form popup
    addCategoryBtn.addEventListener("click", () => {
        categoryPopup.classList.toggle("hidden");
    });

    // Close category form popup
    closeCategoryBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to quit?")) {
            categoryPopup.classList.add("hidden");
        }
    });

    // add new categories under the Allocate Amount button
    function createCategoryElement(name, amount, currency = '€') {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category_added';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'category_title';
        titleDiv.textContent = name;

        const amountDiv = document.createElement('div');
        amountDiv.className = 'category_amount';
        const currencySpan = document.createElement('span');
        currencySpan.className = 'currency_option';
        currencySpan.textContent = currency;
        amountDiv.appendChild(currencySpan);
        amountDiv.append(amount);

        // delete the added category
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete_category_btn';
        deleteBtn.title = 'Delete Category';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this category?")) {
            categoryDiv.remove(); // alert("Category deleted.");
            }
        });

        categoryDiv.appendChild(titleDiv);
        categoryDiv.appendChild(amountDiv);
        categoryDiv.appendChild(deleteBtn);

        return categoryDiv;
    }

    // Submit button adds category to the page - under allocate amount
    const submitCategoryBtn = document.getElementById("submitCategory");
    submitCategoryBtn.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent form submission

        const categoryName = document.getElementById("category_name").value.trim();
        const categoryAmount = parseFloat(document.getElementById("category_amount").value.trim()) || 0;
        
        // Validate input - ensure both name and amount are provided
        if (!categoryName || !categoryAmount) {
            alert("Please enter both name and amount!");
            return;
        }

        // Check if category already exists
        const existingCategories = document.querySelectorAll(".category_added .category_title");
        for (let existingCategory of existingCategories) {
            if (existingCategory.textContent.trim().toLowerCase() === categoryName.toLowerCase()) {
                alert("Category already exists!");
                return;
            }
        }

        // Create and append the new category element
        const categoryDiv = createCategoryElement(categoryName, categoryAmount);
        document.getElementById("categories_container").appendChild(categoryDiv);

        // Clear the input fields
        document.getElementById("category_name").value = "";
        document.getElementById("category_amount").value = "";
        categoryPopup.classList.add("hidden");
    });


    // add expenses form
    const addExpenseBtn = document.getElementById("add_expense_btn");
    const expenseForm = document.getElementById("addExpenseForm");
    const submitBtn = document.getElementById("submitExpense");

    // Show expense form popup
    addExpenseBtn.addEventListener("click", () => {
        expenseForm.classList.toggle("hidden");
    });

    // 
    submitBtn.addEventListener("click", () => {
        const category = document.getElementById("category").value; // get the selected category
        const amount = parseFloat(document.getElementById("amount").value);
        if (!amount || amount <= 0) {
            alert("Enter a valid amount");
            return;
        }

        updateCategoryAmount(category, amount);
        expenseForm.classList.add("hidden");
    });

    // Function to update the expenses amount, takes the old amount and adds the new amount entered to the old
    function updateCategoryAmount(category, amount) {
        const categories = document.querySelectorAll(".each_exp_overview");

        categories.forEach((cat) => {
            const name = cat.querySelector(".exp_name").textContent.trim();
            if (name === category) {
                // const amountSpan = cat.querySelector(".exp_amount span + text, .exp_amount span");
                const current = parseFloat(cat.querySelector(".exp_amount").textContent.replace(/[^0-9.]/g, ''));
                const newTotal = current + amount;
                cat.querySelector(".exp_amount").innerHTML = `<span id="currency_option">€</span>${newTotal.toFixed(2)}`;
            }
        });
    }
});

// This should close the form when clicking outside of the form or on the close button, with confirmation.
const addExpenseForm = document.getElementById("addExpenseForm");
const closeBtn = document.getElementById("closeExpenseForm");

if (addExpenseForm) {
    addExpenseForm.addEventListener("click", (e) => {
        if (e.target === addExpenseForm) {
            if (confirm("Are you sure you want to quit?")) {
                addExpenseForm.classList.add("hidden");
            }
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to quit?")) {
            addExpenseForm.classList.add("hidden");
        }
    });
}

// this creates 

