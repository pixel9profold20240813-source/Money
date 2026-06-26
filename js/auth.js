/* =====================================================================
   auth.js — 認證狀態管理
   ---------------------------------------------------------------------
   監聽 Firebase 登入狀態，把目前使用者資訊存在 window.AuthState，
   並控制「載入中 / 登入 / 主應用」三個畫面之間的切換。

   流程：
   1. 頁面載入時預設顯示「載入中」畫面（HTML 裡已經設定好）。
   2. Firebase 確認登入狀態後（無論有沒有登入），才切到對應畫面，
      避免使用者在驗證期間誤以為自己尚未登入而看到登入畫面閃現。

   注意：所有畫面切換同時設定 hidden 屬性與 inline style.display，
   不依賴 CSS 選擇器優先級的競爭，確保切換一定會立即生效。
===================================================================== */

const AuthState = {
  uid: null,
  user: null, // { displayName, email, photoURL }
  ready: false, // Firebase 是否已完成初次狀態檢查

  /** 回傳一個 Promise，等待登入狀態確定（無論登入或未登入） */
  whenReady() {
    if (this.ready) return Promise.resolve();
    return new Promise((resolve) => {
      this._readyResolvers = this._readyResolvers || [];
      this._readyResolvers.push(resolve);
    });
  },

  _markReady() {
    this.ready = true;
    (this._readyResolvers || []).forEach((fn) => fn());
    this._readyResolvers = [];
  },
};

window.AuthState = AuthState;

function hideLoadingScreen() {
  const loadingEl = document.getElementById('loadingScreen');
  if (!loadingEl) return;
  loadingEl.hidden = true;
  loadingEl.style.setProperty('display', 'none', 'important');
}

function showLoginScreen() {
  hideLoadingScreen();
  const loginEl = document.getElementById('loginScreen');
  const shellEl = document.getElementById('appShell');
  loginEl.hidden = false;
  loginEl.style.setProperty('display', 'flex', 'important');
  shellEl.hidden = true;
  shellEl.style.setProperty('display', 'none', 'important');
}

function showAppShell(user) {
  hideLoadingScreen();
  const loginEl = document.getElementById('loginScreen');
  const shellEl = document.getElementById('appShell');
  loginEl.hidden = true;
  loginEl.style.setProperty('display', 'none', 'important');
  shellEl.hidden = false;
  shellEl.style.setProperty('display', 'block', 'important');
  const nameEl = document.getElementById('userDisplayName');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = user.displayName || user.email || '';
  if (avatarEl && user.photoURL) {
    avatarEl.src = user.photoURL;
    avatarEl.style.display = 'inline-block';
  }
}

/** 初始化認證監聽，必須等 firebase-init.js 觸發 'firebase-ready' 後才能呼叫 */
function initAuthWatcher() {
  window.FirebaseApp.watchAuthState(async (user) => {
    if (user) {
      AuthState.uid = user.uid;
      AuthState.user = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      showAppShell(AuthState.user);
      AuthState._markReady();
      // 通知 app.js：登入狀態確定且是「已登入」，可以啟動/刷新主畫面
      window.dispatchEvent(new CustomEvent('auth-signed-in'));
      if (window.SyncQueue) window.SyncQueue.trySyncNow();
    } else {
      AuthState.uid = null;
      AuthState.user = null;
      showLoginScreen();
      AuthState._markReady();
      window.dispatchEvent(new CustomEvent('auth-signed-out'));
    }
  });
}

if (window.FirebaseApp) {
  initAuthWatcher();
} else {
  window.addEventListener('firebase-ready', initAuthWatcher, { once: true });
}

/* 保險機制：若 6 秒後登入狀態仍未確定（例如 Firebase 初始化失敗、
   網路問題導致 SDK 載入不完整），改顯示登入畫面，
   避免使用者永遠卡在「載入中」畫面看不到任何內容 */
setTimeout(() => {
  if (!AuthState.ready) {
    console.warn('登入狀態確認逾時，改顯示登入畫面');
    showLoginScreen();
  }
}, 6000);

/* ---------------------------------------------------------------------
   登入 / 登出按鈕事件
--------------------------------------------------------------------- */
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
  const btn = document.getElementById('googleLoginBtn');
  btn.disabled = true;
  btn.textContent = '登入中…';
  try {
    await window.FirebaseApp.loginWithGoogle();
  } catch (e) {
    console.error('登入失敗:', e);
    const msg = document.getElementById('loginError');
    if (msg) {
      msg.textContent = '登入失敗，請再試一次。';
      msg.hidden = false;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '使用 Google 帳號登入';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (!confirm('確定要登出嗎？')) return;
  await window.FirebaseApp.logout();
});
