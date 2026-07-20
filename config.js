/* ============================================================
   ملف الإعدادات — كل البيانات القابلة للتعديل من هنا فقط
   Config File — edit every piece of dynamic data from this one place
   ============================================================ */

const SITE_CONFIG = {

  /* أسماء العروسين — Groom & Bride names */
  groomName: "Youmna1",
  brideName: "Ebrahim",

  /* موعد الزفاف (يُستخدم للعد التنازلي فقط — لا يظهر كوقت في صفحة المكان)
     Wedding date & time — used ONLY to power the countdown timer.
     Format: "YYYY-MM-DDTHH:MM:SS" */
  weddingDateTime: "2026-08-30T19:00:00",

  /* رابط خرائط جوجل لصفحة المكان — Google Maps link for the location button */
  googleMapsUrl: "https://maps.app.goo.gl/qGXXbu6fGJ53B4uR8",

  /* رابط ملف الموسيقى — Background music file path */
  musicUrl: "assets/bk.mp3",

  /* نص الدعوة (مرجعي/لذوي الإعاقة البصرية فقط — النص الأساسي مرسوم داخل الصورة)
     Invitation copy — kept here for editability & accessibility (screen readers).
     The visible text already lives inside the invitation image itself. */
  invitationText: {
    en: [
      "AS MUSIC FILLS THE AIR",
      "AND OUR HEARTS BECOME ONE.",
      "WE INVITE YOU TO",
      "CELEBRATE THE BEGINNING OF",
      "OUR GREATEST ADVENTURE"
    ],
    ar: "كل عاشق وله ألحان، وهذه ليلتنا"
  },

  /* بيانات صفحة المكان (مرجعية فقط — موجودة أصلاً داخل الصورة) */
  location: {
    hallName: "Hall Acacia",
    date: "30/8",
    address: "أول قاعة شمال الكوبري"
  },

  /* إعدادات Firebase — تُستخدم لتخزين مباركات الأحبة ومشاركتها بين كل الزوار
     Firebase config — powers the shared (public) comments/blessings wall */
  firebaseConfig: {
    apiKey: "AIzaSyAEQbYRt4JN_5QXqN6s94BqmZ4zAEqAsN0",
    authDomain: "fared26.firebaseapp.com",
    databaseURL: "https://fared26-default-rtdb.firebaseio.com",
    projectId: "fared26",
    storageBucket: "fared26.firebasestorage.app",
    messagingSenderId: "791798109040",
    appId: "1:791798109040:web:eee66dc2d2acb001a235b5",
    measurementId: "G-1EB89J1PNM"
  }
};

/* تهيئة Firebase — تشغّل تلقائيًا عند تحميل الصفحة (Realtime Database لتخزين المباركات) */
if (typeof firebase !== "undefined") {
  firebase.initializeApp(SITE_CONFIG.firebaseConfig);
  SITE_CONFIG.db = firebase.database();
}
