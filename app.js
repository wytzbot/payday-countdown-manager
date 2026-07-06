// State
let state = {
  currency: 'USD',
  salary: 0,
  nextPayday: null,
  transactions: [],
  notificationsEnabled: false
};

// Currency symbols
const CURRENCY = {
  USD: '$', NGN: '₦', GBP: '£', EUR: '€', GHS: '₵', KES: 'KSh'
};

// Funny rotating messages
const FUNNY_MSGS = [
  "Ramen noodles till payday? 🍜",
  "Coffee is a luxury now ☕",
  "Payday is near, stay strong 💪",
  "Your wallet is on a diet 😅",
  "Look at you, Mr. Money Bags 💰",
  "Time to embrace your inner minimalist 🧘",
  "Instant noodles: breakfast of champions 🍜",
  "Your bank account called. It's lonely 😢"
];

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initSplashAd();
  initNav();

  if (state.salary && state.nextPayday) {
    showPage('dashboard');
    updateDashboard();
  } else {
    showPage('welcome');
  }

  startRotatingMessages();
});

// Splash Ad - Fixed stuck at 5s bug
function initSplashAd() {
  const splash = document.getElementById('splashAd');
  const skipBtn = document.getElementById('skipBtn');
  const countdown = document.getElementById('countdown');

  if (!splash) return;

  let seconds = 5;
  skipBtn.style.pointerEvents = 'none';

  const timer = setInterval(() => {
    seconds--;
    if (countdown) countdown.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(timer);
      skipBtn.style.opacity = '1';
      skipBtn.style.pointerEvents = 'auto';
      skipBtn.textContent = 'Skip Ad →';
    }
  }, 1000);

  // Auto-close after 5s even if user doesn't click
  setTimeout(() => {
    closeSplashAd();
  }, 5500);
}

function closeSplashAd() {
  const splash = document.getElementById('splashAd');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.style.display = 'none', 500);
  }
}

// Navigation
function initNav() {
  document.querySelectorAll('.nav-item,.bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (tab) showPage(tab);
    });
  });
}

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active'));

  // Remove active from nav
  document.querySelectorAll('.nav-item,.bottom-nav-item').forEach(n => n.classList.remove('active'));

  // Show selected page
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  // Mark nav active
  document.querySelectorAll(`[data-tab="${pageId}"]`).forEach(n => n.classList.add('active'));

  // Update title
  const titles = {
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    transactions: 'History',
    investments: 'Savings',
    settings: 'Settings',
    faq: 'FAQ',
    setup: 'Setup'
  };
  document.getElementById('pageTitle').textContent = titles[pageId] || 'Payday Pro';

  // Update content
  if (pageId === 'dashboard') updateDashboard();
  if (pageId === 'transactions') renderTransactions();
  if (pageId === 'investments') renderInvestments();
  if (pageId === 'settings') loadSettings();
}

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem('paydayProState');
  if (saved) {
    state = JSON.parse(saved);
    state.transactions = state.transactions || [];
  }
}

// Save state
function saveState() {
  localStorage.setItem('paydayProState', JSON.stringify(state));
}

// Setup
function saveSetup() {
  const currency = document.getElementById('currency').value;
  const salary = parseFloat(document.getElementById('salary').value);
  const nextPayday = document.getElementById('nextPayday').value;

  if (!salary || salary <= 0) {
    showToast('Please enter a valid salary');
    return;
  }
  if (!nextPayday) {
    showToast('Please select your next payday');
    return;
  }

  state.currency = currency;
  state.salary = salary;
  state.nextPayday = nextPayday;
  state.transactions = [];

  saveState();
  showPage('dashboard');
  updateDashboard();
  showToast('Setup complete! 🎉');
}

// Settings
function loadSettings() {
  const sel = document.getElementById('setCurrency');
  sel.innerHTML = Object.keys(CURRENCY).map(c =>
    `<option value="${c}" ${c === state.currency? 'selected' : ''}>${c} - ${getCurrencyName(c)}</option>`
  ).join('');
  document.getElementById('setSalary').value = state.salary || '';
  document.getElementById('setNextPayday').value = state.nextPayday || '';
}

