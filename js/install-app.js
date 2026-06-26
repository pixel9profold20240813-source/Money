/* =====================================================================
   install-app.js — 安裝成 App 的引導
   ---------------------------------------------------------------------
   兩種平台的安裝方式完全不同：
   - Android / Chrome 系：支援 'beforeinstallprompt' 事件，
     可以攔截下來改成自己的按鈕，點擊後跳出系統安裝對話框。
   - iOS（Safari，以及 iOS 上所有瀏覽器底層都是 WebKit）：
     完全沒有這個 API，必須由使用者手動「分享 → 加入主畫面」，
     所以改成顯示一份圖文教學，而不是顯示按鈕。

   四種狀態：
   - 'available'：Android/Chrome，可以安裝，顯示按鈕
   - 'installed'：已經是安裝後的 App 模式在執行
   - 'ios-manual'：iOS 裝置，顯示手動安裝教學
   - 'unsupported'：其他瀏覽器不支援（顯示診斷資訊協助排查）
===================================================================== */

const InstallApp = {
  deferredEvent: null,
  status: 'unsupported',

  /** 判斷目前是否已經是「安裝後的 App」模式執行中 */
  _isRunningAsInstalledApp() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true; // iOS Safari 的標記
  },

  /** 判斷是否為 iOS 裝置（iPhone / iPad / iPod，包含 iPadOS 偽裝成 Mac 的情況） */
  _isIOS() {
    const ua = navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ 預設 UA 會偽裝成 Macintosh，要靠多點觸控能力來判斷
    const isIPadOS13Plus = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isAppleDevice || isIPadOS13Plus;
  },

  init() {
    if (this._isRunningAsInstalledApp()) {
      this.status = 'installed';
      this._render();
      return;
    }

    if (this._isIOS()) {
      this.status = 'ios-manual';
      this._render();
      return; // iOS 不會有 beforeinstallprompt，不用註冊監聽
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // 擋掉瀏覽器自動跳出的提示
      this.deferredEvent = e;
      this.status = 'available';
      this._render();
    });

    window.addEventListener('appinstalled', () => {
      this.status = 'installed';
      this.deferredEvent = null;
      this._render();
      Utils.toast('安裝完成！可以到主畫面打開了', 'success');
    });

    this._render();
  },

  /** 點擊按鈕時呼叫：跳出系統安裝對話框（僅 Android/Chrome 適用） */
  async promptInstall() {
    if (!this.deferredEvent) {
      Utils.toast('目前無法安裝，請稍候再試一次', 'danger');
      return;
    }
    this.deferredEvent.prompt();
    const choice = await this.deferredEvent.userChoice;
    if (choice.outcome === 'accepted') {
      this.status = 'installed';
    }
    this.deferredEvent = null;
    this._render();
  },

  /** 依目前狀態更新設定頁按鈕區塊的顯示內容 */
  _render() {
    const mount = document.getElementById('installAppBlock');
    if (!mount) return;

    if (this.status === 'installed') {
      mount.innerHTML = `<p class="install-hint">已經安裝成 App 囉，可以從主畫面打開 🎉</p>`;
      return;
    }

    if (this.status === 'ios-manual') {
      mount.innerHTML = `
        <p class="install-hint">iPhone / iPad 請用以下步驟手動加入主畫面：</p>
        <ol class="install-steps">
          <li>確認是用 <b>Safari</b> 瀏覽器開啟這個網站（其他 App 內建瀏覽器不支援）</li>
          <li>點畫面下方（或上方網址列旁）的分享圖示 <span class="ios-share-icon">⬆️</span></li>
          <li>在選單中往下滑，點選「<b>加入主畫面</b>」</li>
          <li>點右上角「新增」，桌面就會出現圖示</li>
        </ol>`;
      return;
    }

    if (this.status === 'available') {
      mount.innerHTML = `<button class="btn full" id="installAppBtn">📲 安裝到主畫面</button>`;
      document.getElementById('installAppBtn').addEventListener('click', () => this.promptInstall());
      return;
    }

    // unsupported
    const swStatus = window.__swStatus || '尚未開始註冊';
    const isSecure = window.isSecureContext;
    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    mount.innerHTML = `
      <p class="install-hint">尚未偵測到可安裝的條件，請確認：</p>
      <ul class="install-checklist">
        <li>使用 Chrome 瀏覽器開啟（Android）</li>
        <li>網路連線正常（首次需連線載入）</li>
        <li>不是已經安裝過（可到桌面確認）</li>
      </ul>
      <button class="btn ghost sm" id="recheckInstallBtn">重新檢查</button>
      <details class="install-debug">
        <summary>診斷資訊（回報問題時可提供）</summary>
        <p>Service Worker：${swStatus}</p>
        <p>安全連線 (HTTPS)：${isSecure ? '是' : '否'}</p>
        <p>目前顯示模式為獨立 App：${displayModeStandalone ? '是' : '否'}</p>
        <p>瀏覽器資訊：${navigator.userAgent}</p>
      </details>`;
    const btn = document.getElementById('recheckInstallBtn');
    if (btn) btn.addEventListener('click', () => { this._render(); });
  },
};

window.InstallApp = InstallApp;
InstallApp.init();
