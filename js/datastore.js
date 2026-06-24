/* =====================================================================
   DataStore
   ---------------------------------------------------------------------
   所有資料存取的「唯一入口」。外部呼叫一律是 async 函式。

   策略：Firestore 為主、localStorage 為快取，並支援完整離線寫入：
   - 寫入（add/update/remove）：
       1. 先更新本機快取（讓 UI 立刻反應，不等網路）
       2. 嘗試寫入 Firestore
       3. 若失敗（離線/網路錯誤），把這個操作推進「待同步佇列」，
          並標記快取為「待同步」狀態
   - 讀取（getAll）：嘗試讀 Firestore 並更新快取；
     若離線或讀取失敗，fallback 用本機快取。
   - 監聽 'online' 事件，網路恢復時自動依序補交佇列中的操作。
   - 快取 key 會帶入目前登入者的 uid，避免共用裝置時不同帳號互相污染。

   資料結構：
   accounts:     [{ id, name, color, initialBalance, createdAt }]
   categories:   [{ id, name, type: 'income'|'expense', icon, isDefault }]
   transactions: [{ id, type, amount, categoryId, accountId, date, note, createdAt }]
   budgets:      { 'YYYY-MM': amount }
   ===================================================================== */

/* ---------------------------------------------------------------------
   工具函式
--------------------------------------------------------------------- */
function genId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function cacheKey(uid, name) {
  return `doodle_ledger_${uid}_${name}`;
}

function readCache(uid, name, fallback) {
  try {
    const raw = localStorage.getItem(cacheKey(uid, name));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('讀取快取失敗:', name, e);
    return fallback;
  }
}

function writeCache(uid, name, value) {
  try {
    localStorage.setItem(cacheKey(uid, name), JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('寫入快取失敗:', name, e);
    return false;
  }
}

/** 取得目前登入者的 uid，沒登入則丟出錯誤（呼叫端應確保已登入才會用到 DataStore） */
function requireUid() {
  const uid = window.AuthState && window.AuthState.uid;
  if (!uid) throw new Error('尚未登入，無法存取資料');
  return uid;
}

/* ---------------------------------------------------------------------
   待同步佇列
   ---------------------------------------------------------------------
   每個使用者各自一份佇列，存在 localStorage。
   佇列項目: { id, opType: 'set'|'update'|'remove', collection, docId, payload, timestamp }
--------------------------------------------------------------------- */
function queueKey(uid) {
  return `doodle_ledger_${uid}_pending_queue`;
}

function readQueue(uid) {
  return readCache(uid, 'pending_queue', []);
}

function writeQueue(uid, queue) {
  writeCache(uid, 'pending_queue', queue);
  window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: queue.length } }));
}

function enqueue(uid, opType, collectionName, docId, payload) {
  const queue = readQueue(uid);
  queue.push({
    id: genId(),
    opType,
    collection: collectionName,
    docId,
    payload,
    timestamp: Date.now(),
  });
  writeQueue(uid, queue);
}

/** 取得目前待同步筆數（供 UI 顯示） */
function pendingCount() {
  const uid = window.AuthState && window.AuthState.uid;
  if (!uid) return 0;
  return readQueue(uid).length;
}

/** 嘗試把佇列中的操作依序補交到 Firestore；任何一筆失敗就停下（保留剩餘佇列，下次連線再試） */
async function flushQueue() {
  const uid = window.AuthState && window.AuthState.uid;
  if (!uid) return;
  let queue = readQueue(uid);
  if (queue.length === 0) return;

  while (queue.length > 0) {
    const op = queue[0];
    try {
      if (op.opType === 'set') {
        await window.FirebaseApp.setDocument(uid, op.collection, op.docId, op.payload);
      } else if (op.opType === 'update') {
        await window.FirebaseApp.updateDocument(uid, op.collection, op.docId, op.payload);
      } else if (op.opType === 'remove') {
        await window.FirebaseApp.deleteDocument(uid, op.collection, op.docId);
      }
      queue.shift(); // 成功，移除佇列第一筆
      writeQueue(uid, queue);
    } catch (e) {
      console.warn('補交同步失敗，稍後再試:', e);
      break; // 網路可能又斷了，停止這次補交，保留剩餘佇列
    }
  }
}

window.addEventListener('online', () => { flushQueue(); });

