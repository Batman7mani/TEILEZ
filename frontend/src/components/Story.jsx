import React, { useEffect, useRef } from 'react';
import './Story.css';

/**
 * Story Component - Redesigned for a high-end, Awwwards-style aesthetic.
 * Features: 
 * - Scroll-triggered reveal animations
 * - Staggered text entry
 * - Industrial-premium typography for car components theme
 */
export default function Story() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const copyRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    if (sectionRef.current) observer.observe(sectionRef.current);
    
    return () => observer.disconnect();
  }, []);

  return (
    <section className="story" id="story" ref={sectionRef}>
      <div className="container story-grid">
        <div className="story-header-wrapper">
          <h2 className="story-head" ref={headingRef}>
            <span className="line-wrapper">
              <span className="line">EVERY PART</span>
            </span>
            <span className="line-wrapper">
              <span className="line">HAS A <i className="italic-accent">BUILD</i></span>
            </span>
            <span className="line-wrapper">
              <span className="line">SHEET.</span>
            </span>
          </h2>
          <div className="story-decorator">
            <span className="serial-number">REF-001/ENG-SPEC</span>
          </div>
        </div>

        <div className="story-copy" ref={copyRef}>
          <div className="copy-inner">
            <p>
              Each component leaving the shop carries a fitment plate linking
              back to its torque specs, material batch and install guide —
              scan it any time you're under the hood.
            </p>
            <a className="section-link" href="#">
              <span className="link-text">What's a build sheet?</span>
              <span className="link-arrow">→</span>
            </a>
          </div>
          
          {/* Decorative element representing a component plate */}
          <div className="component-tag">
            <div className="tag-inner">
              <div className="tag-line"></div>
              <div className="tag-content">
                <span>BATCH: 2026-X</span>
                <span>SPEC: HIGH-PERFORMANCE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background visual interest */}
      <div className="story-bg-text">ENGINEERING</div>
    </section>
  );
}
