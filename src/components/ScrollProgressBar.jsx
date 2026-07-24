import React, { useState, useEffect } from 'react';
import './ScrollProgressBar.css';

function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight > 0) {
        const progress = Math.min(Math.max((scrollTop / scrollHeight) * 100, 0), 100);
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  return (
    <div className="scroll-progress-bar-container" aria-hidden="true">
      <div
        className="scroll-progress-bar-fill"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

export default React.memo(ScrollProgressBar);
