import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import Orders from '@/pages/Orders'
import OrderDetail from '@/pages/OrderDetail'
import Me from '@/pages/Me'
import AgentLayout from '@/pages/agent/AgentLayout'
import AgentOverview from '@/pages/agent/AgentOverview'
import AgentCustomers from '@/pages/agent/AgentCustomers'
import AgentGrowth from '@/pages/agent/AgentGrowth'
import AgentLibrary from '@/pages/agent/AgentLibrary'
import Admin from '@/pages/Admin'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/me" element={<Me />} />

        <Route path="/agent" element={<AgentLayout />}>
          <Route index element={<AgentOverview />} />
          <Route path="customers" element={<AgentCustomers />} />
          <Route path="growth" element={<AgentGrowth />} />
          <Route path="library" element={<AgentLibrary />} />
        </Route>

        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  )
}
