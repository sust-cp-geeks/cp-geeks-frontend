import { useEffect } from 'react';

const SELECTOR = [
  '.fade-in-on-scroll',
  '.reveal-on-scroll',
  '.card',
  '.announcement-card',
  '.event-card',
  '.news-contest-card',
  '.news-member-card',
  '.problem-card',
  '.login-card',
  '.sidebar-widget',
  '.contest-card',
  '.profile-card',
  '.ranker-card',
  '.stat-card',
  '.leaderboard-card',
  '.content-section',
  '.table-wrapper'
].join(',');

export default function ScrollRevealObserver() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observedElements = new WeakSet();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -30px 0px',
        threshold: 0.05,
      }
    );

    const observeNewElements = () => {
      const elements = document.querySelectorAll(SELECTOR);
      elements.forEach((el) => {
        if (!observedElements.has(el)) {
          const rect = el.getBoundingClientRect();
          // If element is already inside or near viewport on mount, trigger reveal smoothly
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            // Small timeout to allow CSS mount transition if desired
            requestAnimationFrame(() => {
              el.classList.add('visible');
            });
          } else {
            observer.observe(el);
          }
          observedElements.add(el);
        }
      });
    };

    observeNewElements();

    // Observe future DOM changes (dynamic card lists, page navigation).
    // Coalesce mutation bursts into one scan per frame — scanning the whole
    // document synchronously on every mutation causes jank during renders.
    let scanScheduled = false;
    const mutationObserver = new MutationObserver(() => {
      if (scanScheduled) return;
      scanScheduled = true;
      requestAnimationFrame(() => {
        scanScheduled = false;
        observeNewElements();
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
