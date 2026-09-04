import React from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Simulator from './components/Simulator'
import Features from './components/Features'
import Calculator from './components/Calculator'
import Comparison from './components/Comparison'
import Faq from './components/Faq'
import Installation from './components/Installation'
import ReviewCta from './components/ReviewCta'
import Footer from './components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <div className="ambient-glow" />
      <div className="ambient-grid" />
      <div className="container">
        <Navbar />
        <main>
          <Hero />
          <Simulator />
          <Features />
          <Calculator />
          <Comparison />
          <Faq />
          <Installation />
          <ReviewCta />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
