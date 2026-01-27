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