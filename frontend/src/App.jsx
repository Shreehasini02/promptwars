import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import SignInModal from './components/SignInModal'
import DashboardModal from './components/DashboardModal'

const SLIDES = [
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
]

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [reminder, setReminder] = useState(null)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tc_user')) } catch { return null }
  })

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(s => (s + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Check for trip reminders
  useEffect(() => {
    if (user) {
      checkReminders()
    }
  }, [user])

  const checkReminders = async () => {
    try {
      const token = localStorage.getItem('tc_token')
      if (!token) return
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/trips`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const trips = await res.json()
        let incompleteTasks = 0
        let tripsWithTasks = 0
        trips.forEach(t => {
          const undone = t.checklist.filter(c => !c.done).length
          if (undone > 0) {
            incompleteTasks += undone
            tripsWithTasks++
          }
        })
        if (incompleteTasks > 0) {
          setReminder({
            title: 'Trip Preparation Pending',
            message: `You have ${incompleteTasks} incomplete tasks across ${tripsWithTasks} planned trip${tripsWithTasks > 1 ? 's' : ''}.`
          })
          // Auto-hide toast after 10s
          setTimeout(() => setReminder(null), 10000)
        }
      }
    } catch { /* ignore */ }
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    localStorage.setItem('tc_user', JSON.stringify(userData))
    setShowSignIn(false)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('tc_user')
    localStorage.removeItem('tc_token')
  }

  return (
    <>
      {/* Background Slideshow */}
      <div className="background-slider">
        {SLIDES.map((src, i) => (
          <div
            key={i}
            className={`slide ${i === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url('${src}')` }}
          />
        ))}
      </div>

      {/* Main Overlay */}
      <div className="overlay">
        <Navbar
          user={user}
          onSignInClick={() => setShowSignIn(true)}
          onLogoClick={() => setShowDashboard(true)}
          onLogout={handleLogout}
        />
        <HeroSection
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          slideCount={SLIDES.length}
        />
      </div>

      {/* Feature Cards Section (Scrollable) */}
      <div className="features-fold">
        <h2>Explore Features</h2>
        <div className="features-grid">
          <div className="feature-card" onClick={() => setShowDashboard('ai')}>
            <span className="fc-icon">🤖</span>
            <div className="fc-title">AI Assistance</div>
            <div className="fc-desc">Generate complete itineraries instantly using our advanced AI.</div>
          </div>
          <div className="feature-card" onClick={() => setShowDashboard('trips')}>
            <span className="fc-icon">🧳</span>
            <div className="fc-title">My Trips</div>
            <div className="fc-desc">View and manage all your AI-generated travel itineraries in one place.</div>
          </div>
          <div className="feature-card" onClick={() => setShowDashboard('checklist')}>
            <span className="fc-icon">✅</span>
            <div className="fc-title">Smart Checklist</div>
            <div className="fc-desc">Track your preparation progress with auto-generated tasks and non-negotiables.</div>
          </div>
          <div className="feature-card" onClick={() => setShowDashboard('receipts')}>
            <span className="fc-icon">🧾</span>
            <div className="fc-title">Receipts & Budget</div>
            <div className="fc-desc">Upload softcopies of your receipts and manage your travel budget easily.</div>
          </div>
          <div className="feature-card" onClick={() => setShowDashboard('inspire')}>
            <span className="fc-icon">💡</span>
            <div className="fc-title">Inspire Me</div>
            <div className="fc-desc">Discover beautiful dream destinations to spark your next adventure.</div>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Dashboard Modal */}
      {showDashboard && (
        <DashboardModal onClose={() => setShowDashboard(false)} initialSection={typeof showDashboard === 'string' ? showDashboard : 'trips'} />
      )}

      {/* Toast Reminder */}
      {reminder && (
        <div className="toast-container">
          <div className="toast-reminder">
            <div className="toast-icon">🔔</div>
            <div className="toast-content">
              <h4>{reminder.title}</h4>
              <p>{reminder.message}</p>
            </div>
            <button className="toast-close" onClick={() => setReminder(null)}>&times;</button>
          </div>
        </div>
      )}
    </>
  )
}
