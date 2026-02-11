/**
 * The Microwave Window - PDF Presentation Configuration (Arabic)
 *
 * Arabic translation of slide-by-slide configuration with:
 * - Page numbers
 * - Pre-scripted narrations for avatar TTS
 *
 * Mirrors the structure of microwave-window.js exactly.
 */

export const microwaveWindowPresentation = {
  // Same PDF URL - content may be in English; narration is in Arabic
  pdfUrl: 'https://storage.googleapis.com/qudemo-test-qudemo/microwave.pdf',

  slides: [
    {
      page: 1,
      title: 'نافذة الميكروويف',
      narration: `يشغل الميكروويف الطيف الكهرومغناطيسي بين 300 ميجاهرتز و 300 جيجاهرتز. لأن أطواله الموجية قصيرة نسبياً،   من سنتيمترات إلى ملليمترات،   فإنه يتصرف أشبه بالضوء منه بموجات الراديو التقليدية—متجهاً في خطوط مستقيمة،   بالخط البصري.`,
    },
  ],
};

export default microwaveWindowPresentation;
