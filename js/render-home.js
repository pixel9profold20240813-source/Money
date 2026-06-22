/* =====================================================================
   render-home.js — 首頁渲染
===================================================================== */

const BEAR_MESSAGES = {
  'no-budget': () => `還沒有設定本月預算喔！<br><b>去設定頁建立一個吧</b>`,
  happy: (p) => `預算還很充足！<br>已使用 <b>${p}%</b>，繼續保持～`,
  worried: (p) => `已經用了 <b>${p}%</b> 囉，<br>後面的日子要省一點～`,
  sad: (p) => `用了 <b>${p}%</b> 快要超過了！<br>小心一點比較好喔`,
  over: (p) => `嗚嗚已經超支了…<br>超出了 <b>${p - 100}%</b>，這個月要省一點`,
};

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

function updateBearFace(bearEl, status) {
  bearEl.classList.remove('happy', 'worried', 'sad', 'over');
  const faceClass = status.status === 'no-budget' ? 'happy' : status.status;
  bearEl.classList.add(faceClass);
}

async function renderHome() {
  await AppState.reload();

  const status = AppState.budgetStatus();
  updateBearFace(document.getElementById('homeBear'), status);

  const msgFn = BEAR_MESSAGES[status.status];
  document.getElementById('homeBearMsg').innerHTML = msgFn(status.percent ?? 0);
  renderBudgetBlock(status);

  document.getElementById('homeIncome').textContent = `NT$ ${Utils.formatMoney(AppState.monthlyIncome())}`;
  document.getElementById('homeExpense').textContent = `NT$ ${Utils.formatMoney(AppState.monthlyExpense())}`;
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
