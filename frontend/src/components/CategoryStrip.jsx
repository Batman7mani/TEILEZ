import React from 'react'
import './CategoryStrip.css'

const ITEMS = ['Bumpers','Brakes','Tires','Wraps','Decals','Spoilers','Exhausts','Wheels']

export default function CategoryStrip(){
  return (
    <div className="strip" id="instock">
      <div className="strip-track">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span className="strip-item" key={i}>
            {item}<span className="strip-dot">●</span>
          </span>
        ))}
      </div>
    </div>
  )
}
