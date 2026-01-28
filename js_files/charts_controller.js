// charts_controller.js - UI logic to render the charts on the page

/* ---------------- DAYS TRACKING ---------------- */
// Track the days progress to last day to map the difference as progress bar
function setupDayProgress() {
    const dateElement = new Date();
    const lastDay = new Date(dateElement.getFullYear(), dateElement.getMonth() + 1, 0).getDate();
    const today = dateElement.getDate();
    const daysLeft = lastDay - today;

    // Set the progress bar in the month
    const daysProgress = document.getElementById("daysProgress");
    const daysLeftText = document.getElementById("daysLeftText");

    if (daysProgress && daysLeftText) {
        daysProgress.max = lastDay;
        daysProgress.value = today;
        daysLeftText.textContent = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;
    }
}


/* ---------------- SUMMARY DONUT (Canvas Only) ---------------- */
// Draw the donut chart on canvas (legend is in HTML)
function initHalfDonutChart(ctx, spent, total) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const safeTotal = Math.max(total, 1);
    const progress = Math.min(spent / safeTotal, 1);

    // Thickness based ONLY on height (prevents fat look)
    const thickness = Math.max(16, Math.min(24, canvasHeight * 0.15));

    const radius = (canvasWidth / 2) - thickness - 12;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight - thickness - 12;

    const startAngle = Math.PI;
    const endAngle = 0;
    const spentAngle = startAngle + progress * Math.PI;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.lineCap = "round";

    /* Base line (fixed visual anchor) */
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY + thickness / 2 + 6);
    ctx.lineTo(centerX + radius, centerY + thickness / 2 + 6);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ddd";
    ctx.stroke();

    /* Remaining */
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = "#d4af37";
    ctx.stroke();

    /* Spent */
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, spentAngle);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = "#008080";
    ctx.stroke();

    /* Needle */
    // const needleAngle = spentAngle;
    // const needleLength = radius * 0.9;

    // ctx.beginPath();
    // ctx.moveTo(centerX, centerY);
    // ctx.lineTo(
    //     centerX + needleLength * Math.cos(needleAngle),
    //     centerY + needleLength * Math.sin(needleAngle)
    // );
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = "#444";
    // ctx.stroke();

    /* Percentage text */
    ctx.fillStyle = "#333";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(progress * 100)}%`, centerX, centerY - radius * 0.35);
}


/* ---------------- UPDATE LEGEND VALUES (Existing HTML Elements) ---------------- */
// Update the legend values in the existing HTML structure
function updateLegend(spent, total) {
    const remaining = total - spent;
    
    const legendContainer = document.getElementById("chartLegend");
    if (!legendContainer) {
        console.warn("Legend container not found");
        return;
    }
    
    // Get all legend_value spans in order: Spent, Remaining, Total
    const legendValues = legendContainer.querySelectorAll(".legend_value");
    
    if (legendValues.length >= 3) {
        legendValues[0].textContent = `€${spent.toFixed(2)}`;      // Spent
        legendValues[1].textContent = `€${remaining.toFixed(2)}`;  // Remaining
        legendValues[2].textContent = `€${total.toFixed(2)}`;      // Total Budget
    } else {
        console.warn("Not enough legend value elements found");
    }
}


/* ---------------- RENDER AND UPDATE DONUT WITH BACKEND DATA ---------------- */
// Render the donut chart with data from backend
async function renderAndUpdateDonutChart() {
    const {spent_total, budget_total} = await fetchPerMonthSummaryData();

    // Debug log
    console.log("Rendering donut chart with:", { spent_total, budget_total });

    const donutCanvas = document.getElementById("summaryDonut");

    // Handle edge case (prevent division by zero)
    if (!budget_total || budget_total <= 0) {
        // Clear canvas if it exists
        if (donutCanvas) {
            const ctx = donutCanvas.getContext("2d");
            ctx.clearRect(0, 0, donutCanvas.width, donutCanvas.height);
            
            // Draw "No Data" message on canvas
            ctx.fillStyle = "#999";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("No budget data", donutCanvas.width / 2, donutCanvas.height / 2);
        }
        
        // Clear legend values
        updateLegend(0, 0);
        
        return;
    }

    // Draw donut chart on canvas
    if (donutCanvas) {
        const ctx = donutCanvas.getContext("2d");
        initHalfDonutChart(ctx, spent_total, budget_total);
    }
    
    // Update legend in HTML
    updateLegend(spent_total, budget_total);
}


/* ---------------- FETCH PER MONTH SUMMARY DATA FROM BACKEND ---------------- */
// Fetch per month budget/expenditure for the currently selected month
async function fetchPerMonthSummaryData() {
    try {
        // Check if an active month is selected
        if (!window.currentMonthlySumsId) {
            console.warn('fetchPerMonthSummaryData: No active month selected');
            return { spent_total: 0, budget_total: 0 };
        }

        // Debug log
        console.log('Fetching summary data for monthly_sums_id:', window.currentMonthlySumsId);

        const responseData = await fetch(
            `/myapp/php/budget_and_expense_manager.php?action=fetch_month_summary&monthly_sums_id=${window.currentMonthlySumsId}`
        );

        // Handle non-OK responses
        if (!responseData.ok) {
            console.warn(`fetchPerMonthSummaryData: Server responded with ${responseData.status}`);
            return { spent_total: 0, budget_total: 0 };
        }

        // Parse JSON responseData
        const fetchedData = await responseData.json();

        // Debug log
        console.log('Received summary data:', fetchedData);

        // Validate the data from PHP
        if (!fetchedData || !fetchedData.success) {
            console.warn('fetchPerMonthSummaryData: Invalid or unsuccessful response', fetchedData);
            return { spent_total: 0, budget_total: 0 };
        }

        // Return the summary data
        return {
            spent_total: parseFloat(fetchedData.monthly_expense) || 0,
            budget_total: parseFloat(fetchedData.monthly_budget) || 0
        };

    } catch (error) {
        console.error('fetchPerMonthSummaryData error:', error);
        return { spent_total: 0, budget_total: 0 };
    }
}


/* ---------------- LISTEN FOR MONTH CHANGES ---------------- */
// Update charts when month changes in homepage_ui.js
function setupMonthChangeListener() {
    // Listen for custom event from homepage_ui.js
    window.addEventListener('monthDataLoaded', async (event) => {
        console.log('Month data loaded event received:', event.detail);
        await renderAndUpdateDonutChart();
    });
}


/* ---------------- LISTEN FOR BUDGET UPDATES ---------------- */
// Update charts instantly when budget is saved
function setupBudgetUpdateListener() {
    window.addEventListener('budgetSaved', async (event) => {
        console.log('Budget saved event received:', event.detail);
        await renderAndUpdateDonutChart();
    });
}


/* ---------------- LISTEN FOR EXPENSE UPDATES ---------------- */
// Update charts instantly when expense is added
function setupExpenseUpdateListener() {
    window.addEventListener('expenseAdded', async (event) => {
        console.log('Expense added event received:', event.detail);
        await renderAndUpdateDonutChart();
    });
}


/* ---------------- DISPLAY LAST 12-MONTH BAR CHART ---------------- */
// Create the barchart element from the cdn site
function initBarChart(callback) {
    // Check if Chart.js is already loaded
    if (window.Chart) {
        callback();
        return;
    }

    const scriptElement = document.createElement("script");
    scriptElement.src = "https://cdn.jsdelivr.net/npm/chart.js";
    scriptElement.onload = callback;  // Fixed: removed () from callback
    document.head.appendChild(scriptElement);
}


/* ---------------- PROCESS DATA INTO BAR CHART -----------------------  */
// Returned array data processed into a 12-month bar chart with labels.
async function setupAndUpdateBarChart() {
    try {
        // Fetch spending data for last 12 months
        const monthlyData = await fetchAllMonthlyTotalExpenses();
        
        console.log("Received monthly data:", monthlyData);

        // Generate labels and data for last 6 months
        const monthLabels = [];
        const spentData = [];
        const budgetData = [];

        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const monthKey = `${year}-${month}`;

            const monthLabel = date.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit"
            });

            monthLabels.push(monthLabel);

            const monthData = monthlyData.find(m => m.month_key === monthKey);

            spentData.push(monthData ? Number(monthData.total_spent) : 0);
            budgetData.push(monthData ? Number(monthData.total_budget ?? 0) : 0);
        }

        console.log("Month labels:", monthLabels);
        console.log("Spent data:", spentData);
        console.log("Budget data:", budgetData);

        // Initialize & load Bar Chart
        initBarChart(() => {
            const chartCanvas = document.getElementById("monthsBarChart");
            if (!chartCanvas) {
                console.error("Canvas element 'monthsBarChart' not found");
                return;
            }

            const ctx = chartCanvas.getContext("2d");
            
            // Destroy existing chart if it exists
            if (window.monthlyBarChart) {
                window.monthlyBarChart.destroy();
            }

            // Create new chart
            window.monthlyBarChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: monthLabels,
                    datasets: [
                        {
                            label: "Spent (€)",
                            data: spentData,
                            backgroundColor: "rgba(0, 128, 128, 0.8)",
                            borderColor: "rgba(0, 128, 128, 1)",
                            borderWidth: 1
                        },
                        {
                            label: "Budget (€)",
                            data: budgetData,
                            backgroundColor: "rgba(212, 175, 55, 0.5)",
                            borderColor: "rgba(212, 175, 55, 1)",
                            borderWidth: 2,
                            borderDash: [6, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            bottom: 10
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            stacked: false
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: "#eee" }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title(ctx) {
                                return ctx[0].label;
                            },
                            label(ctx) {
                                const label = ctx.dataset.label;
                                return `${label}: €${ctx.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            });
        });

    } catch (error) {
        console.error("Error setting up bar chart:", error);
    }
}


