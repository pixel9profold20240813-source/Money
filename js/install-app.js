/* =====================================================================
   install-app.js — PWA 手動安裝按鈕
   ---------------------------------------------------------------------
   Chrome 在判定網站符合可安裝條件時，會觸發 'beforeinstallprompt' 事件。
   我們攔截這個事件、阻止瀏覽器自動跳出提示，把事件物件存起來，
   讓使用者點設定頁的按鈕時才主動呼叫安裝流程。

   三種狀態：
   - 'available'：可以安裝，顯示按鈕
   - 'installed'：已經是安裝後的 App 模式在執行，不需要再安裝
   - 'unsupported'：瀏覽器不支援此安裝方式（例如非 Chrome 系或已安裝過）
===================================================================== */

const InstallApp = {
  deferredEvent: null,
  status: 'unsupported',

  /** 判斷目前是否已經是「安裝後的 App」模式執行中 */
  _isRunningAsInstalledApp() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true; // iOS Safari 的標記（雖然主要支援 Android，順手相容）
  },

  init() {
    if (this._isRunningAsInstalledApp()) {
      this.status = 'installed';
      this._render();
      return;
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

  /** 點擊按鈕時呼叫：跳出系統安裝對話框 */
  async promptInstall() {
    if (!this.deferredEvent) {
      Utils.toast('目前無法安裝，請確認使用 Chrome 瀏覽器', 'danger');
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
    } else if (this.status === 'available') {
      mount.innerHTML = `<button class="btn full" id="installAppBtn">📲 安裝到主畫面</button>`;
      document.getElementById('installAppBtn').addEventListener('click', () => this.promptInstall());
    } else {
      mount.innerHTML = `<p class="install-hint">請用 Chrome 瀏覽器開啟此網頁才能安裝</p>`;
    }
  },
};

window.InstallApp = InstallApp;
InstallApp.init();
