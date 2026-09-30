/* يبني نسخة من ملف واحد (dist/study-notebook.html) بدمج CSS وJS داخل HTML
   التشغيل: node tools/build.js            → ملف HTML كامل
            node tools/build.js --fragment → محتوى بلا <html>/<head>/<body> (للنشر كصفحة مضمّنة) */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const fragment = process.argv.includes('--fragment');
const outArg = process.argv.find((a) => a.startsWith('--out='));
const out = outArg ? path.resolve(outArg.slice(6)) : path.join(root, 'dist', fragment ? 'study-notebook.fragment.html' : 'study-notebook.html');

let html = read('index.html');
// حماية نص السكربت من إنهاء الوسم مبكراً
const inlineJs = (f) => '<script>\n' + read(f).replace(/<\/script/gi, '<\\/script') + '\n</script>';
html = html.replace('<link rel="stylesheet" href="styles.css">', () => '<style>\n' + read('styles.css') + '\n</style>');
['js/data.js', 'js/question-bank.js', 'js/scheduler.js', 'js/app.js'].forEach((f) => {
  html = html.replace(`<script src="${f}"></script>`, () => inlineJs(f));
});

if (fragment) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<meta charset[^>]*>\s*/i, '')
    .replace(/<meta name="viewport"[^>]*>\s*/i, '');
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  // RTL على الجذر لأن الغلاف الخارجي لا يحمل dir
  html = head.trim() + '\n<script>document.documentElement.lang="ar";document.documentElement.dir="rtl";</script>\n' + body.trim() + '\n';
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('built', path.relative(process.cwd(), out), (html.length / 1024).toFixed(1) + ' KB');
