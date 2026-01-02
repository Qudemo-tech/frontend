/**
 * Qudemo Widget Loader
 * Dynamically loads a Qudemo widget as an iframe on any website
 */

(function() {
  'use strict';

  // Get the script tag that loaded this file
  const currentScript = document.currentScript || document.querySelector('script[src*="widget-loader.js"]');
  
  if (!currentScript) {
    console.error('Qudemo Widget: Could not find script tag');
    return;
  }

  // Extract configuration from data attributes
  const qudemoId = currentScript.getAttribute('data-qudemo-id');
  const companyName = currentScript.getAttribute('data-company-name');
  const theme = currentScript.getAttribute('data-theme') || 'light';
  const position = currentScript.getAttribute('data-position') || 'bottom-right';
  const size = currentScript.getAttribute('data-size') || 'medium';

  if (!qudemoId || !companyName) {
    console.error('Qudemo Widget: Missing required attributes (data-qudemo-id, data-company-name)');
    return;
  }

  // Get base URL from script src
  const scriptSrc = currentScript.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = `qudemo-widget-container-${qudemoId}`;
  
  // Use proper positioning that prevents overflow on mobile
  const isMobile = window.innerWidth <= 768;
  const containerStyles = isMobile ? `
    position: fixed;
    right: 0;
    left: 0;
    bottom: 0;
    top: 0;
    width: 100%;
    max-width: 100vw;
    height: 100%;
    max-height: 100vh;
    border: none;
    z-index: 999999;
    pointer-events: none;
    overflow: hidden;
    box-sizing: border-box;
  ` : `
    position: fixed;
    ${position.includes('right') ? 'right: 0;' : 'left: 0;'}
    bottom: 0;
    top: 0;
    width: 100%;
    max-width: 100vw;
    height: 100%;
    max-height: 100vh;
    border: none;
    z-index: 999999;
    pointer-events: none;
    overflow: hidden;
    box-sizing: border-box;
  `;
  
  widgetContainer.style.cssText = containerStyles;
  
  // Update on resize
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      const isMobileNow = window.innerWidth <= 768;
      if (isMobileNow) {
        widgetContainer.style.right = '0';
        widgetContainer.style.left = '0';
      }
    }, 100);
  });

  // Create iframe
  const embedUrl = `${baseUrl}/widget-embed/${qudemoId}?theme=${theme}&position=${position}&size=${size}&company=${encodeURIComponent(companyName)}`;
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.style.cssText = `
    width: 100%;
    max-width: 100vw;
    height: 100%;
    max-height: 100vh;
    border: none;
    background: transparent;
    pointer-events: auto;
    box-sizing: border-box;
    overflow: hidden;
  `;
  iframe.allow = 'microphone';
  iframe.title = 'Qudemo Widget';

  widgetContainer.appendChild(iframe);

  // Initialize widget when DOM is ready
  const init = () => {
    document.body.appendChild(widgetContainer);
    console.log('Qudemo Widget: Loaded successfully');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for programmatic control
  window.QudemoWidget = window.QudemoWidget || {};
  window.QudemoWidget[qudemoId] = {
    show: () => widgetContainer.style.display = 'block',
    hide: () => widgetContainer.style.display = 'none',
    toggle: () => widgetContainer.style.display = widgetContainer.style.display === 'none' ? 'block' : 'none',
    destroy: () => widgetContainer.remove()
  };

})();

