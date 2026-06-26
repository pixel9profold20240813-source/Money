/* =====================================================================
   firebase-init.js — Firebase 初始化 (ES Module，透過 CDN 載入)
   ---------------------------------------------------------------------
   這個檔案必須用 <script type="module"> 載入。
   它會把需要的功能掛在 window.FirebaseApp 上，
   讓其他一般 <script> 檔案（非 module）也能透過 window 存取。
===================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 你的 Firebase 專案設定
const firebaseConfig = {
  apiKey: "AIzaSyDbuEFfwShoPrt4Oj7FhhlC1h5UkhowMTw",
  authDomain: "bookkeeping-9c6d7.firebaseapp.com",
  projectId: "bookkeeping-9c6d7",
  storageBucket: "bookkeeping-9c6d7.firebasestorage.app",
  messagingSenderId: "645332332768",
  appId: "1:645332332768:web:e6e24925b6b808337de085",
  measurementId: "G-S159ZQ01LH",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 啟用 Firestore 官方離線持久化（存在 IndexedDB）：
// 連線成功讀取過一次的資料，會自動快取在裝置上，
// 之後即使完全離線，讀取、新增、修改、刪除都能正常運作，
// 連線恢復後 SDK 會自動把離線時的異動同步回雲端。
// 這跟我們自己刻的 localStorage 快取是雙重保障，不會互相衝突。
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // 同一瀏覽器開了多個分頁/視窗時，只有一個能啟用持久化，這是正常情況
    console.warn('Firestore 離線持久化未啟用：偵測到多個開啟的分頁');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore 離線持久化未啟用：此瀏覽器不支援');
  } else {
    console.warn('Firestore 離線持久化啟用失敗:', err);
  }
});

/** 觸發 Google 登入彈窗 */
async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** 登出 */
async function logout() {
  await signOut(auth);
}

/** 監聽登入狀態變化，callback(user|null) */
function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/** 取得某使用者底下某個 collection 的所有文件 */
async function getCollection(uid, collectionName) {
  const colRef = collection(db, 'users', uid, collectionName);
  const snap = await getDocs(query(colRef));
  const result = [];
  snap.forEach((d) => result.push({ id: d.id, ...d.data() }));
  return result;
}

/** 寫入（新增或覆蓋）某個文件 */
async function setDocument(uid, collectionName, docId, data) {
  const ref = doc(db, 'users', uid, collectionName, docId);
  await setDoc(ref, data);
}

/** 局部更新某個文件 */
async function updateDocument(uid, collectionName, docId, patch) {
  const ref = doc(db, 'users', uid, collectionName, docId);
  await updateDoc(ref, patch);
}

/** 刪除某個文件 */
async function deleteDocument(uid, collectionName, docId) {
  const ref = doc(db, 'users', uid, collectionName, docId);
  await deleteDoc(ref);
}

window.FirebaseApp = {
  auth,
  db,
  loginWithGoogle,
  logout,
  watchAuthState,
  getCollection,
  setDocument,
  updateDocument,
  deleteDocument,
};

// 通知其他（非 module）script：Firebase 已經準備好了
window.dispatchEvent(new CustomEvent('firebase-ready'));
