/**
 * Speed and Latency - PDF Presentation Configuration
 *
 * Slide-by-slide configuration with:
 * - Page numbers
 * - Pre-scripted narrations for avatar TTS
 */

export const speedLatencyPresentation = {
  pdfUrl: 'https://drive.google.com/file/d/1mYNEwm3V1QSy_Uv2J3pV4nD7vWMVpU5z/view',

  slides: [
    {
      page: 1,
      title: 'Speed and Latency Overview',
      narration: `Welcome to the Speed and Latency module.   In this section, we'll explore two critical concepts that define 5G performance:   bandwidth and latency.`,
    },
    {
      page: 2,
      title: 'What is Bandwidth?',
      narration: `Bandwidth is how much data can flow at once.   Think of it like the width of a pipe.   A wider pipe can carry more water at the same time.   Similarly, higher bandwidth means more data can be transmitted simultaneously.   5G offers significantly higher bandwidth than 4G,   enabling faster downloads, smoother streaming, and better performance for data-intensive applications.`,
    },
    {
      page: 3,
      title: 'What is Latency?',
      narration: `Latency is how long it takes for data to travel from sender to receiver.   It's the delay you experience between an action and its response.   In 4G, typical latency is around 30 to 50 milliseconds.   5G can achieve latency as low as 1 millisecond,   which is critical for real-time applications like remote surgery, autonomous driving, and cloud gaming.`,
    },
    {
      page: 4,
      title: '5G vs 4G Performance',
      narration: `Let's compare 5G and 4G performance.   5G offers theoretical peak speeds of up to 20 Gbps,   compared to 4G's 1 Gbps.   Latency drops from 30-50 milliseconds to potentially under 1 millisecond.   And 5G can support up to 1 million devices per square kilometer,   compared to just 100,000 for 4G.`,
    },
    {
      page: 5,
      title: 'Spectrum and Deployment',
      narration: `Performance depends on spectrum, network design, and deployment.   Low-band spectrum offers wide coverage but lower speeds.   Mid-band provides a balance of coverage and capacity.   High-band, or millimeter wave,   offers the fastest speeds but requires many small cells due to limited range and penetration.   This is why 5G deployments vary significantly by location.`,
    },
  ],
};

export default speedLatencyPresentation;
