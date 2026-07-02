import React from 'react'
import './Footer.css'

export default function Footer(){
  return (
    <footer className="footer">
      <div className="container footer-top">
        <span className="footer-logo">FORGE</span>
        <p>Performance parts, finished and fitted. Designed for the build, not the showroom.</p>
      </div>
      <div className="container footer-cols">
        <div>
          <h4>Shop</h4>
          <a href="#">Bumpers</a><a href="#">Brakes</a><a href="#">Tires</a><a href="#">Wraps</a><a href="#">Decals</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="#">About</a><a href="#">Lookbook</a><a href="#">Contact</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="#">Fitment Guide</a><a href="#">Returns</a><a href="#">Warranty</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} FORGE Auto Parts</span>
        <span>Built / Not Bought</span>
      </div>
    </footer>
  )
}
