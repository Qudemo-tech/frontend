/**
 * PdfPresentation Component
 *
 * Displays PDF presentations with synchronized avatar narration.
 * Uses pre-scripted narrations for avatar TTS.
 * Includes navigation controls for user to move between slides.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

// Configure PDF.js worker - use local worker from public directory
// This avoids CDN issues and CORS problems
// In development, PUBLIC_URL is empty, so we use relative path
const workerSrc = process.env.PUBLIC_URL
  ? `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`
  : '/pdf.worker.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
console.log('[PDF] Worker configured:', workerSrc);

const PdfPresentation = ({
  pdfUrl,
  slides = [],
  currentSlideIndex = 0,
  onSlideChange,
  onRepeatSlide,
  onPresentationEnd,
  onClose,
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(null);
  const containerRef = useRef(null);

  // Track container width for responsive PDF sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Account for padding/margins - use 95% of available width
        const width = containerRef.current.offsetWidth * 0.95;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    // Also observe container size changes (e.g., sidebar toggle)
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      resizeObserver.disconnect();
    };
  }, []);

  // Sync page number with current slide index
  useEffect(() => {
    const slideConfig = slides[currentSlideIndex];
    if (slideConfig?.page) {
      setPageNumber(slideConfig.page);
    }
  }, [currentSlideIndex, slides]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    console.log(`[PDF] Document loaded successfully: ${numPages} pages`);
  };

  const onDocumentLoadError = (error) => {
    console.error('[PDF] Error loading document:', error);
    console.error('[PDF] PDF URL:', pdfUrl);
    console.error('[PDF] Worker src:', pdfjs.GlobalWorkerOptions.workerSrc);
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      onSlideChange?.(currentSlideIndex + 1);
    } else {
      onPresentationEnd?.();
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      onSlideChange?.(currentSlideIndex - 1);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleRepeat = () => {
    onRepeatSlide?.(currentSlideIndex);
  };

  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === slides.length - 1;

  return (
    <div className="pdf-embedded-container" ref={containerRef}>
      {/* PDF Viewer - full screen, no padding */}
      <div className="pdf-viewer">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="pdf-loading">
              <div className="spinner"></div>
              <p>Loading presentation...</p>
            </div>
          }
          error={
            <div className="pdf-loading">
              <p style={{ color: 'red' }}>Failed to load PDF</p>
              <p style={{ fontSize: '12px', color: '#666' }}>Check console for details</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={containerWidth || 800}
            loading={
              <div className="pdf-loading">
                <div className="spinner"></div>
                <p>Rendering page {pageNumber}...</p>
              </div>
            }
          />
        </Document>
      </div>

      {/* Navigation Controls - at bottom */}
      <div className="pdf-nav-controls">
        <button
          className={`pdf-nav-btn ${isFirstSlide ? 'disabled' : ''}`}
          onClick={handlePrevious}
          disabled={isFirstSlide}
          title="Previous slide"
        >
          <ChevronLeft size={24} />
          <span>Previous</span>
        </button>

        <div className="pdf-nav-center">
          <span className="pdf-slide-indicator">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            className="pdf-nav-btn repeat-btn"
            onClick={handleRepeat}
            title="Repeat this slide"
          >
            <RotateCcw size={18} />
            <span>Repeat</span>
          </button>
        </div>

        <button
          className="pdf-nav-btn"
          onClick={handleNext}
          title={isLastSlide ? "Finish presentation" : "Next slide"}
        >
          <span>{isLastSlide ? 'Finish' : 'Next'}</span>
          <ChevronRight size={24} />
        </button>
      </div>

      <style jsx>{`
        .pdf-embedded-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent;
        }

        .pdf-nav-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 10;
        }

        .pdf-nav-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pdf-nav-btn:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .pdf-nav-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pdf-nav-center {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .pdf-slide-indicator {
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 6px;
        }

        .repeat-btn {
          padding: 8px 12px;
          font-size: 13px;
        }

        .pdf-viewer {
          flex: 1;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          background: transparent;
        }

        .pdf-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PdfPresentation;
