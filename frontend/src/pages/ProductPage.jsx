import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../data/products.js'
import { getProduct, listProducts } from '../api/products.js'
import { useStore } from '../store/StoreContext.jsx'
import NotFound from './NotFound.jsx'
import './ProductPage.css'

export default function ProductPage(){
  const { id } = useParams()
  const { isAuthed, addToGarage } = useStore()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    getProduct(id)
      .then((p) => {
        if (!active) return
        setProduct(p)
        return listProducts({ cat: p.cat, pageSize: 8 })
      })
      .then((res) => {
        if (!active || !res) return
        setRelated(res.items.filter((p) => p.id !== id).slice(0, 3))
      })
      .catch(() => { if (active) setNotFound(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <main className="product container"><p style={{ padding: '4rem 0' }}>Loading…</p></main>
  if (notFound || !product) return <NotFound />

  const handleAdd = async () => {
    if (!isAuthed) {
      navigate('/login', { state: { from: `/product/${product.id}` } })
      return
    }
    setAdding(true)
    try {
      await addToGarage({
        id: product.id,
        variant: 'default',
        qty: 1,
      })
      setAdded(true)
      setTimeout(() => setAdded(false), 2200)
    } catch (err) {
      alert(err.message || 'Could not add this item to your Garage.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <main className="product">
      <div className="container">
        <nav className="product-crumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to={`/shop/${product.cat}`}>{product.cat}</Link>
          <span>/</span>
          <span className="is-current">{product.name}</span>
        </nav>

        <div className="product-main">
          <div className="product-media brackets">
            <span className="bk-tr" /><span className="bk-bl" />
            <img src={product.img} alt={product.name} />
            <span className="product-cat-tag">{product.cat}</span>
          </div>

          <div className="product-info">
            <span className="eyebrow">{product.cat} · {product.brand}</span>
            <h1 className="product-name">{product.name}</h1>
            <span className="product-price">
              {formatINR(product.price)}
              {product.discount > 0 && (
                <>
                  {' '}
                  <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '.7em' }}>
                    {formatINR(product.originalPrice)}
                  </span>
                  <span style={{ fontSize: '.6em', marginLeft: '.5em' }}>-{product.discount}%</span>
                </>
              )}
            </span>
            <p className="product-desc">{product.desc}</p>
            <p style={{ opacity: 0.75, fontSize: '.9em' }}>
              {product.in_stock ? `In stock — ${product.stock} available` : 'Out of stock'}
              {' · '}★ {product.rating} ({product.rating_count} reviews)
            </p>

            <div className="product-actions">
              <button className="btn btn-solid product-add" onClick={handleAdd} disabled={adding || !product.in_stock}>
                {!product.in_stock ? 'Out of stock' : added ? 'Added to Garage ✓' : isAuthed ? (adding ? 'Adding…' : 'Add to Garage') : 'Sign in to add'}
              </button>
              <Link to="/configurator" className="btn btn-ghost product-ghost">Customise a part</Link>
            </div>

            <dl className="product-spec">
              {Object.entries(product.spec || {}).map(([k, v]) => (
                <div className="product-spec-row" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <section className="product-related">
          <h2>More from the shop</h2>
          <div className="product-related-grid">
            {related.map((p) => (
              <Link to={`/product/${p.id}`} className="rel-card brackets" key={p.id}>
                <span className="bk-tr" /><span className="bk-bl" />
                <div className="rel-media">
                  <img src={p.img} alt={p.name} loading="lazy" />
                </div>
                <div className="rel-info">
                  <h3>{p.name}</h3>
                  <span>{formatINR(p.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
