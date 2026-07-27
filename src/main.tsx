import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Words from './pages/Words'
import WordDetail from './pages/WordDetail'
import Grammar from './pages/Grammar'
import Upload from './pages/Upload'
import Scan from './pages/Scan'
import About from './pages/About'
import Read from './pages/Read'
import Guestbook from './pages/Guestbook'
import NotFound from './pages/NotFound'
import './styles/tokens.css'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('[SW] Registration failed:', err.message)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="words" element={<Words />} />
          <Route path="words/:lemma" element={<WordDetail />} />
          <Route path="grammar" element={<Grammar />} />
          <Route path="upload" element={<Upload />} />
          <Route path="scan" element={<Scan />} />
          <Route path="about" element={<About />} />
          <Route path="read" element={<Read />} />
          <Route path="guestbook" element={<Guestbook />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)