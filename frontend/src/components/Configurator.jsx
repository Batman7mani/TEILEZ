import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import './Configurator.css'

// ---------------------------------------------------------------
// 1. Colors & finishes
// ---------------------------------------------------------------
const COLORS = [
  { name: 'Graphite',      hex: '#2B2B29', priceAdd: 0 },
  { name: 'Concrete',      hex: '#9C9B95', priceAdd: 0 },
  { name: 'Caliper Red',   hex: '#B3301A', priceAdd: 50 },
  { name: 'Forge Orange',  hex: '#FF4317', priceAdd: 80 },
  { name: 'Stealth Matte', hex: '#0F0F0E', priceAdd: 60 },
  { name: 'Arctic White',  hex: '#EFEBE2', priceAdd: 0 },
]

const FINISHES = {
  Matte:  { roughness: 0.85, metalness: 0.25, clearcoat: 0,    clearcoatRoughness: 1,    priceAdd: 0 },
  Satin:  { roughness: 0.45, metalness: 0.4,  clearcoat: 0.3,  clearcoatRoughness: 0.4,  priceAdd: 25 },
  Gloss:  { roughness: 0.12, metalness: 0.6,  clearcoat: 1,    clearcoatRoughness: 0.05, priceAdd: 45 },
  Carbon: { roughness: 0.3,  metalness: 0.1,  clearcoat: 0.6,  clearcoatRoughness: 0.2,  priceAdd: 220 },
}

const TABS = ['Customisation', 'Details', 'Fitment', 'Specific Demand']

const CARS = {
  aston: {
    label: 'Aston Martin',
    path: '/models/AstonMartin.glb',
    paintMaterial: 'Body_Color',
    basePrice: 640,
  },
  porsche: {
    label: 'Porsche',
    path: '/models/Porsche.glb',
    paintMaterial: 'paint',
    basePrice: 720,
  },
}

function pickPaintMaterial(materials, hint) {
  if (materials[hint]) return materials[hint]
  const lowerHint = hint.toLowerCase()
  const fuzzyKey = Object.keys(materials).find(k => k.toLowerCase().includes(lowerHint))
  if (fuzzyKey) return materials[fuzzyKey]
  return null
}

// target size every car gets normalized to, in 3D units —
// keeps every car the same on-screen size regardless of its
// original export scale
const TARGET_SIZE = 3

// ---------------------------------------------------------------
// 2. The 3D car — self-normalizing size/position.
// ---------------------------------------------------------------
function CarModel({ carKey, color, finish }) {
  const car = CARS[carKey]
  const { scene, materials } = useGLTF(car.path)
  const groupRef = useRef()

  // recolor the paint
  useEffect(() => {
    console.log(`[${car.label}] materials in ${car.path}:`, Object.keys(materials))

    const paint = pickPaintMaterial(materials, car.paintMaterial)
    if (!paint) {
      console.warn(
        `[${car.label}] No material matching "${car.paintMaterial}" found. ` +
        `Pick the right one from the list above and update CARS.${carKey}.paintMaterial.`
      )
      return
    }
    const preset = FINISHES[finish]
    if (paint.clearcoat === undefined) {
      paint.clearcoat = 0
      paint.clearcoatRoughness = 1
    }
    paint.color = new THREE.Color(color.hex)
    paint.roughness = preset.roughness
    paint.metalness = preset.metalness
    paint.clearcoat = preset.clearcoat
    paint.clearcoatRoughness = preset.clearcoatRoughness
    paint.needsUpdate = true
  }, [materials, color, finish, car, carKey])

  // measure + normalize size/position, once per model load
  useEffect(() => {
    if (!groupRef.current) return

    groupRef.current.scale.set(1, 1, 1)
    groupRef.current.position.set(0, 0, 0)

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    console.log(`[${car.label}] raw bounding box size:`, size, 'center:', center)

    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scaleFactor = TARGET_SIZE / maxDim

    groupRef.current.scale.setScalar(scaleFactor)
    groupRef.current.position.set(
      -center.x * scaleFactor,
      -center.y * scaleFactor,
      -center.z * scaleFactor
    )
  }, [scene, carKey, car.label])

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

function ModelLoading() {
  return (
    <mesh rotation={[0.4, 0.4, 0]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#444" wireframe />
    </mesh>
  )
}

// ---------------------------------------------------------------
// 3. Main configurator component
// ---------------------------------------------------------------
export default function Configurator(){
  const [carKey, setCarKey] = useState('aston')
  const [color, setColor] = useState(COLORS[0])
  const [finish, setFinish] = useState('Matte')
  const [tab, setTab] = useState(TABS[0])

  const car = CARS[carKey]
  const totalPrice = car.basePrice + color.priceAdd + FINISHES[finish].priceAdd

  return (
    <section className="cfg" id="configurator">
      <div className="cfg-media">
        <Canvas
          className="cfg-canvas"
          camera={{ position: [4.5, 2, 4.5], fov: 40 }}
          shadows
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 3]} intensity={1.5} castShadow />
          <Suspense fallback={<ModelLoading />}>
            <CarModel key={carKey} carKey={carKey} color={color} finish={finish} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={14}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.05}
          />
        </Canvas>
      </div>

      <div className="cfg-panel">
        <div className="cfg-row cfg-car-switch">
          <span className="cfg-label">Model</span>
          <div className="cfg-chips">
            {Object.entries(CARS).map(([key, c]) => (
              <button
                key={key}
                className={`chip ${carKey === key ? 'is-active' : ''}`}
                onClick={() => setCarKey(key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cfg-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`cfg-tab ${tab === t ? 'is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Customisation' && (
          <div className="cfg-body">
            <div className="cfg-row">
              <span className="cfg-label">
                Colour: <b>{color.name}</b>
                {color.priceAdd > 0 && <span className="cfg-addon"> (+€{color.priceAdd})</span>}
              </span>
              <div className="cfg-swatches">
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    className={`swatch ${color.name === c.name ? 'is-active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColor(c)}
                    aria-label={c.name}
                    title={c.priceAdd > 0 ? `${c.name} (+€${c.priceAdd})` : c.name}
                  />
                ))}
              </div>
            </div>

            <div className="cfg-row">
              <span className="cfg-label">
                Finish: <b>{finish}</b>
                {FINISHES[finish].priceAdd > 0 && <span className="cfg-addon"> (+€{FINISHES[finish].priceAdd})</span>}
              </span>
              <div className="cfg-chips">
                {Object.keys(FINISHES).map(f => (
                  <button
                    key={f}
                    className={`chip ${finish === f ? 'is-active' : ''}`}
                    onClick={() => setFinish(f)}
                  >
                    {f}{FINISHES[f].priceAdd > 0 ? ` +€${FINISHES[f].priceAdd}` : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Details' && (
          <div className="cfg-body cfg-text">
            <p>Hand-finished polyurethane composite, OEM mounting points, paint-ready surface. Drop-in fit, no cutting required.</p>
          </div>
        )}
        {tab === 'Fitment' && (
          <div className="cfg-body cfg-text">
            <p>Compatible with 2014–2023 chassis variants. Confirm your VIN at checkout for guaranteed fitment.</p>
          </div>
        )}
        {tab === 'Specific Demand' && (
          <div className="cfg-body cfg-text">
            <p>Need a one-off colour, livery or fitment? Send specs and our shop will quote a custom build.</p>
          </div>
        )}

        <button className="btn btn-solid cfg-cta">
          Add to Build — €{totalPrice.toLocaleString()}
        </button>
      </div>
    </section>
  )
}

useGLTF.preload(CARS.aston.path)
useGLTF.preload(CARS.porsche.path)