/**
 * charts_controller.js
 * 
 * Handles UI-related chart rendering and updates for the dashboard.
 * Responsible for displaying budget progress, summary donut charts, 
 * and historical monthly bar charts (last 6 months: budget vs expenditure).
 */

/* ---------------- GLOBAL STATE ---------------- */

// Prevents multiple bar chart updates triggered by multiple events.
let isUpdatingBarChart = false;


/* ---------------- DAYS TRACKING ---------------- */
/**
 * Updates the monthly progress bar and label based on the current date,
 * showing how many days remain in the current month.
 * @return {void}
 */
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


/* ---------------- SUMMARY DONUT WITH WARNING LABELS ---------------- */
/**
 * Draws a half-donut summary chart representing spent vs. total budget.
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} spent - Amount spent in the selected month
 * @param {number} total - Total allocated budget for the month
 */
function initHalfDonutChart(ctx, spent, total) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const safeTotal = Math.max(total, 1);
    const spentRatio = Math.min(spent / safeTotal, 1);
    const remainingRatio = Math.max(1 - spentRatio, 0);

    // Ring dimensions
    const thickness = Math.max(18, Math.min(28, canvasHeight * 0.15));
    const radius = (canvasWidth / 2) - thickness - 12;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight - thickness - 12;

    // Angles
    const startAngle = Math.PI;
    const endAngle = 0;
    const spentEndAngle = startAngle + (spentRatio * Math.PI);

    // Determine color and status based on spending percentage
    let spentColor, statusIcon, statusColor;
    if (spentRatio <= 0.5) {
        spentColor = "#4CAF50";     // Green
        statusIcon = "✓";
        statusColor = "#4CAF50";
    } else if (spentRatio <= 0.75) {
        spentColor = "#FFA726";     // Orange
        statusIcon = "⚠";
        statusColor = "#FFA726";
    } else if (spentRatio <= 0.9) {
        spentColor = "#FF7043";     // Deep Orange
        statusIcon = "⚠";
        statusColor = "#FF7043";
    } else {
        spentColor = "#EF5350";     // Red
        statusIcon = spent > total ? "✕" : "!";
        statusColor = "#EF5350";
    }

    // Remaining is always gold - representing available budget
    const remainingColor = "#d4af37";

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.lineCap = "round";

    /* ---------- BASELINE ---------- */
    ctx.beginPath();
    ctx.moveTo(centerX - radius - thickness/4, centerY + 10);
    ctx.lineTo(centerX + radius + thickness/4, centerY + 10);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ddd";
    ctx.stroke();

    /* ---------- BACKGROUND TRACK ---------- */
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = "#e8e8e8";
    ctx.stroke();

    /* ---------- REMAINING BUDGET (GOLD) ---------- */
    if (remainingRatio > 0 && spent <= total) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, spentEndAngle, endAngle);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = remainingColor;
        ctx.stroke();
    }

    /* ---------- SPENT AMOUNT (COLOR-CODED) ---------- */
    if (spentRatio > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, spentEndAngle);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = spentColor;
        ctx.stroke();
    }

    /* ---------- STATUS ICON ---------- */
    ctx.fillStyle = statusColor;
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(statusIcon, centerX - radius * 0.7, centerY - radius * 0.35);

    /* ---------- PERCENTAGE ---------- */
    ctx.fillStyle = "#333";
    ctx.font = "bold 28px Arial";
    ctx.fillText(
        `${Math.round(spentRatio * 100)}%`,
        centerX,
        centerY - radius * 0.45
    );

    /* ---------- SPENT LABEL ---------- */
    ctx.fillStyle = "#666";
    ctx.font = "13px Arial";
    ctx.fillText("spent", centerX, centerY - radius * 0.25);

    /* ---------- AMOUNTS WITH COLOR INDICATORS ---------- */
    ctx.font = "bold 12px Arial";
    
    // Spent amount (colored)
    ctx.fillStyle = spentColor;
    ctx.textAlign = "left";
    ctx.fillText(
        `€${spent.toFixed(0)}`,
        centerX - radius * 0.6,
        centerY - radius * 0.05
    );
    
    // Separator
    ctx.fillStyle = "#999";
    ctx.textAlign = "center";
    ctx.fillText("/", centerX, centerY - radius * 0.05);
    
    // Total budget
    ctx.fillStyle = "#333";
    ctx.textAlign = "right";
    ctx.fillText(
        `€${total.toFixed(0)}`,
        centerX + radius * 0.6,
        centerY - radius * 0.05
    );

    /* ---------- BUDGET STATUS MINI-LEGEND ---------- */
    const remaining = total - spent;
    if (remaining > 0) {
        ctx.fillStyle = "#d4af37";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `€${remaining.toFixed(0)} left`,
            centerX,
            centerY + radius * 0.15
        );
    } else if (spent > total) {
        const overspent = spent - total;
        ctx.fillStyle = statusColor;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `€${overspent.toFixed(0)} over budget`,
            centerX,
            centerY + radius * 0.15
        );
    }
}


