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
