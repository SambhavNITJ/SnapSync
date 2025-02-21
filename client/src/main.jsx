import { StrictMode } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Fixed import
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  </StrictMode>,
)
