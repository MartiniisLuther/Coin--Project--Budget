# 💰 Coin Project – Personal Finance Tracker

A simple **personal finance tracker** built with **HTML, CSS, JavaScript, PHP, and MySQL**.  
The project is designed for learning **web development and database integration**, while providing a clean dashboard for managing monthly budgets. 
---

## ✨ Features
- **User Accounts** – Sign up or log. No email integration, but use of security questions.
- **Reset passwords** using security questions.
- **Dashboard** – Monthly overview, % of budget spent, categories spent on and days left in the month.
- **Categories** – Default spending categories (e.g., bills, transport), currently only pre-defined categories. Let's you allocate costs to see how much has been spent on that category.
- **Budget Overview** – Set total monthly budget and allocate per-category budgets
- **Charts** – Visual spending distribution with pie charts (remaining in a month), graph for the last 11 months budgets.
- **Responsive UI** – Clean and simple interface using HTML, CSS, and JS

---

## 🚀 Getting Started

### Prerequisites
- PHP 8+  
- MySQL (set up a database for the project)  
- Apache or XAMPP (for local development)  
- Browser (e.g. Firefox, etc.) 
- IDE e.g. VS Code

### Running the Project
1. Clone the repository:
   ```bash
   git clone https://github.com/martiniisluther/Coin--Project--Budget.git


2.	Place the project folder into your local server directory (e.g., /htdocs/myapp in XAMPP).
3.	Import the provided SQL file into MySQL to set up the database.
4.	Update the PHP database connection settings (config.php or similar).
5.	Open the project in your browser:
		http://localhost/myapp/

### Project Structure

```
project-root/
└── htdocs/
	└── myapp/
		├── welcomepage.html
		├── homepage.php
		├── accountpage.html
		├── css_files/
		│   ├── welcomepage.css
		│   ├── homepage.css
		│   └── accountpage.css
		├── js_files/
		│   ├── welcomepage.js
		│   ├── homepage.js
		│   └── accountpage.js
		├── php/
		│   ├── database.php
		│   ├── get_categories.php
		│   ├── get_monthly_spending.php
		│   ├── login.php
		│   └── ... (other PHP files)
		└── README.md
```


🎯 Goals
	•	Practice full-stack web development with PHP + MySQL
	•	Strengthen frontend skills with HTML, CSS, and JavaScript
	•	Learn Git/GitHub workflow for version control
	•	Extend project with JSF integration later


