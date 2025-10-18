import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import HybridVideoPlayer from './HybridVideoPlayer';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  PlayIcon, 
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { getNodeApiUrl } from '../config/api';
import axios from 'axios';
const TypingIndicator = () => (
  <div className="typing-indicator flex space-x-1">
    <span className="dot animate-bounce delay-150"></span>
    <span className="dot animate-bounce delay-300"></span>
    <span className="dot animate-bounce delay-450"></span>
    <style>{`
      .typing-indicator {
        align-items: center;
      }
      .dot {
        width: 8px;
        height: 8px;
        background-color: #2563eb;
        border-radius: 50%;
        display: inline-block;
        animation-duration: 1s;
        animation-iteration-count: infinite;
        animation-timing-function: ease-in-out;
      }
      .animate-bounce {
        animation-name: bounce-dot;
      }
      .delay-150 {
        animation-delay: 0.15s;
      }
      .delay-300 {
        animation-delay: 0.3s;
      }
      .delay-450 {
        animation-delay: 0.45s;
      }
      @keyframes bounce-dot {
        0%,
        80%,
        100% {
          transform: translateY(0);
          opacity: 0.3;
        }
        40% {
          transform: translateY(-8px);
          opacity: 1;
        }
      }
    `}</style>
  </div>
);
const cleanMessageText = (text) => {
  // Remove unwanted patterns
  let cleaned = text
    .replace(/\*\*/g, "")
    .replace(/\(.*?page.*?\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Ensure bullet points and numbers are on new lines
  cleaned = cleaned
    // New line before bullets (•, -, *) if not already at line start
    .replace(/\s*([•\-*])\s+/g, "<br/>$1 ")
    // New line before numbered lists (1., 2., etc.) if not already at line start
    .replace(/\s*(\d+\.)\s+/g, "<br/>$1 ");
  // Convert URLs to clickable links
  cleaned = cleaned.replace(
    /(https?:\/\/[^\s]+)/g,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`
  );
  // Split at each '– ' and wrap each in <p> tags, preserving the intro as its own paragraph
  const parts = cleaned.split(/(?=– )/g);
  const result = parts.map(part => `<p>${part.trim()}</p>`).join("");
  return result;
};
// Extract video ID from various URL formats
const extractVideoId = (url) => {
  if (!url) return null;
  try {
    // YouTube URLs
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      return urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url.split('youtube.com/embed/')[1].split('?')[0];
    }
    // Loom URLs
    if (url.includes('loom.com/share/')) {
      return url.split('loom.com/share/')[1].split('?')[0];
    } else if (url.includes('loom.com/embed/')) {
      return url.split('loom.com/embed/')[1].split('?')[0];
    }
    // Vimeo URLs
    if (url.includes('vimeo.com/')) {
      return url.split('vimeo.com/')[1].split('?')[0];
    } else if (url.includes('player.vimeo.com/video/')) {
      return url.split('player.vimeo.com/video/')[1].split('?')[0];
    }
    return null;
  } catch (error) {
    return null;
  }
};
const PublicQudemoShare = () => {
  const { shareToken } = useParams();
  const [qudemo, setQudemo] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showLoomTimestamp, setShowLoomTimestamp] = useState(false);
  const [loomTimestampMessage, setLoomTimestampMessage] = useState('');
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [loadingSuggestedQuestions, setLoadingSuggestedQuestions] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [loadingCalendly, setLoadingCalendly] = useState(false);
  const [showCalendlyError, setShowCalendlyError] = useState(false);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState(null);
  const [showAvatarVideo, setShowAvatarVideo] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const messagesEndRef = useRef(null);
  const loomIframeRef = useRef();
  const videoPlayerRef = useRef(null);
  const avatarVideoRef = useRef(null);
  // Load shared qudemo data
  useEffect(() => {
    const loadSharedQudemo = async () => {
      try {
        setLoading(true);
        const response = await fetch(getNodeApiUrl(`/api/qudemos/share/${shareToken}`));
        if (response.ok) {
          const data = await response.json();
          setQudemo(data.data);
          setCompany(data.data.company);
          // Update page title and meta tags dynamically
          const qudemoTitle = data.data.title;
          const companyName = data.data.company?.name || data.data.company?.display_name || 'Company';
          // Update document title
          document.title = `${qudemoTitle} - ${companyName} | Qudemo`;
          // Update meta description
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', `Interactive demo: ${qudemoTitle} by ${companyName}. Ask questions and get instant answers with video timestamps.`);
          }
          // Update Open Graph tags
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) {
            ogTitle.setAttribute('content', `${qudemoTitle} - ${companyName}`);
          }
          const ogDescription = document.querySelector('meta[property="og:description"]');
          if (ogDescription) {
            ogDescription.setAttribute('content', `Interactive demo: ${qudemoTitle} by ${companyName}. Ask questions and get instant answers with video timestamps.`);
          }
          // Initialize with welcome message
          const welcomeMessage = {
            sender: "AI",
            text: `Welcome to the ${data.data.title}! I'm your AI assistant for this shared qudemo. I can help you understand the content from the videos and knowledge sources. What would you like to know?`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          setMessages([welcomeMessage]);
        } else {
          const errorData = await response.json();
          // CHECK FOR SUBSCRIPTION EXPIRED
          if (errorData.subscriptionExpired || response.status === 403) {
            setError('subscription_expired');
          } else {
            setError(errorData.error || 'Failed to load shared qudemo');
          }
        }
      } catch (err) {
        setError('Failed to load shared qudemo');
      } finally {
        setLoading(false);
      }
    };
    if (shareToken) {
      loadSharedQudemo();
    }
  }, [shareToken]);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  // Clear suggested questions and fetch new ones when shareToken is available
  useEffect(() => {
    if (shareToken) {
      // Clear old suggested questions immediately
      setSuggestedQuestions([]);
      setLoadingSuggestedQuestions(true);
      setShowAllQuestions(false); // Reset show all state
      fetchSuggestedQuestions();
    } else {
      // Clear suggested questions when missing data
      setSuggestedQuestions([]);
      setLoadingSuggestedQuestions(false);
      setShowAllQuestions(false);
    }
  }, [shareToken]);
  const fetchSuggestedQuestions = async () => {
    try {
      // Use the public endpoint for shared QuDemos
      const response = await axios.get(getNodeApiUrl(`/api/qudemos/share/${shareToken}/suggested-questions`));
      
      if (response.data.success) {
        const questions = response.data.suggested_questions || [];
        setSuggestedQuestions(questions);
      }
    } catch (error) {
      console.error('❌ Error fetching suggested questions:', error);
      console.error('❌ Error response:', error.response?.data);
      // Don't show error to user, just silently fail
    } finally {
      setLoadingSuggestedQuestions(false);
    }
  };
  const handleSuggestedQuestionClick = (question) => {
    setInputMessage(question);
    // Auto-send the suggested question
    setTimeout(() => {
      handleSendMessage(question);
    }, 100);
  };
  // Function to enable audio after user interaction
  const enableAudio = () => {
    setAudioEnabled(true);
    // Enable audio on all video elements
    setTimeout(() => {
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        video.muted = false;
        video.volume = 1.0;
        video.play().catch(e => {});
      });
      // Also handle ReactPlayer instances
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.src.includes('loom.com')) {
          // For Loom videos, try to unmute via postMessage
          try {
            iframe.contentWindow.postMessage({ type: 'unmute' }, '*');
          } catch (e) {
          }
        }
      });
    }, 100);
  };
  const handleSendMessage = async (messageText = null) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend || isTyping || !qudemo) return;
    const userQuestion = messageToSend;
    setMessages(prev => [...prev, {
      sender: "You",
      text: userQuestion,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);
    setInputMessage('');
    setIsTyping(true);
    try {
      // Call the public chat endpoint for shared QuDemos
      const askUrl = getNodeApiUrl(`/api/qudemos/share/${shareToken}/chat`);
      const response = await axios.post(askUrl, {
        question: userQuestion
      }, {
        headers: { 
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      // Generate AI avatar video for the answer
      const aiAnswer = response.data?.answer || 'Sorry, I could not find an answer.';
      
      // Generate avatar video if available
      if (aiAnswer && aiAnswer !== 'Sorry, I could not find an answer.') {
        setIsGeneratingAvatar(true);
        try {
          const avatarResponse = await axios.post(getNodeApiUrl('/api/avatar/generate'), {
            text: aiAnswer,
            shareToken: shareToken
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          });
          
          if (avatarResponse.data.success && avatarResponse.data.videoUrl) {
            setAvatarVideoUrl(avatarResponse.data.videoUrl);
            setShowAvatarVideo(true);
            console.log('✅ Avatar video generated:', avatarResponse.data.videoUrl);
          }
        } catch (avatarError) {
          console.warn('⚠️ Avatar video generation failed:', avatarError);
          // Continue without avatar video
        } finally {
          setIsGeneratingAvatar(false);
        }
      }
      
      // Process the response and handle video switching
      try {
        // Check for video navigation data in the response
        let targetVideoUrl = null;
        let timestamp = 0;
        // First check direct video fields (this is how the Python backend sends video data)
        if (response.data && response.data.video_url) {
          targetVideoUrl = response.data.video_url;
          timestamp = response.data.start || 0;
          // Ensure timestamp is a number and convert to seconds if needed
          if (typeof timestamp === 'string') {
            timestamp = parseFloat(timestamp);
          }
          if (isNaN(timestamp)) {
            timestamp = 0;
          }
          // Additional validation - ensure timestamp is reasonable
          if (timestamp < 0 || timestamp > 36000) { // Max 10 hours
            timestamp = 0;
          }
        }
        // Fallback: check sources array for video sources
        else if (response.data && response.data.sources && response.data.sources.length > 0) {
          // Find the first video source with a timestamp
          const videoSource = response.data.sources.find(source => 
            source.source_type === 'video' && source.start_timestamp
          );
          if (videoSource) {
            targetVideoUrl = videoSource.url;
            timestamp = videoSource.start_timestamp;
          }
        }
        // Add message with video switching
        setMessages(msgs => [...msgs, {
          sender: "AI",
          text: cleanMessageText(aiAnswer),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
        // Switch video if we have a valid video URL
        if (targetVideoUrl) {
          // First, pause the current video to ensure clean transition
          setIsPlaying(false);
          // Find if this video is in our qudemo's videos (flexible URL matching)
          const videoIndex = qudemo.videos?.findIndex(v => {
            if (!v.video_url || !targetVideoUrl) return false;
            // Extract video IDs for comparison
            const vId = extractVideoId(v.video_url);
            const targetId = extractVideoId(targetVideoUrl);
            return vId && targetId && vId === targetId;
          });
          if (videoIndex !== -1) {
            setCurrentVideoIndex(videoIndex);
            setCurrentTimestamp(timestamp);
          } else {
            // Try to set timestamp anyway if we have a valid timestamp
            if (timestamp !== undefined) {
              setCurrentTimestamp(timestamp);
            }
          }
          // Force video to seek to new timestamp after a brief delay
          // This ensures the video player responds to the new timestamp
          setTimeout(() => {
            if (timestamp !== undefined) {
              // Update timestamp and start playing
              setCurrentTimestamp(timestamp);
              setIsPlaying(true);
              // Increment refresh key to force video player re-render
              setVideoRefreshKey(prev => prev + 1);
              // Try to seek directly using the player ref if available
              if (videoPlayerRef.current) {
                try {
                  if (videoPlayerRef.current.seekTo) {
                    videoPlayerRef.current.seekTo(timestamp);
                  }
                } catch (error) {
                }
              }
            }
          }, 200); // Increased delay to ensure video player is ready
        }
        setIsTyping(false);
      } catch (processingError) {
        // Fallback - just add the answer
        setMessages(msgs => [...msgs, {
          sender: "AI",
          text: cleanMessageText(response.data?.answer || "I found an answer but there was an error displaying it. Please try again."),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
        setIsTyping(false);
      }
    } catch (error) {
      const errorMessage = {
        sender: "AI",
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleScheduleMeeting = () => {
    try {
      setLoadingCalendly(true);
      
      // Check if the shared qudemo has a Calendly link
      if (qudemo?.calendly_link) {
        // Open the Calendly link in a new tab
        window.open(qudemo.calendly_link, '_blank', 'noopener,noreferrer');
      } else {
        // No Calendly link found, show error
        setShowCalendlyError(true);
        setTimeout(() => setShowCalendlyError(false), 5000);
      }
    } catch (error) {
      console.error('Failed to open Calendly link:', error);
      setShowCalendlyError(true);
      setTimeout(() => setShowCalendlyError(false), 5000);
    } finally {
      setLoadingCalendly(false);
    }
  };

  const currentVideo = qudemo?.videos?.[currentVideoIndex];
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared Qudemo...</p>
        </div>
      </div>
    );
  }
  if (error) {
    // Subscription expired error
    if (error === 'subscription_expired') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XMarkIcon className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              QuDemo No Longer Available
            </h1>
            <div className="space-y-3 text-gray-600 mb-6">
              <p className="text-lg">
                This QuDemo is currently unavailable.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <p className="text-sm text-red-800">
                  <strong>Reason:</strong> The owner's subscription has ended or been downgraded to a Free plan.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Public sharing is only available with Pro or Enterprise plans.
                </p>
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-4">
                If you're the owner of this QuDemo:
              </p>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Upgrade to Restore Access
              </button>
            </div>
          </div>
        </div>
      );
    }
    // Generic error
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Share Link Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">The share link may have expired or been removed.</p>
        </div>
      </div>
    );
  }
  if (!qudemo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">QuDemo Not Found</h1>
          <p className="text-gray-600">This QuDemo is no longer available.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="text-left">
                <h1 className="text-lg font-semibold text-gray-900 flex items-center text-left">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  {company?.name || 'Unknown Company'}
                </h1>
                <p className="text-sm text-gray-500 text-left">
                  {qudemo.title}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Shared Qudemo
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row h-[80vh]">
            {/* Video Section */}
            <div 
              className="w-full lg:w-2/3 relative flex flex-col bg-black overflow-y-auto"
              onClick={enableAudio}
            >
              {/* Main Video Player */}
              {currentVideo ? (
                <div className="relative w-full flex-shrink-0" style={{ height: showAvatarVideo ? '60%' : '100%' }}>
                  <HybridVideoPlayer
                    ref={videoPlayerRef}
                    key={`${currentVideo.video_url}-${currentTimestamp}-${videoRefreshKey}`}
                    url={currentVideo.video_url}
                    width="100%"
                    height="100%"
                    controls={true}
                    playing={isPlaying}
                    startTime={currentTimestamp}
                    style={{ width: '100%', height: '100%', background: 'black' }}
                    onReady={() => {
                    }}
                    onPlay={() => {
                    }}
                    iframeRef={loomIframeRef}
                  />
                  {/* Loom Timestamp Indicator */}
                  {showLoomTimestamp && currentVideo.video_url.includes('loom.com') && currentTimestamp > 0 && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-3 rounded-lg text-sm font-medium z-20 shadow-lg max-w-xs">
                      <div className="flex items-center space-x-2">
                        <span>⏰</span>
                        <div>
                          <div className="font-bold">Seek to:</div>
                          <div>{loomTimestampMessage}</div>
                        </div>
                        <button 
                          onClick={() => setShowLoomTimestamp(false)}
                          className="text-black hover:text-gray-700 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                  {/* YouTube Timestamp Indicator */}
                  {currentTimestamp > 0 && currentVideo.video_url.includes('youtube.com') && (
                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium z-20 shadow-lg max-w-xs">
                      <div className="flex items-center space-x-2">
                        <span>⏰</span>
                        <div>
                          <div className="font-bold">Jump to:</div>
                          <div>{Math.floor(currentTimestamp / 60)}:{(currentTimestamp % 60).toString().padStart(2, '0')}</div>
                        </div>
                        <button 
                          onClick={() => setCurrentTimestamp(0)}
                          className="text-white hover:text-gray-200 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full w-full text-white text-lg">
                  <div className="text-center">
                    <PlayIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No videos available for this qudemo</p>
                  </div>
                </div>
              )}
              {/* Video Controls */}
              {qudemo?.videos && qudemo.videos.length > 1 && (
                <div className="p-4 bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm">
                        Video {currentVideoIndex + 1} of {qudemo.videos.length}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
                        disabled={currentVideoIndex === 0}
                        className="px-3 py-1 bg-gray-700 text-white rounded text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentVideoIndex(Math.min(qudemo.videos.length - 1, currentVideoIndex + 1))}
                        disabled={currentVideoIndex === qudemo.videos.length - 1}
                        className="px-3 py-1 bg-gray-700 text-white rounded text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Avatar Video Section */}
              {(showAvatarVideo || isGeneratingAvatar) && (
                <div className="w-full flex-shrink-0 bg-gradient-to-b from-gray-900 to-black" style={{ height: '40%' }}>
                  {isGeneratingAvatar ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-3 mx-auto"></div>
                        <p className="text-white text-sm">Generating AI Avatar...</p>
                        <p className="text-gray-400 text-xs mt-1">Creating personalized video response</p>
                      </div>
                    </div>
                  ) : avatarVideoUrl ? (
                    <div className="relative h-full">
                      <video
                        ref={avatarVideoRef}
                        src={avatarVideoUrl}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        onEnded={() => setShowAvatarVideo(false)}
                      />
                      {/* Avatar Badge */}
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                        AI Avatar
                      </div>
                      {/* Close Button */}
                      <button
                        onClick={() => {
                          setShowAvatarVideo(false);
                          setAvatarVideoUrl(null);
                        }}
                        className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {/* Chat Section */}
            <div className="w-full lg:w-1/3 flex flex-col bg-white border-l">
              {/* Header */}
              <div className="bg-blue-600 text-white px-4 py-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold text-sm sm:text-base">
                      Ask questions about this qudemo
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                  </div>
                </div>
              </div>
              {/* Chat Messages */}
              <div className="flex-1 px-3 py-1 overflow-y-auto space-y-3 bg-gray-50 text-sm">
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    <div
                      className={`flex ${msg.sender === "AI" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`rounded-xl px-4 py-2 max-w-[80%] ${
                          msg.sender === "AI"
                            ? "bg-white border text-gray-800 text-left"
                            : "bg-blue-600 text-white text-right"
                        }`}
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: msg.text, // already cleaned before storing
                          }}
                        />
                      </div>
                    </div>
                    {/* Show suggested questions after the first AI message (welcome message) or greeting responses */}
                    {msg.sender === "AI" && (idx === 0 || msg.text.includes("Hi! I am an AI assistant for this demo")) && (
                      <div className="flex justify-start px-3 py-2">
                        <div className="max-w-[95%]">
                          <div className="text-xs text-gray-600 mb-2 font-medium text-left">Suggested questions:</div>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            // Only show suggested questions if they are actually loaded
                            if (suggestedQuestions.length === 0) {
                              return null; // Don't show any questions if none are loaded
                            }
                            const displayQuestions = showAllQuestions ? suggestedQuestions : suggestedQuestions.slice(0, 4);
                            return displayQuestions.map((question, questionIndex) => (
                              <button
                                key={questionIndex}
                                onClick={() => handleSuggestedQuestionClick(question)}
                                className="text-xs bg-blue-50 border border-blue-200 rounded-full px-4 py-2 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 text-blue-700 text-left max-w-sm whitespace-normal"
                                disabled={isTyping}
                              >
                                {question}
                              </button>
                            ));
                          })()}
                          {/* Show "More..." button if there are more than 4 questions and not showing all */}
                          {suggestedQuestions.length > 4 && !showAllQuestions && (
                            <button
                              onClick={() => setShowAllQuestions(true)}
                              className="text-xs bg-gray-100 border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-200 hover:border-gray-400 transition-colors duration-200 text-gray-700 text-left"
                              disabled={isTyping}
                            >
                              More...
                            </button>
                          )}
                        </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-4 py-2 max-w-[80%] bg-white border text-gray-800 select-none">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <div className="px-3 py-1 border-t flex items-center gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask a question about this qudemo..."
                  rows={1}
                  className="flex-1 px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                  style={{ minHeight: '2.5rem', maxHeight: '7.5rem' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 7.5 * 16) + 'px';
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-7 w-8" />
                </button>
              </div>

              {/* Schedule Meeting Button */}
              <div className="px-3 py-2 border-t flex justify-end bg-gray-50">
                <button
                  onClick={handleScheduleMeeting}
                  disabled={loadingCalendly}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
                >
                  {loadingCalendly ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Book Meeting
                    </>
                  )}
                </button>
              </div>

              {/* Calendly Error Message */}
              {showCalendlyError && (
                <div className="px-3 py-2 bg-red-50 border-t border-red-200">
                  <p className="text-xs text-red-600">
                    No meeting link available for this QuDemo.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="px-2 py-2 flex justify-center items-center text-xs bg-white border-t">
                <span className="text-gray-500">
                  Powered by <span 
                    onClick={() => window.location.href = '/'}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer font-semibold"
                  >
                    Qudemo
                  </span> AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PublicQudemoShare;
