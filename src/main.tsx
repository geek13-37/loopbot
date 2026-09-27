import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { LessonRoute } from './pages/Lesson'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter — чтобы работало на любом статическом хостинге (GitHub Pages и т.п.) */}
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lesson/:id" element={<LessonRoute />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
