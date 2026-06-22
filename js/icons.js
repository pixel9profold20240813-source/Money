/* =====================================================================
   icons.js — 手繪線稿風 SVG 圖標庫
   ---------------------------------------------------------------------
   風格統一：24x24 viewBox，圓頭線條（stroke-linecap: round），
   故意保留些微不對稱與手抖路徑，呼應蠟筆手繪質感。
   顏色預設用 currentColor，外層用 CSS color 控制，
   少數需要強調色的圖示內建寫死的馬卡龍色塊。

   使用方式：Icons.foodIcon()  -> 回傳 SVG 字串，直接塞進 innerHTML
===================================================================== */

const Icons = {

  /* ---------------- 分類圖示：支出 ---------------- */

  food() { // 餐飲：碗+筷子
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 11.5c-.3 4 2.2 7.3 7.4 7.6 5.1.3 7.8-3 7.6-7.3" />
      <path d="M4.3 11.3C4 8 7.3 6 12 6.2c4.6.2 7.8 2.4 7.5 5.4" />
      <path d="M5 11.4h14.2" />
      <path d="M16.5 5.3c.6.4 1 1.3.6 2.4" />
      <path d="M18.4 4.8c.7.5 1.1 1.6.5 2.8" />
    </svg>`;
  },

  transport() { // 交通：公車外形
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 16.2V8.6C4.4 6 6.7 5 12 5c5.4 0 7.6 1 7.5 3.6v7.6" />
      <path d="M4.6 16.3h14.8" />
      <path d="M4.8 12.3h14.3" />
      <circle cx="7.6" cy="18.3" r="1.3" />
      <circle cx="16.3" cy="18.3" r="1.3" />
      <path d="M6.3 8.6h3.4M14 8.6h3.6" />
    </svg>`;
  },

  fun() { // 娛樂：調色盤
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4.3c-4.6-.2-7.8 3-7.6 7.5.2 4.3 3.4 7.7 8 7.7 1.1 0 1.7-.7 1.4-1.6-.3-.9.3-1.7 1.3-1.6 3 .2 5.3-2 5.3-5C20.4 6.8 16.8 4.5 12 4.3Z" />
      <circle cx="8.7" cy="9.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.4" cy="7.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="9.7" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="13.4" r="1" fill="currentColor" stroke="none" />
    </svg>`;
  },

  shopping() { // 購物：購物袋
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.2 8.3h11.7l1 11.2c.1.9-.6 1.6-1.5 1.6H6.6c-.9 0-1.6-.7-1.5-1.6Z" />
      <path d="M8.7 8.1V7c0-1.9 1.4-3.3 3.3-3.3s3.3 1.4 3.3 3.3v1.1" />
      <path d="M8.5 11c0 1.7 1.3 3 3.3 3.1 2 .1 3.5-1.3 3.4-3" />
    </svg>`;
  },

  home() { // 居家：房子
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.3 12.2 11.7 5c.2-.2.5-.2.7 0l7.3 7.1" />
      <path d="M6.3 10.8v7.4c0 .6.5 1.1 1.1 1.1h9.2c.6 0 1.1-.5 1.1-1.1v-7.5" />
      <path d="M10 19.2v-4.6c0-.5.4-.9 1-.9h2c.6 0 1 .4 1 .9v4.6" />
    </svg>`;
  },

  medical() { // 醫療：十字藥盒
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4.5" y="5.3" width="15" height="14" rx="2.6" />
      <path d="M12 9v6.2M8.9 12.1h6.2" />
    </svg>`;
  },

  scribble() { // 通用「其他」：一個塗鴉螺旋線
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 13.8c.3 2.7 2.6 4.6 5.4 4.4 3.4-.2 5.2-3 4.7-6-.4-2.4-2.6-3.9-4.8-3.4-1.7.4-2.7 2-2.3 3.5.4 1.4 2 2.1 3.2 1.5 1-.5 1.4-1.6.9-2.5" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>`;
  },

  /* ---------------- 分類圖示：收入 ---------------- */

  salary() { // 薪資：錢幣疊
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="12" cy="8.2" rx="7.2" ry="3.1" />
      <path d="M4.8 8.2v3.4c0 1.7 3.2 3.1 7.2 3.1s7.2-1.4 7.2-3.1V8.2" />
      <path d="M4.8 11.6V15c0 1.7 3.2 3.1 7.2 3.1s7.2-1.4 7.2-3.1v-3.4" />
      <path d="M9.8 8c.5-.6 1.3-.9 2.2-.9.9 0 1.7.3 2.2.9" />
    </svg>`;
  },

  bonus() { // 獎金：禮物盒
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4.3" y="10.1" width="15.4" height="9.2" rx="1.4" />
      <path d="M4.1 10.2h15.8M12 10v9.3" />
      <path d="M8.6 10c-1.7 0-2.8-1-2.6-2.2.2-1.2 1.6-1.8 2.7-1 .9.6 1.5 1.8 1.7 3.2" />
      <path d="M15.4 10c1.7 0 2.8-1 2.6-2.2-.2-1.2-1.6-1.8-2.7-1-1 .6-1.5 1.8-1.7 3.2" />
    </svg>`;
  },

  job() { // 兼職：手提箱/工具
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3.8" y="8.4" width="16.4" height="10.4" rx="1.8" />
      <path d="M8.6 8.4V6.7c0-.8.7-1.4 1.5-1.4h3.8c.8 0 1.5.6 1.5 1.4v1.7" />
      <path d="M3.9 13.2h16.2" />
      <path d="M10.7 13.1v1.6h2.6v-1.6" />
    </svg>`;
  },

  sparkle() { // 其他收入：星星閃光
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4.4c.3 2.8 1 5 2.3 6.5 1.4 1.5 3.4 2.2 5.4 2.3-2.8.3-4.9 1.1-6.3 2.5-1.4 1.4-2.1 3.3-2.3 5.7-.3-2.8-1-5-2.4-6.5-1.4-1.5-3.3-2.2-5.3-2.4 2.8-.3 4.8-1 6.2-2.4 1.4-1.4 2.1-3.3 2.4-5.7Z" />
    </svg>`;
  },

  /* ---------------- 介面圖示（底部導覽 / 標題） ---------------- */

  navHome() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.2 12 11.7 5c.2-.2.4-.2.6 0l7.5 7" />
      <path d="M6.2 10.6v7.6c0 .5.4.9.9.9h9.8c.5 0 .9-.4.9-.9v-7.7" />
    </svg>`;
  },

  navLedger() { // 記帳：筆記本
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.3 4.6h10.6c.9 0 1.6.7 1.6 1.6v12c0 .9-.7 1.6-1.6 1.6H6.4c-.9 0-1.5-.7-1.4-1.6L6.3 4.6Z" />
      <path d="M9 8.4h6M9 11.6h6M9 14.8h4" />
    </svg>`;
  },

  navStats() { // 統計：折線+長條
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 19.3V5.4" />
      <path d="M4.6 19.2h14.8" />
      <path d="M7 16.4v-3.6M11 16.4V9.2M15 16.4v-5.6M19 16.4V11" />
    </svg>`;
  },

  navSettings() { // 設定：齒輪
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.8v2.5M12 17.7v2.5M5.4 7.2l2.1 1.4M16.5 15.4l2.1 1.4M4 12.3h2.6M17.4 12.3H20M5.4 17.4l2.1-1.4M16.5 9.2l2.1-1.4" />
    </svg>`;
  },

  pencil() { // 新增 / 標題用：蠟筆/筆
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.4 17.6 5.3 20.7l3.2-1.1L18.9 9.2c.6-.6.6-1.6 0-2.3l-1-1c-.6-.6-1.6-.6-2.3 0L6.4 17.6Z" />
      <path d="M14.1 7.3l2.9 2.9" />
    </svg>`;
  },

  close() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M5.5 5.8 18.3 18.4M18.3 5.8 5.5 18.4" />
    </svg>`;
  },

  /* ---------------- 空狀態插畫（較大尺寸） ---------------- */

  emptyScribble() { // 空狀態：塗鴉雲朵+問號感
    return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 38c-4-2-5-8-1-11 1-6 8-9 13-6 4-5 12-5 16-1 6-1 11 4 9 9 4 2 4 8 0 10-2 1-4 1-6 1H19c-2 0-4 0-5-2Z" />
      <path d="M24 27c1-1 2-1 3 0M37 27c1-1 2-1 3 0" />
      <path d="M27 34c1.5 2 6 2 7.5 0" />
    </svg>`;
  },

  emptyLedger() { // 空狀態：空白筆記本+羽毛筆
    return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 12h26c2 0 4 2 4 4v32c0 2-2 4-4 4H17c-2 0-3-1.6-3.3-3.5L16 12Z" />
      <path d="M22 22h16M22 30h16M22 38h10" />
      <path d="M40 40l9-9 4 4-9 9-5 1 1-5Z" />
    </svg>`;
  },

  emptyBank() { // 空狀態：銀行/帳戶
    return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 26 32 14l22 12" />
      <path d="M13 26.5h38v22.5H13Z" />
      <path d="M20 30.5v14M30 30.5v14M40 30.5v14" />
      <path d="M10 49h44" />
    </svg>`;
  },

  emptyPie() { // 空狀態：手繪派
    return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="30" cy="32" r="16" />
      <path d="M30 16v16l13-9" />
      <path d="M44 24l5-3" />
    </svg>`;
  },

  /** 依名稱字串取得對應 icon 的 HTML，名稱不存在時回退 scribble */
  html(name) {
    const fn = this[name];
    return typeof fn === 'function' ? fn.call(this) : this.scribble();
  },

  /** 分類圖示選擇器可選的清單（名稱 + 顯示用標籤） */
  CATEGORY_ICON_CHOICES: [
    'food', 'transport', 'fun', 'shopping', 'home', 'medical',
    'salary', 'bonus', 'job', 'sparkle', 'scribble',
  ],
};

window.Icons = Icons;
