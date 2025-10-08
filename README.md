## 💰 Coin Project

A personal finance tracker built with HTML, CSS, JavaScript, PHP, and MySQL.  
Designed for learning web development and managing monthly budgets.

## ✨ Features

- **User accounts** — Sign up and log in with local accounts; security questions available for account recovery (no email integration).
- **Password reset** — Recover or reset passwords using configured security questions.
- **Dashboard** — Monthly overview showing total spent, percentage of budget used, top categories, and days remaining in the month.
- **Categories** — Predefined spending categories (e.g., bills, transport). Assign transactions to categories to track category totals.
- **Budget management** — Set a total monthly budget and allocate amounts to categories for more granular tracking.
- **Charts & reports** — Visualize spending with pie charts and historical graphs (e.g., last 11 months) to spot trends and remaining budget.
- **Responsive UI** — Simple, mobile-friendly interface built with HTML, CSS, and JavaScript for a consistent experience across devices.
- **Security & best practices** — Uses prepared statements for safe DB access; sensible defaults to avoid exposing credentials in version control.
- **Extensible design** — Simple structure intended for easy improvement (additional categories, email integration, or richer analytics).

## 🚀 Getting Started

### Prerequisites
- PHP 8+ with mysqli or pdo_mysql enabled  
- MySQL (or MariaDB) server  
- Apache (XAMPP, MAMP, or a similar local server)  
- Web browser (e.g., Firefox, Chrome)  
- Code editor (e.g., VS Code)  
- Optional: phpMyAdmin for easier DB import

### Running the Project
1. Clone the repository:
	```bash
	git clone https://github.com/martiniisluther/Coin--Project--Budget.git
	```
2. Place the cloned folder inside your local server web root (e.g., /Applications/XAMPP/xamppfiles/htdocs/myapp or C:\xampp\htdocs\myapp).
3. Create and import the database:
	- Create a new database (e.g., coin_project) via phpMyAdmin or MySQL CLI.
	- Import the provided SQL file found in the repo (search for *.sql, e.g., schema.sql or seed.sql).
4. Configure the DB connection:
	- Update the database connection file (php/database.php or the credentials file in php/credentials/) with your DB host, name, user, and password.
	- Example variables to update: DB_HOST, DB_NAME, DB_USER, DB_PASS.
5. Start services and open the app:
	- Start Apache and MySQL using XAMPP/MAMP or your chosen stack.
	- Open: http://localhost/myapp/ (or http://localhost/myapp/homepage.php)

### Quick Tips & Troubleshooting
- Ensure PHP extensions (mysqli or pdo_mysql) are enabled.
- If you see a connection error, double-check credentials and DB name in php/database.php.
- Check web server/PHP error logs for 500 errors.
- Do not commit real credentials to version control — use environment variables or a local config file excluded by .gitignore.

That's it — the app should be reachable at the local URL after the steps above.


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
		│   ├── credentials/
		│   │   ├── login.php
		│   │   ├── signup.php
		│   │   ├── reset_password.php
		│   │   └── logout.php
		│   ├── database.php
		│   ├── budget_operations.php
		│   └── ... (other PHP files)
		└── README.md
```

## 🎯 Goals

- Build a complete full‑stack app with PHP + MySQL: secure authentication, CRUD for transactions and budgets, and safe DB access (prepared statements).
- Strengthen frontend skills: responsive layouts, accessible UI, client‑side validation, and interactive charts.
- Improve development workflow: use Git/GitHub with feature branches, meaningful commits, pull requests, and issue tracking.
- Practice deployment and debugging: run locally with XAMPP/MAMP, examine logs, and prepare simple production configuration (env-based credentials).
- Add automated checks: basic unit/integration tests and linting for JS/CSS to catch regressions early.
- Plan future extensions: prototype front‑end frameworks (React/Vue) or consider a server‑side migration (e.g., JSF/Java) if you decide to move off PHP.

Success criteria: a working local app with secure auth, tested CRUD flows, responsive UI, and a documented Git workflow for further contributions.

