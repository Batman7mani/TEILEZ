import React from 'react'
import loaderVideo from '../assets/loader-bg.mp4'
import './Hero.css'

export default function Hero(){
  return (
    <section className="hero">
      <video className="hero-video" src={loaderVideo} autoPlay muted loop playsInline />
      <div className="hero-scrim" />

      <div className="hero-content container">
        <span className="eyebrow">Built / Not Bought</span>
        <h1 className="hero-title">
          PARTS THAT<br/>
          <span>HOLD THE LINE.</span>
        </h1>
        <p className="hero-sub">
          Bumpers, brakes, tires, wraps and decals — fitted, finished and
          customised to your exact build.
        </p>
        <div className="hero-cta">
          <a className="btn btn-solid" href="#products">Shop Parts</a>
          <a className="btn btn-ghost" href="#configurator">Open Configurator</a>
        </div>
      </div>

      <div className="hero-thumbs">
        {['Bumpers','Brakes','Tires'].map((t,i) => (
          <div className="hero-thumb brackets" key={t} style={{ animationDelay: `${i*0.1+0.3}s` }}>
            <span className="bk-tr" /><span className="bk-bl" />
            <span className="hero-thumb-label">{t}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
