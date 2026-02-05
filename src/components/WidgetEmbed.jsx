import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

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
    // Apply theme to body
    document.body.style.backgroundColor = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    // Apply theme class if needed
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
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
      height: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* FloatingQudemoWidget removed - HeyGen integration deprecated */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: '#666' }}>Widget functionality removed</p>
      </div>
    </div>
  );
};

export default WidgetEmbed;

