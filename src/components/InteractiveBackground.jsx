import React, { useEffect, useRef } from 'react';

/**
 * InteractiveBackground
 * Renders an ambient responsive dot-grid canvas behind the content.
 * Dots float gently and reactively disperse/displace with spring physics
 * when the mouse cursor moves close to them.
 */
const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check system preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Theme state
    let isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    // Theme observer
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Particle Grid Configuration
    const SPACING = 30; // Grid spacing in px
    const MOUSE_RADIUS = 135; // Interaction radius in px
    const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
    const RETURN_SPEED = 0.08; // Spring return factor
    const DAMPING = 0.88; // Damping/friction factor
    const REPEL_STRENGTH = 38; // Maximum displacement in px

    let points = [];

    const initGrid = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      points = [];

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      // Center the grid nicely
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const originX = offsetX + c * SPACING;
          const originY = offsetY + r * SPACING;
          points.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            phase: (c * 0.35) + (r * 0.25), // Phase for ambient floating wave
          });
        }
      }
    };

    initGrid();

    // Mouse coordinates (client viewport coordinates)
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
      mouse.active = false;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
      mouse.active = false;
    };

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(initGrid, 150);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.02;

      // Smooth mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.25;
        mouse.y += (mouse.targetY - mouse.y) * 0.25;
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      ctx.clearRect(0, 0, width, height);

      // Colors depending on theme
      const baseR = isDark ? 141 : 15;
      const baseG = isDark ? 224 : 140;
      const baseB = isDark ? 219 : 138;
      const baseAlpha = isDark ? 0.22 : 0.18;

      // Pink accent for highlights
      const accentR = isDark ? 212 : 168;
      const accentG = isDark ? 148 : 73;
      const accentB = isDark ? 214 : 171;

      const total = points.length;

      for (let i = 0; i < total; i++) {
        const pt = points[i];

        // Ambient idle floating wave (bypassed if reduced motion is requested)
        let ambientX = 0;
        let ambientY = 0;
        if (!prefersReducedMotion) {
          ambientX = Math.sin(time + pt.phase) * 1.5;
          ambientY = Math.cos(time * 0.8 + pt.phase) * 1.5;
        }

        const targetBaseX = pt.originX + ambientX;
        const targetBaseY = pt.originY + ambientY;

        // Interaction with mouse cursor
        const dx = mouse.x - targetBaseX;
        const dy = mouse.y - targetBaseY;
        const distSq = dx * dx + dy * dy;

        if (distSq < MOUSE_RADIUS_SQ && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const ratio = 1 - dist / MOUSE_RADIUS; // 0 (outer edge) to 1 (center)
          const force = ratio * ratio * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);

          // Disperse / push point away from mouse cursor
          const repelX = -Math.cos(angle) * force;
          const repelY = -Math.sin(angle) * force;

          pt.vx += (targetBaseX + repelX - pt.x) * RETURN_SPEED * 1.6;
          pt.vy += (targetBaseY + repelY - pt.y) * RETURN_SPEED * 1.6;
        } else {
          // Spring back smoothly to base position
          pt.vx += (targetBaseX - pt.x) * RETURN_SPEED;
          pt.vy += (targetBaseY - pt.y) * RETURN_SPEED;
        }

        pt.vx *= DAMPING;
        pt.vy *= DAMPING;
        pt.x += pt.vx;
        pt.y += pt.vy;

        // Visual calculation: highlight and scale based on proximity to mouse
        let radius = 1.15;
        let r = baseR;
        let g = baseG;
        let b = baseB;
        let alpha = baseAlpha;

        if (distSq < MOUSE_RADIUS_SQ) {
          const dist = Math.sqrt(distSq);
          const ratio = 1 - dist / MOUSE_RADIUS;
          radius = 1.15 + ratio * 2.2;
          alpha = baseAlpha + ratio * 0.65;

          // Transition color to secondary pink near the center of cursor
          if (ratio > 0.4) {
            const blend = (ratio - 0.4) / 0.6;
            r = Math.round(baseR + (accentR - baseR) * blend);
            g = Math.round(baseG + (accentG - baseG) * blend);
            b = Math.round(baseB + (accentB - baseB) * blend);
          }
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      themeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="interactive-bg-canvas"
      aria-hidden="true"
    />
  );
};

export default React.memo(InteractiveBackground);
