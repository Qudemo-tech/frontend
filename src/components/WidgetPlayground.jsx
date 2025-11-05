import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FloatingQudemoWidget from './FloatingQudemoWidget';
import FAQEditor from './FAQEditor';
import { getNodeApiUrl } from '../config/api';

const WidgetPlayground = () => {
  const { qudemoId } = useParams();
  const navigate = useNavigate();
  const [qudemoData, setQudemoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('widget'); // 'widget' or 'faqs'

  useEffect(() => {
    const fetchQudemoData = async () => {
      try {
        setError(null);
        let response;
        const token = localStorage.getItem('accessToken');
        
        console.log('🎮 Widget Playground initialized for QuDemo:', qudemoId);
        console.log('🔑 Token available:', !!token);
        
        // Try authenticated request first if token exists
        if (token) {
          try {
            console.log('🔒 Attempting authenticated request...');
            response = await fetch(getNodeApiUrl(`/api/qudemos/${qudemoId}`), {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('📡 Auth response status:', response.status);
            
            // If response not OK, clear stale tokens and try public endpoint
            if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                console.log('🧹 Clearing stale/invalid tokens');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
              }
              console.log('⚠️ Auth failed, trying public endpoint');
              response = await fetch(getNodeApiUrl(`/api/qudemos/public/${qudemoId}`));
              console.log('📡 Public endpoint response status:', response.status);
            }
          } catch (authError) {
            console.log('⚠️ Auth error:', authError.message);
            console.log('🔄 Falling back to public endpoint');
            response = await fetch(getNodeApiUrl(`/api/qudemos/public/${qudemoId}`));
            console.log('📡 Public endpoint response status:', response.status);
          }
        } else {
          // No token, use public endpoint
          console.log('🌐 No auth token, using public endpoint');
          const publicUrl = getNodeApiUrl(`/api/qudemos/public/${qudemoId}`);
          console.log('🔗 Fetching from:', publicUrl);
          response = await fetch(publicUrl);
          console.log('📡 Public endpoint response status:', response.status);
        }
        
        if (!response) {
          throw new Error('No response received from server');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response not OK:', response.status, errorText);
          
          // Provide specific error message for 404
          if (response.status === 404) {
            throw new Error('QuDemo not found or not active. If you own this QuDemo, please ensure it is activated in your dashboard.');
          }
          
          throw new Error(`Failed to fetch QuDemo: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Widget Playground - Fetched QuDemo data:', {
          success: data.success,
          hasQudemo: !!(data.qudemo || data.data),
          qudemoTitle: (data.qudemo || data.data)?.title,
          companyName: (data.qudemo || data.data)?.company_name
        });
        
        if (data.success && (data.qudemo || data.data)) {
          const qudemo = data.qudemo || data.data;
          console.log('✅ QuDemo data loaded successfully:', qudemo.title);
          setQudemoData(qudemo);
        } else {
          console.error('❌ No QuDemo data in response:', data);
          setError('QuDemo not found or not accessible');
        }
      } catch (error) {
        console.error('❌ Error fetching qudemo data:', error);
        setError(error.message || 'Failed to load QuDemo');
      } finally {
        setLoading(false);
      }
    };

    if (qudemoId) {
      fetchQudemoData();
    } else {
      console.error('❌ No qudemoId provided in URL');
      setError('No QuDemo ID provided');
      setLoading(false);
    }
  }, [qudemoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your QuDemo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to Load QuDemo
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go to Home
              </button>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-500 mb-2">
                <strong>Troubleshooting:</strong>
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Check if the QuDemo ID is correct</li>
                <li>• Ensure the QuDemo is active</li>
                <li>• Try opening in a different browser</li>
                <li>• Check your internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!qudemoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            QuDemo Not Found
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            The requested QuDemo could not be loaded.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Widget Playground</h1>
              <p className="text-sm text-gray-600">
                {qudemoData?.title || 'Test your widget before embedding'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!localStorage.getItem('accessToken') && (
                <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Public Preview</span>
                </div>
              )}
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Widget Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('widget')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'widget'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>Widget Test</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'faqs'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>FAQ Editor</span>
              </div>
            </button>
          </div>
        </div>

        {/* Widget Test Tab */}
        {activeTab === 'widget' && (
          <>
        {/* Demo Website Mockup */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Mockup Browser Bar */}
          <div className="bg-gray-100 border-b border-gray-300 px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-600 flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>https://your-website.com</span>
              </div>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="p-8 min-h-[600px] bg-gradient-to-br from-white to-gray-50">
            <div className="max-w-4xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  Demo Website
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome to Our Website
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  This is a preview of how your widget will appear on your actual website. Notice the QuDemo widget in the bottom-right corner!
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: '🚀', title: 'Fast Setup', desc: 'Get started in minutes' },
                  { icon: '💬', title: 'Interactive Q&A', desc: 'Engage with visitors' },
                  { icon: '📊', title: 'Analytics', desc: 'Track engagement' }
                ].map((feature, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="text-4xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
                <h2 className="text-2xl font-bold mb-3">
                  Ready to Get Started?
                </h2>
                <p className="text-purple-100 mb-6">
                  Click the widget below to see it in action
                </p>
                <div className="flex items-center justify-center space-x-2 text-purple-100">
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>Look at the bottom-right corner</span>
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* FAQ Editor Tab */}
        {activeTab === 'faqs' && qudemoData && (
          <FAQEditor 
            qudemoId={qudemoId}
            companyName={qudemoData.company_name}
          />
        )}
      </div>

      {/* Floating Widget - Only show on widget tab */}
      {activeTab === 'widget' && qudemoData && (
        <FloatingQudemoWidget
          qudemoId={qudemoId}
          companyName={qudemoData.company_name}
          isPreview={false}
        />
      )}
    </div>
  );
};

export default WidgetPlayground;

