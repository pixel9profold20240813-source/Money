/* =====================================================================
   app.js — 啟動進入點
   ---------------------------------------------------------------------
   啟動流程：
   1. 注入靜態圖示（不需要等登入，立刻做）
   2. 等待 Firebase 認證狀態確定（AuthState.whenReady）
   3. 若已登入 -> 啟動 Router，渲染首頁
   4. 若尚未登入 -> 不啟動 Router（登入畫面已由 auth.js 顯示），
      改監聽 'auth-signed-in' 事件，等使用者登入成功後再啟動
===================================================================== */

function injectStaticIcons() {
  document.getElementById('titleIcon').innerHTML = Icons.pencil();
  document.getElementById('navIconHome').innerHTML = Icons.navHome();
  document.getElementById('navIconLedger').innerHTML = Icons.navLedger();
  document.getElementById('navIconStats').innerHTML = Icons.navStats();
  document.getElementById('navIconSettings').innerHTML = Icons.navSettings();
  document.getElementById('fabIcon').innerHTML = Icons.pencil();
  document.getElementById('txCloseIcon').innerHTML = Icons.close();
  document.getElementById('accCloseIcon').innerHTML = Icons.close();
  document.getElementById('catCloseIcon').innerHTML = Icons.close();
}

let appStarted = false;

async function startApp() {
  if (appStarted) {
    // 已經啟動過（例如登出又重新登入），重新刷新當前分頁即可
    await Router.go(Router.current || 'home');
    return;
  }
  appStarted = true;
  Router.init();
  await Router.go('home');
}

(async function init() {
  injectStaticIcons();

  await AuthState.whenReady();
  if (AuthState.uid) {
    await startApp();
  }
  // 尚未登入：什麼都不做，登入畫面已經顯示中

  window.addEventListener('auth-signed-in', () => { startApp(); });
  window.addEventListener('auth-signed-out', () => {
    appStarted = false; // 登出後重置，下次登入要重新初始化 Router
  });
})();