function saveSettings() {
  const currency = document.getElementById('setCurrency').value;
  const salary = parseFloat(document.getElementById('setSalary').value);
  const nextPayday = document.getElementById('setNextPayday').value;

  if (!salary || salary <= 0) {
    showToast('Please enter a valid salary');
    return;
  }
  if (!nextPayday) {
    showToast('Please select your next payday');
    return;
  }

  state.currency = currency;
  state.salary = salary;
  state.nextPayday = nextPayday;

  saveState();
  updateDashboard();
  showToast('Settings saved ✓');
}

// Dashboard - FIXED MATH BUGS
function updateDashboard() {
  if (!state.nextPayday) return;

  const symbol = CURRENCY[state.currency] || '$';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payday = new Date(state.nextPayday);
  payday.setHours(0, 0, 0, 0);

  // Fix 1: NaN bug - ensure valid date math
  const timeDiff = payday.getTime() - today.getTime();
  const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  // Calculate spent
  const totalExpenses = state.transactions
   .filter(t => t.type === 'expense')
   .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = state.transactions
   .filter(t => t.type === 'income')
   .reduce((sum, t) => sum + t.amount, 0);

  // Fix 2: Correct math - use amount left, not total salary
  const amountLeft = Math.max(0, state.salary + totalIncome - totalExpenses);
  const dailyBudget = daysLeft > 0? amountLeft / daysLeft : 0;

  // Fix 3: Savings potential = amount left, not daily * days
  const savingsPotential = amountLeft;

  // Today's spending
  const todayStr = new Date().toDateString();
  const spentToday = state.transactions
   .filter(t => t.type === 'expense' && new Date(t.date).toDateString() === todayStr)
   .reduce((sum, t) => sum + t.amount, 0);

  // Update UI
  document.getElementById('daysLeft').textContent = daysLeft;
  document.getElementById('paydayDate').textContent = payday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: payday.getFullYear()!== today.getFullYear()? 'numeric' : undefined
  });

  document.getElementById('safeToSpend').textContent = `${symbol}${dailyBudget.toFixed(2)}`;
  document.getElementById('dailyBudget').textContent = `${symbol}${dailyBudget.toFixed(2)}`;
  document.getElementById('spentToday').textContent = `${symbol}${spentToday.toFixed(2)}`;
  document.getElementById('savingsPotential').textContent = `${symbol}${savingsPotential.toFixed(2)}`;

  // Progress bar
  const percentUsed = dailyBudget > 0? (spentToday / dailyBudget) * 100 : 0;
  const bar = document.getElementById('spendBar');
  bar.style.width = `${Math.min(100, percentUsed)}%`;

  if (percentUsed > 100) {
    bar.style.background = 'var(--danger)';
  } else if (percentUsed > 75) {
    bar.style.background = 'var(--warning)';
  } else {
    bar.style.background = 'var(--success)';
  }

  // Update investment budget
  document.getElementById('investBudget').textContent = `${symbol}${savingsPotential.toFixed(2)}`;
}

// Transactions
function addTx(type) {
  const amount = parseFloat(document.getElementById('quickAmount').value);
  const note = document.getElementById('quickNote').value.trim();

  if (!amount || amount <= 0) {
    showToast('Enter a valid amount');
    return;
  }

  state.transactions.unshift({
    id: Date.now(),
    type,
    amount,
    note: note || (type === 'expense'? 'Expense' : 'Income'),
    date: new Date().toISOString()
  });

  saveState();
  updateDashboard();
  renderTransactions();

  document.getElementById('quickAmount').value = '';
  document.getElementById('quickNote').value = '';

  showToast(`${type === 'expense'? 'Expense' : 'Income'} added`);
}

