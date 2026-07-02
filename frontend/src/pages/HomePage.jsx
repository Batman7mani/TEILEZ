import React from 'react'
import Hero from '../components/Hero.jsx'
import CategoryStrip from '../components/CategoryStrip.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import Configurator from '../components/Configurator.jsx'
import Story from '../components/Story.jsx'

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryStrip />
      <ProductGrid />
      <Configurator />
      <Story />
    </>
  )
}
