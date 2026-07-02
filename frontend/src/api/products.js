// src/api/products.js
import { apiRequest } from './client.js'

// Normalizes a backend product into the shape the existing frontend
// components already expect (id, name, cat, price, img, desc, spec),
// while keeping the extra backend fields (brand, discount, stock, rating...) available too.
function normalize(p) {
  return {
    ...p,
    desc: p.description,
    originalPrice: p.price,
    price: p.final_price,
  }
}

export async function listProducts({ cat, q, sort, page = 1, pageSize = 60 } = {}) {
  const data = await apiRequest('/api/products', {
    auth: false,
    params: { cat, q, sort, page, page_size: pageSize },
  })
  return { ...data, items: data.items.map(normalize) }
}

export async function getProduct(id) {
  const p = await apiRequest(`/api/products/${id}`, { auth: false })
  return normalize(p)
}

export async function listCategories() {
  const data = await apiRequest('/api/products/categories', { auth: false })
  return data.categories
}
