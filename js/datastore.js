/* =====================================================================
   DataStore
   ---------------------------------------------------------------------
   所有資料存取的「唯一入口」。外部呼叫一律是 async 函式，
   現在內部用 localStorage 實作，未來要換成 Firebase Firestore 時，
   只需要替換本檔案內部實作，外部呼叫程式碼完全不用更動。

   資料結構：
   accounts:     [{ id, name, color, initialBalance, createdAt }]
   categories:   [{ id, name, type: 'income'|'expense', icon, isDefault }]
   transactions: [{ id, type, amount, categoryId, accountId, date, note, createdAt }]
   budgets:      { 'YYYY-MM': amount }
   ===================================================================== */

const STORAGE_KEYS = {
  accounts: 'doodle_ledger_accounts',
  categories: 'doodle_ledger_categories',
  transactions: 'doodle_ledger_transactions',
  budgets: 'doodle_ledger_budgets',
};

/* ---------------------------------------------------------------------
   工具函式
--------------------------------------------------------------------- */
function genId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('讀取資料失敗:', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('寫入資料失敗:', key, e);
    return false;
  }
}

/* 模擬非同步延遲（之後接 Firebase 時這裡會是真正的網路延遲，
   保留這個寫法讓呼叫端的 loading 處理邏輯現在就能測到） */
function tick() {
  return Promise.resolve();
}

/* ---------------------------------------------------------------------
   預設分類（首次啟動時建立）
--------------------------------------------------------------------- */
const DEFAULT_CATEGORIES = [
  { name: '餐飲', type: 'expense', icon: 'food', isDefault: true },
  { name: '交通', type: 'expense', icon: 'transport', isDefault: true },
  { name: '娛樂', type: 'expense', icon: 'fun', isDefault: true },
  { name: '購物', type: 'expense', icon: 'shopping', isDefault: true },
  { name: '居家', type: 'expense', icon: 'home', isDefault: true },
  { name: '醫療', type: 'expense', icon: 'medical', isDefault: true },
  { name: '其他支出', type: 'expense', icon: 'scribble', isDefault: true },
  { name: '薪資', type: 'income', icon: 'salary', isDefault: true },
  { name: '獎金', type: 'income', icon: 'bonus', isDefault: true },
  { name: '兼職', type: 'income', icon: 'job', isDefault: true },
  { name: '其他收入', type: 'income', icon: 'sparkle', isDefault: true },
];

/* 合法的圖示名稱清單（對應 icons.js 裡定義的函式） */
const VALID_ICON_NAMES = [
  'food', 'transport', 'fun', 'shopping', 'home', 'medical', 'scribble',
  'salary', 'bonus', 'job', 'sparkle',
];

/* 舊版資料用 emoji 字串存圖示，這裡做一次性映射，
   讓升級後的使用者不用清資料就能自動修復成新的 SVG 名稱 */
const LEGACY_EMOJI_TO_ICON = {
  '🍙': 'food', '🚌': 'transport', '🎨': 'fun', '🛍️': 'shopping',
  '🏠': 'home', '💊': 'medical', '🖍️': 'scribble',
  '💰': 'salary', '🎁': 'bonus', '🛠️': 'job', '✨': 'sparkle',
};

function migrateCategoryIcons() {
  const list = readJSON(STORAGE_KEYS.categories, []);
  if (!Array.isArray(list) || list.length === 0) return;
  let changed = false;
  const fixed = list.map((c) => {
    if (VALID_ICON_NAMES.includes(c.icon)) return c; // 已經是合法名稱，不動
    changed = true;
    const mapped = LEGACY_EMOJI_TO_ICON[c.icon];
    return { ...c, icon: mapped || 'scribble' };
  });
  if (changed) writeJSON(STORAGE_KEYS.categories, fixed);
}

function ensureSeedData() {
  if (localStorage.getItem(STORAGE_KEYS.categories) === null) {
    const seeded = DEFAULT_CATEGORIES.map((c) => ({ id: genId(), ...c }));
    writeJSON(STORAGE_KEYS.categories, seeded);
  } else {
    migrateCategoryIcons(); // 既有資料：檢查並修復舊版 emoji 圖示
  }
  if (localStorage.getItem(STORAGE_KEYS.accounts) === null) {
    writeJSON(STORAGE_KEYS.accounts, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.transactions) === null) {
    writeJSON(STORAGE_KEYS.transactions, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.budgets) === null) {
    writeJSON(STORAGE_KEYS.budgets, {});
  }
}
ensureSeedData();

