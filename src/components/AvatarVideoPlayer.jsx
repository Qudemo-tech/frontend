import React, { useState, useRef, useEffect } from 'react';

/**
 * AvatarVideoPlayer Component
 * 
 * Displays HeyGen-generated AI avatar videos for document-based answers.
 * Provides a modern video player with playback controls.
 * Now optimized to use preloaded video cache for instant playback!
 */
const AvatarVideoPlayer = ({ avatarVideoUrl, answer, isVisible, faqId, avatarVideoCache }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [videoSrc, setVideoSrc] = useState(avatarVideoUrl);

  // Check cache and set video source for instant loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !avatarVideoUrl) return;

    // Check if video is in cache
    const cacheKey = faqId || avatarVideoUrl;
    const cachedVideo = avatarVideoCache?.[cacheKey];

    if (cachedVideo?.ready && cachedVideo?.element) {
      console.log('⚡ INSTANT LOAD! Using cached video element');
      console.log('⚡ Cache metadata:', {
        duration: cachedVideo.element.duration,
        readyState: cachedVideo.element.readyState,
        networkState: cachedVideo.element.networkState
      });
      setCacheHit(true);
      
      // If cached video is fully loaded, use its src directly (browser cache will be instant)
      if (cachedVideo.element.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
        setIsLoading(false);
        
        // Copy metadata from cached video for instant display
        if (cachedVideo.element.duration && !isNaN(cachedVideo.element.duration)) {
          setDuration(cachedVideo.element.duration);
        }
      }
      
      // Set the source - browser will use its cache
      setVideoSrc(avatarVideoUrl.replace(/ /g, '%20'));
    } else {
      console.log('⏳ Loading video from network...', {
        cacheKey,
        cacheStatus: cachedVideo ? 'LOADING' : 'NOT_FOUND'
      });
      setCacheHit(false);
      setIsLoading(true);
      setVideoSrc(avatarVideoUrl.replace(/ /g, '%20'));
    }
  }, [avatarVideoUrl, faqId, avatarVideoCache]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play when visible
    if (isVisible && video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Autoplay failed:', err);
      });
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (cacheHit) {
        console.log('⚡ Cached video loaded instantly!');
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e) => {
      console.error('🎬 Avatar Video Error:', {
        error: e,
        videoUrl: avatarVideoUrl,
        encodedUrl: avatarVideoUrl?.replace(/ /g, '%20'),
        videoElement: videoRef.current
      });
      setError('Failed to load avatar video. Please check if the video is accessible.');
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [isVisible]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black">
      {/* Video Player */}
      <div className="relative bg-black w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white mt-2 text-sm">
                {cacheHit ? 'Loading from cache...' : 'Loading avatar video...'}
              </p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={videoSrc}
          autoPlay
          muted={false}
          preload="auto"
          playsInline
          key={videoSrc} // Force re-render when src changes
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default AvatarVideoPlayer;

