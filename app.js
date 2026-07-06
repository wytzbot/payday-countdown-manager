// Check if setup exists
document.addEventListener('DOMContentLoaded', () => {
  const salary = localStorage.getItem('salary');
  const payday = localStorage.getItem('payday');
  
  if (salary && payday) {
    showDashboard();
    calculateBudget();
    // Auto-hide ad banner after 5 seconds
const adBanner = document.querySelector('.ad-banner');
if (adBanner) {
  // Make it dismissible on tap
  adBanner.style.cursor = 'pointer';
  adBanner.onclick = () => adBanner.style.display = 'none';
  
  // Auto-hide after 5s
  setTimeout(() => {
    adBanner.style.opacity = '0';
    adBanner.style.transition = 'opacity 0.5s ease';
    setTimeout(() => adBanner.style.display = 'none', 500);
  }, 5000);
}
  } else {
    showSetup();
  }
});

function showSetup() {
  document.getElementById('setup').classList.add('active');
  document.getElementById('dashboard').classList.remove('active');
}

function showDashboard() {
  document.getElementById('setup').classList.remove('active');
  document.getElementById('dashboard').classList.add('active');
}

function saveSetup() {
  const salary = document.getElementById('salary').value;
  const payday = document.getElementById('payday').value;
  
  if (!salary || !payday) {
    alert('Please enter both salary and payday');
    return;
  }
  
  if (parseFloat(salary) <= 0) {
    alert('Salary must be greater than 0');
    return;
  }
  
  localStorage.setItem('salary', salary);
  localStorage.setItem('payday', payday);
  localStorage.setItem('totalSpent', '0');
  
  showDashboard();
  calculateBudget();
}

function calculateBudget() {
  const salary = parseFloat(localStorage.getItem('salary')) || 0;
  const payday = new Date(localStorage.getItem('payday'));
  const totalSpent = parseFloat(localStorage.getItem('totalSpent')) || 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  payday.setHours(0, 0, 0, 0);
  
  const timeDiff = payday.getTime() - today.getTime();
  const daysRemaining = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  // Fixed math: use amount left, not total salary
  const amountLeft = salary - totalSpent;
  const dailyBudget = amountLeft / daysRemaining;
  const savingsPotential = amountLeft; // Can't save more than what's left
  
  // Format numbers
  const formatCurrency = (num) => {
    return `₦${num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };
  
  // Update UI
  document.getElementById('days-left').textContent = daysRemaining;
  document.getElementById('payday-date').textContent = `Next payday: ${payday.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
  document.getElementById('amount-left').textContent = formatCurrency(amountLeft);
  document.getElementById('safe-today').textContent = formatCurrency(dailyBudget);
  document.getElementById('savings-potential').textContent = formatCurrency(savingsPotential);
  document.getElementById('spent-today').textContent = `₦0.00 spent of ${formatCurrency(dailyBudget)} today`;
  
  // Update progress bar
  const percentSpent = salary > 0 ? (totalSpent / salary) * 100 : 0;
  const progressBar = document.getElementById('progress-bar');
  progressBar.style.width = `${Math.min(100, percentSpent)}%`;
  
  // Change bar color if overspending
  progressBar.style.background = percentSpent > 90 ? '#ef4444' : '#22c55e';
}

function resetApp() {
  if (confirm('Reset all data? This cannot be undone.')) {
    localStorage.clear();
    showSetup();
  }
}

// Recalculate on page focus in case date changed
window.addEventListener('focus', calculateBudget);
