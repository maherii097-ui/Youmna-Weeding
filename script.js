/* ============================================================
   Vintage Royal Theater — Wedding Invitation
   script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c[تشخيص] الصفحة حمّلت، السكريبت بدأ يشتغل.', 'color:#c9a24b');
  console.log('[تشخيص] firebase معرّف؟', typeof firebase !== 'undefined');
  console.log('[تشخيص] SITE_CONFIG.db جاهز؟', !!SITE_CONFIG.db);

  // Fix viewport-height to a stable value to avoid image "zoom" when
  // mobile browser chrome (address/tool bars) hide or show during scroll.
  function setFixedVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    console.log('[تشخيص] --vh ثابت تم تعيينه إلى', vh);
  }

  // Set once on initial load. Update only on orientation change (not on scroll/resize)
  // to keep the layout stable while the user scrolls.
  setFixedVh();
  window.addEventListener('orientationchange', setFixedVh);

  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const enterBtn = document.getElementById('enterBtn');
  const body = document.body;

  function openSite() {
    body.classList.add('is-entered');
    if (welcomeOverlay) welcomeOverlay.setAttribute('aria-hidden', 'true');
    hasInteracted = true;
    playMusic();
  }

  let hasInteracted = false;
  let audio = null;
  let isPlaying = false;

  function playMusic() {
    if (!audio) return;
    if (!hasInteracted) return;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        isPlaying = true;
        if (musicBtn) {
          musicBtn.setAttribute('aria-pressed', 'true');
          musicBtn.setAttribute('aria-label', 'إيقاف الموسيقى');
          musicBtn.classList.remove('is-muted');
        }
      }).catch(() => {
        console.warn('تعذر تشغيل الموسيقى. تأكد من وجود الملف في: ' + SITE_CONFIG.musicUrl);
      });
    }
  }

  function pauseMusic() {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    if (musicBtn) {
      musicBtn.setAttribute('aria-pressed', 'false');
      musicBtn.setAttribute('aria-label', 'تشغيل الموسيقى');
      musicBtn.classList.add('is-muted');
    }
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      openSite();
    });
  }

  if (welcomeOverlay) {
    welcomeOverlay.addEventListener('click', (event) => {
      if (event.target === welcomeOverlay) {
        openSite();
      }
    });
  }

  /* ---------- 1) Inject config-driven data ---------- */
  document.getElementById('groomName').textContent = SITE_CONFIG.groomName;
  document.getElementById('brideName').textContent = SITE_CONFIG.brideName;
  document.getElementById('viewLocationBtn').href = SITE_CONFIG.googleMapsUrl;

  /* ---------- 2) Countdown ---------- */
  const target = new Date(SITE_CONFIG.weddingDateTime).getTime();
  const elDays = document.getElementById('cdDays');
  const elHours = document.getElementById('cdHours');
  const elMinutes = document.getElementById('cdMinutes');
  const elSeconds = document.getElementById('cdSeconds');

  function two(n){ return String(Math.max(n, 0)).padStart(2, '0'); }

  function tickCountdown(){
    const now = Date.now();
    let diff = target - now;
    if (diff < 0) diff = 0;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    elDays.textContent = two(days);
    elHours.textContent = two(hours);
    elMinutes.textContent = two(minutes);
    elSeconds.textContent = two(seconds);
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- 3) Music toggle ---------- */
  const musicBtn = document.getElementById('musicToggle');
  if (SITE_CONFIG.musicUrl) {
    audio = new Audio(SITE_CONFIG.musicUrl);
    audio.loop = true;
    audio.preload = 'auto';

    audio.addEventListener('canplaythrough', () => {
      console.log('تم تحميل الملف الصوتي بنجاح:', SITE_CONFIG.musicUrl);
    });

    audio.addEventListener('error', () => {
      console.warn('فشل تحميل الملف الصوتي:', SITE_CONFIG.musicUrl);
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      hasInteracted = true;
      if (!isPlaying) {
        playMusic();
      } else {
        pauseMusic();
      }
    });
  }

  if (audio) {
    audio.addEventListener('ended', () => {
      isPlaying = false;
      if (musicBtn) {
        musicBtn.setAttribute('aria-pressed', 'false');
        musicBtn.setAttribute('aria-label', 'تشغيل الموسيقى');
        musicBtn.classList.add('is-muted');
      }
    });
  }

  /* ---------- 4) Scroll reveal (Fade + Slide Up) ---------- */
  const revealTargets = document.querySelectorAll('.reveal-on-scroll');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  revealTargets.forEach(el => io.observe(el));

  /* ---------- 5) Comments (مباركات الأحبة) — مشتركة بين كل الزوار عبر Realtime Database ---------- */
  const form = document.getElementById('commentForm');
  const nameInput = document.getElementById('commentName');
  const messageInput = document.getElementById('commentMessage');
  const submitBtn = form.querySelector('.btn-submit');
  const statusEl = document.getElementById('commentStatus');
  const list = document.getElementById('commentsList');
  const commentsRef = SITE_CONFIG.db ? SITE_CONFIG.db.ref('comments') : null;

  function setStatus(text, type){
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.classList.remove('is-error', 'is-ok');
    if (type) statusEl.classList.add(type === 'error' ? 'is-error' : 'is-ok');
  }

  if (!commentsRef) {
    setStatus('تعذر الاتصال بـ Firebase — تأكد من صحة الإعدادات في config.js.', 'error');
  }

  const knownKeys = new Set();
  let initialLoadDone = false;

  function escapeHTML(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderEmptyState(){
    if (list.children.length === 0 && !document.getElementById('commentsEmpty')) {
      const empty = document.createElement('li');
      empty.className = 'comments-empty';
      empty.id = 'commentsEmpty';
      empty.textContent = 'كن أول من يكتب مباركة \u2728';
      list.appendChild(empty);
    }
  }

  function renderLoadErrorState(message){
    const existingEmpty = document.getElementById('commentsEmpty');
    if (existingEmpty) existingEmpty.remove();
    if (!document.getElementById('commentsLoadError')) {
      const errLi = document.createElement('li');
      errLi.className = 'comments-empty comments-load-error';
      errLi.id = 'commentsLoadError';
      errLi.textContent = message;
      list.appendChild(errLi);
    }
  }

  function removeEmptyState(){
    const empty = document.getElementById('commentsEmpty');
    if (empty) empty.remove();
    const loadError = document.getElementById('commentsLoadError');
    if (loadError) loadError.remove();
  }

  function addCommentToDOM(comment, { animate = true } = {}){
    removeEmptyState();
    const li = document.createElement('li');
    li.className = 'comment-card';
    if (!animate) {
      /* بدون أنيميشن: لازم نفرض الحالة النهائية يدويًا، لأن opacity:0 في الـ CSS
         الأساسي مش هيترفع لـ 1 غير لو الأنيميشن اشتغلت فعليًا */
      li.style.animation = 'none';
      li.style.opacity = '1';
      li.style.transform = 'none';
    }
    li.innerHTML =
      '<p class="comment-name">' + escapeHTML(comment.name) + '</p>' +
      '<p class="comment-text">' + escapeHTML(comment.message) + '</p>';
    list.insertBefore(li, list.firstChild);
  }

  if (commentsRef) {
    console.log('[تشخيص] بدأ الاستماع لمسار comments في Realtime Database...');
    /* كل مباركة جديدة تصل (من أي زائر) تظهر تلقائيًا أعلى القائمة لدى الجميع */
    commentsRef.orderByChild('ts').on('child_added', (snapshot) => {
      console.log('[تشخيص] child_added وصل — key:', snapshot.key, '| data:', snapshot.val());
      const key = snapshot.key;
      if (knownKeys.has(key)) return;
      knownKeys.add(key);
      addCommentToDOM(snapshot.val(), { animate: initialLoadDone });
    }, (err) => {
      console.error('[تشخيص] فشل تحميل المباركات ✘', err);
      if (err && err.code === 'PERMISSION_DENIED') {
        renderLoadErrorState('تعذر عرض المباركات — قواعد الأمان ترفض القراءة حاليًا.');
        setStatus('قواعد الأمان في Realtime Database ترفض القراءة حاليًا. راجع Firebase Console → Realtime Database → Rules (تأكد إن ".read": true مش بس ".write": true).', 'error');
      } else {
        renderLoadErrorState('تعذر تحميل المباركات (' + (err && err.code ? err.code : 'خطأ غير معروف') + ').');
        setStatus('تعذر تحميل المباركات (' + (err && err.code ? err.code : 'خطأ غير معروف') + ').', 'error');
      }
    });

    commentsRef.orderByChild('ts').once('value', (snapshot) => {
      console.log('[تشخيص] once(value) رجع، عدد العناصر:', snapshot.numChildren());
      initialLoadDone = true;
      renderEmptyState();
    }, (err) => {
      console.error('[تشخيص] once(value) فشل ✘', err);
    });

    commentsRef.on('value', (snapshot) => {
      console.log('[تشخيص] on(value) رجع، exists؟', snapshot.exists(), '| عدد العناصر:', snapshot.numChildren());
      if (!snapshot.exists()) renderEmptyState();
    }, (err) => {
      console.error('[تشخيص] on(value) فشل ✘', err);
    });
  } else {
    renderEmptyState();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('%c[تشخيص] تم الضغط على إرسال المباركة.', 'color:#c9a24b');
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    console.log('[تشخيص] الاسم:', name, '| الرسالة:', message, '| commentsRef موجود؟', !!commentsRef);
    if (!name || !message) {
      console.log('[تشخيص] توقف: الاسم أو الرسالة فاضيين.');
      return;
    }

    if (!commentsRef) {
      setStatus('تعذر الاتصال بـ Firebase — تأكد من صحة الإعدادات في config.js.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'جارِ الإرسال...';
    setStatus('', null);
    console.log('[تشخيص] جاري إرسال البيانات لـ Realtime Database...');

    const hangWarning = setTimeout(() => {
      console.warn('[تشخيص] الطلب مستني من أكتر من 8 ثواني من غير رد — راجع قواعد الأمان في Realtime Database، أو الشبكة بتمنع الوصول لـ firebaseio.com.');
      setStatus('الطلب واخد وقت أطول من الطبيعي… تأكد من قواعد الأمان في Firebase Console.', 'error');
    }, 8000);

    commentsRef.push({ name, message, ts: Date.now() })
      .then(() => {
        clearTimeout(hangWarning);
        console.log('%c[تشخيص] تم الإرسال بنجاح ✔', 'color:#7CFC00');
        form.reset();
        nameInput.focus();
        setStatus('تم إرسال مباركتك \u2728', 'ok');
        setTimeout(() => setStatus('', null), 4000);
      })
      .catch((err) => {
        clearTimeout(hangWarning);
        console.error('[تشخيص] فشل الإرسال ✘', err);
        if (err && err.code === 'PERMISSION_DENIED') {
          setStatus('قواعد الأمان في Realtime Database ترفض الكتابة حاليًا. راجع Firebase Console → Realtime Database → Rules.', 'error');
        } else {
          setStatus('تعذر إرسال المباركة (' + (err && err.code ? err.code : 'خطأ غير معروف') + ').', 'error');
        }
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'إرسال المباركة';
      });
  });

});
