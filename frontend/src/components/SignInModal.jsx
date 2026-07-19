import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

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
