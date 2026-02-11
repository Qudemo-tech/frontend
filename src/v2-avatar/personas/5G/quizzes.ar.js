/**
 * 5G Persona - Quiz Definitions (Arabic)
 *
 * MCQ quizzes for each module and the final assessment.
 * Arabic translation of quizzes.js - structure and logic values are identical.
 */

export const moduleQuizzes = {
  'quiz-5g-basics': {
    intro: "هيا نختبر فهمك لأساسيات 5G. سأقرأ كل سؤال مع 4 خيارات. يرجى النقر على إجابتك على الشاشة - الإجابات الصوتية غير مدعومة في الاختبارات.",
    questions: [
      {
        question: "ماذا يعني حرف 'G' في 5G؟",
        options: [
          "عالمي (Global)",
          "جيل (Generation)",
          "جيجابت (Gigabit)",
          "جاذبية (Gravity)"
        ],
        correctIndex: 1,
        explanation: "حرف 'G' يعني جيل (Generation). شبكة 5G هي الجيل الخامس من معايير الشبكات الخلوية."
      },
      {
        question: "أي مما يلي ليس من الركائز الأساسية لخدمات 5G؟",
        options: [
          "eMBB (النطاق العريض المحسّن للأجهزة المتنقلة)",
          "URLLC (الاتصالات فائقة الموثوقية ومنخفضة التأخير)",
          "mMTC (الاتصالات الآلية الضخمة)",
          "Wi-Fi"
        ],
        correctIndex: 3,
        explanation: "الفئات الثلاث الأساسية لخدمات 5G هي eMBB (معدلات بيانات عالية) و URLLC (تأخير منخفض وموثوقية عالية) و mMTC (اتصال أجهزة ضخم). تُعد Wi-Fi تقنية مكمّلة لكنها ليست جزءاً من المواصفات الأساسية لشبكة 5G."
      }
    ],
    passingScore: 1,
    completionMessage: "عمل رائع! أنت تفهم أساسيات 5G. هيا نستمر في التعرف على السرعة وزمن الاستجابة."
  },

  'quiz-technical-specs': {
    intro: "الآن لنختبر معرفتك بالمواصفات التقنية لشبكة 5G. سأقرأ كل سؤال مع 4 خيارات. يرجى النقر على إجابتك على الشاشة.",
    questions: [
      {
        question: "ما هي سرعة التنزيل القصوى النظرية لشبكة 5G (وفقاً لمعايير 3GPP)؟",
        options: [
          "100 Mbps",
          "1 Gbps",
          "20 Gbps",
          "100 Gbps"
        ],
        correctIndex: 2,
        explanation: "يحدد معيار 5G سرعة تنزيل تصل إلى 20 Gbps في الظروف المثالية. السرعات الفعلية أقل بكثير لكنها لا تزال أسرع بشكل ملحوظ من 4G."
      },
      {
        question: "لماذا تحتاج شبكة 5G إلى خلايا صغيرة في كثير من عمليات النشر؟",
        options: [
          "لأنها تبدو أفضل في المدن",
          "لأن الإشارات عالية التردد ذات مدى محدود وقدرة اختراق ضعيفة",
          "لتوفير الكهرباء",
          "لتحسين تغطية راديو FM"
        ],
        correctIndex: 1,
        explanation: "يوفر الطيف الترددي العالي (خاصة mmWave) سرعات عالية جداً لكنه ينتقل لمسافات قصيرة ويُحجب بسهولة بالعوائق، مما يتطلب شبكات أكثر كثافة من الهوائيات الصغيرة."
      }
    ],
    passingScore: 1,
    completionMessage: "ممتاز! أنت الآن تفهم الجوانب التقنية لشبكة 5G. هيا نستكشف التطبيقات الواقعية."
  },

  'final-quiz': {
    intro: "هذا هو الاختبار النهائي لتقييم معرفتك الشاملة بشبكة 5G. سأقرأ كل سؤال مع 4 خيارات. يرجى النقر على إجابتك على الشاشة.",
    questions: [
      {
        question: "أي نوع من خدمات 5G هو الأنسب لتمكين الجراحة عن بُعد أو الروبوتية؟",
        options: [
          "eMBB",
          "URLLC (الاتصالات فائقة الموثوقية ومنخفضة التأخير)",
          "mMTC",
          "4G LTE"
        ],
        correctIndex: 1,
        explanation: "تتطلب الجراحة عن بُعد زمن تأخير منخفضاً جداً وموثوقية عالية للغاية، وهو ما تركز عليه تقنية URLLC بشكل أساسي."
      },
      {
        question: "ماذا يتيح 'تقسيم الشبكة' (Network Slicing) في 5G؟",
        options: [
          "قطع الكابلات المادية",
          "إنشاء شبكات افتراضية متعددة على نفس البنية التحتية المادية",
          "تقسيم فواتير المستخدمين",
          "زيادة حجم الأبراج"
        ],
        correctIndex: 1,
        explanation: "يتيح تقسيم الشبكة للمشغلين إنشاء شبكات منطقية بضمانات أداء مختلفة، مثل شريحة لخدمات الطوارئ وأخرى لبث الفيديو للمستهلكين."
      }
    ],
    passingScore: 1,
    completionMessage: "تهانينا! لقد أكملت دورة أساسيات 5G. أنت الآن تفهم ما هي 5G حقاً - ليست مجرد ضجة إعلامية، بل منصة مرنة لاحتياجات اتصال مختلفة جداً."
  },
};

export const finalQuiz = {
  intro: "هذا هو التقييم النهائي. لنرى كم تعلمت عن تقنية 5G.",
  questions: [
    {
      question: "ما هي الركائز الثلاث لخدمات 5G؟",
      correctAnswer: "eMBB, URLLC, mMTC",
      keywords: ["embb", "urllc", "mmtc", "enhanced mobile broadband", "ultra-reliable", "massive machine"],
      topic: "أساسيات 5G"
    },
    {
      question: "ما هي سرعة التنزيل القصوى النظرية لشبكة 5G؟",
      correctAnswer: "20 Gbps",
      keywords: ["20", "gbps", "20gbps", "gigabits"],
      topic: "مواصفات 5G"
    }
  ],
  passingScore: 1,
  completionMessage: "تهانينا! لقد أكملت دورة أساسيات 5G. أنت الآن تفهم ما هي 5G حقاً - ليست مجرد ضجة إعلامية، بل منصة مرنة لاحتياجات اتصال مختلفة جداً."
};

const fiveGQuizzes = {
  moduleQuizzes,
  finalQuiz,
};

export default fiveGQuizzes;
