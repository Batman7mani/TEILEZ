import React, { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/StoreContext.jsx'
import Loader from './components/Loader.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import ShopPage from './pages/ShopPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import ConfiguratorPage from './pages/ConfiguratorPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import GaragePage from './pages/GaragePage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App(){
  const [loading, setLoading] = useState(true)
  const [siteReady, setSiteReady] = useState(false)

  const handleLoaderDone = useCallback(() => {
    setSiteReady(true)
    // small delay so the wipe-reveal in Loader can finish before unmount
    setTimeout(() => setLoading(false), 650)
  }, [])

  return (
    <StoreProvider>
      <BrowserRouter>
        {loading && <Loader onDone={handleLoaderDone} />}
        <div style={{
          opacity: siteReady ? 1 : 0,
          transition: 'opacity .8s var(--ease-out)',
        }}>
          <Nav />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:cat" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/configurator" element={<ConfiguratorPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/garage" element={<GaragePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </StoreProvider>
  )
}
