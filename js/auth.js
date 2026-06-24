/* =====================================================================
   auth.js — 認證狀態管理
   ---------------------------------------------------------------------
   監聽 Firebase 登入狀態，把目前使用者資訊存在 window.AuthState，
   並控制登入畫面 / 主應用畫面的切換。
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

function showLoginScreen() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('appShell').hidden = true;
}

function showAppShell(user) {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('appShell').hidden = false;
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
