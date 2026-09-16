import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Cartello from './components/Cartello.jsx'
import './index.css'

const isCartello = window.location.pathname.replace(/\/$/, '') === '/cartello'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isCartello ? <Cartello /> : <App />}</React.StrictMode>
)
