import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ── Image Modal ──────────────────────────────────────────────────────────────
function ImageModal({ imageUrl, treeId, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🌳 Tree {treeId}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <img src={imageUrl} alt={`Tree ${treeId}`} className="modal-img" />
        <div className="modal-footer">Click outside or press Esc to close</div>
      </div>
    </div>
  )
}

// ── Tree Table ───────────────────────────────────────────────────────────────
function TreeTable({ data, loading, error }) {
  const [modalImage, setModalImage] = useState(null)

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <table><tbody>
        <tr className="state-row">
          <td colSpan="5">
            <span className="state-icon">⏳</span>
            <div className="state-text">Loading data…</div>
            <div className="state-sub">Fetching records from the database</div>
          </td>
        </tr>
      </tbody></table>
    )
  }

  if (error) {
    return (
      <table><tbody>
        <tr className="state-row">
          <td colSpan="5">
            <span className="state-icon">⚠️</span>
            <div className="state-text error-text">Could not connect to backend</div>
            <div className="state-sub">{error}</div>
          </td>
        </tr>
      </tbody></table>
    )
  }

  if (data.length === 0) {
    return (
      <table><tbody>
        <tr className="state-row">
          <td colSpan="5">
            <span className="state-icon">🌱</span>
            <div className="state-text">No records yet</div>
            <div className="state-sub">Waiting for the Raspberry Pi to send its first reading…</div>
          </td>
        </tr>
      </tbody></table>
    )
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tree ID</th>
            <th>TOF Distance</th>
            <th>Image</th>
            <th>Recorded At</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row._id}>
              <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{index + 1}</td>
              <td>
                <span className="tree-id-badge">🌳 {row.treeId}</span>
              </td>
              <td>
                <span className="tof-value">{row.tofMeasurement}</span>
                <span className="tof-unit">cm</span>
              </td>
              <td>
                {row.imageUrl ? (
                  <div
                    className="thumb-wrapper"
                    onClick={() => setModalImage(row)}
                    title="Click to enlarge"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setModalImage(row)}
                  >
                    <img src={row.imageUrl} alt={`Tree ${row.treeId}`} loading="lazy" />
                  </div>
                ) : (
                  <div className="thumb-wrapper" title="No image uploaded">
                    <span className="no-image">🚫</span>
                  </div>
                )}
              </td>
              <td>
                <span className="timestamp">{formatDate(row.createdAt)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalImage && (
        <ImageModal
          imageUrl={modalImage.imageUrl}
          treeId={modalImage.treeId}
          onClose={() => setModalImage(null)}
        />
      )}
    </>
  )
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [spinning, setSpinning] = useState(false)

  const fetchData = useCallback(async () => {
    setSpinning(true)
    try {
      const res = await fetch(`${API_URL}/api/tree/data`)
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const json = await res.json()
      setData(json.data || [])
      setError(null)
      setLastSync(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setTimeout(() => setSpinning(false), 600)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Stats
  const uniqueTrees = new Set(data.map((d) => d.treeId)).size
  const avgTof = data.length
    ? (data.reduce((s, d) => s + d.tofMeasurement, 0) / data.length).toFixed(1)
    : '—'
  const withImages = data.filter((d) => d.imageUrl).length

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-icon">🌳</span>
          <div>
            <h1 className="app-title">Tree Monitor</h1>
            <div className="app-subtitle">Real-time Raspberry Pi Sensor Dashboard</div>
          </div>
        </div>
        <div className="status-badge">
          <span className={`status-dot ${error ? 'error' : ''}`} />
          {error ? 'Disconnected' : 'Live — updates every 10s'}
        </div>
      </header>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{data.length}</div>
          <div className="stat-sub">readings stored</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Trees</div>
          <div className="stat-value">{uniqueTrees}</div>
          <div className="stat-sub">distinct IDs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg TOF Distance</div>
          <div className="stat-value">{avgTof}</div>
          <div className="stat-sub">centimetres</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Images</div>
          <div className="stat-value">{withImages}</div>
          <div className="stat-sub">photos captured</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <div className="table-title">Sensor Readings</div>
            {lastSync && (
              <div className="table-meta">
                Last updated: {lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>
          <button
            className="refresh-btn"
            onClick={fetchData}
            disabled={spinning}
            id="refresh-button"
          >
            <span className={`refresh-icon ${spinning ? 'spinning' : ''}`}>↻</span>
            Refresh
          </button>
        </div>

        <div className="table-wrapper">
          <TreeTable data={data} loading={loading} error={error} />
        </div>
      </div>

      <footer className="app-footer">
        Tree Monitor • Data refreshes automatically every 10 seconds
      </footer>
    </div>
  )
}
