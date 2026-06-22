/* =====================================================================
   render-settings.js — 設定頁渲染
===================================================================== */

async function renderSettings() {
  await AppState.reload();
  renderAccountSettingsList();
  renderBudgetInput();
  renderCategoryLists();
}

function renderAccountSettingsList() {
  const mount = document.getElementById('settingsAccountList');
  if (AppState.accounts.length === 0) {
    mount.innerHTML = `
      <div class="empty-state">
        <span class="emoji">🏦</span>
        <div class="hand">還沒有帳戶，先新增一個吧！</div>
      </div>`;
    return;
  }
  mount.innerHTML = AppState.accounts.map((acc) => `
    <div class="setting-list-item">
      <div class="meta">
        <span class="acc-dot" style="background:${acc.color}"></span>
        <div>
          <div style="font-family:var(--font-display); font-size:0.92rem;">${escapeHtml(acc.name)}</div>
          <div style="font-size:0.78rem; color:var(--ink-soft);">餘額 NT$ ${Utils.formatMoney(AppState.accountBalance(acc.id))}</div>
        </div>
      </div>
      <button class="btn sm danger" data-del-acc="${acc.id}">刪除</button>
    </div>`).join('');

  mount.querySelectorAll('[data-del-acc]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.delAcc;
      const acc = AppState.getAccount(id);
      if (!confirm(`確定要刪除帳戶「${acc.name}」嗎？\n這個帳戶底下的所有交易紀錄也會一併刪除。`)) return;
      await DataStore.accounts.remove(id);
      if (AppState.activeAccountId === id) AppState.activeAccountId = 'all';
      Utils.toast('帳戶已刪除', 'danger');
      await renderSettings();
    });
  });
}

function renderBudgetInput() {
  const input = document.getElementById('budgetInput');
  input.value = AppState.currentBudget ?? '';
}

function renderCategoryLists() {
  const expenseMount = document.getElementById('expenseCategoryList');
  const incomeMount = document.getElementById('incomeCategoryList');

  const expenseCats = AppState.categories.filter((c) => c.type === 'expense');
  const incomeCats = AppState.categories.filter((c) => c.type === 'income');

  const chipHTML = (c) => `
    <span class="chip" data-cat-id="${c.id}">
      ${c.icon} ${escapeHtml(c.name)}
      ${!c.isDefault ? `<span class="x" data-del-cat="${c.id}">✕</span>` : ''}
    </span>`;

  expenseMount.innerHTML = expenseCats.map(chipHTML).join('') || '<span style="color:var(--ink-soft); font-size:0.85rem;">尚無分類</span>';
  incomeMount.innerHTML = incomeCats.map(chipHTML).join('') || '<span style="color:var(--ink-soft); font-size:0.85rem;">尚無分類</span>';

  document.querySelectorAll('[data-del-cat]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = el.dataset.delCat;
      const cat = AppState.getCategory(id);
      if (!confirm(`確定要刪除分類「${cat.name}」嗎？`)) return;
      await DataStore.categories.remove(id);
      Utils.toast('分類已刪除', 'danger');
      await renderSettings();
    });
  });
}

window.renderSettings = renderSettings;
