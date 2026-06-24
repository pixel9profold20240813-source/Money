/* =====================================================================
   Utils — 共用工具函式
===================================================================== */

const Utils = {
  /** 'YYYY-MM' 格式的當月 key */
  currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  /** 'YYYY-MM-DD' 格式的今天日期，用作表單預設值 */
  todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /** 取得某筆日期字串所屬的月份 key */
  monthKeyOf(dateStr) {
    return dateStr.slice(0, 7); // 'YYYY-MM-DD' -> 'YYYY-MM'
  },

  /** 貨幣格式化：1234.5 -> '1,234.5'；金額不補小數零 */
  formatMoney(num) {
    const n = Number(num) || 0;
    const rounded = Math.round(n * 100) / 100;
    return rounded.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
  },

  /** 把日期字串轉成「6月22日 (一)」這種手帳感顯示 */
  formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 (${weekDays[d.getDay()]})`;
  },

  /** 簡單防抖，給輸入框搜尋用 */
  debounce(fn, delay = 300) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /** 產生 toast 提示（蠟筆便利貼風格） */
  toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `doodle-toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    }, 2200);
  },

  /** 儲存成功的 toast；若目前處於離線/有待同步資料，自動附加提示文字 */
  toastSaved(message) {
    const offline = !navigator.onLine;
    this.toast(offline ? `${message}（離線中，將自動同步）` : message, offline ? 'info' : 'success');
  },
};

window.Utils = Utils;
