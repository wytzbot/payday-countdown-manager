// SAFE STATE
let state = {
  salary: 0,
  nextPayday: '',
  currency: 'USD',
  expenses: [],
  income: [],
  setupDone: false
};

const CURRENCIES = {
  USD: '$', NGN: '₦', GBP: '£', EUR: '€', GHS: 'GH₵', KES: 'KSh'
};

const FUNNY = [
  "Ramen noodles till payday? 🍜",
  "Your wallet is on a diet",
  "Time to call your rich uncle",
  "Coffee is a luxury now ☕",
  "Almost at 'I can afford shawarma' level",
  "Budget mode: activated",
  "Look at you, Mr. Money Bags 💰",
  "Payday is near, stay strong"
];

const INVESTMENTS = [
  { name: 'High-Yield Savings Account', min: 100, type: 'Low Risk', desc: 'FDIC insured banks offer 4-5% APY. Safest option.' },
  { name: 'Government Treasury Bills', min: 500, type: 'Low Risk', desc: 'Nigerian T-Bills or US Treasuries. 10-18% in Nigeria.' },
  { name: 'S&P 500 ETF (VOO/SPY)', min: 300, type: 'Medium Risk', desc: 'Diversified US stocks. 7-10% average annual return.' },
  { name: 'REITs - Real Estate', min: 1000, type: 'Medium Risk', desc: 'Property without buying houses. 6-8% dividend yield.' },
  { name: 'PiggyVest/Cowrywise', min: 100, type: 'Low-Medium Risk', desc: 'Nigerian savings apps. 8-15% returns. Start small.' }
];

// SAFE LOAD
function load() {
  try {
    const saved = localStorage.getItem('paydayData');
    if (saved) state = {...state,...JSON.parse(saved) };
  } catch (e) {
    localStorage.removeItem('paydayData');
  }

  const currSel = document.getElementById('setCurrency');
  currSel.innerHTML = Object.keys(CURRENCIES).map(c =>
    `<option value="${c}">${c}</option>`
  ).join('');
  currSel.value = state.currency;

  if (state.setupDone) {
    showPage('dashboard');
    updateDash();
  } else {
    showPage('welcome');
  }
}

function save() {
  try {
    localStorage.setItem('paydayData', JSON.stringify(state));
  } catch (e) {
    showToast('Storage full. Export backup and clear old data.');
  }
}

