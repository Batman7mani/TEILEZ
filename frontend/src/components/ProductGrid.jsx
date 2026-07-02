import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../data/products.js';
import { listProducts } from '../api/products.js';
import './ProductGrid.css';

// Splits text into per-letter spans so each character can be
// animated independently on hover (staggered via --i custom property)
function KineticText({ text, el: Tag = 'span', className = '' }) {
  return (
    <Tag className={`kinetic-text ${className}`} aria-label={text}>
      {text.split('').map((char, i) => (
        <span
          className="kinetic-letter"
          style={{ '--i': i }}
          key={i}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Tag>
  );
}

export default function ProductGrid() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    let active = true;
    listProducts({ sort: 'rating', pageSize: 3 })
      .then((res) => { if (active) setFeatured(res.items); })
      .catch(() => { if (active) setFeatured([]); });
    return () => { active = false; };
  }, []);

  return (
    <section className="product-archive">
      <div className="archive-container">
        <header className="archive-header">
          <div className="header-left">
            <Link to="/shop" className="view-more-link">
              EXPLORE THE COLLECTION →
            </Link>
          </div>
          <h2 className="archive-title">
            <KineticText text="SELECTED" />
            <br />
            <KineticText text="COMPONENTS" />
          </h2>
        </header>

        <div className="bento-grid">
          {featured.map((p, index) => (
            <Link
              to={`/product/${p.id}`}
              key={p.id}
              className={`bento-item item-size-${index + 1}`}
            >
              <div className="pcard-media">
                <img src={p.img} alt={p.name} loading="lazy" />

                {/* Hover Reveal Bar */}
                <div className="hover-reveal-bar">
                  <div className="reveal-left">
                    <span className="reveal-cat">{p.cat}</span>
                    <h3 className="reveal-name">{p.name}</h3>
                  </div>

                  <div className="reveal-center">
                    <span className="discover-btn">DISCOVER</span>
                  </div>

                  <div className="reveal-right">
                    <span className="reveal-price">{formatINR(p.price)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Fourth tile: kinetic copy instead of a 4th product, keeps the grid breathing */}
          <Link to="/shop" className="bento-item item-size-4 manifesto-tile">
            <div className="manifesto-inner">
              <span className="manifesto-eyebrow">No two builds alike</span>
              <p className="manifesto-line">
                <KineticText text="Precision" />
                <br />
                <KineticText text="has a" />
                <br />
                <KineticText text="sound." />
              </p>
              <span className="manifesto-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
