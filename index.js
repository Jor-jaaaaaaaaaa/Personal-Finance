let transactions = [
    { id: 1, date: '2025-01-14', category: 'Subscription', amount: -40.00, status: 'Success', type: 'expense' },
    { id: 2, date: '2025-01-31', category: 'Salary', amount: 2500.00, status: 'Success', type: 'income' },
    { id: 3, date: '2025-01-2', category: 'Shopping', amount: -2500.00, status: 'Success', type: 'expense' }
];

let monthlyIncome = 1;
let monthlyExpenses = 0.5;

const today = new Date().toISOString().split('T')[0]
document.getElementById('incomeDate').value=today
document.getElementById('expenseDate').value=today

function openincomeModal(){
    document.getElementById('incomeModal').style.display='block';
    document.body.style.overflow='hidden'
}
function openexpenseModal(){
    document.getElementById('expenseModal').style.display='block';
    document.body.style.overflow='hidden'
}

function closeModal(modalID){
    document.getElementById(modalID).style.display='none'
    document.body.style.overflow='auto'

    if (modalID === 'incomeModal'){
        document.getElementById('incomeForm').reset()
        document.getElementById('incomeDate').value=today
    }else{
        document.getElementById('expenseForm').reset()
        document.getElementById('expenseDate').value=today
    }
}

window.onclick = function(event) {
    const incomeModal = document.getElementById('incomeModal');
    const expenseModal = document.getElementById('expenseModal');

    if (event.target === incomeModal) {
        closeModal('incomeModal');
    }
    if (event.target === expenseModal) {
        closeModal('expenseModal');
    }
};
function addIncome() {
    // 1. Get values from the modal input fields
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const category = document.getElementById('incomeCategory').value;
    const description = document.getElementById('incomeDescription').value;
    const date = document.getElementById('incomeDate').value;

    // 2. Validate that all fields are filled
    if (!amount || !category || !description || !date) {
        alert("Please fill in all required fields");
        return;
    }

    // 3. Create a new transaction object
    const newTransaction = {
        id: transactions.length + 1,
        date: date,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: amount,
        status: "Success",
        type: "income",
        description: description
    };

    // 4. Update the data and refresh the UI
    transactions.unshift(newTransaction); // Add to the top of the list
    monthlyIncome += amount; // Update the total income

    updateDashboard(); // Refresh total displays
    updateTransactionsTable(); // Refresh the table list
    closeModal('incomeModal'); // Hide the popup
    showNotification("Income added successfully", "success");
}
function addExpense() {
    // 1. Get values from the modal input fields
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;
    const date = document.getElementById('expenseDate').value;

    // 2. Validate that all fields are filled
    if (!amount || !category || !description || !date) {
        alert("Please fill in all required fields");
        return;
    }

    // 3. Create a new transaction object
    const newTransaction = {
        id: transactions.length + 1,
        date: date,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: -amount,
        status: "Success",
        type: "expense",
        description: description
    };

    // 4. Update the data and refresh the UI
    transactions.unshift(newTransaction); // Add to the top of the list
    monthlyExpenses += amount; // Update the total expenses

    updateDashboard(); // Refresh total displays
    updateTransactionsTable(); // Refresh the table list
    closeModal('expenseModal'); // Hide the popup
    showNotification("Expense added successfully", "success");
}

function updateDashboard() {
    // Updates the main income display
    document.querySelector('.income-amount').textContent = `$${monthlyIncome.toLocaleString()}`;
    
    // Updates the main expense display
    document.querySelector('.expense-amount').textContent = `$${monthlyExpenses.toLocaleString()}`;

    // Calculates and updates the spending limit on the card
    const spendingLimit = 12645;
    const usedAmount = monthlyExpenses;
    
    // Calculates percentage for the progress bar
    const percentage = (usedAmount / spendingLimit) * 100;
    
    // Updates the spending limit text content
    document.querySelector('.spending-limit').textContent = `$${(spendingLimit - usedAmount).toLocaleString()}`;

    // Updates the progress bar fill width dynamically
    const progressFill = document.querySelector('.progress-fill');
    progressFill.style.width = `${Math.min(percentage, 100)}%`;
}

function updateTransactionsTable() {
    const tbody = document.getElementById('transactions-table'); //
    if (!tbody) return;
    tbody.innerHTML = ''; // Clear existing rows

    // Loop through the transactions array
    transactions.forEach(transaction => {
        const row = document.createElement('tr'); //
        
        // Format the date for display
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }); //

        // Determine the color based on income vs expense
        const amountDisplay = transaction.type === 'income' 
            ? `+$${transaction.amount.toLocaleString()}` 
            : `-$${Math.abs(transaction.amount).toLocaleString()}`; //
            
        const amountColor = transaction.type === 'income' ? '#10B981' : '#EF4444'; //

        // Construct the row HTML
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.category}</td>
            <td style="color: ${amountColor}">${amountDisplay}</td>
            <td><span class="status-success">${transaction.status}</span></td>
            <td><button class="action-btn"><i class="fas fa-ellipsis-h"></i></button></td>
        `; //

        tbody.appendChild(row); //
    });
}

function showNotification(message, type = 'success') {
    // 1. Create a notification div element
    const notification = document.createElement('div');
    
    // 2. Set the CSS styles for the notification popup
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1100;
        animation: slideInRight 0.3s ease;
    `;

    // 3. Set the message and add to the document body
    notification.textContent = message;
    document.body.appendChild(notification);

    // 4. Remove the notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`
document.head.appendChild(style);
document.addEventListener('DOMContentLoaded', function() {
            updateTransactionsTable();
        });