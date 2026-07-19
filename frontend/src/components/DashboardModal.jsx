import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

const DESTINATIONS = [
  { src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop", alt: "Bamboo Forest", label: "Kyoto Bamboo Forest" },
  { src: "https://images.unsplash.com/photo-1516483638261-f4088921eece?q=80&w=800&auto=format&fit=crop", alt: "Santorini", label: "Santorini, Greece" },
  { src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop", alt: "Mountain Sunset", label: "Alpine Sunset" },
  { src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800&auto=format&fit=crop", alt: "Desert", label: "Sahara Desert" },
]

const NAV_ITEMS = [
  { icon: '🧳', label: 'Trips', id: 'trips' },
  { icon: '✅', label: 'Checklist', id: 'checklist' },
  { icon: '🧾', label: 'Receipts', id: 'receipts' },
  { icon: '💡', label: 'Inspire', id: 'inspire' },
  { icon: '🤖', label: 'AI Assistance', id: 'ai' },
]

function getAuthHeaders() {
  const token = localStorage.getItem('tc_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

// ─── Trips Section ────────────────────────────────────────────────────────────
function TripsSection({ trips, onSelectTrip, onDeleteTrip }) {
  if (trips.length === 0) {
    return (
      <div className="dash-empty">
        <div className="empty-icon">🧳</div>
        <h3>No trips yet</h3>
        <p>Go to <strong>AI Assistance</strong> and describe your dream trip to get started!</p>
      </div>
    )
  }
  return (
    <>
      <h2>🧳 Your Trips</h2>
      <p>All your AI-generated travel itineraries in one place.</p>
      <div className="trips-grid">
        {trips.map(trip => (
          <div className="trip-card" key={trip.id} onClick={() => onSelectTrip(trip)}>
            <div className="trip-card-img">
              <img src={trip.image} alt={trip.destination} loading="lazy" />
              <div className="trip-card-badge">{trip.emoji} {trip.days} days</div>
            </div>
            <div className="trip-card-body">
              <h3>{trip.destination}</h3>
              <p className="trip-card-type">{trip.tripTypeLabel}</p>
              <div className="trip-card-meta">
                <span>👥 {trip.travelers}</span>
                <span>💰 ${trip.totalBudget.toLocaleString()}</span>
              </div>
              <div className="trip-card-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round(trip.checklist.filter(c => c.done).length / trip.checklist.length * 100)}%` }}></div>
                </div>
                <span className="progress-text">{trip.checklist.filter(c => c.done).length}/{trip.checklist.length} tasks</span>
              </div>
            </div>
            <button className="trip-delete-btn" onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }} title="Delete trip">🗑️</button>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Trip Detail View ─────────────────────────────────────────────────────────
function TripDetail({ trip, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState('itinerary')
  
  // Custom checklist state
  const [newChecklist, setNewChecklist] = useState('')
  const [newChecklistCat, setNewChecklistCat] = useState('packing')

  // Custom receipt state
  const [newReceiptItem, setNewReceiptItem] = useState('')
  const [newReceiptAmount, setNewReceiptAmount] = useState('')
  const [newReceiptFile, setNewReceiptFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const toggleChecklist = (idx) => {
    const updated = { ...trip, checklist: trip.checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c) }
    onUpdate(updated)
  }
  const toggleReceipt = (idx) => {
    const updated = { ...trip, receipts: trip.receipts.map((r, i) => i === idx ? { ...r, paid: !r.paid } : r) }
    onUpdate(updated)
  }
  const toggleActivity = (dayIdx, actIdx) => {
    const updated = {
      ...trip,
      itinerary: trip.itinerary.map((d, di) => di === dayIdx ? {
        ...d, activities: d.activities.map((a, ai) => ai === actIdx ? { ...a, done: !a.done } : a)
      } : d)
    }
    onUpdate(updated)
  }

  const handleAddReceipt = async () => {
    if (!newReceiptItem.trim() || !newReceiptAmount) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('item', newReceiptItem)
      formData.append('amount', newReceiptAmount)
      if (newReceiptFile) formData.append('receiptImage', newReceiptFile)

      const token = localStorage.getItem('tc_token')
      const res = await fetch(`/api/trips/${trip.id}/receipts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        onUpdate(data.trip)
        setNewReceiptItem('')
        setNewReceiptAmount('')
        setNewReceiptFile(null)
      }
    } catch { /* ignore */ }
    setUploading(false)
  }

  const handleExportCSV = () => {
    const header = 'Item,Amount,Paid,Category\n'
    const rows = trip.receipts.map(r => `"${r.item}",${r.amount},${r.paid ? 'Yes' : 'No'},${r.category}`).join('\n')
    const csvContent = "data:text/csv;charset=utf-8," + header + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${trip.destination}_Receipts.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="trip-detail">
      <button className="back-btn" onClick={onBack}>← Back to Trips</button>
      <div className="trip-detail-header">
        <img src={trip.image} alt={trip.destination} className="trip-detail-img" />
        <div className="trip-detail-info">
          <h2>{trip.title}</h2>
          <div className="trip-detail-stats">
            <span>📅 {trip.days} days</span>
            <span>👥 {trip.travelers} travelers</span>
            <span>🏨 {trip.hotel}</span>
            <span>💰 Est. ${trip.totalBudget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        {['itinerary', 'checklist', 'receipts'].map(t => (
          <button key={t} className={`detail-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'itinerary' ? '📋 Itinerary' : t === 'checklist' ? '✅ Checklist' : '🧾 Receipts'}
          </button>
        ))}
      </div>

      {activeTab === 'itinerary' && (
        <div className="itinerary-list">
          {trip.itinerary.map((day, dayIdx) => (
            <div className="itin-day" key={dayIdx}>
              <div className="itin-day-header">
                <span className="itin-day-num">Day {day.day}</span>
                <span className="itin-day-title">{day.title}</span>
              </div>
              {day.activities.map((act, actIdx) => (
                <label className={`itin-activity ${act.done ? 'done' : ''}`} key={actIdx}>
                  <input type="checkbox" checked={act.done} onChange={() => toggleActivity(dayIdx, actIdx)} />
                  <span className="itin-time">{act.time}</span>
                  <span className="itin-text">{act.activity}</span>
                </label>
              ))}
              <div className="itin-meal">🍽️ {day.meal}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="checklist-section">
          {['booking', 'documents', 'packing', 'transport', 'finance'].map(cat => {
            const items = trip.checklist.filter(c => c.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} className="checklist-group">
                <h4 className="checklist-cat">{cat === 'booking' ? '📌 Bookings' : cat === 'documents' ? '📄 Documents' : cat === 'packing' ? '🎒 Packing' : cat === 'transport' ? '🚕 Transport' : '💳 Finance'}</h4>
                {items.map((c, i) => {
                  const realIdx = trip.checklist.indexOf(c)
                  return (
                    <label className={`checklist-item ${c.done ? 'done' : ''}`} key={i}>
                      <input type="checkbox" checked={c.done} onChange={() => toggleChecklist(realIdx)} />
                      <span>{c.text}</span>
                    </label>
                  )
                })}
              </div>
            )
          })}
          <div className="checklist-progress-bar">
            <div className="cpb-fill" style={{ width: `${Math.round(trip.checklist.filter(c => c.done).length / trip.checklist.length * 100)}%` }}></div>
          </div>
          <div className="add-item-form">
            <input type="text" className="add-item-input" placeholder="Add non-negotiable task..." value={newChecklist} onChange={e => setNewChecklist(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('add-chk').click() }}/>
            <select className="add-item-input" style={{flex: '0 0 120px'}} value={newChecklistCat} onChange={e => setNewChecklistCat(e.target.value)}>
              <option value="booking">Bookings</option>
              <option value="documents">Documents</option>
              <option value="packing">Packing</option>
              <option value="transport">Transport</option>
              <option value="finance">Finance</option>
            </select>
            <button id="add-chk" className="add-item-btn" disabled={!newChecklist.trim()} onClick={() => {
              if (!newChecklist.trim()) return
              onUpdate({ ...trip, checklist: [...trip.checklist, { text: newChecklist, category: newChecklistCat, done: false }] })
              setNewChecklist('')
            }}>Add Task</button>
          </div>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="receipts-section">
          <button className="receipt-export-btn" onClick={handleExportCSV}>
            📥 Download CSV
          </button>
          {trip.receipts.map((r, i) => (
            <label className={`receipt-row ${r.paid ? 'paid' : ''}`} key={i}>
              <input type="checkbox" checked={r.paid} onChange={() => toggleReceipt(i)} />
              <span className="receipt-item">{r.item}</span>
              {r.imageUrl && (
                <img src={`http://localhost:5000${r.imageUrl}`} alt="receipt" className="receipt-img-thumb" onClick={(e) => { e.preventDefault(); window.open(`http://localhost:5000${r.imageUrl}`, '_blank') }} />
              )}
              <span className="receipt-amount" style={{marginLeft: r.imageUrl ? '10px' : 'auto'}}>${r.amount.toLocaleString()}</span>
            </label>
          ))}
          <div className="receipt-total">
            <span>Total Estimated Budget</span>
            <span className="receipt-total-amount">${trip.totalBudget.toLocaleString()}</span>
          </div>
          <div className="receipt-paid-info">
            ✅ Paid: ${trip.receipts.filter(r => r.paid).reduce((s, r) => s + r.amount, 0).toLocaleString()}
            &nbsp;&nbsp;|&nbsp;&nbsp;
            ⏳ Remaining: ${trip.receipts.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0).toLocaleString()}
          </div>
          <div className="add-item-form">
            <div className="file-upload-wrapper" title="Attach Receipt Image">
              <span className="file-upload-icon">{newReceiptFile ? '✅' : '📎'}</span>
              <input type="file" accept="image/*,.pdf" onChange={e => setNewReceiptFile(e.target.files[0])} />
            </div>
            <input type="text" className="add-item-input" placeholder="Expense description..." value={newReceiptItem} onChange={e => setNewReceiptItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddReceipt() }}/>
            <input type="number" className="add-item-input amount" placeholder="Amount ($)" value={newReceiptAmount} onChange={e => setNewReceiptAmount(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddReceipt() }}/>
            <button id="add-rec" className="add-item-btn" disabled={!newReceiptItem.trim() || !newReceiptAmount || uploading} onClick={handleAddReceipt}>
              {uploading ? '...' : 'Add Receipt'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AI Assistance Section ────────────────────────────────────────────────────
function AISection({ onTripGenerated, onSelectTrip }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [previewTrip, setPreviewTrip] = useState(null)

  const suggestions = [
    '5-day romantic getaway to Santorini',
    '7-day family adventure in Tokyo',
    '3-day weekend trip to Paris',
    '10-day cultural exploration of London',
    '4-day beach relaxation in Bali',
    '6-day adventure trip to Dubai',
  ]

  const handleGenerate = async (text) => {
    const input = text || prompt
    if (!input.trim()) return setMessage({ type: 'error', text: 'Please describe your trip!' })

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`${API}/generate-itinerary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt: input }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message })
      } else {
        setPrompt('')
        setPreviewTrip(data.trip)
        onTripGenerated(data.trip)
      }
    } catch {
      setMessage({ type: 'error', text: 'Cannot connect to server. Is the backend running?' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2>🤖 AI Trip Assistant</h2>
      <p>Describe your dream trip and I'll create a full itinerary with checklist and budget.</p>

      <div className="ai-prompt-box">
        <div className="ai-prompt-header">
          <span className="ai-sparkle">✨</span>
          <span>What's your dream trip?</span>
        </div>
        <textarea
          className="ai-textarea"
          placeholder="e.g. 5-day romantic getaway to Santorini for 2 people..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() }}}
        />
        <button
          className={`ai-generate-btn ${loading ? 'loading' : ''}`}
          onClick={() => handleGenerate()}
          disabled={loading}
        >
          {loading ? '' : '🚀 Generate Itinerary'}
        </button>
      </div>

      {previewTrip && (
        <div className="ai-preview-wrapper">
          <div className="ai-preview-card">
            <div className="ai-preview-header" style={{ backgroundImage: `url('${previewTrip.image}')` }}>
              <div className="ai-preview-header-content">
                <h3>{previewTrip.emoji} {previewTrip.destination}</h3>
                <p>{previewTrip.tripTypeLabel}</p>
              </div>
            </div>
            <div className="ai-preview-body">
              <div className="ai-preview-stats">
                <div className="ai-stat">
                  <span className="ai-stat-label">Duration</span>
                  <span className="ai-stat-value">{previewTrip.days} days</span>
                </div>
                <div className="ai-stat">
                  <span className="ai-stat-label">Travelers</span>
                  <span className="ai-stat-value">{previewTrip.travelers}</span>
                </div>
                <div className="ai-stat">
                  <span className="ai-stat-label">Est. Budget</span>
                  <span className="ai-stat-value">${previewTrip.totalBudget.toLocaleString()}</span>
                </div>
              </div>
              <div className="ai-preview-actions">
                <button className="ai-action-btn primary" onClick={() => onSelectTrip(previewTrip)}>📋 View Full Itinerary</button>
                <button className="ai-action-btn secondary" onClick={() => setPreviewTrip(null)}>Create Another</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!previewTrip && message && (
        <div className={`auth-message ${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <div className="ai-suggestions">
        <h4>💡 Try these prompts:</h4>
        <div className="suggestions-grid">
          {suggestions.map((s, i) => (
            <button key={i} className="suggestion-chip" onClick={() => { setPrompt(s); handleGenerate(s) }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Checklist Overview (all trips) ────────────────────────────────────────────
function ChecklistOverview({ trips, onSelectTrip }) {
  if (trips.length === 0) {
    return (
      <div className="dash-empty">
        <div className="empty-icon">✅</div>
        <h3>No checklists yet</h3>
        <p>Generate a trip via <strong>AI Assistance</strong> to get auto-created checklists.</p>
      </div>
    )
  }
  return (
    <>
      <h2>✅ Trip Checklists</h2>
      <p>Track your preparation progress across all trips.</p>
      {trips.map(trip => {
        const done = trip.checklist.filter(c => c.done).length
        const total = trip.checklist.length
        const pct = Math.round(done / total * 100)
        return (
          <div className="checklist-trip-card" key={trip.id} onClick={() => onSelectTrip(trip)}>
            <div className="ctc-left">
              <span className="ctc-emoji">{trip.emoji}</span>
              <div>
                <h4>{trip.destination}</h4>
                <p>{done}/{total} tasks completed</p>
              </div>
            </div>
            <div className="ctc-right">
              <div className="ctc-ring" style={{ '--pct': pct }}>
                <span>{pct}%</span>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── Receipts Overview (all trips) ────────────────────────────────────────────
function ReceiptsOverview({ trips, onSelectTrip }) {
  if (trips.length === 0) {
    return (
      <div className="dash-empty">
        <div className="empty-icon">🧾</div>
        <h3>No receipts yet</h3>
        <p>Generate a trip via <strong>AI Assistance</strong> to get estimated budgets.</p>
      </div>
    )
  }
  const totalBudget = trips.reduce((s, t) => s + t.totalBudget, 0)
  const totalPaid = trips.reduce((s, t) => s + t.receipts.filter(r => r.paid).reduce((ss, r) => ss + r.amount, 0), 0)
  return (
    <>
      <h2>🧾 Budget & Receipts</h2>
      <p>Financial overview of all your trips.</p>
      <div className="receipts-summary">
        <div className="receipt-sum-card">
          <span className="rsc-label">Total Budget</span>
          <span className="rsc-value">${totalBudget.toLocaleString()}</span>
        </div>
        <div className="receipt-sum-card paid">
          <span className="rsc-label">Paid</span>
          <span className="rsc-value">${totalPaid.toLocaleString()}</span>
        </div>
        <div className="receipt-sum-card remaining">
          <span className="rsc-label">Remaining</span>
          <span className="rsc-value">${(totalBudget - totalPaid).toLocaleString()}</span>
        </div>
      </div>
      {trips.map(trip => (
        <div className="receipt-trip-row" key={trip.id} onClick={() => onSelectTrip(trip)}>
          <span>{trip.emoji} {trip.destination}</span>
          <span className="rtr-amount">${trip.totalBudget.toLocaleString()}</span>
        </div>
      ))}
    </>
  )
}

// ─── Inspire Section ──────────────────────────────────────────────────────────
function InspireSection() {
  return (
    <>
      <h2>💡 Inspire: Dream Destinations</h2>
      <p>Beautiful locations to get you started on your next journey.</p>
      <div className="gallery">
        {DESTINATIONS.map((d, i) => (
          <div className="gallery-card" key={i}>
            <img src={d.src} alt={d.alt} loading="lazy" />
            <div className="card-info">{d.label}</div>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardModal({ onClose, initialSection = 'trips' }) {
  const [activeSection, setActiveSection] = useState(initialSection)
  const [trips, setTrips] = useState([])
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load trips on mount
  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const res = await fetch(`${API}/trips`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setTrips(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleTripGenerated = (trip) => {
    setTrips(prev => [...prev, trip])
  }

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip)
    setActiveSection('trip-detail')
  }

  const handleUpdateTrip = async (updatedTrip) => {
    setSelectedTrip(updatedTrip)
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t))
    try {
      await fetch(`${API}/trips/${updatedTrip.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedTrip),
      })
    } catch { /* ignore */ }
  }

  const handleDeleteTrip = async (id) => {
    setTrips(prev => prev.filter(t => t.id !== id))
    try {
      await fetch(`${API}/trips/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
    } catch { /* ignore */ }
  }

  const renderContent = () => {
    if (loading) return <div className="dash-loading"><div className="dash-spinner"></div><p>Loading your trips...</p></div>
    if (activeSection === 'trip-detail' && selectedTrip) {
      return <TripDetail trip={selectedTrip} onBack={() => { setActiveSection('trips'); setSelectedTrip(null) }} onUpdate={handleUpdateTrip} />
    }
    switch (activeSection) {
      case 'trips': return <TripsSection trips={trips} onSelectTrip={handleSelectTrip} onDeleteTrip={handleDeleteTrip} />
      case 'checklist': return <ChecklistOverview trips={trips} onSelectTrip={handleSelectTrip} />
      case 'receipts': return <ReceiptsOverview trips={trips} onSelectTrip={handleSelectTrip} />
      case 'inspire': return <InspireSection />
      case 'ai': return <AISection onTripGenerated={handleTripGenerated} onSelectTrip={handleSelectTrip} />
      default: return <TripsSection trips={trips} onSelectTrip={handleSelectTrip} onDeleteTrip={handleDeleteTrip} />
    }
  }

  return (
    <div className="dashboard-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dashboard-panel">
        <aside className="dashboard-sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">✈</div>
            <span className="logo-text">travelcopilot</span>
          </div>
          <ul className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <li
                key={item.id}
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => { setActiveSection(item.id); setSelectedTrip(null) }}
              >
                <span>{item.icon}</span> {item.label}
                {item.id === 'trips' && trips.length > 0 && (
                  <span className="nav-badge">{trips.length}</span>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <section className="dashboard-main">
          <button className="dash-close" onClick={onClose} aria-label="Close dashboard">×</button>
          {renderContent()}
        </section>
      </div>
    </div>
  )
}
