import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/StoreContext.jsx';
import { getCategoryImage } from '../data/categoryImages.js';
import './Nav.css';

const CATEGORIES = [
  { name: 'Bumpers', slug: 'bumpers', img: getCategoryImage('bumper1') },
  { name: 'Brakes',  slug: 'brakes',  img: getCategoryImage('brake1') },
  { name: 'Tires',   slug: 'tires',   img: getCategoryImage('tire1') },
  { name: 'Wraps',   slug: 'wraps',   img: getCategoryImage('wrap1') },
  { name: 'Decals',  slug: 'decals',  img: getCategoryImage('decal1') },
  { name: 'All Parts', slug: null,    img: getCategoryImage('bumper1') },
];

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(CATEGORIES[0]);
  const { garageCount } = useStore();

  // Close menu on scroll or click outside (optional but recommended)
  useEffect(() => {
    const handleScroll = () => setIsMenuOpen(false);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`nav-wrapper ${isMenuOpen ? 'is-open' : ''}`}>
      <div className="nav-main">
        <div className="nav-left">
          <Link to="/" className="nav-brand">FORGE</Link>
        </div>

        <div className="nav-center">
          <div className="nav-items">
            <button 
              className={`nav-item ${isMenuOpen ? 'active' : ''}`}
              onMouseEnter={() => setIsMenuOpen(true)}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              PARTS <span className="arrow">{isMenuOpen ? '▲' : '▼'}</span>
            </button>
            <Link to="/shop" className="nav-item">SHOP</Link>
            <Link to="/configurator" className="nav-item">CONFIGURATOR</Link>
            <Link to="/about" className="nav-item">ABOUT</Link>
          </div>
        </div>

        <div className="nav-right">
          <Link to="/login" className="nav-icon-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
          <Link to="/garage" className="nav-icon-btn cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {garageCount > 0 && <span className="badge">{garageCount}</span>}
          </Link>
        </div>
      </div>

      {/* Awwwards-Level Mega Dropdown */}
      <div 
        className={`mega-dropdown ${isMenuOpen ? 'show' : ''}`}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <div className="mega-container">
          
          {/* Column 1: Navigation List */}
          <div className="mega-col-nav">
            <ul className="mega-list">
              {CATEGORIES.map((cat, i) => (
                <li 
                  key={i} 
                  className={`mega-list-item ${activeCat.name === cat.name ? 'active' : ''}`}
                  onMouseEnter={() => setActiveCat(cat)}
                >
                  <Link to={cat.slug ? `/shop/${cat.slug}` : '/shop'} onClick={() => setIsMenuOpen(false)}>
                    <span className="item-num">0{i + 1}</span>
                    <span className="item-name">{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Dynamic Massive Title (The Video Effect) */}
          <div className="mega-col-title">
            <div className="title-reveal-wrapper">
              <h2 className="massive-text" key={activeCat.name}>
                {activeCat.name}
              </h2>
            </div>
            
            {/* Corner Decorative Elements */}
            <div className="corner c-tl"></div>
            <div className="corner c-tr"></div>
            <div className="corner c-bl"></div>
            <div className="corner c-br"></div>
          </div>

          {/* Column 3: Visual Preview Strip */}
          <div className="mega-col-visual">
            <div className="visual-frame">
              <img 
                src={activeCat.img} 
                alt={activeCat.name} 
                key={activeCat.name}
                className="visual-img" 
              />
              <div className="frame-overlay"></div>
            </div>
            <div className="visual-meta">
              <span className="meta-label">CHASSIS SPEC // 2026</span>
              <span className="meta-id">ID: {activeCat.slug || 'ALL'}</span>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}