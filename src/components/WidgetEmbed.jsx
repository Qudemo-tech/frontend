import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FloatingQudemoWidget from './FloatingQudemoWidget';

/**
 * WidgetEmbed Component
 * This component is loaded inside an iframe when the widget is embedded on external sites
 * It renders only the FloatingQudemoWidget without any dashboard UI
 */
const WidgetEmbed = () => {
  const { qudemoId } = useParams();
  const [searchParams] = useSearchParams();
  
  const companyName = searchParams.get('company') || '';
  const theme = searchParams.get('theme') || 'light';
  const position = searchParams.get('position') || 'bottom-right';
  const size = searchParams.get('size') || 'medium';

  useEffect(() => {
    // Apply theme to body and html to prevent overflow
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.width = '100%';
    document.documentElement.style.maxWidth = '100vw';
    document.body.style.backgroundColor = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.maxWidth = '100vw';
    document.body.style.boxSizing = 'border-box';
    
    // Apply theme class if needed
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.width = '';
      document.documentElement.style.maxWidth = '';
      document.body.style.width = '';
      document.body.style.maxWidth = '';
      document.body.style.boxSizing = '';
    };
  }, [theme]);

  if (!qudemoId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div>QuDemo ID not provided</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '100vw',
      height: '100%',
      maxHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <FloatingQudemoWidget
        qudemoId={qudemoId}
        companyName={companyName}
        isPreview={false}
        lockedExpanded={false}
        theme={theme}
        position={position}
        size={size}
      />
    </div>
  );
};

export default WidgetEmbed;

