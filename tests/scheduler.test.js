/* اختبارات خوارزمية توليد الجدول — التشغيل: node --test tests/ */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/scheduler.js');

const TODAY = '2026-10-01';
let n = 0;
const idGen = () => 'id' + (n++);

function chapters(count, prefix = 'c') {
  return Array.from({ length: count }, (_, i) => ({ id: prefix + i, title: 'الشابتر ' + (i + 1), pages: 0, done: false }));
}
function subject(id, examOffset, chCount, difficulty = 'medium') {
  return { id, name: 'مادة ' + id, difficulty, examDate: examOffset == null ? '' : S.addDays(TODAY, examOffset), chapters: chapters(chCount, id + '_c') };
}
function run(subjects, settings = {}, history = []) {
  return S.generateSchedule({ subjects, settings, today: TODAY, history, idGen });
}
function assertNoOverbooking(res, slotsPerDay) {
  const perDay = {};
  res.sessions.forEach((s) => { perDay[s.date] = (perDay[s.date] || 0) + 1; });
  Object.entries(perDay).forEach(([d, c]) => assert.ok(c <= slotsPerDay, `اليوم ${d} فيه ${c} جلسات > ${slotsPerDay}`));
  const keys = res.sessions.map((s) => s.date + '#' + s.slot);
  assert.equal(new Set(keys).size, keys.length, 'تكرار فترة في نفس اليوم');
}

test('حالة عادية: كل الشابترات قبل الاختبار + يوما مراجعة', () => {
  const sub = subject('a', 20, 5, 'medium');
  const res = run([sub], { dailyHours: 4 });
  const study = res.sessions.filter((s) => s.kind === 'study');
  assert.equal(study.length, 10); // 5 شابترات × جلستان
  study.forEach((s) => assert.ok(s.date < S.addDays(sub.examDate, -2)));
  const reviews = res.sessions.filter((s) => s.kind === 'review');
  const reviewDates = new Set(reviews.map((s) => s.date));
  assert.deepEqual([...reviewDates].sort(), [S.addDays(sub.examDate, -2), S.addDays(sub.examDate, -1)]);
  assert.ok(reviews.some((r) => r.comprehensive), 'آخر مراجعة شاملة');
  res.sessions.forEach((s) => assert.ok(s.date < sub.examDate));
  assertNoOverbooking(res, 4);
});

test('مادة بدون شابترات: مراجعة عامة فقط مع تنبيه', () => {
  const res = run([subject('a', 10, 0)]);
  assert.ok(res.warnings.some((w) => w.message.includes('بلا شابترات')));
  assert.equal(res.sessions.filter((s) => s.kind === 'study').length, 0);
  assert.ok(res.sessions.filter((s) => s.kind === 'review').length >= 2);
});

test('تاريخ اختبار ماضٍ: تُستبعد المادة', () => {
  const res = run([subject('a', -3, 4)]);
  assert.equal(res.sessions.length, 0);
  assert.ok(res.warnings.some((w) => w.message.includes('مضى')));
});

test('صفر أيام متبقية (الاختبار اليوم): جلسة مراجعة سريعة فقط', () => {
  const res = run([subject('a', 0, 4)]);
  assert.equal(res.sessions.length, 1);
  assert.equal(res.sessions[0].kind, 'quick');
  assert.equal(res.sessions[0].date, TODAY);
  assert.ok(res.warnings.some((w) => w.level === 'error' && w.message.includes('اليوم')));
});

test('يوم واحد متبقٍ: يوم مكثف (مذاكرة مدمجة + مراجعة)', () => {
  const res = run([subject('a', 1, 6, 'hard')], { dailyHours: 3 });
  assert.ok(res.sessions.every((s) => s.date === TODAY));
  assert.equal(res.sessions.filter((s) => s.kind === 'review').length, 1);
  const study = res.sessions.filter((s) => s.kind === 'study');
  assert.equal(study.length, 2);
  const covered = new Set(study.flatMap((s) => s.chapterIds));
  assert.equal(covered.size, 6, 'كل الشابترات مغطاة بالدمج');
  assertNoOverbooking(res, 3);
});

