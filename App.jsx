import { useState, useEffect } from 'react'
import Map from './components/Map'
import Analytics from './components/Analytics'
import Route from './components/Route'
import AIChat from './components/AIChat'
import './index.css'

const NAV = [
  { id: 'map',       icon: '🗺',  label: 'Карта'     },
  { id: 'analytics', icon: '📊',  label: 'Аналитика' },
  { id: 'route',     icon: '🚛',  label: 'Маршрут'   },
]

function useCounter(target, duration = 600) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    const start = performance.now()
    const step = ts => {
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return value
}

function MetricCard({ label, value, variant = 'default' }) {
  const animated = useCounter(typeof value === 'number' ? value : 0)
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${variant}`}>
        {typeof value === 'number' ? animated : value}
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage]           = useState('map')
  const [containers, setContainers] = useState([])
  const [analytics, setAnalytics]   = useState({ districts: [], waste_types: [] })

  useEffect(() => {
    fetch('http://127.0.0.1:8000/containers').then(r => r.json()).then(setContainers)
    fetch('http://127.0.0.1:8000/analytics').then(r => r.json()).then(setAnalytics)
    const ws = new WebSocket('ws://127.0.0.1:8000/ws')
    ws.onmessage = e => setContainers(JSON.parse(e.data))
    const iv = setInterval(() =>
      fetch('http://127.0.0.1:8000/analytics').then(r => r.json()).then(setAnalytics),
    5000)
    return () => { ws.close(); clearInterval(iv) }
  }, [])

  const critical   = containers.filter(c => c.status === 'critical').length
  const warning    = containers.filter(c => c.status === 'warning').length
  const violations = containers.filter(c => c.has_violation).length

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">♻️</span>
          <span className="sidebar-logo-text">
            Smart<span>Sort</span>
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot"/>
          <span>Система активна</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        gap: 12,
      }}>

        {/* Metrics */}
        <div className="metrics-row">
          <MetricCard label="Контейнеров"  value={containers.length} />
          <MetricCard label="Внимание"     value={warning}    variant="warning"  />
          <MetricCard label="Критично"     value={critical}   variant="critical" />
          <MetricCard label="Нарушений"    value={violations} variant="accent"   />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {page === 'map'       && <Map containers={containers} />}
          {page === 'analytics' && <Analytics analytics={analytics} containers={containers} />}
          {page === 'route'     && <Route />}
        </div>
      </main>

      <AIChat containers={containers} analytics={analytics} />
    </div>
  )
}