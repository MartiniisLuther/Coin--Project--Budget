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


/* ---------------- SUMMARY DONUT WITH WARNING ZONES ---------------- */
// Draw the half-donut chart with color-coded budget warnings
function initHalfDonutChart(ctx, spent, total) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const safeTotal = Math.max(total, 1);
    const spentRatio = Math.min(spent / safeTotal, 1);

    // Ring dimensions
    const thickness = Math.max(18, Math.min(28, canvasHeight * 0.15));
    const radius = (canvasWidth / 2) - thickness - 12;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight - thickness - 12;

    // Angles
    const startAngle = Math.PI;
    const endAngle = 0;
    const spentEndAngle = startAngle + (spentRatio * Math.PI);

    // Determine color based on spending percentage
    let spentColor;
    let statusText;
    if (spentRatio <= 0.5) {
        spentColor = "#4CAF50";  // Green - Safe
        statusText = "On Track";
    } else if (spentRatio <= 0.75) {
        spentColor = "#FFA726";  // Orange - Warning
        statusText = "Watch Out";
    } else if (spentRatio <= 0.9) {
        spentColor = "#FF7043";  // Deep Orange - Caution
        statusText = "Caution";
    } else {
        spentColor = "#EF5350";  // Red - Over/Near Limit
        statusText = spent > total ? "Over Budget!" : "Almost There";
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.lineCap = "round";

    /* ---------- BASELINE ---------- */
    ctx.beginPath();
    ctx.moveTo(centerX - radius - thickness/4, centerY + 10);
    ctx.lineTo(centerX + radius + thickness/4, centerY + 10);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ddd";
    ctx.stroke();

    /* ---------- BACKGROUND (REMAINING) ---------- */
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = "#e8e8e8";
    ctx.stroke();

    /* ---------- SPENT (COLOR-CODED) ---------- */
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, spentEndAngle);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = spentColor;
    ctx.stroke();

    /* ---------- PERCENTAGE TEXT ---------- */
    ctx.fillStyle = "#333";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        `${Math.round(spentRatio * 100)}%`,
        centerX,
        centerY - radius * 0.45
    );

    /* ---------- STATUS TEXT ---------- */
    ctx.fillStyle = spentColor;
    ctx.font = "bold 14px Arial";
    ctx.fillText(statusText, centerX, centerY - radius * 0.25);

    /* ---------- AMOUNT TEXT ---------- */
    ctx.fillStyle = "#666";
    ctx.font = "13px Arial";
    ctx.fillText(
        `€${spent.toFixed(0)} / €${total.toFixed(0)}`,
        centerX,
        centerY - radius * 0.05
    );
}


/* ---------------- UPDATE LEGEND VALUES (Existing HTML Elements) ---------------- */
function resizeSummaryDonut() {
    const canvas = document.getElementById("summaryDonut");
    const wrapper = canvas.parentElement;

    canvas.width = wrapper.clientWidth;
    canvas.height = 200; // fixed height = consistent proportions
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
            `/myapp/php/monthly_budget_controller.php?action=fetch_month_summary&monthly_sums_id=${window.currentMonthlySumsId}`
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


/* ---------------- INITIALIZATION ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Initializing charts UI render...");

    // Setup UI Components
    setupDayProgress();
    setupMonthChangeListener();
    setupBudgetUpdateListener();
    setupExpenseUpdateListener();
    // resizeSummaryDonut();

    // Wait for initial budget load
    setTimeout(async () => {
        await renderAndUpdateDonutChart();
    }, 1000);
});