function renderTransactions() {
  const list = document.getElementById('txList');
  const symbol = CURRENCY[state.currency] || '$';

  if (state.transactions.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No transactions yet</p>';
    return;
  }

  list.innerHTML = state.transactions.map(tx => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border);">
      <div>
        <div style="font-weight: 600;">${tx.note}</div>
        <div style="font-size: 12px; color: var(--text-muted);">${new Date(tx.date).toLocaleDateString()}</div>
      </div>
      <div style="font-weight: 700; color: ${tx.type === 'expense'? 'var(--danger)' : 'var(--success)'};">
        ${tx.type === 'expense'? '-' : '+'}${symbol}${tx.amount.toFixed(2)}
      </div>
    </div>
  `).join('');
}

// Investments - Educational examples
function renderInvestments() {
  const symbol = CURRENCY[state.currency] || '$';
  const monthlyBudget = Math.max(0, state.salary - state.transactions
   .filter(t => t.type === 'expense')
   .reduce((sum, t) => sum + t.amount, 0));

  document.getElementById('investBudget').textContent = `${symbol}${monthlyBudget.toFixed(2)}`;

  const examples = [
    { name: 'Conservative', rate: 0.04, risk: 'Low' },
    { name: 'Balanced', rate: 0.07, risk: 'Medium' },
    { name: 'Growth', rate: 0.10, risk: 'High' }
  ];

  const list = document.getElementById('investmentList');
  list.innerHTML = examples.map(ex => {
    const year1 = monthlyBudget * 12 * (1 + ex.rate);
    const year5 = monthlyBudget * 12 * ((Math.pow(1 + ex.rate, 5) - 1) / ex.rate);

    return `
      <div class="investment-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong>${ex.name}</strong>
          <span class="badge">${ex.risk} Risk</span>
        </div>
        <div style="font-size: 14px; color: var(--text-muted);">
          ${ex.rate * 100}% annual return example
        </div>
        <div style="margin-top: 12px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 12px; color: var(--text-muted);">1 Year</div>
            <div style="font-weight: 700;">${symbol}${year1.toFixed(0)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--text-muted);">5 Years</div>
            <div style="font-weight: 700;">${symbol}${year5.toFixed(0)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Rotating funny messages
function startRotatingMessages() {
  let msgIndex = 0;
  const msgElements = ['funnyText1', 'funnyText2', 'funnyText3'];

  setInterval(() => {
    msgIndex = (msgIndex + 1) % FUNNY_MSGS.length;
    msgElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.opacity = '0';
        setTimeout(() => {
          el.textContent = FUNNY_MSGS[(msgIndex + Math.floor(Math.random() * 3)) % FUNNY_MSGS.length];
          el.style.opacity = '1';
        }, 300);
      }
    });
  }, 5000);
}

// Notifications
function requestNotifications() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported');
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      state.notificationsEnabled = true;
      saveState();
      showToast('Alerts enabled! 🔔');
      scheduleNotifications();
    }
  });
}

function scheduleNotifications() {
  // Check every hour if we should alert
  setInterval(() => {
    if (!state.notificationsEnabled ||!state.nextPayday) return;

    const daysLeft = getDaysLeft();
    if (daysLeft === 1) {
      new Notification('Payday Tomorrow!', {
        body: 'Tomorrow is payday! Check your budget.',
        icon: '/payday-countdown-manager/icon-192.png'
      });
    }
  }, 3600000); // Every hour
}

function getDaysLeft() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const payday = new Date(state.nextPayday);
  payday.setHours(0, 0, 0, 0);
  const timeDiff = payday.getTime() - today.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
}

// Data management
function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payday-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  showToast('Backup downloaded');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      state = imported;
      saveState();
      updateDashboard();
      showToast('Backup restored ✓');
      showPage('dashboard');
    } catch (err) {
      showToast('Invalid backup file');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (confirm('This will delete all your data and reset the app. Are you sure?')) {
    localStorage.removeItem('paydayProState');
    state = { currency: 'USD', salary: 0, nextPayday: null, transactions: [], notificationsEnabled: false };
    showPage('welcome');
    showToast('All data cleared');
  }
}

// FAQ
function toggleFAQ(el) {
  const answer = el.nextElementSibling;
  const icon = el.querySelector('span');
  answer.classList.toggle('show');
  icon.textContent = answer.classList.contains('show')? '−' : '+';
}

// Utils
function getCurrencyName(code) {
  const names = {
    USD: 'US Dollar', NGN: 'Nigerian Naira', GBP: 'British Pound',
    EUR: 'Euro', GHS: 'Ghanaian Cedi', KES: 'Kenyan Shilling'
  };
  return names[code] || code;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Update dashboard on page focus
window.addEventListener('focus', () => {
  if (document.getElementById('dashboard').classList.contains('active')) {
    updateDashboard();
  }
});