/* =====================================================================
   Accounts
===================================================================== */
const accounts = {
  async getAll() {
    await tick();
    return readJSON(STORAGE_KEYS.accounts, []);
  },

  async add({ name, color, initialBalance }) {
    await tick();
    const list = readJSON(STORAGE_KEYS.accounts, []);
    const item = {
      id: genId(),
      name: name.trim(),
      color: color || '#A8D3E0',
      initialBalance: Number(initialBalance) || 0,
      createdAt: new Date().toISOString(),
    };
    list.push(item);
    writeJSON(STORAGE_KEYS.accounts, list);
    return item;
  },

  async update(id, patch) {
    await tick();
    const list = readJSON(STORAGE_KEYS.accounts, []);
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    writeJSON(STORAGE_KEYS.accounts, list);
    return list[idx];
  },

  async remove(id) {
    await tick();
    const list = readJSON(STORAGE_KEYS.accounts, []);
    const next = list.filter((a) => a.id !== id);
    writeJSON(STORAGE_KEYS.accounts, next);
    // 同步刪除底下交易，避免孤兒資料
    const txs = readJSON(STORAGE_KEYS.transactions, []);
    writeJSON(STORAGE_KEYS.transactions, txs.filter((t) => t.accountId !== id));
    return true;
  },
};

/* =====================================================================
   Categories
===================================================================== */
const categories = {
  async getAll() {
    await tick();
    return readJSON(STORAGE_KEYS.categories, []);
  },

  async add({ name, type, icon }) {
    await tick();
    const list = readJSON(STORAGE_KEYS.categories, []);
    const item = {
      id: genId(),
      name: name.trim(),
      type,
      icon: icon || 'scribble',
      isDefault: false,
    };
    list.push(item);
    writeJSON(STORAGE_KEYS.categories, list);
    return item;
  },

  async remove(id) {
    await tick();
    const list = readJSON(STORAGE_KEYS.categories, []);
    const next = list.filter((c) => c.id !== id);
    writeJSON(STORAGE_KEYS.categories, next);
    return true;
  },
};

/* =====================================================================
   Transactions
===================================================================== */
const transactions = {
  async getAll() {
    await tick();
    return readJSON(STORAGE_KEYS.transactions, []);
  },

  async add({ type, amount, categoryId, accountId, date, note }) {
    await tick();
    const list = readJSON(STORAGE_KEYS.transactions, []);
    const item = {
      id: genId(),
      type, // 'income' | 'expense'
      amount: Number(amount),
      categoryId,
      accountId,
      date, // 'YYYY-MM-DD'
      note: note || '',
      createdAt: new Date().toISOString(),
    };
    list.push(item);
    writeJSON(STORAGE_KEYS.transactions, list);
    return item;
  },

  async update(id, patch) {
    await tick();
    const list = readJSON(STORAGE_KEYS.transactions, []);
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, amount: Number(patch.amount ?? list[idx].amount) };
    writeJSON(STORAGE_KEYS.transactions, list);
    return list[idx];
  },

  async remove(id) {
    await tick();
    const list = readJSON(STORAGE_KEYS.transactions, []);
    const next = list.filter((t) => t.id !== id);
    writeJSON(STORAGE_KEYS.transactions, next);
    return true;
  },
};

/* =====================================================================
   Budgets — 以月份為 key 儲存每月預算金額
===================================================================== */
const budgets = {
  async get(monthKey) {
    await tick();
    const all = readJSON(STORAGE_KEYS.budgets, {});
    return all[monthKey] ?? null;
  },

  async set(monthKey, amount) {
    await tick();
    const all = readJSON(STORAGE_KEYS.budgets, {});
    all[monthKey] = Number(amount);
    writeJSON(STORAGE_KEYS.budgets, all);
    return all[monthKey];
  },
};

/* =====================================================================
   匯出
===================================================================== */
window.DataStore = { accounts, categories, transactions, budgets };
