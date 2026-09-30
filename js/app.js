/* =========================================================================
   app.js — واجهة التطبيق: الحالة، الحفظ، العرض، والأحداث
   يعتمد على: StudyData (data.js) و Scheduler (scheduler.js) و SortableJS (اختياري)
   ========================================================================= */
(function () {
  'use strict';

  const D = window.StudyData;
  const S = window.Scheduler;
  const STORAGE_KEY = 'study-notebook-v1';
  const THEME_KEY = 'study-notebook-theme';
  const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const KIND_LABELS = { study: 'مذاكرة', review: 'مراجعة نهائية', spaced: 'مراجعة متباعدة', quick: 'مراجعة سريعة' };
  const VIEWS = ['dashboard', 'subjects', 'schedule', 'plans', 'questions', 'curriculum', 'help'];
  const COLOR_COUNT = 8;

  // ===================== أدوات عامة =====================
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const today = () => S.todayLocal();
  const pad = (n) => String(n).padStart(2, '0');

  // تخزين آمن: قد يُمنع الوصول للتخزين في بعض المتصفحات أو الوضع الخاص
  const storage = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    remove(k) { try { window.localStorage.removeItem(k); } catch (e) { /* تجاهل */ } }
  };

  // تنسيق التواريخ (أرقام لاتينية لسهولة القراءة)
  function toDate(str) { return new Date(str + 'T12:00:00'); }
  function fmtDate(str, opts) {
    try { return new Intl.DateTimeFormat('ar-u-nu-latn', opts || { weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(str)); }
    catch (e) { return str; }
  }
  function fmtHijri(str) {
    try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(toDate(str)); }
    catch (e) { return ''; }
  }
  function daysWord(n) {
    if (n === 1) return 'يوم واحد';
    if (n === 2) return 'يومان';
    return n + (n >= 3 && n <= 10 ? ' أيام' : ' يوماً');
  }
  function daysLeftLabel(n) {
    if (n == null) return 'بلا تاريخ';
    if (n < 0) return 'انتهى';
    if (n === 0) return 'اليوم';
    if (n === 1) return 'غداً';
    return 'بعد ' + daysWord(n);
  }
  function fmtClock(mins) {
    const m = ((Math.round(mins) % 1440) + 1440) % 1440;
    return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  }

  // ===================== الحالة والحفظ =====================
  function defaultSettings() {
    return { dailyHours: 4, sessionMinutes: 50, breakMinutes: 10, reviewDays: 2, restDays: [], spacedReview: true, activeTime: 'evening', startTime: '' };
  }

  function makeChapter(title, pages, topics, bank) {
    const ch = { id: uid('ch'), title: String(title || '').trim() || 'شابتر بلا عنوان', pages: Number(pages) > 0 ? Number(pages) : 0, done: false, inExam: true, topics: topics || [], questions: [] };
    if (bank) ch.bank = bank;
    return ch;
  }

  // أسئلة البنك المكتوبة (مع الإجابات) لشابتر مرتبط ببنك
  function bankQuestions(c) {
    const list = (c.bank && D.QUESTION_BANK && D.QUESTION_BANK[c.bank]) || [];
    return list.filter((b) => !c.questions.some((q) => q.text === b.text))
      .map((b) => ({ id: uid('q'), text: b.text, type: b.type, status: 'todo', answer: b.answer || '', lecture: !!b.lecture, generated: false, fromBank: true }));
  }

  function nextColor(subjects) {
    const used = subjects.map((s) => s.colorIndex);
    for (let i = 0; i < COLOR_COUNT; i++) if (!used.includes(i)) return i;
    return subjects.length % COLOR_COUNT;
  }

  function makeSubject(f, subjects) {
    return {
      id: uid('sub'),
      name: String(f.name || '').trim(),
      code: String(f.code || '').trim(),
      teacher: String(f.teacher || '').trim(),
      difficulty: D.DIFFICULTY_LABELS[f.difficulty] ? f.difficulty : 'medium',
      type: D.TYPE_LABELS[f.type] ? f.type : 'understand',
      source: D.SOURCE_LABELS[f.source] ? f.source : 'book',
      examDate: S.parseDate(f.examDate) ? f.examDate : '',
      colorIndex: nextColor(subjects),
      suggested: !!f.suggested,
      chapters: f.chapters || []
    };
  }

  function courseChapters(code) {
    const suggested = D.SUGGESTED_CHAPTERS[code] || [];
    return suggested.map((c) => {
      const ch = makeChapter(c.title, 0, c.topics, c.bank);
      ch.questions = bankQuestions(ch);
      return ch;
    });
  }

  function subjectFromCourse(course, subjects) {
    const suggested = D.SUGGESTED_CHAPTERS[course.code];
    const sub = makeSubject({
      name: course.name, code: course.code, difficulty: course.difficulty, type: course.type,
      source: course.type === 'language' || course.type === 'memorize' ? 'notes' : 'book',
      suggested: !!suggested,
      chapters: courseChapters(course.code)
    }, subjects);
    sub.contentVersion = (D.COURSE_CONTENT_VERSION || {})[course.code] || 1;
    if (sub.contentVersion > 1) sub.suggested = false; // شابترات من محاضرة الطالبة وليست مقترحة
    return sub;
  }

  function createInitialState() {
    const st = {
      version: 1, settings: defaultSettings(), subjects: [], sessions: [], warnings: [],
      generatedAt: null, dirty: false, focusMinutes: 0,
      ui: { view: 'dashboard', weekOffset: 0, qSubject: '', qStatus: 'all', qType: 'all' }
    };
    const level1 = D.STUDY_PLAN.levels[0];
    level1.courses.forEach((c) => st.subjects.push(subjectFromCourse(c, st.subjects)));
    return st;
  }

  // التحقق من البيانات المحمّلة أو المستوردة وإكمال الناقص
  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.subjects)) throw new Error('بنية الملف غير صحيحة: لا توجد قائمة مواد.');
    const st = createInitialState();
    st.subjects = [];
    st.settings = Object.assign(defaultSettings(), raw.settings || {});
    raw.subjects.forEach((s) => {
      if (!s || typeof s !== 'object') return;
      const sub = makeSubject(s, st.subjects);
      if (s.id) sub.id = String(s.id);
      if (Number.isInteger(s.colorIndex)) sub.colorIndex = s.colorIndex % COLOR_COUNT;
      if (s.demoDate) sub.demoDate = true;
      sub.contentVersion = Number(s.contentVersion) || 1;
      sub.contentDismissed = Number(s.contentDismissed) || 0;
      sub.chapters = (Array.isArray(s.chapters) ? s.chapters : []).map((c) => {
        const ch = makeChapter(c && c.title, c && c.pages, Array.isArray(c && c.topics) ? c.topics : [], c && c.bank);
        if (c && c.id) ch.id = String(c.id);
        ch.done = !!(c && c.done);
        ch.inExam = !(c && c.inExam === false);
        ch.questions = (Array.isArray(c && c.questions) ? c.questions : []).filter((q) => q && q.text).map((q) => ({
          id: q.id ? String(q.id) : uid('q'), text: String(q.text),
          type: D.QUESTION_TYPES[q.type] ? q.type : 'essay',
          status: D.QUESTION_STATUS[q.status] ? q.status : 'todo', generated: !!q.generated,
          answer: q.answer ? String(q.answer) : '', lecture: !!q.lecture, fromBank: !!q.fromBank
        }));
        return ch;
      });
      st.subjects.push(sub);
    });
    const ids = new Set(st.subjects.map((s) => s.id));
    st.sessions = (Array.isArray(raw.sessions) ? raw.sessions : [])
      .filter((s) => s && ids.has(s.subjectId) && S.parseDate(s.date) && KIND_LABELS[s.kind])
      .map((s) => Object.assign({ chapterIds: [], part: 1, parts: 1, minutes: 50, done: false, manual: false }, s, { slot: Math.max(0, Number(s.slot) || 0) }));
    st.warnings = Array.isArray(raw.warnings) ? raw.warnings.filter((w) => w && w.message) : [];
    st.generatedAt = raw.generatedAt || null;
    st.dirty = !!raw.dirty;
    st.focusMinutes = Number(raw.focusMinutes) || 0;
    st.inExamAsked = !!raw.inExamAsked;
    st.ui = Object.assign(st.ui, raw.ui || {});
    return st;
  }

  function loadState() {
    const txt = storage.get(STORAGE_KEY);
    if (!txt) return createInitialState();
    try { return normalizeState(JSON.parse(txt)); }
    catch (e) { return createInitialState(); }
  }

  let state = loadState();
  let storageWarned = false;

  function save() {
    const ok = storage.set(STORAGE_KEY, JSON.stringify(state));
    if (!ok && !storageWarned) {
      storageWarned = true;
      toast('تعذّر الحفظ في المتصفح (قد يكون الوضع الخاص مفعّلاً). صدّر بياناتك من «كيفية الاستخدام» لتحتفظ بها.');
    }
  }
  function commit() { save(); render(); }

  // ===================== استعلامات مساعدة =====================
  const subjectById = (id) => state.subjects.find((s) => s.id === id);
  const colorOf = (sub) => 'var(--c' + ((sub && sub.colorIndex) || 0) % COLOR_COUNT + ')';
  const daysLeft = (sub) => (sub.examDate ? S.diffDays(today(), sub.examDate) : null);

  // ترتيب المواد: القادمة حسب الأقرب، ثم بلا تاريخ، ثم المنتهية
  function sortedSubjects() {
    const rank = (s) => { const d = daysLeft(s); return d == null ? 1 : d < 0 ? 2 : 0; };
    return state.subjects.slice().sort((a, b) => rank(a) - rank(b) || (a.examDate || '').localeCompare(b.examDate || '') || a.name.localeCompare(b.name, 'ar'));
  }

  function effectiveSettings() { return S.normalizeSettings(state.settings, []); }
  function startMinutes() {
    const t = state.settings.startTime || (D.ACTIVE_TIMES[state.settings.activeTime] || D.ACTIVE_TIMES.evening).start;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  function slotRange(slot) {
    const cfg = effectiveSettings();
    const start = startMinutes() + slot * (cfg.sessionMinutes + cfg.breakMinutes);
    return [fmtClock(start), fmtClock(start + cfg.sessionMinutes)];
  }

  const chapterPct = (ch) => S.chapterProgress(ch, state.sessions);
  const examChapters = (sub) => S.examChapters(sub);
  function subjectPct(sub) {
    const list = examChapters(sub);
    if (!list.length) return 0;
    return Math.round(list.reduce((a, c) => a + chapterPct(c), 0) / list.length);
  }
  const isOverdue = (s) => !s.done && s.date < today();
  const sessionTitle = (s) => S.describeSession(s, subjectById(s.subjectId));

  function stats() {
    const chapters = state.subjects.flatMap((s) => examChapters(s));
    const questions = state.subjects.flatMap((s) => s.chapters).flatMap((c) => c.questions);
    const done = state.sessions.filter((s) => s.done);
    return {
      chaptersDone: chapters.filter((c) => chapterPct(c) === 100).length,
      chaptersTotal: chapters.length,
      studyMinutes: done.reduce((a, s) => a + (Number(s.minutes) || 0), 0),
      focusMinutes: state.focusMinutes,
      qDone: questions.filter((q) => q.status === 'done').length,
      qReview: questions.filter((q) => q.status === 'review').length,
      qTotal: questions.length,
      sessionsDone: done.length,
      sessionsTotal: state.sessions.length,
      overdue: state.sessions.filter(isOverdue)
    };
  }

  // ===================== مكوّنات عرض صغيرة =====================
  function urgencyChip(sub) {
    const d = daysLeft(sub);
    const u = S.examUrgency(d);
    const cls = { red: 'chip-red', orange: 'chip-orange', green: 'chip-green', past: 'chip-past', none: '' }[u];
    return `<span class="chip ${cls}">${esc(daysLeftLabel(d))}</span>`;
  }
  function countdownBox(sub) {
    const d = daysLeft(sub);
    const u = S.examUrgency(d);
    if (d == null) return `<div class="countdown u-none"><b>—</b><small>بلا تاريخ</small></div>`;
    if (d < 0) return `<div class="countdown u-past"><b>✓</b><small>انتهى</small></div>`;
    return `<div class="countdown u-${u}"><b>${d}</b><small>${d === 0 ? 'اليوم' : d === 1 ? 'يوم' : d <= 10 ? 'أيام' : 'يوماً'}</small></div>`;
  }
  function progressBar(pct, small) {
    return `<div class="progress${small ? ' sm' : ''}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
  }
  function optionList(map, selected) {
    return Object.entries(map).map(([v, l]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${esc(l)}</option>`).join('');
  }

  // ===================== التوجيه بين التبويبات =====================
  function setView(view) {
    if (!VIEWS.includes(view)) view = 'dashboard';
    state.ui.view = view;
    save();
    render();
    try { history.replaceState(null, '', '#' + view); } catch (e) { /* تجاهل */ }
    window.scrollTo({ top: 0 });
  }

  function render() {
    const view = state.ui.view;
    $$('[data-view-panel]').forEach((el) => { el.hidden = el.dataset.viewPanel !== view; });
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === view)));
    const renderers = { dashboard: renderDashboard, subjects: renderSubjects, schedule: renderSchedule, plans: renderPlans, questions: renderQuestions, curriculum: renderCurriculum, help: renderHelp };
    renderers[view]();
    const plan = D.STUDY_PLAN;
    $('#brand-sub').textContent = plan.major + ' · ' + plan.university;
  }

  // سؤال لمرة واحدة: من علّم الشابترات قبل وجود خيار «مقرر في الاختبار» قد يقصد به المقرر
  function inExamBanner() {
    if (state.inExamAsked || !state.subjects.some((s) => s.chapters.some((c) => c.done))) return '';
    return `<div class="alert alert-warn"><div class="alert-head"><span>ماذا تعني علامة ✓ التي وضعتها على الشابترات؟</span></div>
      <p>علامة ✓ في العمود الأول تعني «أنهيت مذاكرته»، لذلك استبعدها الجدول. الآن يوجد عمود مستقل باسم «مقرر» للشابترات المطلوبة في الاختبار.</p>
      <div class="btn-row"><button class="btn btn-sm btn-primary" data-action="convert-inexam">كانت تعني المقرر في الاختبار: حوّلها وأعد توليد الجدول</button>
      <button class="btn btn-sm" data-action="keep-done">كانت تعني أني أنهيت مذاكرتها</button></div></div>`;
  }

  // تحديث شابترات مقرر (مثل فيزياء 1) من شرائح المحاضرة للبيانات المحفوظة سابقاً
  function contentUpdates() {
    const versions = D.COURSE_CONTENT_VERSION || {};
    return state.subjects.filter((s) => versions[s.code] && (s.contentVersion || 1) < versions[s.code] && (s.contentDismissed || 0) < versions[s.code]);
  }
  function contentBanner() {
    return contentUpdates().map((s) => {
      const chs = D.SUGGESTED_CHAPTERS[s.code];
      const qn = chs.reduce((a, c) => a + ((D.QUESTION_BANK[c.bank] || []).length), 0);
      return `<div class="alert alert-info"><div class="alert-head"><span>شابترات «${esc(s.name)}» من شرائح محاضرتك جاهزة</span></div>
        <p>${chs.length} شابترات (${esc(chs.map((c) => c.title.split(' — ')[0]).join('، '))}) مع ${qn} سؤالاً مكتوبة بإجاباتها. ستحل محل الشابترات المقترحة، وتُحدد كلها «مقررة» في الاختبار.</p>
        <div class="btn-row"><button class="btn btn-sm btn-primary" data-action="apply-content" data-sid="${s.id}">استبدل الشابترات وأضف الأسئلة</button>
        <button class="btn btn-sm" data-action="dismiss-content" data-sid="${s.id}">لاحقاً</button></div></div>`;
    }).join('');
  }
  function applyContent(sid) {
    const s = subjectById(sid);
    if (!s) return;
    const oldIds = new Set(s.chapters.map((c) => c.id));
    s.chapters = courseChapters(s.code);
    s.contentVersion = D.COURSE_CONTENT_VERSION[s.code];
    s.suggested = false;
    const hadSessions = state.sessions.some((x) => x.subjectId === s.id && !x.done);
    state.sessions = state.sessions.filter((x) => x.subjectId !== s.id || x.done || !x.chapterIds.some((id) => oldIds.has(id)));
    state.ui.qSubject = s.id;
    const qn = s.chapters.reduce((a, c) => a + c.questions.length, 0);
    toast(`حُدّثت «${s.name}»: ${s.chapters.length} شابترات و${qn} سؤالاً.`);
    if (hadSessions && s.examDate) { generate(true); setView('questions'); return; }
    markDirty();
    setView('questions');
  }

  function convertInExam() {
    state.subjects.forEach((s) => {
      if (!s.chapters.some((c) => c.done)) return;
      s.chapters.forEach((c) => { c.inExam = c.done; c.done = false; });
    });
    state.inExamAsked = true;
    toast('صارت الشابترات المحددة هي المقررة في الاختبار.');
    generate(true);
  }

  // ===================== الرئيسية =====================
  function renderDashboard() {
    const st = stats();
    const upcoming = sortedSubjects().filter((s) => daysLeft(s) != null && daysLeft(s) >= 0);
    const hasDates = state.subjects.some((s) => s.examDate);

    // بطاقة البداية
    let onboard = '';
    if (!state.subjects.length) {
      onboard = `<div class="onboard"><h3>ابدأ بإضافة موادك</h3><p>أضف مادة يدوياً أو استورد مواد مستوى من خطتك الجامعية.</p>
        <div class="btn-row"><button class="btn btn-primary" data-action="new-subject">+ إضافة مادة</button><button class="btn" data-action="goto" data-view="curriculum">خطتي الجامعية</button></div></div>`;
    } else if (!hasDates) {
      onboard = `<div class="onboard"><h3>خطوتك التالية: تواريخ الاختبارات</h3>
        <p>أضفت لك مواد المستوى الأول من خطتك (${state.subjects.length} مواد) مع شابترات مقترحة. أدخل تاريخ كل اختبار ثم ولّد الجدول.</p>
        <ol><li>افتح «المواد» واختر تاريخ الاختبار لكل مادة.</li><li>راجع الشابترات وعدّلها لتطابق منهجك.</li><li>من «الجدول» اضبط ساعاتك واضغط «توليد الجدول».</li></ol>
        <div class="btn-row"><button class="btn btn-primary" data-action="goto" data-view="subjects">أدخل تواريخ الاختبارات</button>
        <button class="btn" data-action="demo-dates">جرّب بتواريخ تجريبية</button></div></div>`;
    } else if (!state.sessions.length) {
      onboard = `<div class="onboard"><h3>التواريخ جاهزة، ولّد جدولك</h3><p>سيوزع التطبيق الشابترات على الأيام المتبقية ويحجز يومين للمراجعة قبل كل اختبار.</p>
        <div class="btn-row"><button class="btn btn-primary" data-action="generate">توليد الجدول</button><button class="btn" data-action="goto" data-view="schedule">إعدادات الجدول</button></div></div>`;
    }
    if (state.subjects.some((s) => s.demoDate)) {
      onboard += `<div class="alert alert-warn"><div class="alert-head"><span>بعض التواريخ تجريبية</span><button class="btn btn-sm" data-action="clear-demo">امسح التواريخ التجريبية</button></div><p>استبدلها بتواريخ اختباراتك الحقيقية من تبويب المواد.</p></div>`;
    }
    $('#dash-onboard').innerHTML = contentBanner() + inExamBanner() + onboard;

    // الإحصائيات
    const hours = (st.studyMinutes / 60);
    $('#dash-stats').innerHTML = `
      <div class="stat"><span class="stat-label">الشابترات المنجزة</span><span class="stat-value">${st.chaptersDone}<small> / ${st.chaptersTotal}</small></span><span class="stat-foot">${st.chaptersTotal ? Math.round(100 * st.chaptersDone / st.chaptersTotal) : 0}% من المنهج</span></div>
      <div class="stat"><span class="stat-label">ساعات المذاكرة</span><span class="stat-value">${hours.toFixed(hours % 1 ? 1 : 0)}<small> س</small></span><span class="stat-foot">${st.focusMinutes ? 'و' + Math.round(st.focusMinutes) + ' دقيقة بالمؤقت' : 'من الجلسات المنجزة'}</span></div>
      <div class="stat"><span class="stat-label">الأسئلة المحلولة</span><span class="stat-value">${st.qDone}<small> / ${st.qTotal}</small></span><span class="stat-foot">${st.qReview} تحتاج مراجعة</span></div>
      <div class="stat"><span class="stat-label">الجلسات المنجزة</span><span class="stat-value">${st.sessionsDone}<small> / ${st.sessionsTotal}</small></span><span class="stat-foot">${st.overdue.length ? `<span style="color:var(--red)">${st.overdue.length} متأخرة</span>` : 'لا توجد جلسات متأخرة'}</span></div>`;

    // جلسات اليوم
    const t = today();
    const todays = state.sessions.filter((s) => s.date === t).sort((a, b) => a.slot - b.slot);
    $('#dash-today').innerHTML = `<div class="panel-title"><h3>مهام اليوم</h3><span class="muted">${esc(fmtDate(t))}</span></div>` +
      (todays.length ? `<ul class="task-list">${todays.map(taskItem).join('')}</ul>`
        : `<p class="empty">${state.sessions.length ? 'لا جلسات اليوم. استرح أو راجع أسئلتك المتوقعة.' : 'لا يوجد جدول بعد.'}</p>`);

    // العد التنازلي
    $('#dash-exams').innerHTML = `<div class="panel-title"><h3>الاختبارات القادمة</h3><button class="btn btn-sm btn-ghost" data-action="goto" data-view="subjects">كل المواد</button></div>` +
      (upcoming.length ? `<ul class="exam-list">${upcoming.map((s) => `
        <li class="exam-item">${countdownBox(s)}<div><strong>${esc(s.name)}</strong>${s.demoDate ? ' <span class="chip">تجريبي</span>' : ''}<div class="task-meta">${esc(fmtDate(s.examDate))} · ${esc(fmtHijri(s.examDate))}</div></div></li>`).join('')}</ul>`
        : `<p class="empty">لم تُدخل تواريخ اختبارات قادمة.</p>`);

    // المتأخرات
    $('#dash-overdue').innerHTML = st.overdue.length ? overdueAlert(st.overdue) : '';

    // التقدم لكل مادة
    $('#dash-progress').innerHTML = `<div class="panel-title"><h3>التقدم في المواد</h3></div>` + (state.subjects.length ? sortedSubjects().map((s) => {
      const pct = subjectPct(s);
      const qs = s.chapters.flatMap((c) => c.questions);
      const qd = qs.filter((q) => q.status === 'done').length;
      return `<div class="progress-line" style="--subject-color:${colorOf(s)}"><span><b style="color:${colorOf(s)}">●</b> ${esc(s.name)}</span><span class="num">${pct}%</span>${progressBar(pct)}<span class="task-meta">الأسئلة: ${qd} / ${qs.length}</span></div>`;
    }).join('') : '<p class="empty">لا توجد مواد.</p>');

    renderTimer();
    renderTimes();
  }

  function taskItem(s) {
    const sub = subjectById(s.subjectId);
    const [a, b] = slotRange(s.slot);
    return `<li class="task${s.done ? ' done' : ''}" style="--subject-color:${colorOf(sub)}">
      <input type="checkbox" data-action="toggle-session" data-id="${s.id}" ${s.done ? 'checked' : ''} aria-label="تمت الجلسة">
      <div><div class="task-title">${esc(sub ? sub.name : '')}: ${esc(sessionTitle(s))}</div><div class="task-meta num">${a}–${b} · ${KIND_LABELS[s.kind]}</div></div>
      <button class="icon-btn" data-action="open-session" data-id="${s.id}" aria-label="تفاصيل الجلسة">⋯</button></li>`;
  }

  function overdueAlert(list) {
    const items = list.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5).map((s) => {
      const sub = subjectById(s.subjectId);
      return `<li>${esc(fmtDate(s.date, { day: 'numeric', month: 'long' }))}: ${esc(sub ? sub.name : '')} — ${esc(sessionTitle(s))} <button class="btn btn-sm" data-action="toggle-session" data-id="${s.id}">تمت</button></li>`;
    }).join('');
    return `<div class="alert alert-error"><div class="alert-head"><span>لديك ${list.length} ${list.length === 1 ? 'جلسة متأخرة' : 'جلسات متأخرة'}</span>
      <button class="btn btn-sm btn-primary" data-action="generate">أعد توليد الجدول لتوزيعها</button></div>
      <ul>${items}</ul>${list.length > 5 ? `<p class="task-meta">و${list.length - 5} غيرها.</p>` : ''}</div>`;
  }

  // ===== اقتراح أوقات المذاكرة المثالية =====
  function renderTimes() {
    const act = D.ACTIVE_TIMES[state.settings.activeTime] || D.ACTIVE_TIMES.evening;
    const hard = state.subjects.filter((s) => s.difficulty === 'hard' || s.type === 'math').map((s) => s.name);
    const memo = state.subjects.filter((s) => s.type === 'memorize' || s.type === 'language').map((s) => s.name);
    const cfg = effectiveSettings();
    const [first] = slotRange(0);
    const [, last] = slotRange(cfg.slotsPerDay - 1);
    $('#dash-times').innerHTML = `<h3>أوقات المذاكرة المقترحة</h3>
      <p class="muted">أنت <b>${esc(act.label)}</b> النشاط. يومك الدراسي: <span class="num">${first}–${last}</span> (${cfg.slotsPerDay} ${cfg.slotsPerDay === 1 ? 'جلسة' : cfg.slotsPerDay === 2 ? 'جلستان' : 'جلسات'} × ${cfg.sessionMinutes} د).</p>
      <ul class="tips">
        <li>ذروة تركيزك ${esc(act.peak)}: خصصها للمواد الصعبة${hard.length ? ' (' + esc(hard.join('، ')) + ')' : ''}. الجدول يضعها في أول فترات اليوم.</li>
        <li>${esc(act.light)}: مناسب للحفظ والمراجعة الخفيفة${memo.length ? ' (' + esc(memo.join('، ')) + ')' : ''}.</li>
        <li>راجع المحفوظات قبل النوم مباشرة؛ النوم يثبّت الذاكرة.</li>
        <li>تجنّب المذاكرة الثقيلة بعد وجبة كبيرة مباشرة، وابدأ بعدها بمراجعة خفيفة.</li>
      </ul>
      <button class="btn btn-sm" data-action="goto" data-view="schedule">غيّر وقت النشاط</button>`;
  }

  // ===== مؤقت بومودورو =====
  const timer = { phase: 'focus', remaining: null, running: false, endAt: 0, handle: null };
  function timerLengths() {
    const cfg = effectiveSettings();
    return { focus: cfg.sessionMinutes * 60, rest: Math.max(1, cfg.breakMinutes || 5) * 60 };
  }
  function renderTimer() {
    const el = $('#dash-timer');
    if (!el) return;
    const len = timerLengths();
    if (timer.remaining == null) timer.remaining = len.focus;
    const r = Math.max(0, Math.ceil(timer.remaining));
    el.innerHTML = `<div class="timer"><div class="panel-title"><h3>مؤقت المذاكرة</h3><span class="chip ${timer.phase === 'focus' ? 'chip-accent' : 'chip-orange'}">${timer.phase === 'focus' ? 'تركيز' : 'راحة'}</span></div>
      <div class="timer-face" id="timer-face" aria-live="off">${pad(Math.floor(r / 60))}:${pad(r % 60)}</div>
      <div class="timer-phase">${timer.phase === 'focus' ? 'أغلق الإشعارات وركّز على مهمة واحدة' : 'ابتعد عن الشاشة وتحرك قليلاً'}</div>
      <div class="btn-row"><button class="btn btn-primary btn-sm" data-action="timer-toggle">${timer.running ? 'إيقاف مؤقت' : 'ابدأ'}</button>
      <button class="btn btn-sm" data-action="timer-reset">إعادة</button><button class="btn btn-sm btn-ghost" data-action="timer-skip">تخطٍّ</button></div></div>`;
  }
  function timerTick() {
    timer.remaining = (timer.endAt - Date.now()) / 1000;
    if (timer.remaining <= 0) {
      const len = timerLengths();
      if (timer.phase === 'focus') {
        state.focusMinutes += len.focus / 60;
        save();
        toast('أحسنت! انتهت جلسة التركيز، خذ راحة.');
        timer.phase = 'rest'; timer.remaining = len.rest;
      } else {
        toast('انتهت الراحة، لنبدأ جلسة جديدة.');
        timer.phase = 'focus'; timer.remaining = len.focus;
      }
      timer.endAt = Date.now() + timer.remaining * 1000;
      if (state.ui.view === 'dashboard') renderDashboard();
      return;
    }
    const face = $('#timer-face');
    if (face) { const r = Math.ceil(timer.remaining); face.textContent = pad(Math.floor(r / 60)) + ':' + pad(r % 60); }
  }
  function timerToggle() {
    if (timer.running) {
      clearInterval(timer.handle); timer.running = false;
      timer.remaining = (timer.endAt - Date.now()) / 1000;
    } else {
      if (timer.remaining == null) timer.remaining = timerLengths().focus;
      timer.endAt = Date.now() + timer.remaining * 1000;
      timer.running = true;
      timer.handle = setInterval(timerTick, 500);
    }
    renderTimer();
  }
  function timerReset() {
    clearInterval(timer.handle);
    Object.assign(timer, { phase: 'focus', remaining: timerLengths().focus, running: false });
    renderTimer();
  }
  function timerSkip() {
    const len = timerLengths();
    timer.phase = timer.phase === 'focus' ? 'rest' : 'focus';
    timer.remaining = timer.phase === 'focus' ? len.focus : len.rest;
    timer.endAt = Date.now() + timer.remaining * 1000;
    renderTimer();
  }

  // ===================== المواد =====================
  function renderSubjects() {
    const list = sortedSubjects();
    $('#subjects-list').innerHTML = contentBanner() + inExamBanner() + (list.length ? list.map(subjectCard).join('')
      : `<div class="empty">لا توجد مواد بعد. اضغط «إضافة مادة» أو استورد مواد من «خطتي الجامعية».</div>`);
  }

  function subjectCard(s) {
    const pct = subjectPct(s);
    const d = daysLeft(s);
    return `<article class="subject-card" style="--subject-color:${colorOf(s)}" id="subject-${s.id}">
      <header>
        <div>
          <div class="subject-title"><h3>${esc(s.name)}</h3>${s.code ? `<span class="subject-code">${esc(s.code)}</span>` : ''}</div>
          <div class="subject-meta">
            ${urgencyChip(s)}
            <span class="chip">${esc(D.DIFFICULTY_LABELS[s.difficulty])}</span>
            <span class="chip">${esc(D.TYPE_LABELS[s.type])}</span>
            <span class="chip">${esc(D.SOURCE_LABELS[s.source])}</span>
            ${s.teacher ? `<span class="chip">المدرس: ${esc(s.teacher)}</span>` : ''}
          </div>
        </div>
        <div class="subject-actions">
          <button class="icon-btn" data-action="edit-subject" data-sid="${s.id}" aria-label="تعديل المادة" title="تعديل">✎</button>
          <button class="icon-btn danger" data-action="delete-subject" data-sid="${s.id}" aria-label="حذف المادة" title="حذف">🗑</button>
        </div>
      </header>
      <div class="subject-body">
        <div class="exam-box">
          <label class="field"><span>تاريخ الاختبار</span>
            <input type="date" id="exam-${s.id}" data-bind="examDate" data-sid="${s.id}" value="${esc(s.examDate)}"></label>
          ${s.examDate ? `<div class="hijri">${esc(fmtDate(s.examDate))}<br>${esc(fmtHijri(s.examDate))}${s.demoDate ? ' · <b>تاريخ تجريبي</b>' : ''}</div>` : '<div class="hijri">اختر التاريخ لتدخل المادة الجدول.</div>'}
          ${d != null && d < 0 ? '<div class="hijri">انتهى الاختبار؛ لن تُجدول المادة.</div>' : ''}
          ${s.chapters.length ? examScopeField(s) : ''}
          <div class="progress-line"><span class="task-meta">إنجاز المادة</span><span class="num">${pct}%</span>${progressBar(pct)}</div>
        </div>
        <div>
          ${s.suggested ? `<p class="suggested-note">الشابترات مقترحة من توصيف المقرر المعتاد. عدّل العناوين وأضف عدد الصفحات لتطابق منهجك. <button class="btn btn-sm btn-ghost" data-action="dismiss-suggested" data-sid="${s.id}">فهمت</button></p>` : ''}
          ${s.chapters.length ? `<div class="chapter-head"><span title="أنهيت مذاكرته">أنهيت</span><span>الشابتر</span><span title="مقرر في الاختبار">مقرر</span><span>الصفحات</span><span>الإنجاز</span><span></span></div>
          <ul class="chapter-list">${s.chapters.map((c) => chapterRow(s, c)).join('')}</ul>`
            : '<p class="empty">لا توجد شابترات. المادة بلا شابترات تُجدول لها مراجعة عامة فقط.</p>'}
          <form class="btn-row" data-form="add-chapter" data-sid="${s.id}" style="margin-top:8px">
            <input class="input" style="flex:1 1 180px" id="newch-${s.id}" name="title" placeholder="عنوان شابتر جديد" aria-label="عنوان شابتر جديد">
            <input class="input" style="width:90px" id="newpg-${s.id}" name="pages" type="number" min="0" placeholder="صفحات" aria-label="عدد الصفحات">
            <button class="btn btn-sm" type="submit">+ شابتر</button>
          </form>
        </div>
      </div>
    </article>`;
  }

  // «الاختبار يشمل حتى الشابتر...»: اختصار لتحديد المقرر بسرعة (مثل اختبارات منتصف الفصل)
  function examScopeField(s) {
    const flags = s.chapters.map((c) => c.inExam !== false);
    const n = flags.lastIndexOf(true);
    const prefix = n >= 0 && flags.every((f, i) => f === (i <= n));
    const value = !prefix ? 'custom' : n === flags.length - 1 ? 'all' : String(n);
    const opts = s.chapters.slice(0, -1).map((c, i) => `<option value="${i}"${value === String(i) ? ' selected' : ''}>حتى: ${esc(c.title)}</option>`).join('');
    return `<label class="field"><span>الاختبار يشمل</span><select id="scope-${s.id}" data-bind="exam-scope" data-sid="${s.id}">
      <option value="all"${value === 'all' ? ' selected' : ''}>كل الشابترات (${s.chapters.length})</option>${opts}
      ${value === 'custom' ? `<option value="custom" selected>اختيار مخصص (${flags.filter(Boolean).length})</option>` : ''}</select></label>`;
  }

  function chapterRow(s, c) {
    const pct = chapterPct(c);
    return `<li class="chapter-row${c.inExam === false ? ' not-in-exam' : ''}">
      <input type="checkbox" data-bind="chapter-done" data-sid="${s.id}" data-cid="${c.id}" ${c.done ? 'checked' : ''} aria-label="أنهيت مذاكرة الشابتر" title="أنهيت مذاكرته">
      <input class="input" data-bind="chapter-title" data-sid="${s.id}" data-cid="${c.id}" id="cht-${c.id}" value="${esc(c.title)}" aria-label="عنوان الشابتر">
      <input type="checkbox" data-bind="chapter-inexam" data-sid="${s.id}" data-cid="${c.id}" ${c.inExam !== false ? 'checked' : ''} aria-label="مقرر في الاختبار" title="مقرر في الاختبار">
      <input class="input pages" type="number" min="0" data-bind="chapter-pages" data-sid="${s.id}" data-cid="${c.id}" id="chp-${c.id}" value="${c.pages || ''}" placeholder="—" aria-label="عدد الصفحات">
      <div><div class="chapter-pct">${pct}%</div>${progressBar(pct, true)}</div>
      <button class="icon-btn danger" data-action="delete-chapter" data-sid="${s.id}" data-cid="${c.id}" aria-label="حذف الشابتر">✕</button>
    </li>`;
  }

  // نموذج إضافة/تعديل مادة
  function openSubjectForm(sid) {
    const s = sid ? subjectById(sid) : null;
    const v = s || { name: '', code: '', teacher: '', difficulty: 'medium', type: 'understand', source: 'book', examDate: '' };
    openModal(s ? 'تعديل المادة' : 'إضافة مادة', `
      <form id="subject-form" class="form-grid" autocomplete="off" novalidate>
        <label class="field field-wide"><span>اسم المادة *</span><input id="f-name" name="name" required value="${esc(v.name)}" placeholder="مثال: فيزياء (1)"></label>
        <label class="field"><span>رمز المادة</span><input id="f-code" name="code" value="${esc(v.code)}" placeholder="PHYS 103" dir="ltr"></label>
        <label class="field"><span>اسم المدرس (اختياري)</span><input id="f-teacher" name="teacher" value="${esc(v.teacher)}"></label>
        <label class="field"><span>مستوى الصعوبة</span><select id="f-difficulty" name="difficulty">${optionList(D.DIFFICULTY_LABELS, v.difficulty)}</select></label>
        <label class="field"><span>نوع المادة</span><select id="f-type" name="type">${optionList(D.TYPE_LABELS, v.type)}</select></label>
        <label class="field"><span>مصدر المنهج</span><select id="f-source" name="source">${optionList(D.SOURCE_LABELS, v.source)}</select></label>
        <label class="field"><span>تاريخ الاختبار</span><input id="f-exam" name="examDate" type="date" value="${esc(v.examDate)}"></label>
        ${s ? '' : `
        <label class="field"><span>عدد الشابترات</span><input id="f-count" name="count" type="number" min="0" max="60" placeholder="اختياري"></label>
        <label class="field field-wide"><span>أسماء الشابترات (سطر لكل شابتر، والصفحات بعد |)</span>
          <textarea id="f-chapters" name="chapters" rows="5" placeholder="الحركة في بعد واحد | 22&#10;المتجهات | 18&#10;قوانين نيوتن"></textarea>
          <span class="hint">إن تركتها فارغة وكتبت العدد، ستُنشأ شابترات باسم «الشابتر 1، 2...». يمكنك تعديلها لاحقاً من بطاقة المادة.</span></label>`}
        <p class="hint field-wide" id="f-error" role="alert"></p>
        <div class="modal-actions field-wide"><button type="submit" class="btn btn-primary">${s ? 'حفظ التعديلات' : 'إضافة المادة'}</button><button type="button" class="btn" data-action="close-modal">إلغاء</button></div>
      </form>`);
    const form = $('#subject-form');
    $('#f-name').focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form).entries());
      if (!String(f.name || '').trim()) { $('#f-error').textContent = 'اكتب اسم المادة.'; $('#f-name').focus(); return; }
      if (s) {
        const changed = s.difficulty !== f.difficulty || s.examDate !== f.examDate;
        Object.assign(s, {
          name: f.name.trim(), code: (f.code || '').trim(), teacher: (f.teacher || '').trim(),
          difficulty: f.difficulty, type: f.type, source: f.source, examDate: f.examDate || ''
        });
        if (changed) { s.demoDate = false; markDirty(); }
        toast('حُفظت تعديلات «' + s.name + '».');
      } else {
        const chapters = parseChapterLines(f.chapters || '', Number(f.count) || 0);
        const sub = makeSubject(Object.assign({}, f, { chapters }), state.subjects);
        state.subjects.push(sub);
        markDirty();
        toast('أُضيفت «' + sub.name + '» مع ' + chapters.length + ' شابتر.');
      }
      closeModal();
      commit();
    });
  }

  // تحويل النص إلى شابترات: "العنوان | الصفحات"
  function parseChapterLines(text, count) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const chapters = lines.map((l) => {
      const [title, pages] = l.split('|').map((x) => x.trim());
      return makeChapter(title, parseInt(pages, 10) || 0);
    });
    for (let i = chapters.length; i < Math.min(count, 60); i++) chapters.push(makeChapter('الشابتر ' + (i + 1)));
    return chapters;
  }

  function markDirty() { if (state.sessions.length) state.dirty = true; }

  function deleteSubject(sid) {
    const s = subjectById(sid);
    if (!s) return;
    confirmDialog(`حذف «${s.name}» مع شابتراتها وأسئلتها وجلساتها من الجدول؟ لا يمكن التراجع.`, 'احذف المادة', () => {
      state.subjects = state.subjects.filter((x) => x.id !== sid);
      state.sessions = state.sessions.filter((x) => x.subjectId !== sid);
      toast('حُذفت المادة.');
      commit();
    });
  }

  function deleteChapter(sid, cid) {
    const s = subjectById(sid);
    const c = s && s.chapters.find((x) => x.id === cid);
    if (!c) return;
    const doIt = () => {
      s.chapters = s.chapters.filter((x) => x.id !== cid);
      state.sessions = state.sessions.filter((x) => {
        if (x.subjectId !== sid || !x.chapterIds.includes(cid)) return true;
        x.chapterIds = x.chapterIds.filter((id) => id !== cid);
        return x.done || x.chapterIds.length > 0 || x.kind !== 'study';
      });
      markDirty();
      commit();
    };
    if (c.questions.length) confirmDialog(`للشابتر «${c.title}» ${c.questions.length} سؤال ستُحذف معه. متابعة؟`, 'احذف الشابتر', doIt);
    else doIt();
  }

  // ===================== الجدول =====================
  function weekDays() {
    const t = today();
    const start = S.addDays(t, -S.weekday(t) + (state.ui.weekOffset || 0) * 7);
    return Array.from({ length: 7 }, (_, i) => S.addDays(start, i));
  }

  function renderSchedule() {
    syncSettingsForm();
    // التنبيهات
    const groups = { error: [], warn: [], info: [] };
    state.warnings.forEach((w) => (groups[w.level] || groups.info).push(w.message));
    let html = inExamBanner();
    const overdue = state.sessions.filter(isOverdue);
    if (!state.sessions.length) {
      html += `<div class="alert alert-info"><div class="alert-head"><span>لم يُولَّد الجدول بعد</span><button class="btn btn-sm btn-primary" data-action="generate">توليد الجدول</button></div>
        <p>أدخل تواريخ الاختبارات في تبويب المواد، ثم اضبط الإعدادات أعلاه واضغط «توليد الجدول».</p></div>`;
    }
    if (state.dirty && state.sessions.length) {
      html += `<div class="alert alert-info"><div class="alert-head"><span>تغيّرت المواد أو الإعدادات بعد آخر توليد</span><button class="btn btn-sm btn-primary" data-action="generate">أعد التوليد</button></div></div>`;
    }
    if (overdue.length) html += overdueAlert(overdue);
    const box = (lvl, title, items) => items.length ? `<div class="alert alert-${lvl}"><div class="alert-head"><span>${title}</span></div><ul>${items.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : '';
    html += box('error', 'تنبيهات عاجلة', groups.error) + box('warn', 'تنبيهات', groups.warn) + box('info', 'ملاحظات', groups.info);
    $('#schedule-warnings').innerHTML = `<div class="warn-list">${html}</div>`;

    // الشبكة الأسبوعية
    const days = weekDays();
    const t = today();
    const cfg = effectiveSettings();
    const weekSessions = state.sessions.filter((s) => s.date >= days[0] && s.date <= days[6]);
    const rows = Math.max(cfg.slotsPerDay, ...weekSessions.map((s) => s.slot + 1));
    const exams = {};
    state.subjects.forEach((s) => { if (s.examDate) (exams[s.examDate] = exams[s.examDate] || []).push(s); });
    const rest = new Set(cfg.restDays);

    let g = '<div class="wg-corner"></div>';
    days.forEach((d) => {
      const cls = [d === t ? 'is-today' : '', rest.has(S.weekday(d)) ? 'is-rest' : ''].join(' ');
      g += `<div class="wg-day ${cls}"><span class="d-name">${WEEKDAYS[S.weekday(d)]}</span><span class="d-date">${esc(fmtDate(d, { day: 'numeric', month: 'short' }))}</span>
        ${(exams[d] || []).map((s) => `<span class="wg-exam">اختبار ${esc(s.name)}</span>`).join('')}</div>`;
    });
    for (let slot = 0; slot < rows; slot++) {
      const [a, b] = slotRange(slot);
      g += `<div class="wg-time"><b>الفترة ${slot + 1}</b><span>${a}</span><span>${b}</span></div>`;
      days.forEach((d) => {
        const here = weekSessions.filter((s) => s.date === d && s.slot === slot);
        g += `<div class="wg-cell${rest.has(S.weekday(d)) ? ' is-rest' : ''}" data-date="${d}" data-slot="${slot}">${here.map(sessionCard).join('')}</div>`;
      });
    }
    const grid = $('#schedule-grid');
    grid.innerHTML = g;
    $('#week-label').textContent = fmtDate(days[0], { day: 'numeric', month: 'long' }) + ' – ' + fmtDate(days[6], { day: 'numeric', month: 'long', year: 'numeric' });
    enableDragDrop(grid);
  }

  function sessionCard(s) {
    const sub = subjectById(s.subjectId);
    const od = isOverdue(s);
    return `<div class="session kind-${s.kind}${s.done ? ' is-done' : ''}${od ? ' is-overdue' : ''}" data-id="${s.id}" role="button" tabindex="0" draggable="true"
      style="--subject-color:${colorOf(sub)}" aria-label="${esc((sub ? sub.name : '') + ': ' + sessionTitle(s))}">
      <span class="s-sub">${esc(sub ? sub.name : '')}</span>
      <span class="s-title">${esc(sessionTitle(s))}</span>
      <span class="s-kind">${KIND_LABELS[s.kind]}${od ? ' · متأخرة' : ''}${s.done ? ' · تمت ✓' : ''}</span>
    </div>`;
  }

  function moveSession(id, date, slot) {
    const s = state.sessions.find((x) => x.id === id);
    if (!s || !S.parseDate(date)) return;
    s.date = date; s.slot = Math.max(0, Number(slot) || 0); s.manual = true;
    const sub = subjectById(s.subjectId);
    if (sub && sub.examDate && date >= sub.examDate && s.kind !== 'quick') toast('تنبيه: نقلت الجلسة إلى يوم الاختبار أو بعده.');
    commit();
  }

  // السحب والإفلات: SortableJS إن توفر (يدعم اللمس)، وإلا السحب الأصلي للمتصفح
  function enableDragDrop(grid) {
    const cells = $$('.wg-cell', grid);
    if (window.Sortable) {
      cells.forEach((cell) => window.Sortable.create(cell, {
        group: 'sessions', animation: 150, delay: 180, delayOnTouchOnly: true, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
        onEnd: (evt) => {
          if (evt.from === evt.to) return;
          moveSession(evt.item.dataset.id, evt.to.dataset.date, evt.to.dataset.slot);
        }
      }));
      return;
    }
    $$('.session', grid).forEach((el) => el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', el.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
    }));
    cells.forEach((cell) => {
      cell.addEventListener('dragover', (e) => { e.preventDefault(); cell.classList.add('drag-over'); });
      cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        if (id) moveSession(id, cell.dataset.date, cell.dataset.slot);
      });
    });
  }

  function openSessionModal(id) {
    const s = state.sessions.find((x) => x.id === id);
    if (!s) return;
    const sub = subjectById(s.subjectId);
    const cfg = effectiveSettings();
    const slots = Array.from({ length: Math.max(cfg.slotsPerDay, s.slot + 1) }, (_, i) => `<option value="${i}"${i === s.slot ? ' selected' : ''}>الفترة ${i + 1} (${slotRange(i).join('–')})</option>`).join('');
    openModal(sub ? sub.name : 'جلسة', `
      <div><p><b>${esc(sessionTitle(s))}</b></p><p class="muted">${KIND_LABELS[s.kind]} · ${s.minutes} دقيقة · ${esc(fmtDate(s.date))}${isOverdue(s) ? ' · <span style="color:var(--red)">متأخرة</span>' : ''}</p></div>
      <div class="modal-actions"><button class="btn btn-primary" data-action="toggle-session" data-id="${s.id}" data-close="1">${s.done ? 'إلغاء «تمت»' : 'تمت ✓'}</button></div>
      <form id="move-form" class="form-grid">
        <label class="field"><span>نقل إلى يوم</span><input type="date" id="mv-date" name="date" value="${s.date}" required></label>
        <label class="field"><span>الفترة</span><select id="mv-slot" name="slot">${slots}</select></label>
        <div class="modal-actions field-wide"><button class="btn" type="submit">نقل الجلسة</button>
        <button class="btn btn-danger" type="button" data-action="delete-session" data-id="${s.id}">حذف الجلسة</button></div>
      </form>`);
    $('#move-form').addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal();
      moveSession(s.id, $('#mv-date').value, $('#mv-slot').value);
      toast('نُقلت الجلسة.');
    });
  }

  function toggleSession(id) {
    const s = state.sessions.find((x) => x.id === id);
    if (!s) return;
    s.done = !s.done;
    if (s.done) toast(s.kind === 'study' ? 'أحسنت! تقدّمك في المادة زاد.' : 'تمت الجلسة.');
    commit();
  }

  function generate(force) {
    const pending = state.sessions.filter((s) => !s.done && s.date >= today());
    const manual = pending.filter((s) => s.manual).length;
    if (!force && manual) {
      confirmDialog(`لديك ${manual} ${manual === 1 ? 'جلسة عدّلتها' : 'جلسات عدّلتها'} يدوياً. إعادة التوليد تعيد توزيع كل الجلسات غير المنجزة. الجلسات المنجزة لا تتأثر.`, 'أعد التوليد', () => generate(true));
      return;
    }
    const history = state.sessions.filter((s) => s.done);
    const res = S.generateSchedule({ subjects: state.subjects, settings: state.settings, today: today(), history, idGen: () => uid('s') });
    state.sessions = history.concat(res.sessions);
    state.warnings = res.warnings;
    state.generatedAt = new Date().toISOString();
    state.dirty = false;
    state.ui.weekOffset = 0;
    save();
    if (res.sessions.length) {
      toast(`وُلّد الجدول: ${res.meta.counts.study} مذاكرة، ${res.meta.counts.review} مراجعة نهائية، ${res.meta.counts.spaced} مراجعة متباعدة.`);
      if (state.ui.view !== 'schedule') { setView('schedule'); return; }
    } else {
      toast('لم تُنشأ جلسات. راجع التنبيهات في تبويب الجدول.');
      if (state.ui.view !== 'schedule') { setView('schedule'); return; }
    }
    render();
  }

  // ===== إعدادات الجدول =====
  function syncSettingsForm() {
    const st = state.settings;
    $('#set-hours').value = st.dailyHours === '' || st.dailyHours == null ? '' : st.dailyHours;
    $('#set-session').value = st.sessionMinutes;
    $('#set-break').value = st.breakMinutes;
    $('#set-review').value = st.reviewDays;
    $('#set-active').value = st.activeTime;
    $('#set-start').value = st.startTime || (D.ACTIVE_TIMES[st.activeTime] || D.ACTIVE_TIMES.evening).start;
    $('#set-spaced').checked = st.spacedReview !== false;
    const rest = $('#set-rest');
    if (!rest.children.length) {
      rest.innerHTML = WEEKDAYS.map((n, i) => `<label class="day-pick"><input type="checkbox" id="rest-${i}" value="${i}">${n}</label>`).join('');
    }
    $$('input', rest).forEach((cb) => { cb.checked = (st.restDays || []).includes(Number(cb.value)); });
  }

  function onSettingsChange(e) {
    const t = e.target;
    const st = state.settings;
    if (t.id === 'set-hours') st.dailyHours = t.value === '' ? '' : Number(t.value);
    else if (t.id === 'set-session') st.sessionMinutes = Number(t.value) || 50;
    else if (t.id === 'set-break') st.breakMinutes = Math.max(0, Number(t.value) || 0);
    else if (t.id === 'set-review') st.reviewDays = Math.max(2, Math.min(7, Number(t.value) || 2));
    else if (t.id === 'set-active') { st.activeTime = t.value; st.startTime = ''; }
    else if (t.id === 'set-start') st.startTime = t.value;
    else if (t.id === 'set-spaced') st.spacedReview = t.checked;
    else if (t.id.startsWith('rest-')) st.restDays = $$('#set-rest input:checked').map((x) => Number(x.value));
    else return;
    if (t.id === 'set-hours' && (t.value === '' || Number(t.value) <= 0)) toast('لم تُحدد ساعات المذاكرة؛ سيستخدم الجدول 4 ساعات افتراضياً.');
    if (!['set-active', 'set-start'].includes(t.id)) markDirty();
    commit();
  }

  // ===================== خطط المذاكرة =====================
  function renderPlans() {
    const list = sortedSubjects();
    $('#plans-list').innerHTML = list.length ? list.map(planCard).join('') : '<div class="empty">أضف مواد لترى خطط مذاكرتها.</div>';
  }

  function planCard(s) {
    const mine = state.sessions.filter((x) => x.subjectId === s.id);
    const cnt = (k) => mine.filter((x) => x.kind === k).length;
    const totalMin = mine.reduce((a, x) => a + (Number(x.minutes) || 0), 0);
    const bp = D.BREAK_PLANS[s.difficulty] || D.BREAK_PLANS.medium;
    const techKeys = [...new Set([...(D.TECHNIQUES_BY_TYPE[s.type] || []), ...(D.TECHNIQUES_BY_DIFFICULTY[s.difficulty] || [])])].slice(0, 5);
    const tips = (D.TYPE_TIPS[s.type] || D.TYPE_TIPS.understand).tips;
    const cfg = effectiveSettings();

    // تقسيم الشابترات على الجلسات
    const excluded = s.chapters.length - examChapters(s).length;
    const rows = examChapters(s).map((c) => {
      const related = mine.filter((x) => x.kind === 'study' && x.chapterIds.includes(c.id)).sort((a, b) => a.date.localeCompare(b.date));
      const est = S.partsFor(c, s.difficulty);
      const dates = related.map((x) => `<span class="${x.done ? 'muted' : ''}">${esc(fmtDate(x.date, { day: 'numeric', month: 'short' }))}${x.done ? ' ✓' : ''}</span>`).join('، ');
      return `<tr><td>${esc(c.title)}</td><td class="num">${related.length || est}${related.length ? '' : ' (تقديري)'}</td><td>${dates || '<span class="muted">—</span>'}</td><td class="num">${chapterPct(c)}%</td></tr>`;
    }).join('');

    // خطة الأيام الأخيرة
    const d = daysLeft(s);
    const exam = s.examDate;
    const lastDays = exam ? [
      [S.addDays(exam, -3), 'أنهِ آخر شابتر، وحدّث ورقة الملخص/القوانين.'],
      [S.addDays(exam, -2), s.type === 'math' || s.type === 'apply' ? 'مراجعة الشابترات بحل مسألتين من كل شابتر ودفتر الأخطاء.' : 'مراجعة الشابترات بالخرائط الذهنية والبطاقات.'],
      [S.addDays(exam, -1), 'حل نموذج اختبار كامل بتوقيت حقيقي، ثم راجع الأسئلة المعلّمة «يحتاج مراجعة». نم مبكراً.'],
      [exam, 'مراجعة سريعة للملخص فقط (30 دقيقة)، إفطار خفيف، ووصول مبكر.']
    ] : [];

    const breakBar = [];
    for (let i = 0; i < bp.cycles; i++) {
      breakBar.push(`<span class="f" style="flex:${bp.focus}">${bp.focus}د</span>`);
      breakBar.push(i < bp.cycles - 1 ? `<span class="b" style="flex:${bp.shortBreak}">${bp.shortBreak}</span>` : `<span class="l" style="flex:${bp.longBreak}">${bp.longBreak}د</span>`);
    }

    return `<article class="plan-card" style="--subject-color:${colorOf(s)}">
      <div class="panel-title"><div><h3>${esc(s.name)} ${s.code ? `<span class="subject-code">${esc(s.code)}</span>` : ''}</h3>
        <div class="subject-meta">${urgencyChip(s)}<span class="chip">${esc(D.DIFFICULTY_LABELS[s.difficulty])}</span><span class="chip">${esc(D.TYPE_LABELS[s.type])}</span><span class="chip">${esc(D.SOURCE_LABELS[s.source])}</span></div></div>
        ${exam ? `<span class="muted">${esc(fmtDate(exam))}</span>` : ''}</div>
      <p>${mine.length
        ? `في جدولك: <b class="num">${cnt('study')}</b> جلسة مذاكرة، <b class="num">${cnt('review')}</b> مراجعة نهائية، <b class="num">${cnt('spaced')}</b> مراجعة متباعدة، بمجموع <b class="num">${(totalMin / 60).toFixed(1)}</b> ساعة.`
        : exam ? 'ولّد الجدول من تبويب «الجدول» لترى مواعيد جلسات هذه المادة.' : 'أدخل تاريخ الاختبار لتدخل المادة الجدول.'}</p>
      <div class="plan-grid">
        <div class="plan-block"><h4>تقسيم الشابترات على الجلسات</h4>
          ${excluded ? `<p class="muted">${excluded} ${excluded === 1 ? 'شابتر' : 'شابترات'} خارج الاختبار ولا تظهر هنا.</p>` : ''}
          ${examChapters(s).length ? `<div class="table-scroll"><table class="plan-table"><thead><tr><th>الشابتر</th><th>الجلسات</th><th>المواعيد</th><th>الإنجاز</th></tr></thead><tbody>${rows}</tbody></table></div>`
            : '<p class="empty">لا توجد شابترات؛ ستُجدول مراجعة عامة فقط.</p>'}
        </div>
        <div class="plan-block"><h4>تقنيات المذاكرة المناسبة</h4>
          ${techKeys.map((k, i) => { const t = D.TECHNIQUES[k]; return `<details class="tech"${i === 0 ? ' open' : ''}><summary>${esc(t.name)}</summary><p>${esc(t.what)}</p><ol>${t.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ol></details>`; }).join('')}
        </div>
        <div class="plan-block"><h4>توزيع فترات الراحة</h4>
          <p><span class="num">${bp.focus}</span> دقيقة تركيز ثم <span class="num">${bp.shortBreak}</span> دقائق راحة، وبعد ${bp.cycles} ${bp.cycles === 2 ? 'دورتين' : 'دورات'} راحة طويلة <span class="num">${bp.longBreak}</span> دقيقة.</p>
          <div class="break-bar" aria-hidden="true">${breakBar.join('')}</div>
          <p class="muted">${esc(bp.note)} جلسات جدولك ${cfg.sessionMinutes} دقيقة؛ قسّم الجلسة الواحدة على هذا النمط.</p>
          <h4>نصائح لمادة ${esc(D.TYPE_LABELS[s.type])}</h4>
          <ul class="tips">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}<li>${esc(D.SOURCE_TIPS[s.source])}</li></ul>
        </div>
        ${lastDays.length && d >= 0 ? `<div class="plan-block"><h4>خطة الأيام الأخيرة</h4><ul class="countdown-plan">${lastDays.filter(([dt]) => dt >= today()).map(([dt, txt]) => `<li><b>${esc(fmtDate(dt, { day: 'numeric', month: 'short' }))}</b><span>${esc(txt)}</span></li>`).join('')}</ul></div>` : ''}
      </div>
    </article>`;
  }

  // ===================== الأسئلة المتوقعة =====================
  const openChapters = new Set();

  function renderQuestions() {
    const sel = $('#q-subject');
    const subs = sortedSubjects();
    if (!subs.length) {
      sel.innerHTML = '';
      $('#questions-list').innerHTML = '<div class="empty">أضف مواد وشابترات أولاً.</div>';
      return;
    }
    if (!subs.some((s) => s.id === state.ui.qSubject)) state.ui.qSubject = subs[0].id;
    sel.innerHTML = subs.map((s) => `<option value="${s.id}"${s.id === state.ui.qSubject ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
    $('#q-status').value = state.ui.qStatus;
    $('#q-type').value = state.ui.qType;
    const s = subjectById(state.ui.qSubject);
    const all = s.chapters.flatMap((c) => c.questions);
    let html = contentBanner() + `<div class="panel-title" style="margin-bottom:10px"><span class="muted">${all.length} سؤال · ${all.filter((q) => q.status === 'done').length} تم · ${all.filter((q) => q.status === 'review').length} يحتاج مراجعة</span>
      ${s.chapters.length ? `<button class="btn btn-sm" data-action="gen-all-questions" data-sid="${s.id}">ولّد أسئلة إرشادية لكل الشابترات</button>` : ''}</div>`;
    if (!s.chapters.length) html += '<div class="empty">هذه المادة بلا شابترات. أضف شابترات من تبويب المواد لتضيف أسئلتها.</div>';
    s.chapters.forEach((c) => {
      const qs = c.questions.filter((q) => (state.ui.qStatus === 'all' || q.status === state.ui.qStatus) && (state.ui.qType === 'all' || q.type === state.ui.qType));
      const done = c.questions.filter((q) => q.status === 'done').length;
      const pct = c.questions.length ? Math.round(100 * done / c.questions.length) : 0;
      html += `<details class="q-chapter" data-cid="${c.id}"${openChapters.has(c.id) ? ' open' : ''}>
        <summary><span class="q-sum-title">${esc(c.title)}</span><span class="num muted">${done} / ${c.questions.length}</span>${c.questions.length ? `<div style="grid-column:1/-1">${progressBar(pct, true)}</div>` : ''}</summary>
        <div class="q-body">
          ${qs.length ? `<ul class="q-list">${qs.map((q) => questionItem(s, c, q)).join('')}</ul>` : `<p class="muted">${c.questions.length ? 'لا أسئلة تطابق التصفية.' : 'لا أسئلة بعد.'}</p>`}
          <form class="q-add" data-form="add-question" data-sid="${s.id}" data-cid="${c.id}">
            <label class="field"><span>سؤال جديد</span><input class="input" name="text" id="qt-${c.id}" placeholder="اكتب السؤال المتوقع"></label>
            <label class="field"><span>النوع</span><select name="type" id="qy-${c.id}">${optionList(D.QUESTION_TYPES, 'essay')}</select></label>
            <button class="btn" type="submit">إضافة</button>
          </form>
          <div class="btn-row"><button class="btn btn-sm btn-ghost" type="button" data-action="gen-questions" data-sid="${s.id}" data-cid="${c.id}">ولّد أسئلة إرشادية لهذا الشابتر</button></div>
        </div></details>`;
    });
    $('#questions-list').innerHTML = html;
  }

  function questionItem(s, c, q) {
    return `<li class="q-item st-${q.status}">
      <div class="q-text" dir="auto">${esc(q.text)}${q.answer ? `<details class="q-answer"><summary>الإجابة</summary><div dir="auto">${esc(q.answer)}</div></details>` : ''}</div>
      <button class="icon-btn danger" data-action="delete-question" data-sid="${s.id}" data-cid="${c.id}" data-qid="${q.id}" aria-label="حذف السؤال">✕</button>
      <div class="q-tags"><span class="chip">${esc(D.QUESTION_TYPES[q.type])}</span>${q.lecture ? '<span class="chip chip-accent">من المحاضرة</span>' : ''}${q.generated ? '<span class="chip">إرشادي</span>' : ''}
        <select data-bind="q-status" data-sid="${s.id}" data-cid="${c.id}" data-qid="${q.id}" aria-label="حالة السؤال">${optionList(D.QUESTION_STATUS, q.status)}</select></div>
    </li>`;
  }

  // توليد أسئلة إرشادية من القوالب حسب نوع المادة وموضوعات الشابتر
  function generateQuestions(s, c) {
    const fromBank = bankQuestions(c);
    if (fromBank.length) { c.questions.push(...fromBank); return fromBank.length; }
    const tpl = D.QUESTION_TEMPLATES[s.type] || D.QUESTION_TEMPLATES.understand;
    const topics = c.topics && c.topics.length ? c.topics : [c.title];
    const round = Math.floor(c.questions.filter((q) => q.generated).length / tpl.length);
    const added = [];
    for (let r = round; r < round + topics.length && !added.length; r++) {
      tpl.forEach(([type, text], i) => {
        const topic = topics[(i + r) % topics.length];
        const qText = text.split('{ch}').join(c.title).split('{t}').join(topic);
        if (!c.questions.some((q) => q.text === qText) && !added.some((q) => q.text === qText)) {
          added.push({ id: uid('q'), text: qText, type, status: 'todo', generated: true });
        }
      });
    }
    c.questions.push(...added);
    return added.length;
  }

  // ===================== الخطة الجامعية =====================
  function renderCurriculum() {
    const plan = D.STUDY_PLAN;
    $('#curriculum-sub').textContent = `${plan.university} · ${plan.college} · ${plan.major} · القبول ${plan.admission}. أضف مواد أي مستوى إلى قائمتك بضغطة.`;
    const codes = new Set(state.subjects.map((s) => s.code));
    const total = plan.levels.reduce((a, l) => a + l.courses.reduce((b, c) => b + c.credits, 0), 0);
    $('#curriculum').innerHTML = `<p class="muted" style="margin-bottom:12px">مجموع الخطة: <span class="num">${total}</span> وحدة في ${plan.levels.length} مستويات.</p><div class="levels">` + plan.levels.map((l) => {
      const credits = l.courses.reduce((a, c) => a + c.credits, 0);
      const missing = l.courses.filter((c) => !codes.has(c.code)).length;
      return `<section class="level${l.status ? ' is-current' : ''}">
        <div class="level-head"><h3>المستوى ${D.LEVEL_NAMES[l.level]}</h3><div class="btn-row">${l.status ? `<span class="chip chip-accent">${esc(l.status)}</span>` : ''}<span class="chip num">${credits} وحدة</span></div></div>
        <ul class="course-list">${l.courses.map((c) => `<li class="course"><code>${esc(c.code)}</code><span>${esc(c.name)}${codes.has(c.code) ? ' <span class="chip chip-green">مضافة</span>' : ''}</span><span class="cr">${c.credits} و</span></li>`).join('')}</ul>
        <button class="btn btn-sm${missing ? '' : ' btn-ghost'}" data-action="add-level" data-level="${l.level}" ${missing ? '' : 'disabled'}>${missing ? `أضف ${missing === l.courses.length ? 'مواد المستوى' : 'المواد الناقصة'} (${missing})` : 'كل المواد مضافة'}</button>
      </section>`;
    }).join('') + '</div>';
  }

  function addLevel(levelNo) {
    const level = D.STUDY_PLAN.levels.find((l) => l.level === Number(levelNo));
    if (!level) return;
    const codes = new Set(state.subjects.map((s) => s.code));
    const toAdd = level.courses.filter((c) => !codes.has(c.code));
    toAdd.forEach((c) => state.subjects.push(subjectFromCourse(c, state.subjects)));
    markDirty();
    toast(`أُضيفت ${toAdd.length} مواد من المستوى ${D.LEVEL_NAMES[level.level]}. أضف شابتراتها وتواريخ اختباراتها.`);
    commit();
  }

  // ===================== البيانات =====================
  function renderHelp() { /* المحتوى ثابت في HTML */ }

  function exportData() {
    const json = JSON.stringify(Object.assign({ exportedAt: new Date().toISOString(), app: 'study-notebook' }, state), null, 2);
    $('#export-text').value = json;
    $('#export-box').hidden = false;
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'study-notebook-' + today() + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    } catch (e) { /* التنزيل غير متاح: النص ظاهر للنسخ */ }
    toast('جُهّزت النسخة الاحتياطية. إن لم يبدأ التنزيل فانسخ النص الظاهر.');
  }

  function importJson(text) {
    let parsed;
    try { parsed = normalizeState(JSON.parse(text)); }
    catch (e) { toast('تعذّر الاستيراد: ' + (e instanceof SyntaxError ? 'الملف ليس JSON صالحاً.' : e.message)); return; }
    confirmDialog(`سيُستبدل كل ما في التطبيق بـ ${parsed.subjects.length} مادة و${parsed.sessions.length} جلسة من الملف. متابعة؟`, 'استورد البيانات', () => {
      state = parsed;
      state.ui.view = 'dashboard';
      toast('تم الاستيراد بنجاح.');
      commit();
    });
  }

  function demoDates() {
    const offsets = [10, 13, 16, 19, 22, 25, 28, 31];
    let i = 0;
    state.subjects.forEach((s) => {
      if (!s.examDate) { s.examDate = S.addDays(today(), offsets[i++ % offsets.length]); s.demoDate = true; }
    });
    generate(true);
    toast('التواريخ تجريبية؛ استبدلها بالحقيقية من تبويب المواد.');
  }

  // ===================== النوافذ والإشعارات =====================
  let lastFocus = null;
  function openModal(title, html) {
    lastFocus = document.activeElement;
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    $('#modal').hidden = false;
    const first = $('#modal-body input, #modal-body select, #modal-body button');
    if (first) first.focus();
  }
  function closeModal() {
    $('#modal').hidden = true;
    $('#modal-body').innerHTML = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  // بديل confirm(): نافذة تأكيد داخل الصفحة
  function confirmDialog(message, label, onYes) {
    openModal('تأكيد', `<p>${esc(message)}</p><div class="modal-actions"><button class="btn btn-danger" id="confirm-yes">${esc(label)}</button><button class="btn" data-action="close-modal">إلغاء</button></div>`);
    $('#confirm-yes').addEventListener('click', () => { closeModal(); onYes(); });
  }
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    const box = $('#toasts');
    box.appendChild(el);
    while (box.children.length > 2) box.firstElementChild.remove(); // لا نغطي المحتوى بإشعارات كثيرة
    setTimeout(() => el.remove(), 3500);
  }

  // ===================== الوضع الليلي =====================
  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
    const dark = theme === 'dark' || (!theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    $('#theme-toggle').textContent = dark ? 'الوضع النهاري' : 'الوضع الليلي';
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const dark = cur === 'dark' || (!cur && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    storage.set(THEME_KEY, next);
    applyTheme(next);
  }

  // ===================== الأحداث =====================
  const actions = {
    'goto': (el) => setView(el.dataset.view),
    'toggle-theme': toggleTheme,
    'close-modal': closeModal,
    'new-subject': () => openSubjectForm(null),
    'edit-subject': (el) => openSubjectForm(el.dataset.sid),
    'delete-subject': (el) => deleteSubject(el.dataset.sid),
    'delete-chapter': (el) => deleteChapter(el.dataset.sid, el.dataset.cid),
    'dismiss-suggested': (el) => { const s = subjectById(el.dataset.sid); if (s) { s.suggested = false; commit(); } },
    'generate': () => generate(false),
    'week-prev': () => { state.ui.weekOffset--; commit(); },
    'week-next': () => { state.ui.weekOffset++; commit(); },
    'week-today': () => { state.ui.weekOffset = 0; commit(); },
    'open-session': (el) => openSessionModal(el.dataset.id),
    'toggle-session': (el) => { if (el.dataset.close) closeModal(); toggleSession(el.dataset.id); },
    'delete-session': (el) => { state.sessions = state.sessions.filter((s) => s.id !== el.dataset.id); closeModal(); toast('حُذفت الجلسة.'); commit(); },
    'demo-dates': demoDates,
    'convert-inexam': convertInExam,
    'apply-content': (el) => applyContent(el.dataset.sid),
    'dismiss-content': (el) => { const s = subjectById(el.dataset.sid); if (s) { s.contentDismissed = D.COURSE_CONTENT_VERSION[s.code]; commit(); } },
    'keep-done': () => { state.inExamAsked = true; commit(); },
    'clear-demo': () => { state.subjects.forEach((s) => { if (s.demoDate) { s.examDate = ''; s.demoDate = false; } }); state.sessions = state.sessions.filter((x) => x.done); state.warnings = []; toast('مُسحت التواريخ التجريبية والجلسات غير المنجزة.'); commit(); },
    'add-level': (el) => addLevel(el.dataset.level),
    'gen-questions': (el) => {
      const s = subjectById(el.dataset.sid); const c = s && s.chapters.find((x) => x.id === el.dataset.cid);
      if (!c) return;
      openChapters.add(c.id);
      const n = generateQuestions(s, c);
      toast(n ? `أُضيف ${n} أسئلة إرشادية. عدّلها أو احذف ما لا يناسب منهجك.` : 'كل الأسئلة الإرشادية لهذا الشابتر مضافة مسبقاً.');
      commit();
    },
    'gen-all-questions': (el) => {
      const s = subjectById(el.dataset.sid); if (!s) return;
      const n = s.chapters.reduce((a, c) => a + generateQuestions(s, c), 0);
      toast(n ? `أُضيف ${n} سؤالاً إرشادياً لكل الشابترات.` : 'لا أسئلة جديدة؛ كلها مضافة مسبقاً.');
      commit();
    },
    'delete-question': (el) => {
      const s = subjectById(el.dataset.sid); const c = s && s.chapters.find((x) => x.id === el.dataset.cid);
      if (!c) return;
      c.questions = c.questions.filter((q) => q.id !== el.dataset.qid);
      commit();
    },
    'timer-toggle': timerToggle,
    'timer-reset': timerReset,
    'timer-skip': timerSkip,
    'export': exportData,
    'copy-export': () => {
      const ta = $('#export-text');
      const fallback = () => { ta.focus(); ta.select(); toast('حدّد النص وانسخه يدوياً.'); };
      try { navigator.clipboard.writeText(ta.value).then(() => toast('نُسخت البيانات.'), fallback); } catch (e) { fallback(); }
    },
    'import-text': () => { const v = $('#import-text').value.trim(); if (v) importJson(v); else toast('الصق محتوى JSON أولاً.'); },
    'reset': () => confirmDialog('مسح كل المواد والجدول والأسئلة وإعادة التطبيق لحالته الأولى (مواد المستوى الأول)؟ صدّر نسخة احتياطية قبل ذلك إن احتجت.', 'امسح كل البيانات', () => {
      state = createInitialState();
      storage.remove(STORAGE_KEY);
      toast('أُعيد التطبيق لحالته الأولى.');
      commit();
    })
  };

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) { setView(tab.dataset.view); return; }
    const el = e.target.closest('[data-action]');
    if (el && actions[el.dataset.action]) {
      if (el.tagName !== 'INPUT') e.preventDefault();
      actions[el.dataset.action](el);
      return;
    }
    const card = e.target.closest('.session');
    if (card) { openSessionModal(card.dataset.id); return; }
    if (e.target.id === 'modal') closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('session')) {
      e.preventDefault();
      openSessionModal(e.target.dataset.id);
    }
  });

  // تعديلات مباشرة داخل البطاقات
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.closest('#settings-form')) { onSettingsChange(e); return; }
    if (t.id === 'q-subject') { state.ui.qSubject = t.value; commit(); return; }
    if (t.id === 'q-status') { state.ui.qStatus = t.value; commit(); return; }
    if (t.id === 'q-type') { state.ui.qType = t.value; commit(); return; }
    if (t.id === 'import-file') {
      const file = t.files && t.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => importJson(String(reader.result));
      reader.onerror = () => toast('تعذّرت قراءة الملف.');
      reader.readAsText(file);
      t.value = '';
      return;
    }
    const bind = t.dataset && t.dataset.bind;
    if (!bind) return;
    const s = subjectById(t.dataset.sid);
    if (!s) return;
    const c = t.dataset.cid ? s.chapters.find((x) => x.id === t.dataset.cid) : null;
    switch (bind) {
      case 'examDate':
        s.examDate = S.parseDate(t.value) ? t.value : '';
        s.demoDate = false;
        markDirty();
        commit();
        if (s.examDate && S.diffDays(today(), s.examDate) < 0) toast('هذا التاريخ مضى؛ لن تدخل المادة الجدول.');
        break;
      case 'chapter-title':
        if (c) { c.title = t.value.trim() || c.title; t.value = c.title; save(); }
        break;
      case 'chapter-pages':
        if (c) { c.pages = Math.max(0, parseInt(t.value, 10) || 0); markDirty(); save(); }
        break;
      case 'chapter-inexam':
        if (c) { c.inExam = t.checked; state.inExamAsked = true; markDirty(); commit(); }
        break;
      case 'exam-scope':
        if (t.value !== 'custom') {
          const n = t.value === 'all' ? s.chapters.length - 1 : Number(t.value);
          s.chapters.forEach((ch, i) => { ch.inExam = i <= n; });
          state.inExamAsked = true;
          markDirty();
          commit();
        }
        break;
      case 'chapter-done':
        if (c) { c.done = t.checked; markDirty(); commit(); }
        break;
      case 'q-status': {
        const q = c && c.questions.find((x) => x.id === t.dataset.qid);
        if (q) { q.status = t.value; commit(); }
        break;
      }
    }
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.dataset.form === 'add-chapter') {
      e.preventDefault();
      const s = subjectById(f.dataset.sid);
      const title = f.elements.title.value.trim();
      if (!s) return;
      if (!title) { toast('اكتب عنوان الشابتر.'); f.elements.title.focus(); return; }
      s.chapters.push(makeChapter(title, f.elements.pages.value));
      markDirty();
      commit();
      const input = $('#newch-' + s.id);
      if (input) input.focus();
    } else if (f.dataset.form === 'add-question') {
      e.preventDefault();
      const s = subjectById(f.dataset.sid);
      const c = s && s.chapters.find((x) => x.id === f.dataset.cid);
      const text = f.elements.text.value.trim();
      if (!c) return;
      if (!text) { toast('اكتب نص السؤال.'); return; }
      c.questions.push({ id: uid('q'), text, type: f.elements.type.value, status: 'todo', generated: false });
      openChapters.add(c.id);
      commit();
      const input = $('#qt-' + c.id);
      if (input) input.focus();
    }
  });

  // حفظ حالة فتح شابترات الأسئلة
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d.classList && d.classList.contains('q-chapter')) {
      if (d.open) openChapters.add(d.dataset.cid); else openChapters.delete(d.dataset.cid);
    }
  }, true);

  // ===================== التشغيل =====================
  applyTheme(storage.get(THEME_KEY));
  const hash = (location.hash || '').replace('#', '');
  if (VIEWS.includes(hash)) state.ui.view = hash;
  render();
  // تحديث العرض عند تغيّر اليوم (مثلاً إذا بقيت الصفحة مفتوحة بعد منتصف الليل)
  let lastDay = today();
  setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 60000);
})();
