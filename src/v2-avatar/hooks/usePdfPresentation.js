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

    setPresentationConfig(config);
    setCurrentPdfUrl(pdfUrl);
    setCurrentSlideIndex(0);
    setIsPresenting(true);

    return true;
  }, [log]);


  /**
   * End presentation and cleanup
   * @param {boolean} notifyParent - Whether to call onPresentationEnd callback (default: true)
   */
  const endPresentation = useCallback(async (notifyParent = true) => {
    log('PDF', `Ending presentation (notifyParent: ${notifyParent})`);

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
  }, [onPresentationEnd, log]);

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

    log('PDF', `Narrating slide ${slideIndex + 1}/${presentationConfig.slides.length}`);

    // Mark that we're waiting for narration
    waitingForNarrationRef.current = true;

    // Use pre-scripted narration
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
    if (!presentationConfig) return;

    const nextIndex = currentSlideIndex + 1;

    if (nextIndex >= presentationConfig.slides.length) {
      log('PDF', '🎬 Presentation complete - ending and advancing to next module');
      endPresentation();
      return;
    }

    log('PDF', `Advancing to slide ${nextIndex + 1}`);
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
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      log('PDF', `Going back to slide ${prevIndex + 1}`);
      setCurrentSlideIndex(prevIndex);

      setTimeout(() => {
        narrateSlide(prevIndex);
      }, 300); // Reduced from 500ms
    }
  }, [currentSlideIndex, narrateSlide, log]);

  /**
   * Go to a specific slide
   */
  const goToSlide = useCallback((slideIndex) => {
    log('PDF', `goToSlide called with index: ${slideIndex}`);

    if (!presentationConfig || !presentationConfig.slides) {
      log('PDF', `⚠️ Cannot go to slide - no presentation config`);
      return;
    }

    if (slideIndex < 0 || slideIndex >= presentationConfig.slides.length) {
      log('PDF', `⚠️ Invalid slide index: ${slideIndex} (valid: 0-${presentationConfig.slides.length - 1})`);
      return;
    }

    log('PDF', `Going to slide ${slideIndex + 1} of ${presentationConfig.slides.length}`);
    setCurrentSlideIndex(slideIndex);

    // Get the slide content now while we have the correct config
    const slide = presentationConfig.slides[slideIndex];
    const narration = slide?.narration;

    log('PDF', `Slide ${slideIndex + 1} narration: ${narration ? narration.substring(0, 50) + '...' : 'NONE'}`);

    setTimeout(() => {
      log('PDF', `Timer fired - narrating slide ${slideIndex + 1}`);
      if (narration) {
        log('PDF', '📝 Sending narration via echo');
        sendMessage(narration, 'echo');
      } else {
        log('PDF', '⚠️ No narration for this slide');
      }
    }, 300); // Reduced from 800ms for faster response
  }, [presentationConfig, sendMessage, log]);

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
