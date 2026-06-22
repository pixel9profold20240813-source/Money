/* =====================================================================
   AppState
   ---------------------------------------------------------------------
   集中管理記憶體中的當前資料快取，並提供「衍生計算」
   （帳戶餘額、本月支出、預算百分比...）。
   所有畫面渲染都讀這裡的 cache，不直接打 DataStore，
   這樣切換頁籤時不用每次重新讀 storage。
===================================================================== */

const AppState = {
  accounts: [],
  categories: [],
  transactions: [],
  currentBudget: null, // 當月預算金額（數字或 null）
  activeAccountId: 'all', // 'all' 代表「全部帳戶」檢視

  /** 啟動時或資料異動後呼叫，重新從 DataStore 載入到記憶體 */
  async reload() {
    const [accs, cats, txs, budget] = await Promise.all([
      DataStore.accounts.getAll(),
      DataStore.categories.getAll(),
      DataStore.transactions.getAll(),
      DataStore.budgets.get(Utils.currentMonthKey()),
    ]);
    this.accounts = accs;
    this.categories = cats;
    this.transactions = txs.sort((a, b) => (a.date < b.date ? 1 : -1));
    this.currentBudget = budget;
  },

  /** 取得分類物件 */
  getCategory(id) {
    return this.categories.find((c) => c.id === id) || null;
  },

  /** 取得帳戶物件 */
  getAccount(id) {
    return this.accounts.find((a) => a.id === id) || null;
  },

  /** 計算單一帳戶目前餘額：初始餘額 + 該帳戶所有收入 - 該帳戶所有支出 */
  accountBalance(accountId) {
    const acc = this.getAccount(accountId);
    if (!acc) return 0;
    let balance = acc.initialBalance;
    for (const t of this.transactions) {
      if (t.accountId !== accountId) continue;
      balance += t.type === 'income' ? t.amount : -t.amount;
    }
    return balance;
  },

  /** 所有帳戶餘額加總 */
  totalBalance() {
    return this.accounts.reduce((sum, a) => sum + this.accountBalance(a.id), 0);
  },

  /** 篩選交易：依目前選取的帳戶 (activeAccountId) + 可選的月份 */
  filteredTransactions({ monthKey = null } = {}) {
    return this.transactions.filter((t) => {
      if (this.activeAccountId !== 'all' && t.accountId !== this.activeAccountId) return false;
      if (monthKey && Utils.monthKeyOf(t.date) !== monthKey) return false;
      return true;
    });
  },

  /** 本月（依目前帳戶篩選）收入加總 */
  monthlyIncome(monthKey = Utils.currentMonthKey()) {
    return this.filteredTransactions({ monthKey })
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
  },

  /** 本月（依目前帳戶篩選）支出加總 */
  monthlyExpense(monthKey = Utils.currentMonthKey()) {
    return this.filteredTransactions({ monthKey })
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  },

  /** 預算使用狀況：{ amount, spent, remaining, percent, status } */
  budgetStatus() {
    const amount = this.currentBudget;
    const spent = this.monthlyExpense();
    if (amount === null || amount === undefined || amount <= 0) {
      return { amount: null, spent, remaining: null, percent: null, status: 'no-budget' };
    }
    const remaining = amount - spent;
    const percent = Math.round((spent / amount) * 100);
    let status = 'happy'; // 0-69%
    if (percent >= 100) status = 'over';
    else if (percent >= 90) status = 'sad'; // 90-99% 預警
    else if (percent >= 70) status = 'worried'; // 70-89%
    return { amount, spent, remaining, percent, status };
  },

  /** 依分類彙總本月支出，給圓餅圖用：[{ name, value, icon }] */
  expenseByCategory(monthKey = Utils.currentMonthKey()) {
    const map = new Map();
    for (const t of this.filteredTransactions({ monthKey })) {
      if (t.type !== 'expense') continue;
      const cat = this.getCategory(t.categoryId);
      const name = cat ? cat.name : '未分類';
      map.set(name, (map.get(name) || 0) + t.amount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  },

  /** 近 N 個月的收入/支出趨勢，給折線圖用 */
  trendByMonth(months = 6) {
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        monthKey: key,
        label: `${d.getMonth() + 1}月`,
        income: this.monthlyIncome(key),
        expense: this.monthlyExpense(key),
      });
    }
    return result;
  },
};

window.AppState = AppState;