test('عدم إدخال ساعات المذاكرة: قيمة افتراضية وتنبيه', () => {
  const res = run([subject('a', 10, 3)], { dailyHours: '' });
  assert.equal(res.meta.slotsPerDay, 4);
  assert.ok(res.warnings.some((w) => w.message.includes('ساعات المذاكرة')));
});

test('بدون تاريخ اختبار: لا جدول مع تنبيه', () => {
  const res = run([subject('a', null, 3)]);
  assert.equal(res.sessions.length, 0);
  assert.ok(res.warnings.some((w) => w.message.includes('لم يُحدَّد تاريخ')));
});

test('تعارض مواعيد: مادتان في اليوم نفسه', () => {
  const res = run([subject('a', 12, 4), subject('b', 12, 4)], { dailyHours: 4 });
  assert.ok(res.warnings.some((w) => w.message.includes('تعارض')));
  ['a', 'b'].forEach((id) => {
    assert.ok(res.sessions.some((s) => s.subjectId === id && s.kind === 'review'), 'لكل مادة مراجعة');
    assert.equal(res.sessions.filter((s) => s.subjectId === id && s.kind === 'study').length, 8);
  });
  assertNoOverbooking(res, 4);
});

test('ضغط الوقت: الشابترات تُدمج ولا يتجاوز الجدول السعة', () => {
  const res = run([subject('a', 4, 12, 'hard'), subject('b', 5, 10, 'hard')], { dailyHours: 2 });
  assertNoOverbooking(res, 2);
  ['a', 'b'].forEach((id) => {
    const exam = S.addDays(TODAY, id === 'a' ? 4 : 5);
    res.sessions.filter((s) => s.subjectId === id).forEach((s) => assert.ok(s.date < exam));
  });
  assert.ok(res.warnings.some((w) => w.message.includes('دُمجت') || w.message.includes('قُلّصت') || w.message.includes('لا يوجد وقت')));
});

test('أيام الراحة لا تُجدول فيها جلسات', () => {
  const res = run([subject('a', 21, 6)], { restDays: [5] });
  res.sessions.forEach((s) => assert.notEqual(S.weekday(s.date), 5));
});

test('الجلسات المنجزة سابقاً تُحتسب ولا تتكرر', () => {
  const sub = subject('a', 15, 3, 'medium');
  const history = [{ id: 'h1', date: '2026-09-28', slot: 0, subjectId: 'a', kind: 'study', chapterIds: ['a_c0'], part: 2, parts: 2, done: true }];
  const res = run([sub], {}, history);
  assert.equal(res.sessions.filter((s) => s.kind === 'study' && s.chapterIds.includes('a_c0')).length, 0);
  assert.equal(res.sessions.filter((s) => s.kind === 'study').length, 4);
});

test('الصعوبة وعدد الصفحات يحددان عدد الجلسات', () => {
  assert.equal(S.partsFor({ pages: 0 }, 'easy'), 1);
  assert.equal(S.partsFor({ pages: 0 }, 'hard'), 3);
  assert.equal(S.partsFor({ pages: 40 }, 'hard'), 5);
  assert.equal(S.partsFor({ pages: 500 }, 'easy'), 6);
});

test('ألوان قرب الاختبار', () => {
  assert.equal(S.examUrgency(3), 'red');
  assert.equal(S.examUrgency(7), 'orange');
  assert.equal(S.examUrgency(14), 'orange');
  assert.equal(S.examUrgency(15), 'green');
  assert.equal(S.examUrgency(-1), 'past');
});

test('خطة المستوى الأول كاملة: 5 مواد بتواريخ متقاربة', () => {
  const subs = [subject('phys', 10, 10, 'hard'), subject('math', 12, 7, 'hard'), subject('eng', 14, 7, 'medium'), subject('gs', 16, 6, 'easy'), subject('ar', 16, 6, 'easy')];
  const res = run(subs, { dailyHours: 5 });
  assertNoOverbooking(res, 5);
  subs.forEach((s) => {
    const mine = res.sessions.filter((x) => x.subjectId === s.id);
    assert.ok(mine.length > 0);
    mine.forEach((x) => assert.ok(x.date < s.examDate));
    const covered = new Set(mine.filter((x) => x.kind === 'study').flatMap((x) => x.chapterIds));
    assert.equal(covered.size, s.chapters.length, `كل شابترات ${s.id} مغطاة`);
  });
});
