/**
 * usePdfPresentation Hook
 *
 * Manages PDF presentations with pre-scripted avatar narrations.
 *
 * Flow:
 * 1. Show PDF slide to user
 * 2. Avatar speaks pre-scripted narration using TTS (echo mode)
 * 3. When avatar finishes speaking → advance to next slide
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export const usePdfPresentation = ({
  sessionManager,
  dailyEventManager,
  sendMessage,
  log,
  onPresentationEnd,
}) => {
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [presentationConfig, setPresentationConfig] = useState(null);

  const waitingForNarrationRef = useRef(false);

  /**
   * Start a PDF presentation
   */
  const startPresentation = useCallback(async (config) => {
    const { pdfUrl, slides, moduleId } = config;

    if (!pdfUrl || !slides || slides.length === 0) {
      log('PDF', '⚠️ Invalid presentation config', config);
      return false;
    }

    log('PDF', `Starting presentation: ${moduleId}`, { pdfUrl, slideCount: slides.length });

    // NOTE: We do NOT send a SYSTEM message here because 'respond' mode triggers
    // Tavus to generate a conversational response which interferes with the presentation.
    // The slide context messages sent during narrateSlide are sufficient for tool awareness.
    // PDF tool availability is already in the persona's tool definitions.

    setPresentationConfig(config);
    setCurrentPdfUrl(pdfUrl);
    setCurrentSlideIndex(0);
    setIsPresenting(true);

    return true;
  }, [log, sendMessage]);


  /**
   * End presentation and cleanup
   * @param {boolean} notifyParent - Whether to call onPresentationEnd callback (default: true)
   */
  const endPresentation = useCallback(async (notifyParent = true) => {
    log('PDF', `Ending presentation (notifyParent: ${notifyParent})`);

    // NOTE: We skip sending SYSTEM message via 'respond' mode as it triggers
    // Tavus conversational responses that interfere with module transitions.
    // The frontend guards already prevent PDF tool execution when not presenting.

    // Reset state FIRST before calling callback to prevent race conditions
    setIsPresenting(false);
    setCurrentPdfUrl(null);
    setCurrentSlideIndex(0);
    setPresentationConfig(null);
    waitingForNarrationRef.current = false;

    // Only notify parent if this is a natural completion (not forced termination)
    if (notifyParent) {
      // Small delay to ensure state updates propagate before callback
      await new Promise(resolve => setTimeout(resolve, 100));
      onPresentationEnd?.();
    }
  }, [onPresentationEnd, log, sendMessage]);

  /**
   * Narrate current slide using pre-scripted narration
   */
  const narrateSlide = useCallback(async (slideIndex) => {
    if (!presentationConfig) return;

    const slide = presentationConfig.slides[slideIndex];
    if (!slide) {
      log('PDF', `⚠️ Slide ${slideIndex} not found`);
      return;
    }

    const totalSlides = presentationConfig.slides.length;
    log('PDF', `Narrating slide ${slideIndex + 1}/${totalSlides}`);

    // Mark that we're waiting for narration
    waitingForNarrationRef.current = true;

    // NOTE: We previously sent slide context via 'respond' mode, but this caused Tavus
    // to generate conversational responses that interfered with the presentation flow.
    // The slide content will be available to Tavus through the echo narration itself.
    // For Q&A, users can ask about what was just said and Tavus can use recent context.

    // Speak the narration (echo = TTS only, exact text)
    log('PDF', '📝 Playing pre-scripted narration');
    if (slide.narration) {
      sendMessage(slide.narration, 'echo');
    }
  }, [presentationConfig, sendMessage, log]);

  /**
   * Called when avatar finishes speaking
   */
  const onNarrationComplete = useCallback(() => {
    waitingForNarrationRef.current = false;
    log('PDF', '✅ Slide narration complete');
  }, [log]);

  /**
   * Advance to next slide
   */
  const nextSlide = useCallback(() => {
    console.log('\n🔄 [usePdfPresentation] nextSlide() called');
    console.log('   currentSlideIndex:', currentSlideIndex);
    console.log('   presentationConfig exists:', !!presentationConfig);
    console.trace();

    if (!presentationConfig) return;

    const nextIndex = currentSlideIndex + 1;

    if (nextIndex >= presentationConfig.slides.length) {
      log('PDF', '🎬 Presentation complete - ending and advancing to next module');
      console.log('   🎬 Last slide reached - ending presentation');
      endPresentation();
      return;
    }

    log('PDF', `Advancing to slide ${nextIndex + 1}`);
    console.log(`   ➡️ Advancing from ${currentSlideIndex} to ${nextIndex}`);
    setCurrentSlideIndex(nextIndex);

    // Narrate the new slide after a brief delay
    setTimeout(() => {
      narrateSlide(nextIndex);
    }, 300); // Reduced from 500ms
  }, [currentSlideIndex, presentationConfig, narrateSlide, log, endPresentation]);

  /**
   * Go to previous slide
   */
  const previousSlide = useCallback(() => {
    console.log('\n🔄 [usePdfPresentation] previousSlide() called');
    console.log('   currentSlideIndex:', currentSlideIndex);
    console.trace();

    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      log('PDF', `Going back to slide ${prevIndex + 1}`);
      console.log(`   ⬅️ Going back from ${currentSlideIndex} to ${prevIndex}`);
      setCurrentSlideIndex(prevIndex);

      setTimeout(() => {
        narrateSlide(prevIndex);
      }, 300); // Reduced from 500ms
    } else {
      console.log('   ⚠️ Already at first slide, cannot go back');
    }
  }, [currentSlideIndex, narrateSlide, log]);

  /**
   * Go to a specific slide
   */
  const goToSlide = useCallback((slideIndex) => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║           📍 goToSlide() CALLED                               ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║ Requested slideIndex: ${slideIndex}`);
    console.log(`║ Current slideIndex: ${currentSlideIndex}`);
    console.log(`║ presentationConfig exists: ${!!presentationConfig}`);
    console.log(`║ Stack trace:`);
    console.trace();
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    log('PDF', `goToSlide called with index: ${slideIndex}`);

    if (!presentationConfig || !presentationConfig.slides) {
      log('PDF', `⚠️ Cannot go to slide - no presentation config`);
      console.log('   ❌ Aborting - no presentation config');
      return;
    }

    if (slideIndex < 0 || slideIndex >= presentationConfig.slides.length) {
      log('PDF', `⚠️ Invalid slide index: ${slideIndex} (valid: 0-${presentationConfig.slides.length - 1})`);
      console.log(`   ❌ Aborting - invalid slide index: ${slideIndex}`);
      return;
    }

    const totalSlides = presentationConfig.slides.length;
    log('PDF', `Going to slide ${slideIndex + 1} of ${totalSlides}`);
    console.log(`   ✅ Setting currentSlideIndex to: ${slideIndex}`);
    setCurrentSlideIndex(slideIndex);

    // Get the slide content now while we have the correct config
    const slide = presentationConfig.slides[slideIndex];
    const narration = slide?.narration;
    const title = slide?.title || 'Untitled';

    log('PDF', `Slide ${slideIndex + 1} narration: ${narration ? narration.substring(0, 50) + '...' : 'NONE'}`);

    setTimeout(() => {
      console.log(`   ⏰ Timer fired for slide ${slideIndex + 1} - sending narration`);
      log('PDF', `Timer fired - narrating slide ${slideIndex + 1}`);

      // NOTE: We skip sending SYSTEM context message via 'respond' mode as it triggers
      // Tavus to generate conversational responses that interfere with presentation flow.
      // Just send the narration directly via echo.

      // Speak the narration (echo = TTS only)
      if (narration) {
        log('PDF', '📝 Sending narration via echo');
        console.log(`   📝 Sending narration for slide ${slideIndex + 1}: "${narration.substring(0, 50)}..."`);
        sendMessage(narration, 'echo');
      } else {
        log('PDF', '⚠️ No narration for this slide');
        console.log(`   ⚠️ No narration for slide ${slideIndex + 1}`);
      }
    }, 300); // Reduced from 800ms for faster response
  }, [presentationConfig, sendMessage, log, currentSlideIndex]);

  return {
    // State
    isPresenting,
    currentPdfUrl,
    currentSlideIndex,
    presentationConfig,

    // Methods
    startPresentation,
    endPresentation,
    narrateSlide,
    onNarrationComplete,
    nextSlide,
    previousSlide,
    goToSlide,
  };
};

export default usePdfPresentation;
