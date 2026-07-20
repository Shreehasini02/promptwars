import { useState } from 'react'

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

export default function SignInModal({ onClose, onAuthSuccess }) {
  const [tab, setTab] = useState('login')          // 'login' | 'register'
  const [idType, setIdType] = useState('email')    // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)     // { type: 'error'|'success', text }

  const isLogin = tab === 'login'
  const placeholder = idType === 'email' ? 'you@example.com' : '+91 98765 43210'
  const inputType = idType === 'email' ? 'email' : 'tel'

  const resetForm = () => {
    setIdentifier('')
    setPassword('')
    setName('')
    setMessage(null)
  }

  const handleTabSwitch = (t) => {
    setTab(t)
    resetForm()
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setMessage(null)
    try {
      setMessage({ type: 'success', text: 'Connecting to Google OAuth...' })
      
      const mockGoogleEmails = [
        'shrihasini.google@gmail.com',
        'traveler.google@gmail.com',
        'explorer.google@gmail.com'
      ]
      const randomEmail = mockGoogleEmails[Math.floor(Math.random() * mockGoogleEmails.length)]
      
      const res = await fetch(`${API}/login-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: randomEmail,
          name: 'Google Explorer'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Google Sign-In failed.' })
      } else {
        localStorage.setItem('tc_token', data.token)
        setMessage({ type: 'success', text: 'Google Authentication Successful! ✈️' })
        setTimeout(() => onAuthSuccess(data.user), 800)
      }
    } catch {
      setMessage({ type: 'error', text: 'Cannot connect to server. Make sure the backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  const handleMailSignIn = () => {
    setIdType('email')
    setTimeout(() => {
      const el = document.getElementById('auth-identifier')
      if (el) el.focus()
    }, 50)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier.trim() || !password.trim()) {
      return setMessage({ type: 'error', text: 'Please fill in all fields.' })
    }
    if (!isLogin && !name.trim()) {
      return setMessage({ type: 'error', text: 'Please enter your name.' })
    }

    setLoading(true)
    setMessage(null)

    try {
      const endpoint = isLogin ? `${API}/login` : `${API}/register`
      const body = isLogin
        ? { identifier, password }
        : { identifier, password, name }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Something went wrong.' })
      } else {
        localStorage.setItem('tc_token', data.token)
        setMessage({ type: 'success', text: data.message })
        setTimeout(() => onAuthSuccess(data.user), 800)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Cannot connect to server. Make sure the backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Sign in">
        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {/* Logo */}
        <div className="modal-logo">
          <div className="logo-icon">✈</div>
          <span className="logo-text">travelcopilot</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs" role="tablist">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
            role="tab"
            id="tab-login"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => handleTabSwitch('register')}
            role="tab"
            id="tab-register"
          >
            Create Account
          </button>
        </div>

        {/* Social Authentication */}
        <div className="social-auth-container">
          <button
            type="button"
            className="social-btn google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="social-icon google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.39 3.67 1.41 7.56l3.82 2.92C6.18 7.33 8.86 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.69-4.95 3.69-8.61z"/>
              <path fill="#FBBC05" d="M5.23 14.81c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.41 7.31C.51 9.1.01 11.01.01 13s.5 3.9 1.4 5.69l3.82-2.88z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.14 0-5.82-2.29-6.77-5.44L1.41 15.8C3.39 19.69 7.35 23 12 23z"/>
            </svg>
            Continue with Google
          </button>
          
          <button
            type="button"
            className="social-btn mail-btn"
            onClick={handleMailSignIn}
            disabled={loading}
          >
            <span className="social-icon text-icon">✉️</span>
            Continue with Mail
          </button>
        </div>

        <div className="auth-divider">
          <span>or use email / phone</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name (register only) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                className="form-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          {/* Identifier type toggle */}
          <div className="id-toggle">
            <button
              type="button"
              className={`id-toggle-btn ${idType === 'email' ? 'active' : ''}`}
              onClick={() => { setIdType('email'); setIdentifier('') }}
            >
              📧 Email
            </button>
            <button
              type="button"
              className={`id-toggle-btn ${idType === 'phone' ? 'active' : ''}`}
              onClick={() => { setIdType('phone'); setIdentifier('') }}
            >
              📱 Phone
            </button>
          </div>

          {/* Identifier field */}
          <div className="form-group">
            <label htmlFor="auth-identifier">
              {idType === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <input
              id="auth-identifier"
              className="form-input"
              type={inputType}
              placeholder={placeholder}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete={idType === 'email' ? 'email' : 'tel'}
            />
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="password-wrapper">
              <input
                id="auth-password"
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`auth-message ${message.type}`} role="alert">
              {message.type === 'error' ? '⚠️' : '✅'} {message.text}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="auth-submit-btn"
            className={`auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {isLogin ? 'Sign In  ✈️' : 'Create Account  🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}
