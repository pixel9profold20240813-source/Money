/* =====================================================================
   ui-scale.js — 介面大小（zoom 縮放）管理
   ---------------------------------------------------------------------
   提供四個等級：normal(小) / medium(中) / large(大) / xlarge(特大)，
   存在 localStorage，跨登入帳號共用同一份裝置偏好設定
   （這是「這台裝置看起來多大」的偏好，不需要跟著雲端帳號走）。
===================================================================== */

const UI_SIZE_KEY = 'doodle_ledger_ui_size';
const UI_SIZE_CLASSES = ['ui-size-normal', 'ui-size-medium', 'ui-size-large', 'ui-size-xlarge'];
const UI_SIZE_DEFAULT = 'normal';

const UIScale = {
  current: UI_SIZE_DEFAULT,

  /** 套用指定等級到 <html>，並存入 localStorage */
  apply(size) {
    if (!['normal', 'medium', 'large', 'xlarge'].includes(size)) size = UI_SIZE_DEFAULT;
    this.current = size;
    const html = document.documentElement;
    UI_SIZE_CLASSES.forEach((c) => html.classList.remove(c));
    html.classList.add(`ui-size-${size}`);
    try { localStorage.setItem(UI_SIZE_KEY, size); } catch (e) { /* 忽略寫入失敗 */ }
    this._syncButtons();
  },

  /** 從 localStorage 讀取並套用（頁面載入時呼叫，越早呼叫越好，避免閃爍） */
  init() {
    let saved = UI_SIZE_DEFAULT;
    try { saved = localStorage.getItem(UI_SIZE_KEY) || UI_SIZE_DEFAULT; } catch (e) { /* 忽略 */ }
    this.apply(saved);
  },

  /** 更新設定頁按鈕的 active 狀態（若該畫面存在） */
  _syncButtons() {
    document.querySelectorAll('.size-opt').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.size === this.current);
    });
  },
};

window.UIScale = UIScale;
UIScale.init();

/* 設定頁按鈕的點擊綁定（用事件委派，避免設定頁尚未渲染時找不到元素） */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.size-opt');
  if (!btn) return;
  UIScale.apply(btn.dataset.size);
});
