/* =========================================================================
   scheduler.js — منطق توليد الجدول الدراسي (دوال نقية بلا واجهة)
   يعمل في المتصفح (window.Scheduler) وفي Node للاختبارات (module.exports)
   ========================================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Scheduler = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ===== أدوات التاريخ: نتعامل مع التواريخ كنص YYYY-MM-DD لتجنب مشاكل المناطق الزمنية =====
  const DAY_MS = 86400000;

  function parseDate(str) {
    if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
    const [y, m, d] = str.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (isNaN(dt) || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }
  function formatDate(dt) { return dt.toISOString().slice(0, 10); }
  function addDays(str, n) {
    const d = parseDate(str);
    d.setUTCDate(d.getUTCDate() + n);
    return formatDate(d);
  }
  // عدد الأيام من a إلى b (موجب إذا كان b بعد a)
  function diffDays(a, b) { return Math.round((parseDate(b) - parseDate(a)) / DAY_MS); }
  function todayLocal(now) {
    const d = now || new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function weekday(str) { return parseDate(str).getUTCDay(); } // 0 = الأحد
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  // ===== الثوابت =====
  const DIFFICULTY = {
    easy:   { rank: 1, sessionsPerChapter: 1, pagesPerSession: 20 },
    medium: { rank: 2, sessionsPerChapter: 2, pagesPerSession: 12 },
    hard:   { rank: 3, sessionsPerChapter: 3, pagesPerSession: 8 }
  };

  const DEFAULT_SETTINGS = {
    dailyHours: 4,        // ساعات المذاكرة اليومية
    sessionMinutes: 50,   // مدة الجلسة
    breakMinutes: 10,     // الراحة بين الجلسات
    reviewDays: 2,        // أيام المراجعة النهائية (يومان على الأقل)
    restDays: [],         // أيام الراحة الأسبوعية (0 = الأحد ... 6 = السبت)
    spacedReview: true    // ملء الوقت الفارغ بمراجعات متباعدة
  };

  // صيغة العدد العربية للجلسات: جلسة واحدة، جلستان، 3–10 جلسات، 11+ جلسة
  function sessionsWord(n) {
    if (n === 1) return 'جلسة واحدة';
    if (n === 2) return 'جلستين';
    return n + (n >= 3 && n <= 10 ? ' جلسات' : ' جلسة');
  }

  function W(level, message, subjectId) { return { level, message, subjectId: subjectId || null }; }

  function makeIdGen() {
    let n = 0;
    const base = Date.now().toString(36);
    return () => 's_' + base + '_' + (n++).toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // تنظيف الإعدادات وتطبيق القيم الافتراضية
  function normalizeSettings(raw, warnings) {
    const s = Object.assign({}, DEFAULT_SETTINGS, raw || {});
    let hours = Number(s.dailyHours);
    if (!isFinite(hours) || hours <= 0) {
      warnings.push(W('warn', 'لم تُدخل ساعات المذاكرة اليومية أو أدخلت صفراً، فاستُخدمت 4 ساعات افتراضياً. عدّلها من إعدادات الجدول.'));
      hours = 4;
    }
    hours = Math.min(hours, 16);
    const dailyMinutes = Math.round(hours * 60);
    let session = clamp(Math.round(Number(s.sessionMinutes) || 50), 15, 180);
    const brk = clamp(Math.round(Number(s.breakMinutes)), 0, 60) || 0;
    if (session > dailyMinutes) session = dailyMinutes;
    const slotsPerDay = Math.max(1, Math.floor((dailyMinutes + brk) / (session + brk)));

    let restDays = Array.isArray(s.restDays)
      ? [...new Set(s.restDays.map(Number).filter((d) => d >= 0 && d <= 6))] : [];
    if (restDays.length >= 7) {
      warnings.push(W('warn', 'اخترت كل أيام الأسبوع أيام راحة، فتم تجاهل أيام الراحة.'));
      restDays = [];
    }
    const reviewDays = clamp(Math.round(Number(s.reviewDays) || 2), 2, 7);
    return {
      dailyHours: hours, dailyMinutes, sessionMinutes: session, breakMinutes: brk,
      slotsPerDay, restDays, reviewDays, spacedReview: s.spacedReview !== false
    };
  }

  // الشابترات المقررة في الاختبار فقط (inExam === false تعني خارج الاختبار)
  function examChapters(subject) {
    return (Array.isArray(subject && subject.chapters) ? subject.chapters : []).filter((c) => c && c.inExam !== false);
  }

  // عدد جلسات المذاكرة التي يحتاجها الشابتر حسب الصفحات أو الصعوبة
  // الأولوية: عدد الجلسات الذي حددته الطالبة، ثم الصفحات، ثم الصعوبة
  function partsFor(chapter, difficulty) {
    const cfg = DIFFICULTY[difficulty] || DIFFICULTY.medium;
    const manual = Math.round(Number(chapter && chapter.sessions) || 0);
    if (manual > 0) return clamp(manual, 1, 10);
    const pages = Number(chapter && chapter.pages) || 0;
    if (pages > 0) return clamp(Math.ceil(pages / cfg.pagesPerSession), 1, 6);
    return cfg.sessionsPerChapter;
  }

  // ما تبقى من كل شابتر بعد احتساب الجلسات المنجزة سابقاً
  function chapterNeeds(subject, history) {
    const chapters = examChapters(subject);
    const needs = [];
    for (const ch of chapters) {
      if (ch.done) continue;
      const doneStudy = history.filter((s) => s.done && s.kind === 'study' &&
        s.subjectId === subject.id && Array.isArray(s.chapterIds) && s.chapterIds.includes(ch.id));
      // إذا أُنجز الجزء الأخير من الشابتر في جدول سابق فهو منتهٍ
      if (doneStudy.some((s) => s.part === s.parts)) continue;
      const need = partsFor(ch, subject.difficulty);
      const doneParts = Math.min(doneStudy.length, need - 1);
      needs.push({ chapterId: ch.id, need, doneParts, remaining: need - doneParts });
    }
    return needs;
  }

  // تحويل الاحتياج إلى وحدات جلسات، مع ضغطها إلى target جلسة إذا لم يتسع الوقت
  function buildUnits(needs, target) {
    const total = needs.reduce((a, n) => a + n.remaining, 0);
    const units = [];
    if (target == null || target >= total) {
      for (const n of needs) {
        for (let p = n.doneParts + 1; p <= n.need; p++) {
          units.push({ chapterIds: [n.chapterId], part: p, parts: n.need });
        }
      }
      return units;
    }
    if (target <= 0) return units;
    if (needs.length <= target) {
      // جلسة واحدة لكل شابتر على الأقل، والباقي للشابترات الأطول
      const alloc = needs.map(() => 1);
      let extra = target - needs.length;
      while (extra > 0) {
        let best = -1, bestGap = 0;
        needs.forEach((n, i) => {
          const gap = n.remaining - alloc[i];
          if (gap > bestGap) { bestGap = gap; best = i; }
        });
        if (best < 0) break;
        alloc[best]++; extra--;
      }
      needs.forEach((n, i) => {
        const parts = n.doneParts + alloc[i];
        for (let p = n.doneParts + 1; p <= parts; p++) {
          units.push({ chapterIds: [n.chapterId], part: p, parts, compressed: true });
        }
      });
      return units;
    }
    // الشابترات أكثر من الجلسات المتاحة: دمج عدة شابترات في جلسة واحدة
    const base = Math.floor(needs.length / target);
    let rem = needs.length % target, i = 0;
    for (let g = 0; g < target; g++) {
      const size = base + (rem-- > 0 ? 1 : 0);
      const ids = needs.slice(i, i + size).map((n) => n.chapterId);
      i += size;
      units.push({ chapterIds: ids, part: 1, parts: 1, compressed: true, merged: ids.length > 1 });
    }
    return units;
  }

  function examUrgency(daysLeft) {
    if (daysLeft == null || isNaN(daysLeft)) return 'none';
    if (daysLeft < 0) return 'past';
    if (daysLeft < 7) return 'red';
    if (daysLeft <= 14) return 'orange';
    return 'green';
  }

  // ======================= الخوارزمية الرئيسية =======================
  function generateSchedule(input) {
    input = input || {};
    const warnings = [];
    const today = input.today || todayLocal();
    const cfg = normalizeSettings(input.settings, warnings);
    const subjects = Array.isArray(input.subjects) ? input.subjects : [];
    const history = (input.history || []).filter((s) => s && s.done);
    const nextId = input.idGen || makeIdGen();

    const emptyResult = () => ({ sessions: [], warnings, meta: { slotsPerDay: cfg.slotsPerDay, settings: cfg, today, days: 0 } });

    // ---- 1) تجهيز خطة لكل مادة مع التحقق من حالات الحافة ----
    const plans = [];
    for (const subj of subjects) {
      const name = subj.name || 'مادة بلا اسم';
      if (!subj.examDate) {
        warnings.push(W('info', `«${name}»: لم يُحدَّد تاريخ الاختبار بعد، لذلك لم تدخل الجدول. أضف التاريخ من تبويب المواد.`, subj.id));
        continue;
      }
      if (!parseDate(subj.examDate)) {
        warnings.push(W('warn', `«${name}»: تاريخ الاختبار غير صالح (${subj.examDate}).`, subj.id));
        continue;
      }
      const daysLeft = diffDays(today, subj.examDate);
      if (daysLeft < 0) {
        warnings.push(W('warn', `اختبار «${name}» كان بتاريخ ${subj.examDate} وقد مضى، فاستُبعدت المادة من الجدول. حدّث التاريخ إن كان لديك اختبار قادم فيها.`, subj.id));
        continue;
      }
      const allChapters = Array.isArray(subj.chapters) ? subj.chapters : [];
      const chapters = examChapters(subj);
      const needs = chapterNeeds(subj, history);
      if (allChapters.length && !chapters.length) {
        warnings.push(W('warn', `«${name}»: لم تحدد أي شابتر مقرر في الاختبار، فجُدولت لها مراجعة عامة فقط. حدّد الشابترات المقررة من بطاقة المادة.`, subj.id));
      } else if (!chapters.length) {
        warnings.push(W('warn', `«${name}» بلا شابترات، فجُدولت لها مراجعة عامة فقط. أضف الشابترات ليتوزع المنهج على الأيام.`, subj.id));
      } else if (!needs.length) {
        warnings.push(W('info', `كل شابترات «${name}» منجزة، فجُدولت لها مراجعة فقط.`, subj.id));
      }
      plans.push({
        subj, id: subj.id, name, examDate: subj.examDate, daysLeft, needs,
        rank: (DIFFICULTY[subj.difficulty] || DIFFICULTY.medium).rank,
        chapters, units: [], studyDays: [], reviewDays: [], intensive: false
      });
    }
    if (!plans.length) {
      warnings.push(W('info', 'لا توجد اختبارات قادمة بتواريخ صالحة، فلم يُنشأ جدول. أدخل تواريخ الاختبارات أولاً.'));
      return emptyResult();
    }
    plans.sort((a, b) => a.examDate.localeCompare(b.examDate) || b.rank - a.rank);

    // ---- 2) كشف تعارض المواعيد ----
    const byDate = {};
    plans.forEach((p) => { (byDate[p.examDate] = byDate[p.examDate] || []).push(p); });
    const examDates = Object.keys(byDate).sort();
    examDates.forEach((d, i) => {
      if (byDate[d].length > 1) {
        warnings.push(W('warn', `تعارض مواعيد: ${byDate[d].map((p) => '«' + p.name + '»').join(' و ')} في يوم واحد (${d}). تأكد من الموعد؛ الجدول يقسم وقت المراجعة بينها.`));
      }
      if (i > 0 && diffDays(examDates[i - 1], d) === 1) {
        warnings.push(W('info', `اختباران متتاليان (${examDates[i - 1]} ثم ${d}): أنهِ مذاكرة المادة الثانية مبكراً قدر الإمكان.`));
      }
    });

    // ---- 3) الأيام والسعة اليومية ----
    const lastExam = examDates[examDates.length - 1];
    const days = [];
    for (let d = today; d < lastExam || d === today; d = addDays(d, 1)) days.push(d);
    const cap = {}, used = {}, occupied = {};
    days.forEach((d) => {
      cap[d] = cfg.restDays.includes(weekday(d)) ? 0 : cfg.slotsPerDay;
      occupied[d] = new Set(history.filter((s) => s.date === d).map((s) => s.slot));
      used[d] = occupied[d].size;
    });
    const free = (d, u) => Math.max(0, cap[d] - (u || used)[d]);

    // ---- 4) نافذة المذاكرة ونافذة المراجعة لكل مادة ----
    for (const p of plans) {
      if (p.daysLeft === 0) { p.today = true; continue; }
      const windowDays = days.filter((d) => d < p.examDate);
      let working = windowDays.filter((d) => free(d) > 0);
      if (!working.length) {
        windowDays.forEach((d) => { if (cap[d] === 0) cap[d] = cfg.slotsPerDay; });
        working = windowDays.filter((d) => free(d) > 0);
        if (working.length) warnings.push(W('warn', `كل الأيام المتبقية قبل اختبار «${p.name}» أيام راحة، فاستُخدمت للمذاكرة.`, p.id));
      }
      const n = working.length;
      const hasUnits = p.needs.length > 0;
      let rc;
      if (!hasUnits) rc = Math.min(cfg.reviewDays, n);
      else if (n <= 1) { rc = 0; p.intensive = n === 1; }
      else rc = Math.min(cfg.reviewDays, n - 1);
      p.reviewDays = working.slice(n - rc);
      p.studyDays = working.slice(0, n - rc);
      p.studySet = new Set(p.studyDays);
      // عند ضيق الوقت يُسمح بإكمال الشابترات في أيام المراجعة قبل اللجوء إلى الدمج
      p.allDays = working;
      p.allSet = new Set(working);
      if (hasUnits && rc < cfg.reviewDays && n > 0) {
        warnings.push(W('warn', `الوقت المتبقي لاختبار «${p.name}» (${n} ${n === 1 ? 'يوم' : 'أيام'}) لا يكفي لـ ${cfg.reviewDays} أيام مراجعة كاملة، فخُصص ${p.intensive ? 'يوم واحد مكثف للمذاكرة والمراجعة معاً' : rc + ' للمراجعة'}.`, p.id));
      }
    }

    // ---- 5) المرحلة الأولى: حجز جلسات المراجعة النهائية ----
    const placed = []; // { plan, date, kind, unit }
    for (const d of days) {
      const reviewers = plans.filter((p) => p.reviewDays.includes(d) || (p.intensive && p.studyDays[0] === d));
      if (!reviewers.length) continue;
      const f = free(d);
      if (f <= 0) continue;
      const othersNeed = plans.some((p) => !reviewers.includes(p) && p.needs.length && p.studySet && p.studySet.has(d));
      const intensiveOnly = reviewers.every((p) => p.intensive);
      let quota = intensiveOnly ? reviewers.length
        : othersNeed ? Math.max(reviewers.length, Math.ceil(f * 0.6)) : f;
      quota = Math.min(quota, f);
      // حد أقصى لكل مادة: نصف اليوم في اليوم الأخير قبل الاختبار، وثلثه في أيام المراجعة الأخرى
      const perPlanCap = (p) => p.intensive ? 1
        : d === p.reviewDays[p.reviewDays.length - 1] ? Math.ceil(cfg.slotsPerDay / 2)
        : Math.max(1, Math.ceil(cfg.slotsPerDay / 3));
      const got = new Map();
      let guard = 0;
      while (quota > 0 && guard++ < 1000) {
        let progressed = false;
        for (const p of reviewers) {
          if (quota <= 0) break;
          const g = got.get(p) || 0;
          if (g >= perPlanCap(p)) continue;
          got.set(p, g + 1);
          placed.push({ plan: p, date: d, kind: 'review' });
          used[d]++; quota--; progressed = true;
        }
        if (!progressed) break;
      }
    }
    plans.forEach((p) => {
      if (!p.today && (p.reviewDays.length || p.intensive) && !placed.some((x) => x.plan === p && x.kind === 'review')) {
        warnings.push(W('warn', `لم يتبقَّ وقت لمراجعة «${p.name}» قبل الاختبار.`, p.id));
      }
    });

    // ---- 6) المرحلة الثانية: توزيع الشابترات (الأقرب أجلاً والأكثر ضغطاً أولاً) ----
    function runStudy(paced) {
      const u = Object.assign({}, used);
      const queues = new Map(plans.map((p) => [p, p.units.slice()]));
      const out = [];
      for (const d of days) {
        const setOf = (p) => (paced ? p.studySet : p.allSet);
        const cands = plans.filter((p) => setOf(p) && setOf(p).has(d));
        if (!cands.length) continue;
        const remDays = (p) => Math.max(1, (paced ? p.studyDays : p.allDays).filter((x) => x >= d && free(x, u) > 0).length);
        const limit = new Map(cands.map((p) => [p, Math.ceil(queues.get(p).length / remDays(p))]));
        const taken = new Map();
        let last = null, streak = 0;
        while (free(d, u) > 0) {
          let best = null, bestScore = -Infinity;
          for (const p of cands) {
            const q = queues.get(p);
            if (!q.length) continue;
            const t = taken.get(p) || 0;
            if (paced && t >= limit.get(p)) continue;
            // الوضع المتوازن: حصة يومية عادلة مع تنويع المواد.
            // الوضع الاحتياطي: الأقرب اختباراً أولاً (EDF) لأنه الأمثل لإدخال أكبر قدر قبل المواعيد
            let score = paced ? q.length / remDays(p) - t : -plans.indexOf(p);
            if (paced && p === last && streak >= 2) score -= 1; // تنويع المواد خلال اليوم
            if (score > bestScore + 1e-9) { best = p; bestScore = score; }
          }
          if (!best) break;
          const unit = queues.get(best).shift();
          out.push({ plan: best, date: d, kind: 'study', unit });
          u[d]++;
          taken.set(best, (taken.get(best) || 0) + 1);
          streak = best === last ? streak + 1 : 1;
          last = best;
        }
      }
      const leftovers = plans.filter((p) => queues.get(p).length);
      return { out, leftovers, queues, used: u };
    }

    // الضغط العادل عند ضيق الوقت: نقلّص الأجزاء أولاً (جلسة لكل شابتر كحد أدنى) في كل المواد المتداخلة،
    // ولا ندمج الشابترات إلا إذا لم يكفِ ذلك
    const core = (p) => p.needs.length;
    const targets = new Map();
    plans.forEach((p) => {
      p.fullCount = buildUnits(p.needs, null).length;
      const canStudy = !p.today && p.allDays && p.allDays.length > 0;
      targets.set(p, canStudy ? p.fullCount : 0);
    });
    const attemptStudy = () => {
      plans.forEach((p) => { p.units = buildUnits(p.needs, targets.get(p)); });
      const paced = runStudy(true);
      return paced.leftovers.length ? runStudy(false) : paced;
    };
    let study = attemptStudy();
    for (let attempt = 0; attempt < 300 && study.leftovers.length; attempt++) {
      let changed = false;
      for (const p of study.leftovers) {
        const left = study.queues.get(p).length;
        // كل المواد المتداخلة زمنياً (ومنها المادة نفسها) تتنازل عن جلسات بالتساوي النسبي
        const pool = plans.filter((q) => targets.get(q) > core(q) &&
          (q === p || (q.allDays && q.allDays.length && q.allDays[0] < p.examDate)));
        let deficit = left;
        while (deficit > 0 && pool.some((q) => targets.get(q) > core(q))) {
          // نأخذ من المادة الأعلى في «جلسات لكل شابتر» حتى يتوزع التقليص بعدل
          pool.sort((x, y) => targets.get(y) / core(y) - targets.get(x) / core(x) || y.examDate.localeCompare(x.examDate));
          const q = pool[0];
          targets.set(q, targets.get(q) - 1); deficit--; changed = true;
        }
        // لم يعد ممكناً التقليص دون دمج الشابترات
        if (deficit > 0) {
          const t = targets.get(p);
          if (t > 0) { targets.set(p, Math.max(0, t - deficit)); changed = true; }
        }
      }
      if (!changed) break;
      study = attemptStudy();
    }
    Object.assign(used, study.used);
    placed.push(...study.out);

    plans.forEach((p) => {
      if (!p.needs.length || p.today) return;
      const fitted = p.units.length - study.queues.get(p).length;
      if (fitted === 0) {
        warnings.push(W('error', `لا يوجد وقت لمذاكرة شابترات «${p.name}» قبل اختبارها. زد ساعات المذاكرة أو قلّل أيام الراحة.`, p.id));
      } else if (fitted < core(p)) {
        warnings.push(W('warn', `الوقت لا يكفي لـ«${p.name}»، فدُمجت ${core(p)} شابترات في ${sessionsWord(fitted)}. زد ساعات المذاكرة لتحسين التوزيع.`, p.id));
      } else if (fitted < p.fullCount) {
        warnings.push(W('warn', `قُلّصت جلسات «${p.name}» من ${p.fullCount} إلى ${fitted} (جلسة لكل شابتر على الأقل) لضيق الوقت. زد ساعات المذاكرة لتفصيل أكثر.`, p.id));
      }
    });

    // ---- 7) المرحلة الثالثة: مراجعة متباعدة في الوقت الفارغ ----
    if (cfg.spacedReview) {
      const touched = new Map(); // plan -> Map(chapterId -> آخر تاريخ مذاكرة/مراجعة)
      plans.forEach((p) => touched.set(p, new Map()));
      history.forEach((s) => {
        const p = plans.find((x) => x.id === s.subjectId);
        if (p && s.kind === 'study') (s.chapterIds || []).filter((c) => p.chapters.some((x) => x.id === c)).forEach((c) => touched.get(p).set(c, s.date < today ? s.date : addDays(today, -1)));
      });
      const studyByDate = {};
      placed.filter((x) => x.kind === 'study').forEach((x) => { (studyByDate[x.date] = studyByDate[x.date] || []).push(x); });
      for (const d of days) {
        for (const p of plans) {
          if (free(d) <= 0) break;
          if (p.today || d >= p.examDate) continue;
          if (p.reviewDays.includes(d)) {
            // جلسة إضافية لحل الأسئلة في أيام المراجعة إن بقي وقت
            placed.push({ plan: p, date: d, kind: 'review' });
            used[d]++;
            continue;
          }
          const map = touched.get(p);
          let bestCh = null, bestGap = 0;
          map.forEach((last, ch) => {
            const gap = diffDays(last, d);
            if (gap >= 2 && gap > bestGap) { bestGap = gap; bestCh = ch; }
          });
          if (bestCh) {
            placed.push({ plan: p, date: d, kind: 'spaced', unit: { chapterIds: [bestCh], part: 1, parts: 1 } });
            map.set(bestCh, d);
            used[d]++;
          }
        }
        (studyByDate[d] || []).forEach((x) => x.unit.chapterIds.forEach((c) => touched.get(x.plan).set(c, d)));
      }
    }

    // ---- 8) مواد اختبارها اليوم: مراجعة سريعة ----
    plans.filter((p) => p.today).forEach((p) => {
      warnings.push(W('error', `اختبار «${p.name}» اليوم! أُضيفت جلسة مراجعة سريعة للملخصات فقط.`, p.id));
      placed.push({ plan: p, date: today, kind: 'quick' });
    });

    // ---- 9) توزيع محتوى جلسات المراجعة النهائية على الشابترات ----
    plans.forEach((p) => {
      const revs = placed.filter((x) => x.plan === p && x.kind === 'review').sort((a, b) => a.date.localeCompare(b.date));
      if (!revs.length) return;
      const chIds = p.chapters.map((c) => c.id);
      const chunks = revs.length - 1;
      revs.forEach((r, i) => {
        if (i === revs.length - 1 || !chIds.length) { r.unit = { chapterIds: [], comprehensive: true }; return; }
        const a = Math.floor(i * chIds.length / chunks), b = Math.floor((i + 1) * chIds.length / chunks);
        const ids = chIds.slice(a, b);
        r.unit = ids.length ? { chapterIds: ids } : { chapterIds: [], practice: true };
      });
    });

    // ---- 10) ترتيب جلسات كل يوم وإسناد الفترات: الأصعب في بداية اليوم (ذروة التركيز) ----
    const order = { quick: 0, review: 1, study: 2, spaced: 3 };
    const sessions = [];
    const byDay = {};
    placed.forEach((x) => { (byDay[x.date] = byDay[x.date] || []).push(x); });
    Object.keys(byDay).sort().forEach((d) => {
      const list = byDay[d].sort((a, b) =>
        order[a.kind] - order[b.kind] ||
        (a.kind === 'review' ? a.plan.examDate.localeCompare(b.plan.examDate) : 0) ||
        b.plan.rank - a.plan.rank || a.plan.examDate.localeCompare(b.plan.examDate));
      const occ = new Set(occupied[d] || []);
      let slot = 0;
      list.forEach((x) => {
        while (occ.has(slot)) slot++;
        occ.add(slot);
        const unit = x.unit || { chapterIds: [] };
        sessions.push({
          id: nextId(), date: d, slot, subjectId: x.plan.id, kind: x.kind,
          chapterIds: unit.chapterIds || [], part: unit.part || 1, parts: unit.parts || 1,
          comprehensive: !!unit.comprehensive, practice: !!unit.practice, merged: !!unit.merged,
          minutes: cfg.sessionMinutes, done: false, manual: false
        });
      });
    });

    return {
      sessions, warnings,
      meta: {
        slotsPerDay: cfg.slotsPerDay, settings: cfg, today, days: days.length,
        counts: {
          study: sessions.filter((s) => s.kind === 'study').length,
          review: sessions.filter((s) => s.kind === 'review').length,
          spaced: sessions.filter((s) => s.kind === 'spaced').length
        }
      }
    };
  }

  // وصف نصي للجلسة (يُحسب وقت العرض ليبقى متوافقاً مع تعديل أسماء الشابترات)
  function describeSession(session, subject) {
    const chapters = (subject && subject.chapters) || [];
    const title = (id) => { const c = chapters.find((x) => x.id === id); return c ? c.title : 'شابتر محذوف'; };
    const ids = session.chapterIds || [];
    switch (session.kind) {
      case 'quick': return 'مراجعة سريعة للملخصات قبل الاختبار';
      case 'spaced': return 'مراجعة متباعدة: ' + (ids.length ? ids.map(title).join('، ') : 'ما سبق مذاكرته');
      case 'review':
        if (session.comprehensive) return chapters.length ? 'مراجعة شاملة وحل نموذج اختبار' : 'مراجعة عامة للمادة';
        if (session.practice || !ids.length) return 'حل أسئلة متوقعة وتمارين متنوعة';
        return 'مراجعة: ' + ids.map(title).join('، ');
      default:
        if (!ids.length) return 'مذاكرة عامة';
        if (ids.length > 1) return 'مذاكرة مدمجة: ' + ids.map(title).join('، ');
        return title(ids[0]) + (session.parts > 1 ? ` (جزء ${session.part} من ${session.parts})` : '');
    }
  }

  // نسبة إنجاز شابتر من جلسات المذاكرة المرتبطة به
  function chapterProgress(chapter, sessions) {
    if (chapter.done) return 100;
    const related = sessions.filter((s) => s.kind === 'study' && (s.chapterIds || []).includes(chapter.id));
    if (!related.length) return 0;
    if (related.some((s) => s.done && s.part === s.parts)) return 100;
    return Math.round(100 * related.filter((s) => s.done).length / related.length);
  }

  return {
    DIFFICULTY, DEFAULT_SETTINGS,
    parseDate, formatDate, addDays, diffDays, todayLocal, weekday,
    normalizeSettings, partsFor, chapterNeeds, buildUnits, examUrgency,
    generateSchedule, describeSession, examChapters, chapterProgress, sessionsWord
  };
});
