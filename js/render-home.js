/* =====================================================================
   render-home.js — 首頁渲染
===================================================================== */

function renderBudgetBlock(status) {
  const mount = document.getElementById('homeBudgetBlock');
  if (status.status === 'no-budget') {
    mount.innerHTML = `
      <div class="budget-meta" style="margin-top:8px;">
        <span>尚未設定預算</span>
        <button class="btn sm ghost" data-nav="settings">前往設定</button>
      </div>`;
    return;
  }
  const pct = Math.min(status.percent, 100);
  mount.innerHTML = `
    <div class="budget-track">
      <div class="budget-fill ${status.status}" style="width:${pct}%"></div>
    </div>
    <div class="budget-meta">
      <span>已花費 NT$ ${Utils.formatMoney(status.spent)}</span>
      <span>預算 NT$ ${Utils.formatMoney(status.amount)}</span>
    </div>`;
}

/** 依文字長度動態縮小字級，避免長數字溢出甜甜圈中央空間
 *  donut-wrap 在 CSS 中是固定 140px，中央可用安全寬度約 76px（不隨機量測，避免在元素隱藏時量到 0） */
function fitDonutCenterText(el) {
  const maxWidth = 76;
  let size = 1.3;
  el.style.fontSize = size + 'rem';
  while (el.scrollWidth > maxWidth && size > 0.7) {
    size -= 0.08;
    el.style.fontSize = size + 'rem';
  }
}

/** 渲染首頁的甜甜圈圖：藍色=收入、黃色=依比例吃掉的支出區段 */
function renderDonut(income, expense) {
  const svgEl = document.getElementById('donutSvg');
  // 支出佔收入的比例（超過 100% 時鎖在 100%，避免圖形畸形；
  // 真實超支金額仍完整顯示在文字與月結餘上）
  const expensePct = income > 0 ? (expense / income) * 100 : (expense > 0 ? 100 : 0);
  DonutChart.render(svgEl, expensePct);

  const balance = income - expense;
  const balanceEl = document.getElementById('donutBalance');
  balanceEl.textContent = `${balance < 0 ? '-$' : '$'}${Utils.formatMoney(Math.abs(balance))}`;
  balanceEl.style.color = balance < 0 ? 'var(--crayon-red-d)' : 'var(--ink)';
  fitDonutCenterText(balanceEl);

  document.getElementById('donutIncome').textContent = `NT$ ${Utils.formatMoney(income)}`;
  document.getElementById('donutExpense').textContent = `NT$ ${Utils.formatMoney(expense)}`;
}

async function renderHome() {
  await AppState.reload();

  const status = AppState.budgetStatus();
  renderBudgetBlock(status);

  const income = AppState.monthlyIncome();
  const expense = AppState.monthlyExpense();
  renderDonut(income, expense);

  document.getElementById('homeIncome').textContent = `NT$ ${Utils.formatMoney(income)}`;
  document.getElementById('homeExpense').textContent = `NT$ ${Utils.formatMoney(expense)}`;
  document.getElementById('homeTotalBalance').textContent = `NT$ ${Utils.formatMoney(AppState.totalBalance())}`;

  renderRecentList();
}

function renderRecentList() {
  const mount = document.getElementById('homeRecentList');
  const recent = AppState.transactions.slice(0, 5);

  if (recent.length === 0) {
    mount.innerHTML = `
      <div class="empty-state">
        <span class="icon">${Icons.emptyLedger()}</span>
        <div class="hand">還沒有任何記錄，點右下角開始記第一筆吧！</div>
      </div>`;
    return;
  }

  mount.innerHTML = recent.map((t) => txItemHTML(t)).join('');
  mount.querySelectorAll('.tx-item').forEach((el) => {
    el.addEventListener('click', () => window.openTxModal(el.dataset.id));
  });
}

/** 共用：渲染單筆交易項目 HTML（記帳頁也會用到） */
function txItemHTML(t) {
  const cat = AppState.getCategory(t.categoryId);
  const acc = AppState.getAccount(t.accountId);
  const iconHtml = Icons.html(cat ? cat.icon : 'scribble');
  const catName = cat ? cat.name : '未分類';
  const sign = t.type === 'income' ? '+' : '-';
  const cls = t.type === 'income' ? 'income' : 'expense';
  return `
    <div class="tx-item" data-id="${t.id}">
      <div class="tx-icon"><span class="icon">${iconHtml}</span></div>
      <div class="tx-info">
        <div class="tx-cat">${catName}</div>
        ${t.note ? `<div class="tx-note">${escapeHtml(t.note)}</div>` : ''}
      </div>
      <div class="tx-right">
        <div class="tx-amount ${cls}">${sign}${Utils.formatMoney(t.amount)}</div>
        <div class="tx-account">${acc ? acc.name : ''}</div>
      </div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.renderHome = renderHome;
window.txItemHTML = txItemHTML;
window.escapeHtml = escapeHtml;
