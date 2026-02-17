import { useEffect, useState } from 'react'

const WASTE_CONFIG = {
  пластик:   { color: '#4C82F7', emoji: '🔵' },
  стекло:    { color: '#3BA776', emoji: '🟢' },
  бумага:    { color: '#E8922A', emoji: '🟡' },
  металл:    { color: '#8B7CF7', emoji: '🟣' },
  органика:  { color: '#F97316', emoji: '🟠' },
  смешанный: { color: '#E5484D', emoji: '🔴' },
}

export default function Route() {
  const [route, setRoute]                   = useState([])
  const [collected, setCollected]           = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState('все')
  const [collecting, setCollecting]         = useState(null)

  useEffect(() => {
    loadRoute()
    const i = setInterval(loadRoute, 5000)
    return () => clearInterval(i)
  }, [])

  function loadRoute() {
    fetch('http://127.0.0.1:8000/route').then(r => r.json()).then(setRoute)
  }

  function collect(id) {
    setCollecting(id)
    fetch(`http://127.0.0.1:8000/containers/${id}/collect`, { method: 'POST' })
      .then(() => {
        setCollected(prev => [...prev, id])
        setCollecting(null)
        setTimeout(loadRoute, 1000)
      })
      .catch(() => setCollecting(null))
  }

  const pending   = route.filter(c => !collected.includes(c.id))
  const districts = ['все', ...new Set(pending.map(c => c.district))]
  const filtered  = selectedDistrict === 'все'
    ? pending
    : pending.filter(c => c.district === selectedDistrict)

  const violationsCount = pending.filter(c => c.has_violation).length

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Маршрут сборщика
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Контейнеры, которые нужно объехать прямо сейчас
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flexShrink: 0 }}>
        {[
          { label: 'Осталось',    value: pending.length,    variant: 'critical' },
          { label: 'Собрано',     value: collected.length,  variant: 'success'  },
          { label: 'Нарушений',   value: violationsCount,   variant: 'accent'   },
        ].map(s => (
          <div key={s.label} className="metric-card" style={{ padding: '14px 18px' }}>
            <div className="metric-label">{s.label}</div>
            <div className={`metric-value ${s.variant}`} style={{ fontSize: 28 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── District filter ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {districts.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDistrict(d)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: selectedDistrict === d
                ? '1px solid rgba(76,130,247,0.4)'
                : '1px solid var(--border-subtle)',
              background: selectedDistrict === d ? 'var(--accent-light)' : 'var(--bg-surface)',
              color: selectedDistrict === d ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: selectedDistrict === d ? 500 : 400,
              cursor: 'pointer',
              transition: 'all var(--transition)',
              fontFamily: 'var(--font)',
            }}
          >
            {d === 'все' ? 'Все районы' : `📍 ${d}`}
          </button>
        ))}
      </div>

      {/* ── Route list ── */}
      {filtered.length === 0 ? (
        <div className="card" style={{ flex: 1 }}>
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <span style={{ fontSize: 36 }}>✅</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Все собрано!
            </span>
            <span>Отличная работа 💪</span>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((c, i) => {
            const cfg         = WASTE_CONFIG[c.waste_type] || WASTE_CONFIG['смешанный']
            const isCollecting = collecting === c.id
            const fillColor   = c.fill_level >= 80 ? 'var(--critical)' : cfg.color

            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1
                    ? '1px solid var(--border-subtle)'
                    : 'none',
                  transition: 'background var(--transition)',
                  background: 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Step number */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {i + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: 3,
                  }}>
                    {c.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}>
                    {c.district} · {cfg.emoji} {c.waste_type} · заполнен на{' '}
                    <span style={{ fontWeight: 500, color: fillColor }}>{c.fill_level}%</span>
                  </div>

                  {/* Fill bar */}
                  <div className="progress-bar-track" style={{ marginBottom: c.has_violation ? 8 : 0 }}>
                    <div className="progress-bar-fill" style={{
                      width: `${c.fill_level}%`,
                      background: fillColor,
                    }}/>
                  </div>

                  {/* Violation */}
                  {c.has_violation && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 6,
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--critical-light)',
                      border: '1px solid rgba(229,72,77,0.15)',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--critical)',
                    }}>
                      ⚠️ Выброшен {c.violation_type} вместо {c.waste_type}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  {/* Status dot */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: c.has_violation ? 'var(--accent)' : 'var(--critical)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: c.has_violation ? 'var(--accent)' : 'var(--critical)',
                      display: 'inline-block',
                    }}/>
                    {c.has_violation ? 'Нарушение' : 'Критично'}
                  </div>

                  {/* Collect button */}
                  <button
                    onClick={() => collect(c.id)}
                    disabled={isCollecting}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      background: isCollecting ? 'var(--bg-hover)' : 'var(--bg-surface)',
                      color: isCollecting ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: isCollecting ? 'default' : 'pointer',
                      fontFamily: 'var(--font)',
                      transition: 'all var(--transition)',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!isCollecting) {
                        e.currentTarget.style.background = 'var(--text-primary)'
                        e.currentTarget.style.color = '#fff'
                        e.currentTarget.style.borderColor = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isCollecting) {
                        e.currentTarget.style.background = 'var(--bg-surface)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                        e.currentTarget.style.borderColor = 'var(--border-medium)'
                      }
                    }}
                  >
                    {isCollecting ? '...' : '✓ Собрал'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}