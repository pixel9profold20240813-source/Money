/* =====================================================================
   render-ledger.js — 記帳頁渲染
===================================================================== */

async function renderLedger() {
  await AppState.reload();
  renderAccountScroll();
  renderLedgerList();
}

function renderAccountScroll() {
  const mount = document.getElementById('accountScroll');
  const pills = [`
    <button class="account-pill ${AppState.activeAccountId === 'all' ? 'active' : ''}" data-acc="all">
      <div class="acc-name"><span class="acc-dot" style="background:var(--ink-soft)"></span>全部帳戶</div>
      <div class="acc-balance">NT$ ${Utils.formatMoney(AppState.totalBalance())}</div>
    </button>`];

  AppState.accounts.forEach((acc) => {
    pills.push(`
      <button class="account-pill ${AppState.activeAccountId === acc.id ? 'active' : ''}" data-acc="${acc.id}">
        <div class="acc-name"><span class="acc-dot" style="background:${acc.color}"></span>${escapeHtml(acc.name)}</div>
        <div class="acc-balance">NT$ ${Utils.formatMoney(AppState.accountBalance(acc.id))}</div>
      </button>`);
  });

  if (AppState.accounts.length === 0) {
    pills.push(`
      <button class="account-pill" data-acc="__add">
        <div class="acc-name">＋ 新增帳戶</div>
        <div class="acc-balance" style="font-size:0.78rem;color:var(--ink-soft);">尚未建立</div>
      </button>`);
  }

  mount.innerHTML = pills.join('');
  mount.querySelectorAll('.account-pill').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.dataset.acc === '__add') {
        Router.go('settings');
        return;
      }
      AppState.activeAccountId = el.dataset.acc;
      renderLedger();
    });
  });
}

function renderLedgerList() {
  const mount = document.getElementById('ledgerList');
  const list = AppState.filteredTransactions();
  document.getElementById('ledgerCount').textContent = `${list.length} 筆`;

  if (list.length === 0) {
    mount.innerHTML = `
      <div class="empty-state">
        <span class="icon">${Icons.emptyLedger()}</span>
        <div class="hand">這個帳戶還沒有記錄，點右下角加一筆吧！</div>
      </div>`;
    return;
  }

  // 依日期分組（list 已經是新到舊排序）
  const groups = [];
  let lastDate = null;
  for (const t of list) {
    if (t.date !== lastDate) {
      groups.push({ date: t.date, items: [] });
      lastDate = t.date;
    }
    groups[groups.length - 1].items.push(t);
  }

  mount.innerHTML = groups.map((g) => {
    const dayIncome = g.items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const dayExpense = g.items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    let summary = '';
    if (dayIncome) summary += `<span style="color:var(--crayon-green-d)">+${Utils.formatMoney(dayIncome)}</span> `;
    if (dayExpense) summary += `<span style="color:var(--crayon-red-d)">-${Utils.formatMoney(dayExpense)}</span>`;

    return `
      <div class="tx-day-group">
        <div class="tx-day-label">
          <span>${Utils.formatDateLabel(g.date)}</span>
          <span>${summary}</span>
        </div>
        ${g.items.map((t) => txItemHTML(t)).join('')}
      </div>`;
  }).join('');

  mount.querySelectorAll('.tx-item').forEach((el) => {
    el.addEventListener('click', () => window.openTxModal(el.dataset.id));
  });
}

window.renderLedger = renderLedger;
