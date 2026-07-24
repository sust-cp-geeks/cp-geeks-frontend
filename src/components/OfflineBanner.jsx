import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';
import './OfflineBanner.css';

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => (typeof window !== 'undefined' ? !navigator.onLine : false));
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
      setDismissed(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      setDismissed(false);

      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);

      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleManualCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      if (navigator.onLine) {
        setIsOffline(false);
        setShowRestored(true);
        setTimeout(() => setShowRestored(false), 3000);
      }
    }, 800);
  };

  if (!isOffline && !showRestored) {
    return null;
  }

  if (dismissed && isOffline) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="offline-indicator-badge"
        title="You are currently offline. Click to view status."
        aria-label="Offline status warning"
      >
        <WifiOff size={14} />
        <span>Offline</span>
      </button>
    );
  }

  return (
    <div
      className={`offline-banner ${isOffline ? 'is-offline' : 'is-restored'}`}
      role="status"
      aria-live="polite"
    >
      <div className="offline-banner-content">
        <div className="offline-banner-message">
          {isOffline ? (
            <>
              <WifiOff className="offline-icon pulse" size={18} />
              <span>You are currently offline. Some features may be unavailable.</span>
            </>
          ) : (
            <>
              <Wifi className="online-icon" size={18} />
              <span>Connection restored. You are back online!</span>
            </>
          )}
        </div>

        <div className="offline-banner-actions">
          {isOffline && (
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="offline-retry-btn"
              title="Check connection"
            >
              <RefreshCw size={13} className={isChecking ? 'spin' : ''} />
              <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="offline-close-btn"
            aria-label="Dismiss banner"
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(OfflineBanner);
