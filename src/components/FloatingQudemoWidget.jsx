import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, ChatBubbleLeftRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { getNodeApiUrl, getVideoApiUrl } from '../config/api';
import HybridVideoPlayer from './HybridVideoPlayer';
import AvatarVideoPlayer from './AvatarVideoPlayer';

const FloatingQudemoWidget = ({ 
  position = 'bottom-right',
  previewImage = null,
  previewText = "Watch Demo",
  qudemoId = null,
  companyName = null,
  isPreview = false
}) => {
  // Debug: Log props on component mount
  console.log('🔍 FloatingQudemoWidget PROPS:', {
    qudemoId,
    companyName,
    isPreview,
    position
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [videoFlow, setVideoFlow] = useState(null);
  const [qudemoData, setQudemoData] = useState(null); // Universal Demo Qudemo data
  const [loading, setLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [overlayQuestions, setOverlayQuestions] = useState([]); // 3 random questions for video overlay
  const [clickedQuestions, setClickedQuestions] = useState([]); // Track clicked questions to exclude them
  const [showAllQuestions, setShowAllQuestions] = useState(false); // State for "More..." button
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showBookingPrompt, setShowBookingPrompt] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);
  const [currentAvatarVideo, setCurrentAvatarVideo] = useState(null); // State for avatar video
  const [introVideoPreview, setIntroVideoPreview] = useState(null); // State for intro video preview URL
  const videoPlayerRef = useRef(null);
  const previewVideoRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const videoPreloadCacheRef = useRef({}); // Cache of preloaded video elements
  const avatarVideoCacheRef = useRef({}); // Cache specifically for FAQ avatar videos
  const cacheTimestampRef = useRef(null); // Track when cache was last refreshed
  const recognitionRef = useRef(null);
  const loomIframeRef = useRef(null);
  const hasLoadedDataRef = useRef(false); // Track if we've already loaded data
  const hasShownIntroRef = useRef(false); // Track if intro video has been shown
  const introPreviewRef = useRef(null); // Ref for intro video preview element
  
  // Universal Demo share token
  const UNIVERSAL_DEMO_TOKEN = 'ca6b5a1b-0764-4e1c-bf6c-3e3c5bc93d1d';

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4 md:bottom-6 md:right-6',
    'bottom-left': 'bottom-4 left-4 md:bottom-6 md:left-6',
    'top-right': 'top-4 right-4 md:top-6 md:right-6',
    'top-left': 'top-4 left-4 md:top-6 md:left-6'
  };

  // Load video thumbnail on mount (for preview)
  useEffect(() => {
    console.log('🚀 FloatingQudemoWidget MOUNTED', { qudemoId, companyName, isPreview });
    
    // Only load static video thumbnail if NOT in playground mode (no qudemoId)
    if (!qudemoId) {
      loadVideoThumbnail();
    }
    
    setupSpeechRecognition();
    
    return () => {
      console.log('💀 FloatingQudemoWidget UNMOUNTED', { qudemoId, companyName });
    };
  }, []);

  // Load specific QuDemo data immediately if qudemoId is provided (for playground/embed)
  useEffect(() => {
    if (qudemoId && companyName && !hasLoadedDataRef.current) {
      console.log('🚀 Widget: Auto-loading QuDemo data (qudemoId provided)');
      hasLoadedDataRef.current = true; // Mark as loaded immediately to prevent re-runs
      loadBetaVersionData();
    }
  }, [qudemoId, companyName]);

  // Load full data when expanded (only for universal widget, not playground)
  useEffect(() => {
    // Skip if we already loaded data (playground mode with qudemoId)
    if (qudemoId) {
      return; // Data already loaded by the immediate effect above
    }
    
    // For universal widget: load when expanded and not already loaded
    if (isExpanded && !videoFlow && !hasLoadedDataRef.current) {
      console.log('🚀 Widget: Loading data on expansion (universal widget)');
      hasLoadedDataRef.current = true; // Prevent re-loading
      loadBetaVersionData();
    }
  }, [isExpanded, qudemoId]);
  
  // Trigger initial video load when videoFlow becomes available
  useEffect(() => {
    if (isExpanded && videoFlow && videoFlow.videos && videoFlow.videos.length > 0 && !loading) {
      // Start playing the initial video
      setIsPlaying(true);
    }
  }, [videoFlow, isExpanded, loading]);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-play intro video when widget is first expanded
  useEffect(() => {
    if (isExpanded && !hasShownIntroRef.current && qudemoData && qudemoData.id) {
      console.log('🎬 Widget expanded - loading intro video...');
      loadIntroVideo();
      hasShownIntroRef.current = true; // Mark as shown
      
      // Unmute the intro preview video if it's playing
      if (introPreviewRef.current) {
        introPreviewRef.current.muted = false;
      }
    }
  }, [isExpanded, qudemoData]);

  // Fetch intro video preview for collapsed state
  useEffect(() => {
    if (qudemoData && qudemoData.id && !introVideoPreview) {
      console.log('🎬 Triggering intro video preview fetch...');
      fetchIntroVideoPreview();
    }
  }, [qudemoData]);
  
  // Also try to fetch intro video preview directly when qudemoId/companyName are provided as props
  const hasAttemptedDirectFetchRef = useRef(false);
  
  useEffect(() => {
    // Only fetch once, with proper validation
    if (qudemoId && companyName && !introVideoPreview && !qudemoData && !hasAttemptedDirectFetchRef.current) {
      // Validate that companyName and qudemoId are valid strings
      if (typeof companyName !== 'string' || typeof qudemoId !== 'string' || !companyName.trim() || !qudemoId.trim()) {
        console.warn('⚠️ Invalid companyName or qudemoId, skipping intro video fetch');
        return;
      }
      
      console.log('🎬 Fetching intro video preview with props (before qudemoData)...');
      hasAttemptedDirectFetchRef.current = true; // Mark as attempted
      
      // Fetch intro video directly
      const fetchDirectIntroVideo = async () => {
        try {
          const response = await fetch(
            getVideoApiUrl(`/ask/${encodeURIComponent(companyName)}/${qudemoId}`),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question: "INTRO_VIDEO" })
            }
          );
          const data = await response.json();
          if (data && data.has_avatar_video && data.avatar_video_url) {
            console.log('✅ Setting intro video preview URL (from props)');
            setIntroVideoPreview(data.avatar_video_url);
          }
        } catch (error) {
          console.error('❌ Error fetching intro video preview (from props):', error);
        }
      };
      fetchDirectIntroVideo();
    }
  }, [qudemoId, companyName, qudemoData, introVideoPreview]);

  // Randomly select 3 questions for video overlay - triggers on suggestedQuestions change and after each bot message
  useEffect(() => {
    if (!suggestedQuestions || suggestedQuestions.length === 0) return;
    
    // Filter out clicked questions
    const availableQuestions = suggestedQuestions.filter(q => !clickedQuestions.includes(q));
    
    // If less than 3 questions remain, reset clicked questions
    if (availableQuestions.length < 3) {
      setClickedQuestions([]);
      // Use all suggested questions
      const shuffled = [...suggestedQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(3, suggestedQuestions.length));
      setOverlayQuestions(selected);
    } else {
      // Shuffle and pick 3 random questions from available ones
      const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      setOverlayQuestions(selected);
    }
  }, [suggestedQuestions, chatMessages, clickedQuestions]);

  // Aggressive video preloading - actually load videos into memory for instant playback
  useEffect(() => {
    if (!videoFlow || currentVideoIndex === null || currentVideoIndex === undefined) return;
    
    const videosToPreload = [];
    
    // Preload next video in sequence (highest priority)
    if (currentVideoIndex + 1 < videoFlow.videos.length) {
      videosToPreload.push(videoFlow.videos[currentVideoIndex + 1]);
    }
    
    // Preload videos from current video's nextQuestions
    const currentVideo = videoFlow.videos[currentVideoIndex];
    if (currentVideo?.nextQuestions) {
      currentVideo.nextQuestions.forEach(question => {
        const result = matchQuestion(question.text);
        if (result.matched) {
          const matchedVideo = videoFlow.videos.find(v => v.id === result.videoId);
          if (matchedVideo && !videosToPreload.includes(matchedVideo)) {
            videosToPreload.push(matchedVideo);
          }
        }
      });
    }
    
    // Actually preload videos (limit to 3 to avoid bandwidth waste)
    videosToPreload.slice(0, 3).forEach((video, index) => {
      // Skip if already preloaded
      if (videoPreloadCacheRef.current[video.id]) {
        return;
      }
      
      // Create hidden video element for preloading
      const preloadVideo = document.createElement('video');
      preloadVideo.src = video.url || video.src;
      preloadVideo.preload = 'auto'; // Aggressively preload
      preloadVideo.muted = true;
      preloadVideo.style.display = 'none';
      
      // Add to DOM to trigger loading
      document.body.appendChild(preloadVideo);
      
      // Track loading progress
      preloadVideo.addEventListener('loadeddata', () => {
        videoPreloadCacheRef.current[video.id] = {
          element: preloadVideo,
          ready: true,
          src: video.url || video.src
        };
      });
      
      preloadVideo.addEventListener('error', () => {
        if (preloadVideo.parentNode) {
          preloadVideo.parentNode.removeChild(preloadVideo);
        }
      });
      
      // Store reference immediately (even before loaded)
      videoPreloadCacheRef.current[video.id] = {
        element: preloadVideo,
        ready: false,
        src: video.url || video.src
      };
    });
    
    // Cleanup old cached videos (keep only last 5)
    const cachedIds = Object.keys(videoPreloadCacheRef.current);
    if (cachedIds.length > 5) {
      cachedIds.slice(0, cachedIds.length - 5).forEach(id => {
        const cached = videoPreloadCacheRef.current[id];
        if (cached?.element?.parentNode) {
          cached.element.parentNode.removeChild(cached.element);
        }
        delete videoPreloadCacheRef.current[id];
      });
    }
  }, [currentVideoIndex, videoFlow]);

  // Update video state when currentVideoIndex changes
  useEffect(() => {
    if (isExpanded && videoFlow?.videos[currentVideoIndex]) {
      // Video index changed - no need to reset ended state anymore
    }
  }, [currentVideoIndex, videoFlow, isExpanded]);

  // Preload all FAQ avatar videos for instant playback
  const preloadAvatarVideos = async () => {
    if (!qudemoData || !qudemoData.id || !qudemoData.company_name) {
      console.log('⚠️ Cannot preload avatar videos: missing qudemo data');
      return;
    }

    // Check if cache needs refresh (refresh every 10 minutes)
    const now = Date.now();
    const CACHE_LIFETIME = 10 * 60 * 1000; // 10 minutes
    
    if (cacheTimestampRef.current && (now - cacheTimestampRef.current) < CACHE_LIFETIME) {
      console.log('✅ Avatar video cache still fresh, skipping preload');
      return;
    }

    try {
      console.log('🎬 Starting avatar video preload...');
      const companyName = qudemoData.company_name;
      const qudemoId = qudemoData.id;

      // Fetch all FAQs with their video URLs
      const faqsUrl = getVideoApiUrl(`/faqs/${encodeURIComponent(companyName)}/${qudemoId}`);
      const response = await fetch(faqsUrl);
      
      if (!response.ok) {
        console.warn('⚠️ Could not fetch FAQs for preloading');
        return;
      }

      const data = await response.json();
      const faqs = data.faqs || [];
      
      console.log(`📦 Found ${faqs.length} FAQs to preload`);

      // Preload up to 10 most important videos (intro + top 9 FAQs)
      const videosToPreload = faqs.slice(0, 10).filter(faq => faq.avatar_video_url);
      
      console.log(`🎯 Preloading ${videosToPreload.length} avatar videos...`);

      for (const faq of videosToPreload) {
        const videoUrl = faq.avatar_video_url;
        const cacheKey = faq.id || videoUrl;

        // Skip if already cached
        if (avatarVideoCacheRef.current[cacheKey]?.ready) {
          continue;
        }

        // Create hidden video element for preloading
        const video = document.createElement('video');
        video.src = videoUrl;
        video.preload = 'auto';
        video.muted = true;
        video.style.display = 'none';
        video.crossOrigin = 'anonymous';

        // Add to DOM to trigger loading
        document.body.appendChild(video);

        // Track when video is loaded
        video.addEventListener('canplaythrough', () => {
          avatarVideoCacheRef.current[cacheKey] = {
            element: video,
            ready: true,
            url: videoUrl,
            question: faq.question
          };
          console.log(`✅ Cached avatar video: ${faq.question.substring(0, 50)}...`);
        });

        video.addEventListener('error', (e) => {
          console.error(`❌ Failed to preload avatar video: ${faq.question}`, e);
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
          delete avatarVideoCacheRef.current[cacheKey];
        });

        // Store reference immediately (even before loaded)
        avatarVideoCacheRef.current[cacheKey] = {
          element: video,
          ready: false,
          url: videoUrl,
          question: faq.question
        };
      }

      // Update cache timestamp
      cacheTimestampRef.current = now;
      console.log(`✅ Avatar video preload initiated. Cache will refresh in 10 minutes.`);

    } catch (error) {
      console.error('❌ Error preloading avatar videos:', error);
    }
  };

  // Trigger avatar video preloading when qudemoData is available
  useEffect(() => {
    if (qudemoData && isExpanded) {
      preloadAvatarVideos();
    }
  }, [qudemoData, isExpanded]);

  // Cleanup avatar video cache on unmount
  useEffect(() => {
    return () => {
      Object.values(avatarVideoCacheRef.current).forEach(cached => {
        if (cached?.element?.parentNode) {
          cached.element.parentNode.removeChild(cached.element);
        }
      });
      avatarVideoCacheRef.current = {};
    };
  }, []);

  const loadVideoThumbnail = async () => {
    try {
      const response = await fetch('/video-flow.json');
      const data = await response.json();
      
      if (data.videos && data.videos.length > 0) {
        const firstVideo = data.videos[0];
        const videoUrl = firstVideo.src || firstVideo.url;
        
        // Priority: 1. Thumbnail field, 2. YouTube thumbnail, 3. Video element capture
        if (firstVideo.thumbnail || firstVideo.poster || firstVideo.preview) {
          setVideoThumbnail(firstVideo.thumbnail || firstVideo.poster || firstVideo.preview);
        } else if (videoUrl) {
          // Check if it's a YouTube video
          const ytThumbnail = getYouTubeThumbnail(videoUrl);
          if (ytThumbnail) {
            setVideoThumbnail(ytThumbnail);
          } else {
            // For direct video files (MP4), capture a frame
            captureVideoFrame(videoUrl);
          }
        }
      }
    } catch (error) {
      // Use default preview image
    }
  };

  const getYouTubeThumbnail = (videoUrl) => {
    if (!videoUrl) return null;
    
    // Extract YouTube video ID and get thumbnail
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    
    return null;
  };

  const captureVideoFrame = (videoUrl) => {
    // Create a hidden video element to capture a frame
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.currentTime = 2; // Capture frame at 2 seconds
    
    video.addEventListener('loadeddata', () => {
      try {
        // Create canvas to draw video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        setVideoThumbnail(thumbnailUrl);
        
        // Clean up
        video.remove();
      } catch (error) {
        // Use previewImage fallback
      }
    });
    
    video.addEventListener('error', () => {
      video.remove();
    });
  };

  const loadBetaVersionData = async () => {
    try {
      setLoading(true);
      
      let videoFlowData = null;
      
      // Only load static video flow if no specific qudemoId is provided
      if (!qudemoId) {
        console.log('📹 Widget: Loading static video flow');
        const videoFlowResponse = await fetch('/video-flow.json');
        videoFlowData = await videoFlowResponse.json();
      setVideoFlow(videoFlowData);
      } else {
        console.log('🎯 Widget: Skipping static video flow (qudemoId provided)');
      }
      
      // Load QuDemo data (either specific QuDemo or Universal Demo)
      let loadedQudemo = null;
      try {
        let qudemoResponse;
        
        // If qudemoId is provided, fetch that specific QuDemo
        if (qudemoId && companyName) {
          console.log('🎯 Widget: Loading specific QuDemo:', qudemoId, companyName);
          
          // Try with authentication first (for logged-in users)
          const token = localStorage.getItem('accessToken');
          if (token) {
            try {
              qudemoResponse = await fetch(getNodeApiUrl(`/api/qudemos/${qudemoId}`), {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              // If auth fails, fall through to public endpoint
              if (!qudemoResponse.ok) {
                console.log('⚠️ Auth fetch failed, trying public endpoint');
                throw new Error('Auth failed');
              }
            } catch (authError) {
              console.log('⚠️ Trying public endpoint without auth');
              // Try public endpoint without auth
              qudemoResponse = await fetch(getNodeApiUrl(`/api/qudemos/public/${qudemoId}`));
            }
          } else {
            // No token, use public endpoint
            console.log('🌐 No auth token, using public endpoint');
            qudemoResponse = await fetch(getNodeApiUrl(`/api/qudemos/public/${qudemoId}`));
          }
        } else {
          // Otherwise, load Universal Demo
          console.log('🌐 Widget: Loading Universal Demo');
          qudemoResponse = await fetch(getNodeApiUrl(`/api/qudemos/share/${UNIVERSAL_DEMO_TOKEN}`));
        }
        
        const qudemoResponseData = await qudemoResponse.json();
        
        if (qudemoResponseData.success && (qudemoResponseData.data || qudemoResponseData.qudemo)) {
          const qudemo = qudemoResponseData.data || qudemoResponseData.qudemo;
          
          // Extract company name from nested company object or use passed-in companyName
          let extractedCompanyName = companyName || qudemo.company?.name || qudemo.company_name;
          
          // If still no company name, use fallback
          if (!extractedCompanyName) {
            extractedCompanyName = 'Qudemo';
          }
          
          // Add company_name to root level for easier access
          qudemo.company_name = extractedCompanyName;
          
          setQudemoData(qudemo);
          loadedQudemo = qudemo; // Store for later use
          console.log('✅ Widget: QuDemo loaded:', qudemo.title || qudemo.name, '- Company:', extractedCompanyName);
          console.log('📦 Widget: Full QuDemo data:', {
            id: qudemo.id,
            title: qudemo.title,
            company_name: qudemo.company_name,
            videos: qudemo.videos?.length || 0,
            knowledge_sources: qudemo.knowledge_sources?.length || 0
          });
        }
      } catch (qudemoError) {
        console.error('❌ Widget: Failed to load qudemo:', qudemoError);
      }
      
      // Extract suggested questions from video flow (static videos)
      const staticQuestions = [];
      if (videoFlowData && videoFlowData.videos && videoFlowData.videos.length > 0) {
        // Get questions from the intro video (first video)
        const introVideo = videoFlowData.videos[0];
        if (introVideo.nextQuestions) {
          introVideo.nextQuestions.forEach(q => {
            if (q.text && !staticQuestions.includes(q.text)) {
              staticQuestions.push(q.text);
            }
          });
        }
        
        // If we need more questions, get from other videos
        if (staticQuestions.length < 6) {
          videoFlowData.videos.forEach(video => {
            if (video.nextQuestions && staticQuestions.length < 6) {
              video.nextQuestions.forEach(q => {
                if (q.text && !staticQuestions.includes(q.text) && staticQuestions.length < 6) {
                  staticQuestions.push(q.text);
                }
              });
            }
          });
        }
      }
      
      // Get suggested questions from Universal Demo Qudemo (if available)
      let qudemoQuestions = [];
      if (loadedQudemo && loadedQudemo.id && loadedQudemo.company_name) {
        try {
          const suggestedQuestionsUrl = getVideoApiUrl(`/suggested-questions/${encodeURIComponent(loadedQudemo.company_name)}/${loadedQudemo.id}`);
          console.log('🔍 Fetching suggested questions from:', suggestedQuestionsUrl);
          
          const suggestedQuestionsResponse = await fetch(suggestedQuestionsUrl);
          console.log('📡 Suggested questions response status:', suggestedQuestionsResponse.status);
          
          const suggestedQuestionsData = await suggestedQuestionsResponse.json();
          console.log('📊 Suggested questions data:', suggestedQuestionsData);
          
          // Handle both response formats: {questions: [...]} and {suggested_questions: [...]}
          const questionsArray = suggestedQuestionsData.questions || suggestedQuestionsData.suggested_questions || [];
          console.log('✅ Extracted questions array:', questionsArray);
          console.log('📝 Questions count:', questionsArray.length);
          
          if (questionsArray && questionsArray.length > 0) {
            qudemoQuestions = questionsArray.map(q => {
              // Handle different question formats
              if (typeof q === 'string') return q;
              return q.question || q.text || q.title || '';
            }).filter(q => q.trim() !== '');
            console.log('✅ Processed questions:', qudemoQuestions);
          } else {
            console.warn('⚠️ No questions found in response');
          }
        } catch (qError) {
          console.error('❌ Error loading suggested questions:', qError);
          // Failed to load suggested questions
        }
      }
      
      // Combine questions: if specific qudemoId is provided, ONLY use qudemo questions
      let allQuestions;
      if (qudemoId && qudemoQuestions.length > 0) {
        console.log('🎯 Using ONLY QuDemo questions (qudemoId provided)');
        allQuestions = qudemoQuestions;
      } else {
        console.log('🔗 Combining static and qudemo questions');
        allQuestions = [...staticQuestions, ...qudemoQuestions];
      }
      console.log('📋 Questions array:', allQuestions);
      
      const questionsToSet = allQuestions.slice(0, 10); // Show up to 10 questions total
      console.log('📌 Final questions to display (max 10):', questionsToSet);
      setSuggestedQuestions(questionsToSet);
      console.log('✅ Suggested questions state updated with', questionsToSet.length, 'questions');
      
    } catch (error) {
      console.error('❌❌❌ CRITICAL ERROR in loadBetaVersionData:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Fallback mock data if file not found
      setVideoFlow({
        videos: [
          {
            id: 'intro',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Product Demo',
            nextQuestions: [
              { text: 'What is QuDemo?' },
              { text: 'How does it work?' },
              { text: 'What are the features?' },
              { text: 'How much does it cost?' }
            ]
          }
        ]
      });
      
      setSuggestedQuestions([
        'What is QuDemo?',
        'How does it work?',
        'What are the features?',
        'How much does it cost?'
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ========== SPEECH RECOGNITION ==========
  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputMessage(finalTranscript);
          recognition.stop();
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  };

  // Check if question is about sales/meeting
  const isSalesRelated = (question) => {
    const lowerQuestion = question.toLowerCase();
    const salesKeywords = [
      'sales', 'talk to sales', 'connect with sales', 'speak to sales',
      'book a call', 'schedule a call', 'book meeting', 'schedule meeting',
      'demo call', 'sales team', 'talk to someone', 'speak to someone',
      'contact sales', 'get in touch', 'arrange a call', 'setup a call',
      'meeting', 'call', 'talk', 'speak', 'connect me', 'reach out'
    ];
    return salesKeywords.some(keyword => lowerQuestion.includes(keyword));
  };

  const handleBookMeeting = () => {
    window.open('https://calendly.com/jazeemchoori/30min', '_blank', 'noopener,noreferrer');
  };

  // ========== USER INPUT HANDLING ==========
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = async () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser.\n\nPlease use Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (error) {
        alert('Could not access microphone. Please check permissions.');
      }
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const userQuestion = messageText || inputMessage.trim();
    if (!userQuestion || isTyping) return;
    
    // Add user message
    setChatMessages(prev => [...prev, { type: 'user', text: userQuestion }]);
    setInputMessage('');
    setIsTyping(true);

    // Check if user wants to book a meeting
    if (isSalesRelated(userQuestion)) {
      // Try to get sales avatar video first
      try {
        const companyName = qudemoData.company_name || qudemoData.company?.name || 'unknown';
        const response = await fetch(
          getVideoApiUrl(`/ask/${encodeURIComponent(companyName)}/${qudemoData.id}`),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: "SALES_INQUIRY" })
          }
        );
        
        const data = await response.json();
        
        // If we got an avatar video for sales inquiry, use it
        if (data && data.has_avatar_video && data.avatar_video_url) {
          // Check cache for sales inquiry video
          const cacheKey = 'faq_fallback_sales';
          const cachedVideo = avatarVideoCacheRef.current[cacheKey];
          
          if (cachedVideo?.ready) {
            console.log('⚡ CACHE HIT! Sales inquiry video ready');
          } else {
            console.log('⏳ Cache miss for sales inquiry video');
          }
          
          setChatMessages(prev => [...prev, { 
            type: 'bot', 
            text: data.answer
          }]);
          
          setCurrentAvatarVideo({
            videoUrl: data.avatar_video_url,
            answer: data.answer,
            faqId: 'faq_fallback_sales'
          });
          
          setIsPlaying(false);
          setShowBookingPrompt(true);
          setIsTyping(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching sales avatar:', error);
      }
      
      // Fallback to text-only if no avatar video
      setIsTyping(false);
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        text: "I'd be happy to connect you with our team! Please click the 'Book a Meeting' button below to schedule a call with our sales team."
      }]);
      setShowBookingPrompt(true);
      return;
    }

    // STEP 1: Check if question matches static video-flow questions (but skip fallback matches)
    const matchResult = matchQuestion(userQuestion);
    
    // Only use static video if it's a STRONG match (not fallback)
    if (matchResult.matched && matchResult.videoIndex !== null && matchResult.videoIndex !== -1 && !matchResult.isFallback) {
      // Use static video response
    setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          type: 'bot', 
          text: matchResult.answer || "Let me show you a video that answers your question!"
        }]);

        // Pause current video first
        setIsPlaying(false);
        
        // Switch to the matched static video
        setCurrentVideoIndex(matchResult.videoIndex);
        setCurrentTimestamp(0);
        
        // Force refresh and auto-play
        setTimeout(() => {
          setVideoRefreshKey(prev => prev + 1);
          setIsPlaying(true);
        }, 200);
        
        setIsTyping(false);
      }, 300);
      return;
    }
    
    // STEP 2: If no static match, call Universal Demo Qudemo API
    if (!qudemoData || !qudemoData.id) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          type: 'bot', 
          text: "I'm not sure about that. You can ask me about Qudemo, pricing, security, or other features!"
        }]);
        setIsTyping(false);
      }, 300);
      return;
    }
    
    // Get company name from qudemoData (might be nested)
    const companyName = qudemoData.company_name || qudemoData.company?.name || 'unknown';

    try {
      
      const response = await fetch(
        getVideoApiUrl(`/ask/${encodeURIComponent(companyName)}/${qudemoData.id}`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: userQuestion
          })
        }
      );

      const data = await response.json();

      if (data && data.answer) {
        // Add bot response
        setChatMessages(prev => [...prev, { 
          type: 'bot', 
          text: data.answer
        }]);

        // Check if there's an avatar video (for document-based answers)
        console.log('🎬 Avatar Video Check:', {
          has_avatar_video: data.has_avatar_video,
          avatar_video_url: data.avatar_video_url,
          faq_id: data.faq_id,
          full_response: data
        });
        
        if (data.has_avatar_video && data.avatar_video_url) {
          // Check if video is in cache
          const cacheKey = data.faq_id || data.avatar_video_url;
          const cachedVideo = avatarVideoCacheRef.current[cacheKey];
          
          if (cachedVideo?.ready) {
            console.log('⚡ CACHE HIT! Using preloaded avatar video:', {
              videoUrl: data.avatar_video_url,
              faqId: data.faq_id,
              cacheStatus: 'READY'
            });
          } else {
            console.log('⏳ Cache miss, loading avatar video:', {
              videoUrl: data.avatar_video_url,
              faqId: data.faq_id,
              cacheStatus: cachedVideo ? 'LOADING' : 'NOT_CACHED'
            });
          }
          
          // Display avatar video
          setCurrentAvatarVideo({
            videoUrl: data.avatar_video_url,
            answer: data.answer,
            faqId: data.faq_id
          });
          
          console.log('✅ Avatar video state set, pausing regular video');
          
          // Pause any playing video
          setIsPlaying(false);
          setIsTyping(false);
          return;
      } else {
          console.log('❌ No avatar video, clearing avatar state');
          // Clear avatar video if switching back to regular video
          setCurrentAvatarVideo(null);
        }

        // Check for video navigation data in the response
        let targetVideoUrl = null;
        let timestamp = 0;
        
        // First check direct video fields (this is how the Python backend sends video data)
        if (data && data.video_url) {
          targetVideoUrl = data.video_url;
          timestamp = data.start || data.timestamp || 0;
          
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

        // Switch video if we have a valid video URL
        if (targetVideoUrl && qudemoData.videos) {
          // First, pause the current video to ensure clean transition
          setIsPlaying(false);
          
          // Find if this video is in our qudemo's videos
          const videoIndex = qudemoData.videos.findIndex(v => 
            v.video_url === targetVideoUrl || v.video_url.includes(targetVideoUrl)
          );

          if (videoIndex !== -1) {
            const qudemoVideo = qudemoData.videos[videoIndex];
            
            // Update the video flow to use the Qudemo video
            const tempVideo = {
              id: `qudemo-${qudemoVideo.id}`,
              url: qudemoVideo.video_url,
              src: qudemoVideo.video_url,
              title: qudemoVideo.video_title || 'Qudemo Video',
              subtitle: null,
              nextQuestions: []
            };

            // Add to videoFlow temporarily (only if not already there)
            setVideoFlow(prev => {
              const exists = prev.videos.some(v => 
                v.url === tempVideo.url || v.src === tempVideo.url
              );
              if (!exists) {
                return {
                  ...prev,
                  videos: [...prev.videos, tempVideo]
                };
              }
              return prev;
            });
            
            // Set the video index and timestamp
            setTimeout(() => {
              // Find the index in videoFlow
              const targetIndex = videoFlow.videos.findIndex(v => 
                (v.url || v.src) === tempVideo.url
              );
              
              if (targetIndex !== -1) {
                setCurrentVideoIndex(targetIndex);
              } else {
                setCurrentVideoIndex(videoFlow.videos.length);
              }
              
              setCurrentTimestamp(timestamp);
              
              // Force video to seek to new timestamp after a brief delay
              setTimeout(() => {
                // Update timestamp
                setCurrentTimestamp(timestamp);
                // Set playing to true BEFORE incrementing refresh key
                setIsPlaying(true);
                // Increment refresh key to force video player re-render with playing=true
                setVideoRefreshKey(prev => prev + 1);
                
                // Try to seek directly using the player ref if available
                setTimeout(() => {
                  if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
                    try {
                      videoPlayerRef.current.seekTo(timestamp);
                    } catch (error) {
                      // Seek failed
                    }
                  }
                }, 500); // Wait for player to be ready
              }, 200);
            }, 100);
          }
        }
      } else {
        setChatMessages(prev => [...prev, { 
          type: 'bot', 
          text: "I couldn't find a relevant answer. You can ask me about Qudemo, pricing, security, or other features!"
        }]);
      }
      
      setIsTyping(false);
    } catch (error) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          type: 'bot', 
          text: "Sorry, I encountered an error. Please try asking your question again."
        }]);
        setIsTyping(false);
      }, 300);
    }
  };

  const loadIntroVideo = async () => {
    try {
      console.log('🎥 Loading intro video for QuDemo...');
      
      if (!qudemoData || !qudemoData.id) {
        console.log('❌ No QuDemo data available');
        return;
      }
      
      const companyName = qudemoData.company_name || qudemoData.company?.name;
      
      if (!companyName) {
        console.log('❌ No company name available');
        return;
      }
      
      // Make a special request to get the intro video
      const response = await fetch(
        getVideoApiUrl(`/ask/${encodeURIComponent(companyName)}/${qudemoData.id}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: "INTRO_VIDEO" })
        }
      );
      
      const data = await response.json();
      
      console.log('🎥 Intro video response:', data);
      
      if (data && data.has_avatar_video && data.avatar_video_url) {
        console.log('✅ Intro video found, auto-playing...');
        
        // Set the intro avatar video
        setCurrentAvatarVideo({
          videoUrl: data.avatar_video_url,
          answer: data.answer,
          faqId: 'faq_intro'
        });
        
        // Pause any regular video
        setIsPlaying(false);
      } else {
        console.log('ℹ️ No intro video available yet');
      }
    } catch (error) {
      console.error('❌ Error loading intro video:', error);
    }
  };

  const fetchIntroVideoPreview = async () => {
    try {
      console.log('🎬 Fetching intro video for collapsed preview...');
      
      if (!qudemoData || !qudemoData.id) {
        console.log('❌ No QuDemo data available for preview');
        return;
      }
      
      const companyName = qudemoData.company_name || qudemoData.company?.name;
      
      if (!companyName) {
        console.log('❌ No company name available for preview');
        return;
      }
      
      // Fetch intro video URL
      const response = await fetch(
        getVideoApiUrl(`/ask/${encodeURIComponent(companyName)}/${qudemoData.id}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: "INTRO_VIDEO" })
        }
      );
      
      const data = await response.json();
      
      console.log('🎬 Intro video preview response:', data);
      
      if (data && data.has_avatar_video && data.avatar_video_url) {
        console.log('✅ Setting intro video preview URL');
        setIntroVideoPreview(data.avatar_video_url);
      } else {
        console.log('ℹ️ No intro video available for preview');
      }
    } catch (error) {
      console.error('❌ Error fetching intro video preview:', error);
    }
  };

  const handleSuggestedQuestionClick = (question) => {
    // Track the clicked question to exclude it from future overlay selections
    setClickedQuestions(prev => [...prev, question]);
    handleSendMessage(question);
  };

  const loadSubtitles = (subtitleUrl) => {
    if (!videoPlayerRef.current) {
      return;
    }

    // Clear existing subtitle tracks
    const existingTracks = videoPlayerRef.current.querySelectorAll('track');
    existingTracks.forEach(track => {
      track.remove();
    });

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'English';
    track.srclang = 'en';
    track.src = subtitleUrl;
    track.default = true;

    videoPlayerRef.current.appendChild(track);

    track.addEventListener('load', () => {
      const textTrack = track.track;
      
      if (textTrack && textTrack.cues) {
        // Set mode to 'showing' to display browser's native subtitles
        textTrack.mode = 'showing';
        
        // Enable all text tracks (show browser's native subtitles)
        if (videoPlayerRef.current && videoPlayerRef.current.textTracks) {
          for (let i = 0; i < videoPlayerRef.current.textTracks.length; i++) {
            videoPlayerRef.current.textTracks[i].mode = 'showing';
          }
        }
      }
    });

    track.addEventListener('error', (e) => {
      // Subtitle loading failed
    });
  };

  const matchQuestion = (userQuestion) => {
    if (!videoFlow || !videoFlow.videos) return { matched: false };

    // Normalize voice recognition variations
    let normalizedQuestion = userQuestion.toLowerCase().trim();
    
    // Handle voice recognition variations of "Qudemo"
    normalizedQuestion = normalizedQuestion.replace(/\bq\s*demo\b/gi, 'qudemo');
    normalizedQuestion = normalizedQuestion.replace(/\bq\s*d\s*e\s*m\s*o\b/gi, 'qudemo');
    normalizedQuestion = normalizedQuestion.replace(/\bque\s*demo\b/gi, 'qudemo');
    normalizedQuestion = normalizedQuestion.replace(/\bcue\s*demo\b/gi, 'qudemo');
    
    // Handle voice recognition variations of "Chatwoot"
    normalizedQuestion = normalizedQuestion.replace(/\bchat\s*wood\b/gi, 'chatwoot');
    normalizedQuestion = normalizedQuestion.replace(/\bchatwood\b/gi, 'chatwoot');
    normalizedQuestion = normalizedQuestion.replace(/\bchat\s*woot\b/gi, 'chatwoot');
    normalizedQuestion = normalizedQuestion.replace(/\bchat\s*wot\b/gi, 'chatwoot');
    normalizedQuestion = normalizedQuestion.replace(/\bchatwot\b/gi, 'chatwoot');
    
    const lowerQuestion = normalizedQuestion;
    
    // First pass: Exact match with video questions (skip intro)
    for (const video of videoFlow.videos) {
      if (video.question && !video.isIntro) {
        const lowerVideoQuestion = video.question.toLowerCase();
        if (lowerQuestion === lowerVideoQuestion) {
          const videoIndex = videoFlow.videos.findIndex(v => v.id === video.id);
          return { 
            matched: true, 
            videoId: video.id, 
            videoIndex: videoIndex,
            question: video.question,
            answer: video.answer,
            confidence: 'high'
          };
        }
      }
    }

    // Second pass: Contains match (skip intro)
    for (const video of videoFlow.videos) {
      if (video.question && !video.isIntro) {
        const lowerVideoQuestion = video.question.toLowerCase();
        if (lowerQuestion.includes(lowerVideoQuestion) || lowerVideoQuestion.includes(lowerQuestion)) {
          const videoIndex = videoFlow.videos.findIndex(v => v.id === video.id);
          return { 
            matched: true, 
            videoId: video.id, 
            videoIndex: videoIndex,
            question: video.question,
            answer: video.answer,
            confidence: 'high' 
          };
        }
      }
    }

    // Third pass: Keyword-based matching for key questions
    const keywordMappings = [
      { keywords: ['what is qudemo', 'what is this', 'what is demo', 'tell me about'], videoId: 'video_1', videoQuestion: 'What is Qudemo?' },
      { keywords: ['how does qudemo work', 'how qudemo works', 'how does it work', 'how does demo work', 'how demo works'], videoId: 'video_2', videoQuestion: 'How does Qudemo work?' },
      { keywords: ['who is qudemo for', 'who can use', 'who should use', 'who is demo for'], videoId: 'video_3', videoQuestion: 'Who is Qudemo for?' },
      { keywords: ['pricing', 'how much', 'cost', "what's the pricing"], videoId: 'video_12', videoQuestion: "What's the pricing?" },
      { keywords: ['secure', 'security', 'how secure'], videoId: 'video_11', videoQuestion: 'How secure is my data?' },
      { keywords: ['integrate', 'integration'], videoId: 'video_14', videoQuestion: 'Can I integrate Qudemo with other tools?' },
      { keywords: ['embed', 'share'], videoId: 'video_7', videoQuestion: 'Can I embed Qudemo or share it?' },
      { keywords: ['insights', 'what insights'], videoId: 'video_9', videoQuestion: 'What insights can I see?' },
      { keywords: ['onboarding', 'training'], videoId: 'video_10', videoQuestion: 'Can I use Qudemo for onboarding or training?' },
    ];

    for (const mapping of keywordMappings) {
      for (const keyword of mapping.keywords) {
        if (lowerQuestion.includes(keyword)) {
          const matchedVideo = videoFlow.videos.find(v => v.id === mapping.videoId);
          if (matchedVideo) {
            const videoIndex = videoFlow.videos.findIndex(v => v.id === matchedVideo.id);
            return {
              matched: true,
              videoId: matchedVideo.id, 
              videoIndex: videoIndex,
              question: matchedVideo.question,
              answer: matchedVideo.answer,
              confidence: 'high' 
            };
          }
        }
      }
    }

    // Fourth pass: Word-based fuzzy matching (skip intro, more conservative)
    for (const video of videoFlow.videos) {
      if (video.question && !video.isIntro && video.question !== 'Fallback Response') {
        const lowerVideoQuestion = video.question.toLowerCase();
        const videoWords = lowerVideoQuestion.split(/\W+/).filter(w => w.length > 3);
        const questionWords = lowerQuestion.split(/\W+/).filter(w => w.length > 3);
        
        // Need at least 3 matching words for fuzzy match
        const matchingWords = videoWords.filter(word => questionWords.includes(word));
        
        if (matchingWords.length >= 3) {
          const videoIndex = videoFlow.videos.findIndex(v => v.id === video.id);
            return {
              matched: true,
            videoId: video.id, 
            videoIndex: videoIndex,
            question: video.question,
            answer: video.answer,
            confidence: 'medium' 
            };
          }
        }
      }

    // Fallback video (use designated fallback or second video, never intro)
    const fallbackVideo = videoFlow.videos.find(v => v.isFallback) || videoFlow.videos[1];
    if (fallbackVideo) {
      const videoIndex = videoFlow.videos.findIndex(v => v.id === fallbackVideo.id);
      return { 
        matched: true, 
        videoId: fallbackVideo.id, 
        videoIndex: videoIndex,
        question: fallbackVideo.question,
        answer: fallbackVideo.answer,
        confidence: 'fallback', 
        isFallback: true 
      };
    }

    return { matched: false };
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setIsMinimized(false);
    
    // Unmute the video when widget is expanded
    setTimeout(() => {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.muted = false;
      }
    }, 100);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsMinimized(false);
    setIsMaximized(false); // Reset maximized state when closing
    
    // Mute the video when closing
    if (videoPlayerRef.current) {
      videoPlayerRef.current.muted = true;
    }
    
    // Clean up preloaded videos when widget is closed
    Object.keys(videoPreloadCacheRef.current).forEach(id => {
      const cached = videoPreloadCacheRef.current[id];
      if (cached?.element?.parentNode) {
        cached.element.parentNode.removeChild(cached.element);
      }
    });
    videoPreloadCacheRef.current = {};
  };

  // ========== RENDER HELPERS ==========
  const TypingIndicator = () => (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-4 py-3 max-w-[80%]">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  // Small circular widget (collapsed state)
  if (!isExpanded) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {/* Text above widget */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top text */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
            Ask me questions
          </div>
        </div>
        
        <button
          onClick={handleExpand}
          className="group relative"
        >
          {/* Circular video preview with pulse animation */}
          <div className="relative w-20 h-20 md:w-36 md:h-36 rounded-full overflow-hidden shadow-2xl border-4 border-white hover:border-blue-500 transition-all duration-300">
            {introVideoPreview ? (
              <video 
                ref={introPreviewRef}
                src={introVideoPreview.replace(/ /g, '%20')}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : !qudemoId && videoFlow && videoFlow.videos && videoFlow.videos[0] && videoFlow.videos[0].src ? (
              <video 
                src={videoFlow.videos[0].src || videoFlow.videos[0].url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : !qudemoId && (videoThumbnail || previewImage) ? (
              <img 
                src={videoThumbnail || previewImage} 
                alt="Demo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-white" />
              </div>
            )}
            
            {/* Play icon overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
              <svg className="w-8 h-8 md:w-16 md:h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>

            {/* Pulse ring animation */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-75"></div>
          </div>

          {/* Text label */}
          {previewText && (
            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              {previewText}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="border-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </button>
      </div>
    );
  }

  // Expanded widget
  return (
    <>
      {/* Mobile overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={handleClose}></div>
      
      <div className={`fixed inset-0 md:inset-auto md:${positionClasses[position]} z-50 transition-all duration-300 p-4 md:p-0 flex items-center justify-center md:block`}>
      {/* Minimized bar */}
      {isMinimized ? (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-gray-900">Demo Video</span>
            <ChevronDownIcon className="w-5 h-5 text-gray-400 ml-auto rotate-180" />
          </button>
        </div>
      ) : (
         // Full expanded widget - shows only video in normal view, adds chat when maximized
         <div 
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-row w-full md:w-auto transition-all duration-300 ${
            isMaximized ? 'fixed inset-4' : ''
          }`}
          style={{ 
            width: isMaximized ? 'auto' : (window.innerWidth >= 768 ? '500px' : '100%'),
            height: isMaximized ? 'auto' : (window.innerWidth >= 768 ? '700px' : 'auto')
          }}
         >
           {loading ? (
            <div className="w-full p-8 flex flex-col items-center justify-center bg-white">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
               <p className="mt-4 text-gray-600">Loading demo...</p>
             </div>
          ) : (videoFlow && videoFlow.videos && videoFlow.videos.length > 0) || qudemoData ? (
             <>
               {/* Action buttons - absolute positioned */}
               <div className="absolute top-4 right-4 z-30 flex gap-2">
                 {/* Maximize/Restore button */}
                 <button
                   onClick={() => setIsMaximized(!isMaximized)}
                   className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
                   title={isMaximized ? "Restore" : "Maximize"}
                 >
                   {isMaximized ? (
                     <ArrowsPointingInIcon className="w-5 h-5" />
                   ) : (
                     <ArrowsPointingOutIcon className="w-5 h-5" />
                   )}
                 </button>
                 
                 {/* Close button */}
               <button
                 onClick={handleClose}
                   className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
                   title="Close"
               >
                 <XMarkIcon className="w-5 h-5" />
               </button>
               </div>

               {/* Left Column: Video + Book a Meeting Button */}
               <div className={`w-full ${isMaximized ? 'md:w-[60%]' : 'md:w-full'} flex flex-col`}>
                 {/* Video Section - Optimized for Portrait Videos */}
                 <div 
                   className="relative bg-black flex items-center justify-center flex-1" 
                   style={{ 
                     height: window.innerWidth >= 768 ? 'auto' : '300px',
                     minHeight: window.innerWidth >= 768 ? '550px' : '300px',
                     overflow: 'visible'
                   }}
                 >
                {/* Show avatar video if available */}
                {currentAvatarVideo ? (
                   <div className="w-full h-full flex items-center justify-center bg-black">
                     <AvatarVideoPlayer
                       avatarVideoUrl={currentAvatarVideo.videoUrl}
                       answer={currentAvatarVideo.answer}
                       isVisible={isExpanded}
                       faqId={currentAvatarVideo.faqId}
                       avatarVideoCache={avatarVideoCacheRef.current}
                     />
                   </div>
                 ) : videoFlow && videoFlow.videos && videoFlow.videos[currentVideoIndex] ? (
                   <HybridVideoPlayer
                   ref={videoPlayerRef}
                     key={`${videoFlow.videos[currentVideoIndex].url || videoFlow.videos[currentVideoIndex].src}-${currentTimestamp}-${videoRefreshKey}`}
                     url={videoFlow.videos[currentVideoIndex].url || videoFlow.videos[currentVideoIndex].src}
                     width="100%"
                     height="100%"
                     controls={false}
                     playing={isPlaying}
                     startTime={currentTimestamp}
                    style={{ width: '100%', height: '100%', background: 'black' }}
                    onReady={() => {
                      if (isExpanded) {
                        setIsPlaying(true);
                      }
                    }}
                     onPlay={() => {
                       setIsPlaying(true);
                     }}
                     iframeRef={loomIframeRef}
                   />
                 ) : null}
                
                {/* 3 Suggested Questions - Overlay on Video (Only show when NOT maximized) */}
                {!isMaximized && overlayQuestions.length > 0 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full px-4 z-20 flex flex-col gap-2">
                    {overlayQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestionClick(question)}
                        disabled={isTyping}
                        className="group relative text-left bg-white/90 backdrop-blur-sm hover:bg-blue-600 text-gray-800 hover:text-white px-3 py-2 rounded-xl text-xs font-medium border border-white/40 hover:border-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-3 h-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="line-clamp-1">{question}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                 </div>

                 {/* Chat Input - Below Video, Above Book a Meeting (Only show when NOT maximized) */}
                 {!isMaximized && (
                 <div className="w-full bg-white p-4 border-t border-gray-200">
                   <div className="relative flex items-center gap-2 bg-gray-50 rounded-2xl p-2 border border-gray-200 shadow-sm">
                     <textarea 
                       value={inputMessage} 
                       onChange={handleInputChange} 
                       onKeyDown={handleKeyPress} 
                       placeholder={isListening ? '🎙️ Listening...' : 'Type your message...'} 
                       rows="1" 
                       className={`flex-1 px-3 py-2 bg-transparent border-0 text-sm resize-none overflow-hidden min-h-[2.5rem] max-h-[5rem] focus:outline-none placeholder:text-gray-400 text-gray-900`}
                     />
                     
                     {/* Voice input button */}
                     <button 
                       onClick={handleVoiceInput} 
                       className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl text-white transition-all duration-200 shadow-md ${isListening ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse ring-2 ring-green-300' : 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'}`}
                       title={isListening ? "Stop recording" : "Voice input"}
                     >
                       <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                         <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                       </svg>
                     </button>
                     
                     {/* Send button */}
                     <button 
                       onClick={() => handleSendMessage()} 
                       disabled={!inputMessage.trim() || isTyping} 
                       className="relative min-w-[2.5rem] h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                       title="Send message"
                     >
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                       <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5"></path>
                       </svg>
                     </button>
                   </div>
                 </div>
                 )}

                 {/* Book a Meeting Button - Below Chat Input (Only show when NOT maximized) */}
                 {!isMaximized && (
                 <div className="w-full bg-white px-4 pb-4">
                   <button
                     onClick={handleBookMeeting}
                     className="group relative w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 overflow-hidden"
                   >
                     {/* Shimmer effect */}
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                     
                     <svg
                       className="relative z-10 w-5 h-5 mr-2"
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                       strokeWidth={2.5}
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                       />
                     </svg>
                     <span className="relative z-10 font-semibold">Book a Meeting</span>
                   </button>
                 </div>
                 )}
               </div>

              {/* Chat Section (Right on desktop, Bottom on mobile) - Only show when maximized */}
              {isMaximized && (
              <div 
                className="w-full md:w-[40%] flex flex-col bg-white border-t md:border-t-0 md:border-l border-gray-200" 
                style={{ 
                  minHeight: 'auto'
                }}
               >
                 {/* Chat header - Professional Blue Design */}
                 <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-3 flex items-center justify-between flex-shrink-0 overflow-hidden">
                   {/* Animated background effect */}
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-700/20 animate-pulse"></div>
                   
                   <div className="relative flex items-center gap-3">
                     {/* AI Avatar Icon */}
                     <div className="relative">
                       <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/40">
                         <div className="w-5 h-5 rounded-full bg-gradient-to-br from-white to-white/80 flex items-center justify-center">
                           <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                           </svg>
                         </div>
                       </div>
                       {/* Online indicator pulse */}
                       <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-white animate-pulse"></div>
                     </div>
                     
                     <div className="flex flex-col">
                       <span className="font-semibold text-white text-sm">AI Assistant</span>
                       <span className="text-white/80 text-[10px]">Ready to help</span>
                     </div>
                   </div>
                   
                   {/* Status indicator */}
                   <div className="relative flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                     <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                     <span className="text-white text-[10px] font-medium">Online</span>
                   </div>
                 </div>

                 {/* Chat messages - Modern scrollable area */}
                 <div 
                   ref={chatMessagesRef} 
                   className="flex-1 overflow-y-auto p-3 md:p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 flex flex-col gap-3" 
                   style={{ 
                     maxHeight: window.innerWidth >= 768 ? 'none' : '300px',
                     minHeight: window.innerWidth >= 768 ? 'auto' : '250px'
                   }}
                 >
                   {chatMessages.length === 0 ? (
                     <>
                       {/* Welcome message - Professional Blue design */}
                       <div className="relative bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-2xl p-4 shadow-sm">
                         <div className="flex items-start gap-3">
                           <div className="flex-shrink-0">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                               <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                               </svg>
                             </div>
                           </div>
                           <div className="flex-1">
                             <p className="text-gray-700 text-sm font-medium mb-1">Hi! I'm your AI assistant 👋</p>
                             <p className="text-gray-600 text-xs">Ask me anything about this demo, and I'll help you find what you're looking for.</p>
                           </div>
                         </div>
                       </div>
                       
                       {/* Initial Suggested Questions - Modern chip design */}
                       {suggestedQuestions && suggestedQuestions.length > 0 && (
                         <div className="flex flex-col gap-2">
                           <p className="text-xs text-gray-500 font-semibold px-1 flex items-center gap-1">
                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                             </svg>
                             Try asking:
                           </p>
                           {suggestedQuestions.map((question, index) => (
                         <button
                           key={index}
                               onClick={() => handleSuggestedQuestionClick(question)}
                           disabled={isTyping}
                               className="group relative text-left bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 text-gray-700 hover:text-blue-700 px-4 py-2.5 rounded-xl text-xs border border-gray-200 hover:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                             >
                               <span className="flex items-center gap-2">
                                 <svg className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                 </svg>
                                 {question}
                               </span>
                         </button>
                       ))}
                         </div>
                       )}
                     </>
                   ) : (
                     <>
                       {chatMessages.map((msg, i) => (
                         <React.Fragment key={i}>
                           {msg.type === 'bot' ? (
                             /* AI Message - Professional Blue design with avatar */
                             <div className="flex justify-start items-start gap-2">
                               <div className="flex-shrink-0 mt-1">
                                 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                                   <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                     <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                   </svg>
                                 </div>
                               </div>
                               <div className="max-w-[80%] bg-gradient-to-br from-white to-gray-50 border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-sm leading-relaxed text-gray-800 text-left">
                                 {msg.text}
                               </div>
                             </div>
                           ) : (
                             /* User Message - Professional Blue design */
                             <div className="flex justify-end">
                               <div className="max-w-[80%] bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed text-white">
                                 {msg.text}
                     </div>
                   </div>
                 )}
                           
                           {/* Show suggested questions after each bot response - Modern chip design */}
                           {msg.type === 'bot' && i === chatMessages.length - 1 && !isTyping && suggestedQuestions && suggestedQuestions.length > 0 && (
                             <div className="flex flex-col gap-2 mt-2 ml-9">
                               <p className="text-xs text-gray-500 font-semibold px-1 flex items-center gap-1">
                                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                 </svg>
                                 Related:
                               </p>
                               {(showAllQuestions ? suggestedQuestions : suggestedQuestions.slice(0, 3)).map((question, qIndex) => (
                                 <button
                                   key={qIndex}
                                   onClick={() => handleSuggestedQuestionClick(question)}
                                   disabled={isTyping}
                                   className="group relative text-left bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 text-gray-700 hover:text-blue-700 px-3 py-2 rounded-xl text-xs border border-gray-200 hover:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                                 >
                                   <span className="flex items-center gap-2">
                                     <svg className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                     </svg>
                                     {question}
                                   </span>
                                 </button>
                               ))}
               </div>
                           )}
                         </React.Fragment>
                       ))}
                       {isTyping && <TypingIndicator />}
                     </>
                   )}
             </div>

                 {/* Chat input - Futuristic design */}
                 <div className="relative p-3 md:p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex-shrink-0">
                   <div className="flex items-center gap-2">
                     {/* Modern input field with glass effect */}
                     <div className="flex-1 relative">
                       <textarea 
                        value={inputMessage} 
                        onChange={handleInputChange} 
                        onKeyDown={handleKeyPress} 
                        placeholder={isListening ? '🎙️ Listening...' : 'Type your message...'} 
                        rows="1" 
                        className={`w-full px-4 py-3 pr-12 bg-white/80 backdrop-blur-sm border-2 ${isListening ? 'border-green-400 shadow-green-100' : 'border-gray-200 focus:border-blue-400'} rounded-2xl text-sm resize-none overflow-hidden min-h-[2.75rem] max-h-[7.5rem] focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm placeholder:text-gray-400 transition-all duration-200 text-left`}
                      />
                       {/* Character/typing indicator */}
                       {inputMessage && (
                         <div className="absolute right-3 top-1/2 -translate-y-1/2">
                           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                         </div>
                       )}
                     </div>
                     
                     {/* Voice input button - Modern glassmorphism */}
                     <button 
                       onClick={handleVoiceInput} 
                       className={`min-w-[2.75rem] h-11 flex items-center justify-center rounded-2xl text-white transition-all duration-200 shadow-lg ${isListening ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse ring-4 ring-green-200' : 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 hover:shadow-xl hover:-translate-y-0.5'}`}
                       title={isListening ? "Stop recording" : "Voice input"}
                     >
                       <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                         <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                       </svg>
                     </button>
                     
                     {/* Send button - Professional Blue gradient */}
                     <button 
                       onClick={() => handleSendMessage()} 
                       disabled={!inputMessage.trim() || isTyping} 
                       className="relative min-w-[2.75rem] h-11 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group overflow-hidden"
                       title="Send message"
                     >
                       {/* Shimmer effect on hover */}
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                       <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5"></path>
                       </svg>
                     </button>
                   </div>
                   
                   {/* Helper text */}
                   <div className="mt-2 px-1 text-[10px] text-gray-400 flex items-center justify-between">
                     <span className="flex items-center gap-1">
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                       </svg>
                       Press Enter to send
                     </span>
                     {isTyping && (
                       <span className="flex items-center gap-1 text-blue-600">
                         <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                         <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                         AI is thinking
                       </span>
                     )}
                   </div>
                 </div>

                 {/* Book Meeting Button - Professional Blue Design */}
                 <div className="relative px-3 py-3 md:py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex-shrink-0">
                   <button
                     onClick={handleBookMeeting}
                     className="group relative w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 overflow-hidden"
                   >
                     {/* Shimmer effect on hover */}
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                     
                     {/* Animated background pulse */}
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 animate-pulse"></div>
                     
                     <svg
                       className="relative z-10 w-5 h-5 mr-2"
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                       strokeWidth={2.5}
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                       />
                     </svg>
                     <span className="relative z-10">Book a Meeting</span>
                     
                     {/* Arrow icon that appears on hover */}
                     <svg className="relative z-10 w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                     </svg>
                   </button>
                   
                   {/* Helper text */}
                   <div className="mt-1.5 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                     </svg>
                     Schedule a 1-on-1 demo call
                   </div>
                 </div>
               </div>
              )}
             </>
           ) : (
             <div className="w-full p-8 text-center text-gray-500 bg-white">
               <p>No demo available</p>
             </div>
           )}
         </div>
      )}
    </div>
    </>
  );
};

export default FloatingQudemoWidget;

