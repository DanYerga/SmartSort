import { useEffect, useState, useRef } from 'react'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const TYPE_LABEL = {
  critical: 'Критично',
  warning:  'Внимание',
  info:     'Инфо',
  success:  'Норма',
}

export default function AlertFeed() {
  const [alerts, setAlerts] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const prevIds = useRef(new Set())

  useEffect(() => {
    const load = () =>
      fetch('http://127.0.0.1:8000/alerts')
        .then(r => r.json())
        .then(data => {
          setAlerts(data)
          const incoming = new Set(data.map(a => a.id))
          const fresh = [...incoming].filter(id => !prevIds.current.has(id))
          if (fresh.length) {
            setNewIds(s => new Set([...s, ...fresh]))
            setTimeout(() => setNewIds(s => {
              const next = new Set(s)
              fresh.forEach(id => next.delete(id))
              return next
            }), 2000)
          }
          prevIds.current = incoming
        })
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [])

  const criticalCount = alerts.filter(a => a.type === 'critical').length

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div className="card-header" style={{ flexShrink: 0 }}>
        <span className="card-title">Алерты</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {criticalCount > 0 && (
            <span style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--critical-light)',
              color: 'var(--critical)',
            }}>
              {criticalCount} крит.
            </span>
          )}
          <span className="badge">{alerts.length}</span>
        </div>
      </div>

      {/* List */}
      <div className="alert-list" style={{
        flex: 1,
        overflowY: 'auto',
      }}>
        {alerts.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 28 }}>✓</span>
            <span>Всё спокойно</span>
          </div>
        ) : (
          alerts.map(a => (
            <div
              key={a.id}
              className="alert-row"
              style={{
                background: newIds.has(a.id) ? 'var(--bg-surface-2)' : undefined,
                transition: 'background 0.4s ease',
              }}
            >
              <div className={`alert-dot ${a.type}`} />
              <div className="alert-body">
                <div className={`alert-type ${a.type}`}>
                  {TYPE_LABEL[a.type] ?? 'Инфо'}
                </div>
                <div className="alert-message">{a.message}</div>
              </div>
              <div className="alert-time">{formatTime(a.created_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}