/* ---------------- FETCH LAST 12-MONTHLY TOTAL EXPENDITURES -----------------------  */
// Fetch an array of 12-month values for each month's spending (uses user_id, not monthly_sums_id)
async function fetchAllMonthlyTotalExpenses() {
    try {
        console.log("Fetching 12-month spending data...");
        
        // Note: Uses user_id from session (PHP side), not monthly_sums_id
        const response = await fetch(
            `/myapp/php/budget_and_expense_manager.php?action=fetch_12_months_spending`
        );

        if (!response.ok) {
            console.warn(`Fetch failed with status: ${response.status}`);
            return [];
        }

        // Get response text first to see what we're receiving
        const responseText = await response.text();
        console.log("Raw response:", responseText.substring(0, 500)); // Log first 500 chars
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError);
            console.error("Response was:", responseText);
            return [];
        }
        
        console.log("Received 12-month data:", data);

        if (!data || !data.success) {
            console.warn("Invalid response:", data);
            return [];
        }

        return data.months || [];

    } catch (error) {
        console.error("Error fetching 12-month data:", error);
        return [];
    }
}


/* ---------------- UPDATE BAR CHART ON EVENTS ---------------- */
// Listen for events that should trigger bar chart update
function setupBarChartListeners() {
    // Update when budget is saved
    window.addEventListener('budgetSaved', async () => {
        if (isUpdatingBarChart) {
            console.log("Bar chart update already in progress, skipping");
            return;
        }
        console.log("Updating bar chart after budget saved");
        isUpdatingBarChart = true;
        await setupAndUpdateBarChart();
        isUpdatingBarChart = false;
    });

    // Update when expense is added
    window.addEventListener('expenseAdded', async () => {
        if (isUpdatingBarChart) {
            console.log("Bar chart update already in progress, skipping");
            return;
        }
        console.log("Updating bar chart after expense added");
        isUpdatingBarChart = true;
        await setupAndUpdateBarChart();
        isUpdatingBarChart = false;
    });
}


/* ---------------- INITIALIZATION ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Initializing charts UI render...");

    // Setup UI Components
    // Donut chart
    setupDayProgress();
    setupMonthChangeListener();
    setupBudgetUpdateListener();
    setupExpenseUpdateListener();

    // Bar chart
    setupBarChartListeners();

    // Wait for initial budget load
    setTimeout(async () => {
        // Donut 
        await renderAndUpdateDonutChart();
        // Bar chart
        await setupAndUpdateBarChart();
    }, 1000);
}); 