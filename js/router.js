/* =====================================================================
   Router — 單頁應用的分頁切換
===================================================================== */

const Router = {
  current: 'home',

  views: {
    home: document.getElementById('view-home'),
    ledger: document.getElementById('view-ledger'),
    stats: document.getElementById('view-stats'),
    settings: document.getElementById('view-settings'),
  },

  navBtns: document.querySelectorAll('.nav-btn'),

  /** 切換到指定分頁，並呼叫對應的 render 函式刷新內容 */
  async go(name) {
    if (!this.views[name]) return;
    this.current = name;

    Object.entries(this.views).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
    this.navBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.nav === name);
    });

    // 進入分頁時刷新對應內容
    if (name === 'home' && window.renderHome) await window.renderHome();
    if (name === 'ledger' && window.renderLedger) await window.renderLedger();
    if (name === 'stats' && window.renderStats) await window.renderStats();
    if (name === 'settings' && window.renderSettings) await window.renderSettings();
  },

  init() {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => this.go(el.dataset.nav));
    });
  },
};

window.Router = Router;