// NAVIGATION - Syncs desktop + mobile
function showPage(page) {
  ['welcome','setup','dashboard','transactions','investments','faq','settings'].forEach(p => {
    document.getElementById(p).classList.add('hidden');
    document.getElementById(p).classList.remove('active');
  });

  document.getElementById(page).classList.remove('hidden');
  document.getElementById(page).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-tab="${page}"]`);
  if (navItem) navItem.classList.add('active');

  document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
  const bottomNavItem = document.querySelector(`.bottom-nav-item[data-tab="${page}"]`);
  if (bottomNavItem) bottomNavItem.classList.add('active');

  const titles = {
    welcome: 'Welcome',
    setup: 'Setup',
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    investments: 'Invest',
    settings: 'Settings',
    faq: 'FAQ'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Payday Pro';

  if (page === 'dashboard') updateDash();
  if (page === 'transactions') renderTransactions();
  if (page === 'investments') updateInvestments();
  if (page === 'settings') {
    document.getElementById('setSalary').value = state.salary || '';
    document.getElementById('setNextPayday').value = state.nextPayday || '';
  }

  window.scrollTo(0, 0);
}

function saveSetup() {
  const salary = parseFloat(document.getElementById('salary').value) || 0;
  const nextPayday = document.getElementById('nextPayday').value;

  if (!salary ||!nextPayday) return showToast('Fill salary and payday');

  state.salary = salary;
  state.nextPayday = nextPayday;
  state.currency = document.getElementById('currency').value;
  state.setupDone = true;
  save();
  showPage('dashboard');
  updateDash();
  showToast('Setup complete! 🎉');
}

function updateDash() {
  try {
    const today = new Date();
    const payday = new Date(state.nextPayday);
    const daysLeft = Math.max(0, Math.ceil((payday - today) / 86400000));

    const expenses = (state.expenses || []).reduce((s, e) => s + e.amount, 0);
    const income = (state.income || []).reduce((s, i) => s + i.amount, 0);
    const remaining = state.salary + income - expenses;
    const safeToSpend = daysLeft > 0? remaining / daysLeft : remaining;

    const symbol = CURRENCIES[state.currency] || '$';
    document.getElementById('daysLeft').textContent = daysLeft;
    document.getElementById('paydayDate').textContent = payday.toLocaleDateString();
    document.getElementById('safeToSpend').textContent = symbol + Math.max(0, safeToSpend).toFixed(2);
    document.getElementById('savingsPotential').textContent = symbol + remaining.toFixed(2);

    document.getElementById('funnyText1').textContent = FUNNY[Math.floor(Math.random() * FUNNY.length)];
    document.getElementById('funnyText2').textContent = FUNNY[Math.floor(Math.random() * FUNNY.length)];
    document.getElementById('funnyText3').textContent = FUNNY[Math.floor(Math.random() * FUNNY.length)];
  } catch (e) {
    console.error(e);
  }
}

function addTx(type) {
  const amount = parseFloat(document.getElementById('quickAmount').value) || 0;
  const note = document.getElementById('quickNote').value || '';
  if (amount <= 0) return showToast('Enter amount');

  const entry = { amount, note, date: new Date().toISOString() };
  if (type === 'expense') {
    state.expenses = state.expenses || [];
    state.expenses.unshift(entry);
  } else {
    state.income = state.income || [];
    state.income.unshift(entry);
    showToast('💰 Money in!');
  }

  save();
  document.getElementById('quickAmount').value = '';
  document.getElementById('quickNote').value = '';
  updateDash();
}

function renderTransactions() {
  const list = document.getElementById('txList');
  const all = [
 ...(state.expenses || []).map(e => ({...e, type: 'expense'})),
 ...(state.income || []).map(i => ({...i, type: 'income'}))
  ].sort((a,b) => new Date(b.date) - new Date(a.date));

  const symbol = CURRENCIES[state.currency] || '$';
  list.innerHTML = all.length? all.map(tx => `
    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
      <div>
        <div style="font-weight: 600;">${tx.note || 'Transaction'}</div>
        <div style="font-size: 12px; color: var(--text-muted);">${new Date(tx.date).toLocaleDateString()}</div>
      </div>
      <div style="color: ${tx.type === 'expense'? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">
        ${tx.type === 'expense'? '-' : '+'}${symbol}${tx.amount.toFixed(2)}
      </div>
    </div>
  `).join('') : '<p style="color: var(--text-muted);">No transactions yet</p>';
}

function updateInvestments() {
  const expenses = (state.expenses || []).reduce((s, e) => s + e.amount, 0);
  const income = (state.income || []).reduce((s, i) => s + i.amount, 0);
  const savings = state.salary + income - expenses;

  const symbol = CURRENCIES[state.currency] || '$';
  document.getElementById('investBudget').textContent = symbol + savings.toFixed(2);

  const list = document.getElementById('investmentList');
  const affordable = INVESTMENTS.filter(i => savings >= i.min);

  list.innerHTML = affordable.length? affordable.map(inv => `
    <div class="investment-card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <strong>${inv.name}</strong>
        <span class="badge">${inv.type}</span>
      </div>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 8px;">${inv.desc}</p>
      <p style="font-size: 14px;">Min: ${symbol}${inv.min}</p>
    </div>
  `).join('') : '<p style="color: var(--text-muted);">Increase savings to unlock investment ideas. Keep tracking!</p>';
}

function saveSettings() {
  state.currency = document.getElementById('setCurrency').value;
  state.salary = parseFloat(document.getElementById('setSalary').value) || state.salary;
  state.nextPayday = document.getElementById('setNextPayday').value || state.nextPayday;
  save();
  updateDash();
  showToast('Saved!');
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payday-pro-backup-${Date.now()}.json`;
  a.click();
  showToast('Backup downloaded');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const imported = JSON.parse(evt.target.result);
      state = {...state,...imported };
      save();
      showToast('Backup imported! Reloading...');
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      showToast('Invalid backup file');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Delete everything? This resets the app to welcome screen.')) return;
  localStorage.clear();
  location.reload();
}

function toggleFAQ(el) {
  const answer = el.nextElementSibling;
  answer.classList.toggle('show');
  el.querySelector('span').textContent = answer.classList.contains('show')? '−' : '+';
}

function requestNotifications() {
  if (!('Notification' in window)) return showToast('Notifications not supported');
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      showToast('Notifications enabled!');
    }
  });
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Setup desktop nav clicks
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      showPage(item.dataset.tab);
    });
  });
});

// Register SW
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/payday-countdown-manager/service-worker.js');
  });
}

// Start app
window.addEventListener('load', () => {
  try {
    load();
  } catch (e) {
    localStorage.clear();
    location.reload();
  }
});