/** 嘗試立刻同步一次（在每次成功登入或重新整理後可呼叫） */
function trySyncNow() {
  if (navigator.onLine) flushQueue();
}

/* ---------------------------------------------------------------------
   通用寫入包裝：本機快取先寫，Firestore 寫入失敗則排入待同步佇列
--------------------------------------------------------------------- */
async function writeThrough(uid, opType, collectionName, docId, payload) {
  try {
    if (opType === 'set') await window.FirebaseApp.setDocument(uid, collectionName, docId, payload);
    if (opType === 'update') await window.FirebaseApp.updateDocument(uid, collectionName, docId, payload);
    if (opType === 'remove') await window.FirebaseApp.deleteDocument(uid, collectionName, docId);
    return { synced: true };
  } catch (e) {
    console.warn(`離線或寫入失敗，已排入待同步佇列 (${collectionName}/${opType}):`, e);
    enqueue(uid, opType, collectionName, docId, payload);
    return { synced: false };
  }
}

/* ---------------------------------------------------------------------
   預設分類（首次使用該帳號時建立）
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

/** 合法的圖示名稱清單，用於修復舊版 emoji 殘留資料 */
const VALID_ICON_NAMES = [
  'food', 'transport', 'fun', 'shopping', 'home', 'medical', 'scribble',
  'salary', 'bonus', 'job', 'sparkle',
];
const LEGACY_EMOJI_TO_ICON = {
  '🍙': 'food', '🚌': 'transport', '🎨': 'fun', '🛍️': 'shopping',
  '🏠': 'home', '💊': 'medical', '🖍️': 'scribble',
  '💰': 'salary', '🎁': 'bonus', '🛠️': 'job', '✨': 'sparkle',
};
function fixIconName(icon) {
  if (VALID_ICON_NAMES.includes(icon)) return icon;
  return LEGACY_EMOJI_TO_ICON[icon] || 'scribble';
}

/** 為新帳號（本機快取與 Firestore 都還沒有任何分類）建立預設分類 */
async function seedDefaultCategoriesIfNeeded(uid) {
  let existing = [];
  try {
    existing = await window.FirebaseApp.getCollection(uid, 'categories');
  } catch (e) {
    // 離線時無法確認 Firestore 是否已有資料，用本機快取判斷，避免離線時重複造出預設分類
    existing = readCache(uid, 'categories', []);
    if (existing.length > 0) return existing;
    throw e; // 真的什麼都沒有又離線，往外丟給呼叫端 fallback 處理
  }
  if (existing.length > 0) return existing;

  const created = [];
  for (const c of DEFAULT_CATEGORIES) {
    const id = genId();
    const item = { ...c, id };
    await writeThrough(uid, 'set', 'categories', id, item);
    created.push(item);
  }
  return created;
}

/* =====================================================================
   Accounts
===================================================================== */
const accounts = {
  async getAll() {
    const uid = requireUid();
    try {
      const list = await window.FirebaseApp.getCollection(uid, 'accounts');
      writeCache(uid, 'accounts', list);
      return list;
    } catch (e) {
      console.warn('讀取帳戶失敗，改用本機快取:', e);
      return readCache(uid, 'accounts', []);
    }
  },

  async add({ name, color, initialBalance }) {
    const uid = requireUid();
    const item = {
      id: genId(),
      name: name.trim(),
      color: color || '#A8D3E0',
      initialBalance: Number(initialBalance) || 0,
      createdAt: new Date().toISOString(),
    };
    const list = readCache(uid, 'accounts', []);
    list.push(item);
    writeCache(uid, 'accounts', list);
    await writeThrough(uid, 'set', 'accounts', item.id, item);
    return item;
  },

  async update(id, patch) {
    const uid = requireUid();
    const list = readCache(uid, 'accounts', []);
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    writeCache(uid, 'accounts', list);
    await writeThrough(uid, 'update', 'accounts', id, patch);
    return list[idx];
  },

  async remove(id) {
    const uid = requireUid();
    const list = readCache(uid, 'accounts', []);
    writeCache(uid, 'accounts', list.filter((a) => a.id !== id));
    await writeThrough(uid, 'remove', 'accounts', id, null);

    // 同步刪除底下交易，避免孤兒資料
    const txs = readCache(uid, 'transactions', []);
    const orphaned = txs.filter((t) => t.accountId === id);
    writeCache(uid, 'transactions', txs.filter((t) => t.accountId !== id));
    for (const t of orphaned) {
      await writeThrough(uid, 'remove', 'transactions', t.id, null);
    }
    return true;
  },
};

