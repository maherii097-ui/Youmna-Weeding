# موقع دعوة الزفاف — دليل التشغيل والتعديل

## البنية
```
index.html
style.css
script.js
config.js          ← كل البيانات القابلة للتعديل من هنا
assets/
  images/           ← الصور الأربع (hero, invitation, location, comments-bg)
  music/            ← ضع ملف الموسيقى هنا باسم song.mp3
```

## التعديل السريع (ملف config.js فقط)
- `groomName` / `brideName` — أسماء العروسين
- `weddingDateTime` — موعد العد التنازلي (لا يظهر كوقت في صفحة المكان، فقط يشغّل العداد)
- `googleMapsUrl` — رابط خرائط جوجل الذي يفتح عند الضغط على زر VIEW LOCATION
- `musicUrl` — مسار ملف الموسيقى (ضع الملف داخل assets/music)

## ملاحظات
- زر "VIEW LOCATION" منطقة شفافة موضوعة فوق الزر المرسوم داخل صورة المكان نفسها — لم تتم إضافة أي تصميم جديد فوق الصورة.
- ملفات Firebase (SDK) محمّلة محليًا من `assets/vendor/firebase/` بدل تحميلها من CDN خارجي (gstatic.com)، لتفادي حجبها من بعض المتصفحات/الإضافات (Ad-blockers أو Tracking Prevention) اللي بتمنع أي حاجة اسمها "firebase" أو "gstatic". لو حبيت تحدّث نسخة Firebase مستقبلًا، استبدل الملفين في نفس المجلد.
- خطوط Google Fonts لسه بتتحمّل من الإنترنت (لازم اتصال بالإنترنت لعرضها، لكنها مش سبب مشكلة الإرسال).

## المباركات (Firebase Realtime Database)
التعليقات **مشتركة بين كل الزوار** عبر Realtime Database (وليست محلية فقط):
- أي مباركة يكتبها أي زائر تظهر فورًا لدى كل الزوار الآخرين بدون تحديث الصفحة (عبر `on('child_added')`).
- تُخزَّن كل مباركة كعنصر داخل المسار `comments`، وتحتوي على `name` و`message` و`ts`.
- إعدادات Firebase موجودة في `config.js` ضمن `firebaseConfig` (بما فيها `databaseURL`).

### مهم جدًا — قواعد الأمان (Security Rules)
مفتاح الـ apiKey في إعدادات Firebase للواجهة الأمامية علني بطبيعته وهذا طبيعي تمامًا، لكن الحماية الفعلية تأتي من **قواعد Realtime Database** في Firebase Console. حاليًا القاعدة الافتراضية قد ترفض أي قراءة/كتابة بلا مصادقة، وده اللي بيخلي الإرسال يفضل معلّق بلا رد.
يُنصح بضبط القواعد من: Firebase Console → Realtime Database → Rules، بحيث:
- يُسمح بالقراءة للجميع (عرض المباركات).
- يُسمح بالكتابة فقط لبيانات تحتوي على `name` و`message` بطول محدود (مثلاً أقل من 300 حرف)، لمنع إساءة الاستخدام.

مثال مبسّط:
```json
{
  "rules": {
    "comments": {
      ".read": true,
      ".write": true,
      "$commentId": {
        ".validate": "newData.hasChildren(['name','message','ts']) && newData.child('message').val().length < 300 && newData.child('name').val().length < 40"
      }
    }
  }
}
```

### تأكيد إن Realtime Database شغّالة
من Firebase Console → Build → Realtime Database، تأكد إن فيه قاعدة بيانات متعملة فعلًا (مش Firestore) وإن الـ `databaseURL` في `config.js` مطابق للي في الـ Console.
