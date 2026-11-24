# Smart Expense Analyzer

Smart Expense Analyzer is a web-based project that helps users manage their monthly income and expenses. It also helps users keep track of their budget and savings.

## Features

- Dashboard to view total income, expenses, spending budget and savings.
- Add, edit and delete income or expense transactions.
- View transactions month-wise.
- Set spending and saving budget percentages.
- Get alerts when the spending budget reaches 80% or 100%.
- Check estimated expenses at the end of the month.
- View category-wise expense charts.
- Compare monthly income and expenses.
- Import a transaction by pasting an SMS message.

## Technologies Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose
- Chart.js

## How to Run the Project

### 1. Open the project

Clone the GitHub repository and open the project folder in VS Code.

### 2. Install backend packages

Open the terminal and run:

```bash
cd backend
npm install
```

### 3. Set up MongoDB

Create a `.env` file inside the backend folder and add your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

### 4. Start the backend

```bash
node server.js
```

### 5. Open the frontend

Open the main project folder in VS Code. Right-click `index.html` and select **Open with Live Server**.

## Notes

- MongoDB Atlas is used to store transaction data.
- A valid MongoDB connection string is required to run the backend.
- SMS import works by pasting a message manually. It does not read the phone's SMS inbox automatically.
- Month-end expense prediction is based on average daily spending. It is not an AI-based prediction.
