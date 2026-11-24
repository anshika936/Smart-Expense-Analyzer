# Smart Expense Analyzer – Frontend Demo

## Run in VS Code
1. Extract this ZIP file.
2. Open the `Smart-Expense-Analyzer-Frontend` folder in VS Code.
3. Install the **Live Server** extension if you do not already have it.
4. Right-click `index.html` → **Open with Live Server**.
5. The demo opens in your browser.

You can also open `index.html` directly in Chrome, but Live Server is recommended.

## Features in this frontend
- Dashboard with income, expenses, spending budget, savings and month-end estimate
- Month selector with current and previous months
- Add, edit and delete transactions
- Flexible spending/savings percentage per month
- Budget alerts and savings-used calculation
- Category and monthly comparison charts (requires internet for Chart.js CDN)
- Monthly history
- Pasted SMS parser demo

## Important notes
- This is a frontend-only prototype. It does not connect to Node.js, Express or MongoDB.
- Data is saved in the browser using `localStorage` on that device/browser.
- Sample data is inserted on first run.
- SMS import only parses text that the user pastes. It does not read the phone inbox.
- The prediction is a simple average-based estimate, not AI.
- Chart.js and Google Fonts use online CDNs; charts/fonts may not load offline.