/* ---------------- LEGEND UPDATE ---------------- */
/**
 * Updates numeric legend values below the summary donut chart.
 * @param {number} spent - Amount spent
 * @param {number} total - Total budget
 */
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


/* ---------------- RENDER AND UPDATE DONUT (WITH BACKEND DATA) ---------------- */
/**
 * Fetches monthly summary data and updates the donut chart and legend.
 * @returns {Promise<void>}
 */
async function renderAndUpdateDonutChart() {
    const {spent_total, budget_total} = await fetchPerMonthSummaryData();

    // Debug log
    //console.log("Rendering donut chart with:", { spent_total, budget_total });

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


/* ---------------- FETCH PER MONTH SUMMARY DATA ---------------- */
/**
 * Retrieves budget and expenditure totals for the selected month.
 * @returns {Promise<{spent_total:number, budget_total:number}>}
 */
async function fetchPerMonthSummaryData() {
    try {
        // Check if an active month is selected
        if (!window.currentMonthlySumsId) {
            console.warn('fetchPerMonthSummaryData: No active month selected');
            return { spent_total: 0, budget_total: 0 };
        }

        // Debug log
        //console.log('Fetching summary data for monthly_sums_id:', window.currentMonthlySumsId);

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
        //console.log('Received summary data:', fetchedData);

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
        //console.log('Month data loaded event received:', event.detail);
        await renderAndUpdateDonutChart();
    });
}

/* ---------------- LISTEN FOR BUDGET UPDATES ---------------- */
// Update charts instantly when budget is saved
function setupBudgetUpdateListener() {
    window.addEventListener('budgetSaved', async (event) => {
        // console.log('Budget saved event received:', event.detail);
        await renderAndUpdateDonutChart();
    });
}

/* ---------------- LISTEN FOR EXPENSE UPDATES ---------------- */
// Update charts instantly when expense is added
function setupExpenseUpdateListener() {
    window.addEventListener('expenseAdded', async (event) => {
        //console.log('Expense added event received:', event.detail);
        await renderAndUpdateDonutChart();
    });
}


/* ---------------- BAR CHART ---------------- */
/**
 * Loads Chart.js dynamically and executes a callback once available.
 * @param {Function} callback - Function to call after Chart.js is loaded
 * @returns {void}
 */
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
/**
 * Fetches historical budget data and renders a six-month bar chart.
 * @returns {Promise<void>}
 */
async function setupAndUpdateBarChart() {
    try {
        // Fetch spending data for last 6 months
        const monthlyData = await fetchAllMonthlyTotalExpenses();
        
        // Debug log
        //console.log("Received monthly data:", monthlyData);

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

        // Debug log
        //console.log("Month labels:", monthLabels);
        //console.log("Spent data:", spentData);
        //console.log("Budget data:", budgetData);

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


/* ---------------- FETCH LAST 6-MONTHLY TOTAL EXPENDITURES -----------------------  */
/**
 * Retrieves aggregated spending data for the last six months.
 * @returns {Promise<Array>}
 */
async function fetchAllMonthlyTotalExpenses() {
    try {
        // Debug log
        //console.log("Fetching 6-month spending data...");
        
        // Note: Uses user_id from session (PHP side), not monthly_sums_id
        const response = await fetch(
            `/myapp/php/budget_and_expense_manager.php?action=fetch_6_months_spending`
        );

        if (!response.ok) {
            console.warn(`Fetch failed with status: ${response.status}`);
            return [];
        }

        // Get response text first to see what we're receiving
        const responseText = await response.text();
        //console.log("Raw response:", responseText.substring(0, 500)); // Log first 500 chars
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError);
            console.error("Response was:", responseText);
            return [];
        }
        
        //console.log("Received 6-month data:", data);

        if (!data || !data.success) {
            console.warn("Invalid response:", data);
            return [];
        }

        return data.months || [];

    } catch (error) {
        console.error("Error fetching 6-month data:", error);
        return [];
    }
}


/* ---------------- UPDATE BAR CHART ON EVENTS ---------------- */
/**
 * Registers event listeners that trigger bar chart updates.
 * @returns {void}
 */
function setupBarChartListeners() {
    // Update when budget is saved
    window.addEventListener('budgetSaved', async () => {
        if (isUpdatingBarChart) {
            //console.log("Bar chart update already in progress, skipping");
            return;
        }
        // Debug log
        //console.log("Updating bar chart after budget saved");
        isUpdatingBarChart = true;
        await setupAndUpdateBarChart();
        isUpdatingBarChart = false;
    });

    // Update when expense is added
    window.addEventListener('expenseAdded', async () => {
        if (isUpdatingBarChart) {
            //console.log("Bar chart update already in progress, skipping");
            return;
        }
        //console.log("Updating bar chart after expense added");
        isUpdatingBarChart = true;
        await setupAndUpdateBarChart();
        isUpdatingBarChart = false;
    });
}


/* ---------------- INITIALIZATION ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
    //console.log("Initializing charts UI render...");

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