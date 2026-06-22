/* =====================================================================
   app.js — 啟動進入點
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

(async function init() {
  injectStaticIcons();
  Router.init();
  await Router.go('home');
})();
