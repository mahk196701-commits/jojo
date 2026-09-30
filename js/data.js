/* =========================================================================
   data.js — المحتوى الثابت: الخطة الدراسية، الشابترات المقترحة، تقنيات المذاكرة،
   النصائح، وقوالب الأسئلة الإرشادية
   ========================================================================= */
(function (root) {
  'use strict';

  // ===== الخطة الدراسية (من ملف الخطة: جامعة طيبة — كلية الهندسة — هندسة الاتصالات) =====
  // type: memorize (حفظ) | understand (فهم) | apply (تطبيق) | math (رياضيات) | language (لغات)
  const STUDY_PLAN = {
    university: 'جامعة طيبة',
    college: 'كلية الهندسة',
    major: 'هندسة الاتصالات',
    admission: '1448هـ — الفصل الأول',
    levels: [
      { level: 1, status: 'مسجّل', courses: [
        { code: 'PHYS 103', name: 'فيزياء (1)', credits: 4, difficulty: 'hard', type: 'apply' },
        { code: 'MATH 105', name: 'تفاضل وتكامل (1)', credits: 3, difficulty: 'hard', type: 'math' },
        { code: 'GS 101', name: 'دراسات إسلامية: العقيدة والعبادة', credits: 2, difficulty: 'easy', type: 'memorize' },
        { code: 'ENG 101', name: 'مهارات اللغة الإنجليزية (1)', credits: 4, difficulty: 'medium', type: 'language' },
        { code: 'GS 111', name: 'مهارات اللغة العربية (1)', credits: 2, difficulty: 'easy', type: 'language' }
      ] },
      { level: 2, courses: [
        { code: 'ENG 102', name: 'مهارات اللغة الإنجليزية (2)', credits: 4, difficulty: 'medium', type: 'language' },
        { code: 'GS 104', name: 'دراسات إسلامية: القيم والأخلاق الإسلامية', credits: 2, difficulty: 'easy', type: 'memorize' },
        { code: 'CHEM 103', name: 'كيمياء (1)', credits: 4, difficulty: 'medium', type: 'apply' },
        { code: 'PHYS 104', name: 'فيزياء (2)', credits: 4, difficulty: 'hard', type: 'apply' },
        { code: 'MATH 106', name: 'تفاضل وتكامل (2)', credits: 3, difficulty: 'hard', type: 'math' }
      ] },
      { level: 3, courses: [
        { code: 'ENGL 103', name: 'مهارات الكتابة', credits: 3, difficulty: 'medium', type: 'language' },
        { code: 'GE 205', name: 'برمجة وتطبيقات الحاسب الآلي', credits: 3, difficulty: 'medium', type: 'apply' },
        { code: 'EE 201', name: 'دوائر كهربائية (1)', credits: 4, difficulty: 'hard', type: 'apply' },
        { code: 'GE 407', name: 'إدارة هندسية', credits: 2, difficulty: 'easy', type: 'understand' },
        { code: 'MATH 308', name: 'المعادلات التفاضلية', credits: 3, difficulty: 'hard', type: 'math' },
        { code: 'GE 101', name: 'مقدمة في الرسم الهندسي', credits: 2, difficulty: 'medium', type: 'apply' }
      ] },
      { level: 4, courses: [
        { code: 'EE 341', name: 'أنظمة وإشارات', credits: 3, difficulty: 'hard', type: 'math' },
        { code: 'MATH 315', name: 'الجبر الخطي باستخدام ماتلاب', credits: 3, difficulty: 'hard', type: 'math' },
        { code: 'EE 212', name: 'تصميم رقمي (1)', credits: 4, difficulty: 'medium', type: 'apply' },
        { code: 'ENGL 104', name: 'مهارات الاتصال', credits: 3, difficulty: 'easy', type: 'language' },
        { code: 'GS 112', name: 'مهارات اللغة العربية (2)', credits: 2, difficulty: 'easy', type: 'language' },
        { code: 'TE 212', name: 'تحليل الاستجابة الترددية', credits: 3, difficulty: 'hard', type: 'math' }
      ] },
      { level: 5, courses: [
        { code: 'TE 361', name: 'أجهزة إلكترونية', credits: 4, difficulty: 'hard', type: 'apply' },
        { code: 'MATH 221', name: 'الرياضيات المتقطعة', credits: 2, difficulty: 'medium', type: 'math' },
        { code: 'FE 1', name: 'مقرر اختياري حر', credits: 2, difficulty: 'easy', type: 'understand' },
        { code: 'GSE 1', name: 'مقرر متطلب جامعة اختياري (1)', credits: 2, difficulty: 'easy', type: 'memorize' },
        { code: 'ENGL 214', name: 'مهارات الكتابة الفنية', credits: 3, difficulty: 'medium', type: 'language' },
        { code: 'TE 311', name: 'العمليات العشوائية في أنظمة الاتصالات', credits: 3, difficulty: 'hard', type: 'math' }
      ] },
      { level: 6, courses: [
        { code: 'TE 322', name: 'معالجة الإشارات الرقمية', credits: 3, difficulty: 'hard', type: 'math' },
        { code: 'TE 332', name: 'أنظمة اتصالات (1)', credits: 3, difficulty: 'hard', type: 'apply' },
        { code: 'TE 352', name: 'المجالات والموجات الكهرومغناطيسية', credits: 3, difficulty: 'hard', type: 'math' },
        { code: 'MATH 317', name: 'مواضيع مختارة في الرياضيات', credits: 3, difficulty: 'hard', type: 'math' },
        { code: 'GE 102', name: 'مقدمة في التصميم الهندسي', credits: 2, difficulty: 'medium', type: 'understand' },
        { code: 'GSE 2', name: 'مقرر متطلب جامعة اختياري (2)', credits: 2, difficulty: 'easy', type: 'memorize' }
      ] },
      { level: 7, courses: [
        { code: 'TE 441', name: 'شبكات المعلومات', credits: 3, difficulty: 'medium', type: 'understand' },
        { code: 'TE 435', name: 'أنظمة اتصالات (2)', credits: 3, difficulty: 'hard', type: 'apply' },
        { code: 'TE 433', name: 'الاتصالات الضوئية', credits: 3, difficulty: 'hard', type: 'apply' },
        { code: 'TE 431', name: 'معمل الاتصالات (1)', credits: 1, difficulty: 'medium', type: 'apply' },
        { code: 'GSE 3', name: 'مقرر متطلب جامعة اختياري (3)', credits: 2, difficulty: 'easy', type: 'memorize' },
        { code: 'TE 451', name: 'تخطيط وتصميم الترددات الراديوية', credits: 3, difficulty: 'hard', type: 'apply' },
        { code: 'GE 405', name: 'الاقتصاد الهندسي', credits: 2, difficulty: 'medium', type: 'math' }
      ] },
      { level: 8, courses: [
        { code: 'TE 1', name: 'مقرر اختياري برنامج (1)', credits: 3, difficulty: 'medium', type: 'understand' },
        { code: 'TE 492', name: 'مشروع تخرج (1)', credits: 2, difficulty: 'medium', type: 'apply' },
        { code: 'TE 444', name: 'مقدمة في الأمن السيبراني', credits: 3, difficulty: 'medium', type: 'understand' },
        { code: 'TE 436', name: 'اتصالات الأقمار الصناعية', credits: 3, difficulty: 'hard', type: 'apply' },
        { code: 'TE 434', name: 'معمل الاتصالات (2)', credits: 1, difficulty: 'medium', type: 'apply' },
        { code: 'TE 432', name: 'شبكات الاتصالات المتنقلة', credits: 3, difficulty: 'medium', type: 'understand' },
        { code: 'TE 442', name: 'إنترنت الأشياء', credits: 3, difficulty: 'medium', type: 'understand' }
      ] },
      { level: 9, courses: [
        { code: 'TE 2', name: 'مقرر اختياري برنامج (2)', credits: 3, difficulty: 'medium', type: 'understand' },
        { code: 'TE 591', name: 'مشروع تخرج (2)', credits: 3, difficulty: 'medium', type: 'apply' },
        { code: 'TE 551', name: 'تصميم دوائر الترددات الراديوية', credits: 3, difficulty: 'hard', type: 'apply' },
        { code: 'TE 511', name: 'سياسات تنظيم الاتصالات', credits: 2, difficulty: 'easy', type: 'memorize' },
        { code: 'TE 531', name: 'معمل الاتصالات (3)', credits: 1, difficulty: 'medium', type: 'apply' },
        { code: 'GE 408', name: 'القيادة وريادة الأعمال', credits: 2, difficulty: 'easy', type: 'understand' },
        { code: 'TE 3', name: 'مقرر اختياري برنامج (3)', credits: 3, difficulty: 'medium', type: 'understand' }
      ] },
      { level: 10, courses: [
        { code: 'TE 592', name: 'التدريب التعاوني', credits: 6, difficulty: 'medium', type: 'apply' }
      ] }
    ]
  };

  const LEVEL_NAMES = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

  // ===== شابترات مقترحة لمواد المستوى الأول (عدّلها لتطابق توصيف مقررك) =====
  // topics: موضوعات فرعية تُستخدم في توليد أسئلة أدق
  const SUGGESTED_CHAPTERS = {
    'PHYS 103': [
      { title: 'الفيزياء والقياس (Physics & Measurement)', topics: ['الوحدات الأساسية SI', 'تحليل الأبعاد', 'تحويل الوحدات', 'الأرقام المعنوية'] },
      { title: 'الحركة في بعد واحد (Motion in 1D)', topics: ['السرعة المتوسطة واللحظية', 'التسارع', 'معادلات الحركة بتسارع ثابت', 'السقوط الحر'] },
      { title: 'المتجهات (Vectors)', topics: ['تحليل المتجه إلى مركبات', 'جمع المتجهات', 'متجهات الوحدة'] },
      { title: 'الحركة في بعدين (Motion in 2D)', topics: ['حركة المقذوفات', 'الحركة الدائرية المنتظمة', 'السرعة النسبية'] },
      { title: 'قوانين نيوتن (Newton\'s Laws)', topics: ['القانون الأول والقصور', 'القانون الثاني F = ma', 'القانون الثالث', 'مخطط الجسم الحر'] },
      { title: 'تطبيقات قوانين نيوتن والحركة الدائرية', topics: ['الاحتكاك السكوني والحركي', 'القوة المركزية', 'الحركة على منحدر'] },
      { title: 'الشغل والطاقة الحركية (Work & Kinetic Energy)', topics: ['الشغل بقوة ثابتة ومتغيرة', 'مبرهنة الشغل والطاقة', 'القدرة'] },
      { title: 'حفظ الطاقة (Conservation of Energy)', topics: ['الطاقة الكامنة', 'القوى المحافظة وغير المحافظة', 'قانون حفظ الطاقة الميكانيكية'] },
      { title: 'الزخم الخطي والتصادمات (Momentum & Collisions)', topics: ['الدفع', 'حفظ الزخم', 'التصادم المرن وغير المرن', 'مركز الكتلة'] },
      { title: 'دوران الجسم الجاسئ (Rotation)', topics: ['السرعة والتسارع الزاويان', 'عزم القصور الذاتي', 'العزم', 'طاقة الدوران'] }
    ],
    'MATH 105': [
      { title: 'الدوال والنماذج (Functions)', topics: ['المجال والمدى', 'تركيب الدوال', 'الدوال العكسية', 'الدوال المثلثية والأسية واللوغاريتمية'] },
      { title: 'النهايات (Limits)', topics: ['قوانين النهايات', 'النهايات من جهة واحدة', 'النهايات عند اللانهاية', 'مبرهنة الشطيرة'] },
      { title: 'الاتصال (Continuity)', topics: ['شروط الاتصال', 'أنواع عدم الاتصال', 'مبرهنة القيمة المتوسطة'] },
      { title: 'المشتقات وقواعد الاشتقاق (Derivatives)', topics: ['تعريف المشتقة بالنهاية', 'قاعدة الضرب والقسمة', 'قاعدة السلسلة', 'مشتقات الدوال المثلثية'] },
      { title: 'الاشتقاق الضمني والمعدلات المرتبطة', topics: ['الاشتقاق الضمني', 'المعدلات المرتبطة', 'التقريب الخطي'] },
      { title: 'تطبيقات الاشتقاق (Applications)', topics: ['القيم القصوى', 'مبرهنة القيمة المتوسطة', 'رسم المنحنيات', 'مسائل الأمثلية', 'قاعدة لوبيتال'] },
      { title: 'التكامل (Integrals)', topics: ['المشتقات العكسية', 'مجموع ريمان', 'المبرهنة الأساسية للتفاضل والتكامل', 'التكامل بالتعويض'] }
    ],
    'GS 101': [
      { title: 'مفهوم العقيدة وأهميتها ومصادرها', topics: ['تعريف العقيدة', 'مصادر التلقي', 'خصائص العقيدة الإسلامية'] },
      { title: 'أركان الإيمان', topics: ['الإيمان بالله', 'الإيمان بالملائكة والكتب والرسل', 'اليوم الآخر والقدر'] },
      { title: 'التوحيد وأقسامه', topics: ['توحيد الربوبية', 'توحيد الألوهية', 'توحيد الأسماء والصفات'] },
      { title: 'نواقض التوحيد وما يضاده', topics: ['الشرك الأكبر والأصغر', 'البدعة', 'نواقض الإسلام'] },
      { title: 'مفهوم العبادة وشروط قبولها', topics: ['تعريف العبادة', 'الإخلاص والمتابعة', 'شمول العبادة'] },
      { title: 'أحكام الطهارة والصلاة', topics: ['أنواع الطهارة', 'شروط الصلاة وأركانها', 'مبطلات الصلاة'] },
      { title: 'الزكاة والصيام والحج', topics: ['شروط وجوب الزكاة', 'أحكام الصيام', 'أركان الحج وواجباته'] }
    ],
    'ENG 101': [
      { title: 'Unit 1', topics: ['المفردات', 'Present Simple'] },
      { title: 'Unit 2', topics: ['المفردات', 'Present Continuous'] },
      { title: 'Unit 3', topics: ['المفردات', 'Past Simple'] },
      { title: 'Unit 4', topics: ['المفردات', 'Comparatives & Superlatives'] },
      { title: 'Unit 5', topics: ['المفردات', 'Future forms'] },
      { title: 'Unit 6', topics: ['المفردات', 'Modals'] },
      { title: 'Reading & Writing Skills', topics: ['Skimming & Scanning', 'Paragraph writing'] }
    ],
    'GS 111': [
      { title: 'مهارة الاستماع والتحدث', topics: ['آداب الاستماع', 'مهارات الإلقاء'] },
      { title: 'مهارة القراءة', topics: ['القراءة الناقدة', 'استخلاص الفكرة الرئيسة'] },
      { title: 'الكتابة والإملاء', topics: ['الهمزة المتوسطة والمتطرفة', 'همزتا الوصل والقطع', 'التاء المربوطة والمفتوحة'] },
      { title: 'علامات الترقيم', topics: ['الفاصلة والنقطة', 'علامات الاستفهام والتعجب', 'علامتا التنصيص'] },
      { title: 'النحو الوظيفي', topics: ['الجملة الاسمية', 'الجملة الفعلية', 'المرفوعات والمنصوبات'] },
      { title: 'الأخطاء اللغوية الشائعة', topics: ['أخطاء الكتابة الشائعة', 'التصويب اللغوي'] }
    ]
  };

  // ===== تقنيات المذاكرة =====
  const TECHNIQUES = {
    pomodoro: {
      name: 'بومودورو (Pomodoro)',
      what: 'مذاكرة مركزة لفترة محددة تليها راحة قصيرة، وبعد عدة دورات راحة طويلة.',
      how: ['اضبط المؤقت على مدة التركيز', 'أغلق الجوال والإشعارات', 'ذاكر دون انقطاع حتى يرن المؤقت', 'خذ راحة قصيرة بعيداً عن الشاشة']
    },
    feynman: {
      name: 'تقنية فاينمان (Feynman)',
      what: 'اشرح المفهوم بكلمات بسيطة كأنك تعلّمه لطالب مبتدئ؛ أي تعثر يكشف فجوة في فهمك.',
      how: ['اكتب اسم المفهوم أعلى الورقة', 'اشرحه بلغة بسيطة دون الرجوع للكتاب', 'حدد المواضع التي تعثرت فيها وارجع للمصدر', 'بسّط الشرح واستخدم مثالاً من الواقع']
    },
    activeRecall: {
      name: 'الاستدعاء النشط (Active Recall)',
      what: 'اختبر نفسك بدلاً من إعادة القراءة: أغلق الكتاب واسترجع المعلومات من ذاكرتك.',
      how: ['بعد كل قسم أغلق الكتاب', 'اكتب كل ما تتذكره أو أجب عن أسئلة الشابتر', 'قارن إجابتك بالمصدر وصحّح', 'علّم ما نسيته لتراجعه لاحقاً']
    },
    spaced: {
      name: 'التكرار المتباعد (Spaced Repetition)',
      what: 'راجع المعلومة على فترات متزايدة (بعد يوم، ثم 3 أيام، ثم أسبوع) لتثبيتها في الذاكرة طويلة المدى.',
      how: ['راجع ما ذاكرته اليوم بعد 24 ساعة', 'ثم بعد 3 أيام، ثم بعد أسبوع', 'الجدول يضيف جلسات «مراجعة متباعدة» تلقائياً في الوقت الفارغ']
    },
    mindMap: {
      name: 'الخرائط الذهنية (Mind Mapping)',
      what: 'ارسم فكرة الشابتر الرئيسية في المنتصف وتفرّع منها المفاهيم والعلاقات بينها.',
      how: ['اكتب عنوان الشابتر في منتصف الورقة', 'أضف الأفكار الرئيسية كفروع', 'استخدم ألواناً وكلمات مفتاحية لا جملاً طويلة', 'راجع الخريطة بدل الكتاب في أيام المراجعة']
    },
    practice: {
      name: 'حل المسائل المتدرج (Worked Examples → Practice)',
      what: 'افهم مثالاً محلولاً خطوة بخطوة، ثم حل مسألة مشابهة دون النظر، ثم مسائل متنوعة.',
      how: ['اقرأ مثالاً محلولاً وافهم سبب كل خطوة', 'غطِّ الحل وأعد حله بنفسك', 'حل 3–5 مسائل من نهاية الشابتر', 'سجّل أخطاءك في «دفتر الأخطاء»']
    },
    interleaving: {
      name: 'التداخل (Interleaving)',
      what: 'اخلط أنواع المسائل من شابترات مختلفة في جلسة واحدة لتتعلم اختيار الطريقة المناسبة.',
      how: ['اختر مسائل من 2–3 شابترات', 'حلها بترتيب عشوائي', 'قبل الحل حدد: أي قانون أو طريقة تناسب هذه المسألة؟']
    },
    flashcards: {
      name: 'البطاقات التعليمية (Flashcards)',
      what: 'سؤال أو مصطلح على وجه، والإجابة على الوجه الآخر، مع مراجعة البطاقات الصعبة أكثر.',
      how: ['اكتب بطاقة لكل تعريف أو دليل أو مصطلح', 'راجعها يومياً وافصل البطاقات الصعبة', 'ركّز على الصعبة في المراجعة التالية']
    },
    blurting: {
      name: 'التفريغ (Blurting)',
      what: 'بعد المذاكرة اكتب كل ما تتذكره عن الشابتر على ورقة بيضاء، ثم قارن بالمصدر.',
      how: ['ذاكر القسم 20–30 دقيقة', 'أغلق الكتاب واكتب كل ما تتذكره', 'لوّن بلون مختلف ما نسيته', 'ابدأ به في المراجعة التالية']
    },
    sq3r: {
      name: 'القراءة الفاعلة (SQ3R)',
      what: 'تصفح، اسأل، اقرأ، سمّع، راجع: طريقة منظمة لقراءة الشابترات النظرية.',
      how: ['تصفح العناوين والملخص', 'حوّل كل عنوان إلى سؤال', 'اقرأ بحثاً عن الإجابة', 'سمّع الإجابة بصوتك', 'راجع الأسئلة في نهاية الجلسة']
    }
  };

  // اختيار التقنيات حسب الصعوبة ونوع المادة
  const TECHNIQUES_BY_DIFFICULTY = {
    hard: ['pomodoro', 'activeRecall', 'feynman', 'spaced'],
    medium: ['pomodoro', 'activeRecall', 'mindMap', 'spaced'],
    easy: ['pomodoro', 'mindMap', 'spaced']
  };
  const TECHNIQUES_BY_TYPE = {
    memorize: ['flashcards', 'blurting'],
    understand: ['sq3r', 'feynman'],
    apply: ['practice', 'feynman'],
    math: ['practice', 'interleaving'],
    language: ['flashcards', 'activeRecall']
  };

  // توزيع فترات الراحة حسب الصعوبة
  const BREAK_PLANS = {
    hard:   { focus: 25, shortBreak: 5,  cycles: 4, longBreak: 20, note: 'التركيز العالي يستنزف بسرعة؛ فترات قصيرة تمنع الإرهاق.' },
    medium: { focus: 40, shortBreak: 8,  cycles: 3, longBreak: 20, note: 'توازن بين العمق والاستمرارية.' },
    easy:   { focus: 50, shortBreak: 10, cycles: 2, longBreak: 25, note: 'مادة خفيفة؛ جلسات أطول تكفي مع راحة منتظمة.' }
  };

  // نصائح حسب نوع المادة
  const TYPE_TIPS = {
    memorize: {
      label: 'حفظ',
      tips: ['قسّم المادة إلى مقاطع صغيرة واحفظ كل مقطع بالتكرار المتباعد', 'اربط كل معلومة بدليل أو مثال لتسهيل الاسترجاع', 'سمّع بصوت مرتفع أو لزميل', 'راجع قبل النوم مباشرة: النوم يثبّت المحفوظ', 'اكتب الأدلة والتعريفات على بطاقات وراجعها في أوقات الانتظار']
    },
    understand: {
      label: 'فهم',
      tips: ['ابدأ بالصورة الكبيرة (العناوين والملخص) قبل التفاصيل', 'اشرح كل مفهوم بكلماتك (تقنية فاينمان)', 'اربط المفاهيم ببعضها بخريطة ذهنية', 'اسأل «لماذا؟» و«كيف؟» عند كل فكرة', 'حل أسئلة المقارنة والتعليل لأنها الأكثر تكراراً']
    },
    apply: {
      label: 'تطبيق',
      tips: ['افهم القانون ومتى يُطبّق قبل حفظه', 'ارسم مخططاً للمسألة (مخطط الجسم الحر، الدائرة...) قبل الحل', 'اكتب الوحدات في كل خطوة لتكشف الأخطاء', 'اصنع ورقة قوانين ملخصة وراجعها يومياً', 'حل مسائل الاختبارات السابقة بتوقيت حقيقي']
    },
    math: {
      label: 'رياضيات',
      tips: ['لا تكتفِ بقراءة الحلول: حل بنفسك بالقلم', 'ابدأ بالمسائل السهلة ثم تدرّج', 'احتفظ بدفتر أخطاء وراجعه قبل الاختبار', 'احفظ القواعد والمبرهنات مع شروط تطبيقها', 'تحقق من إجابتك بالتعويض أو الرسم']
    },
    language: {
      label: 'لغات',
      tips: ['تعلّم المفردات في جمل لا كلمات منفردة', 'راجع المفردات يومياً ببطاقات متباعدة', 'اكتب فقرة قصيرة يومياً مستخدماً القاعدة الجديدة', 'اقرأ بصوت مرتفع لتحسين النطق والطلاقة', 'حل تمارين القواعد ثم صحّحها وافهم سبب الخطأ']
    }
  };

  const SOURCE_TIPS = {
    book: 'المصدر كتاب: ركّز على الأمثلة المحلولة وأسئلة نهاية الفصل، واقرأ الملخص أولاً.',
    notes: 'المصدر ملزمة: غالباً مختصرة ومركّزة؛ أضف عليها ملاحظاتك وحل كل تمارينها.',
    lectures: 'المصدر محاضرات: راجع كل محاضرة في يومها، وأكمل النقص من الشرائح والتسجيلات.'
  };

  const TYPE_LABELS = { memorize: 'حفظ', understand: 'فهم', apply: 'تطبيق', math: 'رياضيات', language: 'لغات' };
  const DIFFICULTY_LABELS = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
  const SOURCE_LABELS = { book: 'كتاب', notes: 'ملزمة', lectures: 'محاضرات' };
  const QUESTION_TYPES = { mcq: 'اختيار من متعدد', essay: 'مقالي', tf: 'صح وخطأ', problem: 'مسائل تطبيقية' };
  const QUESTION_STATUS = { todo: 'لم يُذاكر', done: 'تم', review: 'يحتاج مراجعة' };

  // ===== قوالب الأسئلة الإرشادية: {ch} = عنوان الشابتر، {t} = موضوع فرعي =====
  const QUESTION_TEMPLATES = {
    math: [
      ['problem', 'أوجد/احسب: حل 3 مسائل متدرجة على «{t}» من تمارين نهاية الشابتر مع كتابة كل خطوة.'],
      ['problem', 'مسألة تطبيقية: كوّن مسألة من واقع الحياة تستخدم «{t}» ثم حلها.'],
      ['problem', 'أثبت أو برهن: القاعدة الأساسية في «{t}» واذكر شروط استخدامها.'],
      ['mcq', 'اختيار من متعدد: أي الطرق هي الأنسب لحل مسائل «{t}»؟ اكتب 4 خيارات وحدد الصحيح مع السبب.'],
      ['tf', 'صح أم خطأ: «كل قاعدة في {ch} تنطبق دون شروط» — صحّح العبارة واذكر مثالاً مضاداً.'],
      ['essay', 'اشرح بخطواتك: متى تستخدم «{t}»؟ وما الأخطاء الشائعة عند تطبيقها؟']
    ],
    apply: [
      ['problem', 'مسألة: احسب المطلوب في مسألة على «{t}» مع رسم المخطط وكتابة الوحدات.'],
      ['problem', 'مسألة مركّبة: اربط بين «{t}» ومفهوم آخر من «{ch}» في مسألة واحدة.'],
      ['essay', 'علّل: اشرح المبدأ الفيزيائي/الهندسي وراء «{t}» بمثال من الواقع.'],
      ['mcq', 'اختيار من متعدد: ما القانون المستخدم في «{t}»؟ ضع 4 خيارات مع وحدة كل كمية.'],
      ['tf', 'صح أم خطأ: عبارة شائعة الخطأ عن «{t}» — حددها وصحّحها.'],
      ['essay', 'قارن: ما الفرق بين المفاهيم المتشابهة في «{ch}»؟']
    ],
    memorize: [
      ['essay', 'عرّف: «{t}» لغةً واصطلاحاً مع الدليل.'],
      ['essay', 'عدّد: اذكر أقسام/شروط/أركان «{t}» بالترتيب.'],
      ['mcq', 'اختيار من متعدد: أي مما يلي من «{t}»؟ ضع 4 خيارات متقاربة.'],
      ['tf', 'صح أم خطأ: عبارة عن «{t}» مع تصحيح الخطأ إن وجد.'],
      ['essay', 'استدل: اذكر دليلاً من الكتاب أو السنة على «{t}».'],
      ['tf', 'صح أم خطأ: حكم أو مفهوم من «{ch}» يُخلط كثيراً مع غيره.']
    ],
    understand: [
      ['essay', 'اشرح: الفكرة الرئيسية في «{t}» بأسلوبك.'],
      ['essay', 'قارن: بين «{t}» ومفهوم قريب منه في «{ch}».'],
      ['essay', 'علّل: لماذا يُعد «{t}» مهماً؟ وما أثره؟'],
      ['mcq', 'اختيار من متعدد: أي العبارات تصف «{t}» بدقة؟'],
      ['tf', 'صح أم خطأ: عبارة تحليلية عن «{t}» مع التعليل.'],
      ['problem', 'حالة دراسية: طبّق مفهوم «{t}» على موقف واقعي.']
    ],
    language: [
      ['mcq', 'Vocabulary: اختر المرادف/المعنى الصحيح لكلمات «{ch}» (10 كلمات).'],
      ['mcq', 'Grammar / قواعد: اختر الصيغة الصحيحة في جمل على «{t}».'],
      ['tf', 'صح أم خطأ: حدد الجمل الصحيحة لغوياً في «{t}» وصحّح الخاطئة.'],
      ['essay', 'Writing / كتابة: اكتب فقرة من 80–120 كلمة تستخدم فيها «{t}».'],
      ['problem', 'تطبيق: أعد صياغة 5 جمل باستخدام «{t}».'],
      ['essay', 'Reading / قراءة: لخّص نص الشابتر في 3 جمل واستخرج الفكرة الرئيسة.']
    ]
  };

  // اقتراحات أوقات المذاكرة حسب ساعات النشاط
  const ACTIVE_TIMES = {
    morning: { label: 'صباحي', start: '08:00', peak: 'من 8 إلى 11 صباحاً', light: 'بعد العصر' },
    afternoon: { label: 'بعد الظهر', start: '15:30', peak: 'من 4 إلى 7 مساءً', light: 'بعد العشاء' },
    evening: { label: 'مسائي', start: '19:30', peak: 'من 7:30 إلى 10:30 مساءً', light: 'قبل النوم بساعة' }
  };

  root.StudyData = {
    STUDY_PLAN, LEVEL_NAMES, SUGGESTED_CHAPTERS, TECHNIQUES, TECHNIQUES_BY_DIFFICULTY, TECHNIQUES_BY_TYPE,
    BREAK_PLANS, TYPE_TIPS, SOURCE_TIPS, TYPE_LABELS, DIFFICULTY_LABELS, SOURCE_LABELS,
    QUESTION_TYPES, QUESTION_STATUS, QUESTION_TEMPLATES, ACTIVE_TIMES
  };
})(typeof self !== 'undefined' ? self : this);