/* =====================================================================
   Categories
===================================================================== */
const categories = {
  async getAll() {
    const uid = requireUid();
    try {
      let list = await seedDefaultCategoriesIfNeeded(uid);
      let needFix = false;
      list = list.map((c) => {
        const fixed = fixIconName(c.icon);
        if (fixed !== c.icon) needFix = true;
        return { ...c, icon: fixed };
      });
      writeCache(uid, 'categories', list);
      if (needFix) {
        for (const c of list) {
          await writeThrough(uid, 'update', 'categories', c.id, { icon: c.icon });
        }
      }
      return list;
    } catch (e) {
      console.warn('讀取分類失敗，改用本機快取:', e);
      return readCache(uid, 'categories', []);
    }
  },

  async add({ name, type, icon }) {
    const uid = requireUid();
    const item = {
      id: genId(),
      name: name.trim(),
      type,
      icon: icon || 'scribble',
      isDefault: false,
    };
    const list = readCache(uid, 'categories', []);
    list.push(item);
    writeCache(uid, 'categories', list);
    await writeThrough(uid, 'set', 'categories', item.id, item);
    return item;
  },

  async remove(id) {
    const uid = requireUid();
    const list = readCache(uid, 'categories', []);
    writeCache(uid, 'categories', list.filter((c) => c.id !== id));
    await writeThrough(uid, 'remove', 'categories', id, null);
    return true;
  },
};

/* =====================================================================
   Transactions
===================================================================== */
const transactions = {
  async getAll() {
    const uid = requireUid();
    try {
      const list = await window.FirebaseApp.getCollection(uid, 'transactions');
      writeCache(uid, 'transactions', list);
      return list;
    } catch (e) {
      console.warn('讀取交易失敗，改用本機快取:', e);
      return readCache(uid, 'transactions', []);
    }
  },

  async add({ type, amount, categoryId, accountId, date, note }) {
    const uid = requireUid();
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
    const list = readCache(uid, 'transactions', []);
    list.push(item);
    writeCache(uid, 'transactions', list);
    await writeThrough(uid, 'set', 'transactions', item.id, item);
    return item;
  },

  async update(id, patch) {
    const uid = requireUid();
    const list = readCache(uid, 'transactions', []);
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const nextAmount = Number(patch.amount ?? list[idx].amount);
    const finalPatch = { ...patch, amount: nextAmount };
    list[idx] = { ...list[idx], ...finalPatch };
    writeCache(uid, 'transactions', list);
    await writeThrough(uid, 'update', 'transactions', id, finalPatch);
    return list[idx];
  },

  async remove(id) {
    const uid = requireUid();
    const list = readCache(uid, 'transactions', []);
    writeCache(uid, 'transactions', list.filter((t) => t.id !== id));
    await writeThrough(uid, 'remove', 'transactions', id, null);
    return true;
  },
};

/* =====================================================================
   Budgets — 以月份字串為文件 id，欄位存 amount
===================================================================== */
const budgets = {
  async get(monthKey) {
    const uid = requireUid();
    try {
      const list = await window.FirebaseApp.getCollection(uid, 'budgets');
      const cacheObj = {};
      list.forEach((b) => { cacheObj[b.id] = b.amount; });
      writeCache(uid, 'budgets', cacheObj);
      return cacheObj[monthKey] ?? null;
    } catch (e) {
      console.warn('讀取預算失敗，改用本機快取:', e);
      const cacheObj = readCache(uid, 'budgets', {});
      return cacheObj[monthKey] ?? null;
    }
  },

  async set(monthKey, amount) {
    const uid = requireUid();
    const value = Number(amount);
    const cacheObj = readCache(uid, 'budgets', {});
    cacheObj[monthKey] = value;
    writeCache(uid, 'budgets', cacheObj);
    await writeThrough(uid, 'set', 'budgets', monthKey, { amount: value });
    return value;
  },
};

/* =====================================================================
   匯出
===================================================================== */
window.DataStore = { accounts, categories, transactions, budgets };
window.SyncQueue = { pendingCount, flushQueue, trySyncNow };
