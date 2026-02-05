import { useState } from 'react';
import styles from './ExtendedAvatarPage.module.css';

// AIDEV-NOTE: Fullscreen avatar page for /extended route
// AIDEV-NOTE: Wraps AIChatWidget and uses onDisconnect callback to return to landing page
const ExtendedAvatarPage = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0); // AIDEV-NOTE: Force new widget instance on each session
  const [isLoading, setIsLoading] = useState(false);

  // AIDEV-NOTE: Handle start conversation - show loading state
  const handleStartConversation = () => {
    setIsLoading(true);
    setIsStarted(true);
    // AIDEV-NOTE: Clear loading after widget mounts (autoExpand will handle the rest)
    setTimeout(() => setIsLoading(false), 500);
  };

  // AIDEV-NOTE: Handle disconnect callback from AIChatWidget
  const handleDisconnect = () => {
    setIsStarted(false);
    setIsLoading(false);
    // AIDEV-NOTE: Increment session key to force React to create new widget instance next time
    setSessionKey(prev => prev + 1);
  };

  return (
    <div className={styles.container}>
      {!isStarted ? (
        // AIDEV-NOTE: Landing page with "Start Conversation" button
        <div className={styles.landingContainer}>
          {/* Avatar Preview Image */}
          <div
            className={styles.avatarPreview}
            style={{ backgroundImage: 'url(/ai-avatar.jpg)' }}
          />

          <div className={styles.textContainer}>
            <h1 className={styles.title}>Qudemo Assistant</h1>
            <p className={styles.subtitle}>Click below to start your conversation</p>
          </div>

          <button
            onClick={handleStartConversation}
            className={styles.startButton}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Start Conversation'}
          </button>
        </div>
      ) : (
        // AIDEV-NOTE: Widget container - placeholder after HeyGen removal
        <div className={styles.widgetContainer}>
          <div className="extended-avatar-wrapper">
            {/* HeyGen AIChatWidget removed - component deprecated */}
            <div className="text-center p-8">
              <p className="text-gray-500">Avatar functionality removed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtendedAvatarPage;
