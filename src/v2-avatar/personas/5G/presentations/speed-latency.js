/**
 * Speed and Latency - PDF Presentation Configuration
 *
 * Slide-by-slide configuration with:
 * - Page numbers
 * - Pre-scripted narrations for avatar TTS
 */

export const speedLatencyPresentation = {
  // Google Drive PDF - use uc?export=download format for react-pdf
  // Note: Google Drive may have CORS issues. For reliable PDF loading, consider hosting on S3.
  pdfUrl: 'https://storage.googleapis.com/qudemo-test-qudemo/5G.pdf',

  slides: [
    {
      page: 1,
      title: 'Speed and Latency',
      narration: `Let's talk about speed and latency,   two of the most important performance characteristics of 5G.

Bandwidth is how much data can flow at once,   like the width of a pipe.

Latency is how long it takes for data to travel from sender to receiver,   the delay.

5G dramatically reduces latency and increases capacity compared to 4G,   but performance depends on spectrum, network design, and deployment.`,
    },
  ],
};

export default speedLatencyPresentation;
