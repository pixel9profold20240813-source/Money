/* =====================================================================
   modals.js — 彈窗互動邏輯
===================================================================== */

/* ---------------------------------------------------------------------
   通用 Modal 開關
--------------------------------------------------------------------- */
function openModal(maskEl) { maskEl.classList.add('show'); }
function closeModal(maskEl) { maskEl.classList.remove('show'); }

/* =====================================================================
   交易彈窗（新增 / 編輯）
===================================================================== */
const txModalMask = document.getElementById('txModalMask');
let txEditingId = null; // null = 新增模式；有值 = 編輯模式
let txCurrentType = 'expense';

function renderTxCategoryChips() {
  const mount = document.getElementById('txCategoryChips');
  const cats = AppState.categories.filter((c) => c.type === txCurrentType);
  mount.innerHTML = cats.map((c) => `<span class="chip" data-cat="${c.id}"><span class="icon">${Icons.html(c.icon)}</span> ${escapeHtml(c.name)}</span>`).join('')
    || '<span style="color:var(--ink-soft); font-size:0.85rem;">請先到設定頁新增分類</span>';

  let selectedId = mount.querySelector('.chip')?.dataset.cat || null;
  mount.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      mount.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedId = chip.dataset.cat;
    });
  });
  if (mount.firstElementChild?.classList.contains('chip')) {
    mount.firstElementChild.classList.add('active');
  }
  mount.dataset.selected = selectedId || '';
  return selectedId;
}

function getSelectedCategoryId() {
  const mount = document.getElementById('txCategoryChips');
  const active = mount.querySelector('.chip.active');
  return active ? active.dataset.cat : null;
}

function renderTxAccountOptions() {
  const select = document.getElementById('txAccount');
  if (AppState.accounts.length === 0) {
    select.innerHTML = `<option value="">尚無帳戶，請先到設定頁新增</option>`;
    return;
  }
  select.innerHTML = AppState.accounts.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
}

