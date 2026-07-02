import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatINR } from '../data/products.js'
import { listProducts } from '../api/products.js'
import './ShopPage.css'

export default function ShopPage() {
  const { cat } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const title = cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'All Parts'

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listProducts({ cat, pageSize: 100 })
      .then((res) => { if (active) setProducts(res.items) })
      .catch(() => { if (active) setError('Could not load products right now. Please try again shortly.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [cat])

  return (
    <main className="shop container">
      <span className="eyebrow">Shop</span>
      <h1 className="shop-title">{title}</h1>

      {loading ? (
        <p className="shop-empty">Loading parts…</p>
      ) : error ? (
        <p className="shop-empty">{error}</p>
      ) : products.length === 0 ? (
        <p className="shop-empty">No parts found in this category yet.</p>
      ) : (
        <div className="shop-grid">
          {products.map((p) => (
            <Link to={`/product/${p.id}`} className="shop-card brackets" key={p.id}>
              <span className="bk-tr" /><span className="bk-bl" />
              <div className="shop-media">
                <img src={p.img} alt={p.name} loading="lazy" />
                <span className="shop-cat">{p.cat}</span>
                {p.discount > 0 && <span className="shop-cat" style={{ left: 'auto', right: '.6rem' }}>-{p.discount}%</span>}
              </div>
              <div className="shop-info">
                <h3>{p.name}</h3>
                <span>{formatINR(p.price)}</span>
                {p.discount > 0 && (
                  <span style={{ textDecoration: 'line-through', opacity: 0.5, marginLeft: '.5rem', fontSize: '.85em' }}>
                    {formatINR(p.originalPrice)}
                  </span>
                )}
                {!p.in_stock && <span style={{ display: 'block', opacity: 0.6, fontSize: '.8em' }}>Out of stock</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
