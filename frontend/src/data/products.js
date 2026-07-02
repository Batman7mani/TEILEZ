// src/data/products.js
//
// The static PRODUCTS catalog has been replaced by the live FastAPI backend
// (see src/api/products.js). This file now only keeps the currency
// formatter, which every page still imports.

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