function setTxType(type) {
  txCurrentType = type;
  document.querySelectorAll('#txModalMask .segmented button').forEach((b) => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  renderTxCategoryChips();
}

window.openTxModal = async function openTxModal(id = null) {
  await AppState.reload();
  txEditingId = id;
  renderTxAccountOptions();

  const deleteBtn = document.getElementById('txDeleteBtn');

  if (id) {
    const t = AppState.transactions.find((x) => x.id === id);
    if (!t) return;
    document.getElementById('txModalTitle').textContent = '編輯這一筆';
    setTxType(t.type);
    document.getElementById('txAmount').value = t.amount;
    document.getElementById('txAccount').value = t.accountId;
    document.getElementById('txDate').value = t.date;
    document.getElementById('txNote').value = t.note || '';
    // 等分類 chip 渲染完才能設定 active
    const chipMount = document.getElementById('txCategoryChips');
    const chip = chipMount.querySelector(`[data-cat="${t.categoryId}"]`);
    chipMount.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    if (chip) chip.classList.add('active');
    deleteBtn.style.display = 'inline-flex';
  } else {
    document.getElementById('txModalTitle').textContent = '新增一筆';
    setTxType('expense');
    document.getElementById('txAmount').value = '';
    document.getElementById('txDate').value = Utils.todayStr();
    document.getElementById('txNote').value = '';
    deleteBtn.style.display = 'none';
  }

  openModal(txModalMask);
};

document.querySelectorAll('#txModalMask .segmented button').forEach((btn) => {
  btn.addEventListener('click', () => setTxType(btn.dataset.type));
});

document.getElementById('fabAdd').addEventListener('click', () => window.openTxModal());
document.getElementById('txModalClose').addEventListener('click', () => closeModal(txModalMask));
txModalMask.addEventListener('click', (e) => { if (e.target === txModalMask) closeModal(txModalMask); });

document.getElementById('txSaveBtn').addEventListener('click', async () => {
  const amount = Number(document.getElementById('txAmount').value);
  const categoryId = getSelectedCategoryId();
  const accountId = document.getElementById('txAccount').value;
  const date = document.getElementById('txDate').value;
  const note = document.getElementById('txNote').value.trim();

  if (!amount || amount <= 0) { Utils.toast('請輸入有效金額', 'danger'); return; }
  if (!categoryId) { Utils.toast('請選擇分類', 'danger'); return; }
  if (!accountId) { Utils.toast('請先建立並選擇帳戶', 'danger'); return; }
  if (!date) { Utils.toast('請選擇日期', 'danger'); return; }

  const payload = { type: txCurrentType, amount, categoryId, accountId, date, note };

  if (txEditingId) {
    await DataStore.transactions.update(txEditingId, payload);
    Utils.toast('已更新這一筆', 'success');
  } else {
    await DataStore.transactions.add(payload);
    Utils.toast('已記下這一筆', 'success');
  }

  closeModal(txModalMask);
  await Router.go(Router.current);
});

document.getElementById('txDeleteBtn').addEventListener('click', async () => {
  if (!txEditingId) return;
  if (!confirm('確定要刪除這一筆紀錄嗎？')) return;
  await DataStore.transactions.remove(txEditingId);
  Utils.toast('已刪除', 'danger');
  closeModal(txModalMask);
  await Router.go(Router.current);
});

/* =====================================================================
   帳戶彈窗
===================================================================== */
const accModalMask = document.getElementById('accModalMask');
const ACCOUNT_COLORS = ['#A8D3E0', '#B6D9B0', '#F2B6A0', '#F0A8B8', '#F5DD9B', '#C9B8DE'];
let selectedAccColor = ACCOUNT_COLORS[0];

function renderAccColorPicker() {
  const mount = document.getElementById('accColorPick');
  mount.innerHTML = ACCOUNT_COLORS.map((c, i) =>
    `<span class="c ${i === 0 ? 'active' : ''}" data-color="${c}" style="background:${c}"></span>`
  ).join('');
  selectedAccColor = ACCOUNT_COLORS[0];
  mount.querySelectorAll('.c').forEach((el) => {
    el.addEventListener('click', () => {
      mount.querySelectorAll('.c').forEach((c) => c.classList.remove('active'));
      el.classList.add('active');
      selectedAccColor = el.dataset.color;
    });
  });
}

document.getElementById('btnAddAccount').addEventListener('click', () => {
  document.getElementById('accName').value = '';
  document.getElementById('accBalance').value = '';
  renderAccColorPicker();
  openModal(accModalMask);
});
document.getElementById('accModalClose').addEventListener('click', () => closeModal(accModalMask));
accModalMask.addEventListener('click', (e) => { if (e.target === accModalMask) closeModal(accModalMask); });

document.getElementById('accSaveBtn').addEventListener('click', async () => {
  const name = document.getElementById('accName').value.trim();
  const initialBalance = document.getElementById('accBalance').value || 0;
  if (!name) { Utils.toast('請輸入帳戶名稱', 'danger'); return; }

  await DataStore.accounts.add({ name, color: selectedAccColor, initialBalance });
  Utils.toast('帳戶建立成功！', 'success');
  closeModal(accModalMask);
  await renderSettings();
});

/* =====================================================================
   分類彈窗
===================================================================== */
const catModalMask = document.getElementById('catModalMask');
let catCurrentType = 'expense';
let selectedCatIcon = Icons.CATEGORY_ICON_CHOICES[0];

function renderCatIconPicker() {
  const mount = document.getElementById('catIconPick');
  mount.innerHTML = Icons.CATEGORY_ICON_CHOICES.map((name, i) =>
    `<span class="pick-item ${i === 0 ? 'active' : ''}" data-icon="${name}"><span class="icon">${Icons.html(name)}</span></span>`
  ).join('');
  selectedCatIcon = Icons.CATEGORY_ICON_CHOICES[0];
  mount.querySelectorAll('.pick-item').forEach((el) => {
    el.addEventListener('click', () => {
      mount.querySelectorAll('.pick-item').forEach((p) => p.classList.remove('active'));
      el.classList.add('active');
      selectedCatIcon = el.dataset.icon;
    });
  });
}

document.querySelectorAll('#catModalMask .segmented button').forEach((btn) => {
  btn.addEventListener('click', () => {
    catCurrentType = btn.dataset.cattype;
    document.querySelectorAll('#catModalMask .segmented button').forEach((b) => {
      b.classList.toggle('active', b.dataset.cattype === catCurrentType);
    });
  });
});

document.getElementById('btnAddCategory').addEventListener('click', () => {
  document.getElementById('catName').value = '';
  catCurrentType = 'expense';
  document.querySelectorAll('#catModalMask .segmented button').forEach((b) => {
    b.classList.toggle('active', b.dataset.cattype === 'expense');
  });
  renderCatIconPicker();
  openModal(catModalMask);
});
document.getElementById('catModalClose').addEventListener('click', () => closeModal(catModalMask));
catModalMask.addEventListener('click', (e) => { if (e.target === catModalMask) closeModal(catModalMask); });

document.getElementById('catSaveBtn').addEventListener('click', async () => {
  const name = document.getElementById('catName').value.trim();
  if (!name) { Utils.toast('請輸入分類名稱', 'danger'); return; }

  await DataStore.categories.add({ name, type: catCurrentType, icon: selectedCatIcon });
  Utils.toast('分類新增成功！', 'success');
  closeModal(catModalMask);
  await renderSettings();
});

/* =====================================================================
   設定頁：儲存預算按鈕
===================================================================== */
document.getElementById('btnSaveBudget').addEventListener('click', async () => {
  const value = document.getElementById('budgetInput').value;
  if (value === '' || Number(value) < 0) { Utils.toast('請輸入有效的預算金額', 'danger'); return; }
  await DataStore.budgets.set(Utils.currentMonthKey(), value);
  Utils.toast('預算已儲存！', 'success');
});
