// DOM Elements
const setupSection = document.getElementById('setup-section');
const expenseSection = document.getElementById('expense-section');
const totalAmountInput = document.getElementById('total-amount');
const setBudgetBtn = document.getElementById('set-budget');
const displayBudget = document.getElementById('display-budget');
const displayRemaining = document.getElementById('display-remaining');
const displaySpent = document.getElementById('display-spent');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const addExpenseBtn = document.getElementById('add-expense');
const expenseList = document.getElementById('expense-list');
const resetAppBtn = document.getElementById('reset-app');
const exportExcelBtn = document.getElementById('export-excel');

// App Data
let budget = 0;
let expenses = [];
let totalExpenses = 0;

// Initialize from localStorage if available
function initApp() {
    const savedBudget = localStorage.getItem('budget');
    const savedExpenses = localStorage.getItem('expenses');
    
    if (savedBudget !== null) {
        budget = parseFloat(savedBudget);
        setupSection.classList.add('hidden');
        expenseSection.classList.remove('hidden');
        updateSummary();
    }
    
    if (savedExpenses !== null) {
        expenses = JSON.parse(savedExpenses);
        totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
        renderExpenseList();
        updateSummary();
    }
}

// Set Budget
setBudgetBtn.addEventListener('click', () => {
    const amountValue = parseFloat(totalAmountInput.value);
    
    if (isNaN(amountValue) || amountValue <= 0) {
        alert('Please enter a valid amount greater than zero');
        return;
    }
    
    budget = amountValue;
    localStorage.setItem('budget', budget.toString());
    
    setupSection.classList.add('hidden');
    expenseSection.classList.remove('hidden');
    
    updateSummary();
    totalAmountInput.value = '';
});

// Add Expense
addExpenseBtn.addEventListener('click', () => {
    const expenseName = expenseNameInput.value.trim();
    const expenseAmount = parseFloat(expenseAmountInput.value);
    
    if (expenseName === '' || isNaN(expenseAmount) || expenseAmount <= 0) {
        alert('Please enter a valid expense name and amount');
        return;
    }
    
    // Create new expense object
    const newExpense = {
        id: Date.now(),
        name: expenseName,
        amount: expenseAmount,
        date: new Date().toISOString()
    };
    
    // Add to expenses array
    expenses.push(newExpense);
    totalExpenses += expenseAmount;
    
    // Save to localStorage
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // Update UI
    renderExpenseList();
    updateSummary();
    
    // Clear inputs
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
});

// Delete Expense
function deleteExpense(id) {
    const expenseIndex = expenses.findIndex(expense => expense.id === id);
    
    if (expenseIndex !== -1) {
        totalExpenses -= expenses[expenseIndex].amount;
        expenses.splice(expenseIndex, 1);
        
        // Save to localStorage
        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        // Update UI
        renderExpenseList();
        updateSummary();
    }
}

// Render Expense List
function renderExpenseList() {
    if (expenses.length === 0) {
        expenseList.innerHTML = '<div class="empty-message">No expenses added yet.</div>';
        return;
    }
    
    expenseList.innerHTML = '';
    
    expenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.classList.add('expense-item');
        
        // Format the date
        const expenseDate = new Date(expense.date);
        const formattedDate = expenseDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        expenseItem.innerHTML = `
            <div class="expense-info">
                <div class="expense-date">${formattedDate}</div>
                <div class="expense-name">${expense.name}</div>
            </div>
            <div class="expense-details">
                <span class="expense-amount">₹${expense.amount.toFixed(2)}</span>
                <button class="delete-btn" data-id="${expense.id}">Delete</button>
            </div>
        `;
        
        expenseList.appendChild(expenseItem);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteExpense(id);
        });
    });
}

// Update Summary
function updateSummary() {
    displayBudget.textContent = `₹${budget.toFixed(2)}`;
    displaySpent.textContent = `₹${totalExpenses.toFixed(2)}`;
    
    const remaining = budget - totalExpenses;
    displayRemaining.textContent = `₹${remaining.toFixed(2)}`;
    
    // Change color if over budget
    if (remaining < 0) {
        displayRemaining.style.color = '#e74c3c';
    } else {
        displayRemaining.style.color = '#2ecc71';
    }
}

// Reset App Data
function resetApp() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.clear();
        budget = 0;
        expenses = [];
        totalExpenses = 0;
        
        setupSection.classList.remove('hidden');
        expenseSection.classList.add('hidden');
    }
}

// Export expenses to CSV for Excel
function exportToExcel() {
    if (expenses.length === 0) {
        alert('No expenses to export!');
        return;
    }
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add headers
    csvContent += 'Date,Expense Name,Amount (₹)\n';
    
    // Add expense data
    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        // Format date as YYYY-MM-DD which Excel recognizes properly
        const formattedDate = `${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}-${expenseDate.getDate().toString().padStart(2, '0')}`;
        const row = `${formattedDate},"${expense.name}",${expense.amount.toFixed(2)}`;
        csvContent += row + '\n';
    });
    
    // Add summary row
    csvContent += '\n';
    csvContent += `Summary,,\n`;
    csvContent += `Total Budget,,${budget.toFixed(2)}\n`;
    csvContent += `Total Spent,,${totalExpenses.toFixed(2)}\n`;
    csvContent += `Remaining,,${(budget - totalExpenses).toFixed(2)}\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expenses_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
}

// Add event listener to reset button
resetAppBtn.addEventListener('click', resetApp);

// Add event listener to export button
exportExcelBtn.addEventListener('click', exportToExcel);

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp); 