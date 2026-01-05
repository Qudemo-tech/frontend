/**
 * PdfPresentation Component
 *
 * Displays PDF presentations with synchronized avatar narration.
 * Uses pre-scripted narrations for avatar TTS.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

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
  onPresentationEnd,
  onClose,
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const containerRef = useRef(null);

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
            width={1200}
            loading={
              <div className="pdf-loading">
                <div className="spinner"></div>
                <p>Rendering page {pageNumber}...</p>
              </div>
            }
          />
        </Document>
      </div>

      <style jsx>{`
        .pdf-embedded-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent;
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
