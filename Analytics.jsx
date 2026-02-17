import { useState } from 'react'

const WASTE = {
  пластик:   { color: 'var(--accent)',   emoji: '🔵' },
  стекло:    { color: 'var(--success)',  emoji: '🟢' },
  бумага:    { color: 'var(--warning)',  emoji: '🟡' },
  металл:    { color: '#8B7CF7',         emoji: '🟣' },
  органика:  { color: '#F97316',         emoji: '🟠' },
  смешанный: { color: 'var(--critical)', emoji: '🔴' },
}

function medal(i) { return ['🥇', '🥈', '🥉'][i] || `#${i + 1}` }

function scoreColor(s) {
  return s >= 80 ? 'var(--success)' : s >= 50 ? 'var(--warning)' : 'var(--critical)'
}

function ScoreBadge({ score }) {
  return (
    <span style={{
      fontSize: 18,
      fontWeight: 600,
      color: scoreColor(score),
      minWidth: 36,
      textAlign: 'right',
      letterSpacing: '-0.5px',
    }}>
      {score}
    </span>
  )
}

export default function Analytics({ analytics = {}, containers = [] }) {
  const [selected, setSelected] = useState(null)
  const { districts = [], waste_types = [] } = analytics
  const distContainers = selected
    ? containers.filter(c => c.district === selected.name)
    : []

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>

      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Аналитика
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Нажмите на район для просмотра деталей
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* ── Рейтинг районов ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Рейтинг районов</span>
            <span className="badge">{districts.length}</span>
          </div>

          <div style={{ padding: '8px 12px 12px' }}>
            {districts.map((d, i) => (
              <div
                key={d.name}
                onClick={() => setSelected(selected?.name === d.name ? null : d)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 10px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  background: selected?.name === d.name ? 'var(--accent-light)' : 'transparent',
                  border: selected?.name === d.name
                    ? '1px solid rgba(76,130,247,0.2)'
                    : '1px solid transparent',
                  marginBottom: 2,
                }}
                onMouseEnter={e => {
                  if (selected?.name !== d.name) e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={e => {
                  if (selected?.name !== d.name) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
                  {medal(i)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                    Нарушений: {d.violations} · Заполнение: {d.avg_fill}%
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{
                      width: `${d.score}%`,
                      background: scoreColor(d.score),
                    }}/>
                  </div>
                </div>
                <ScoreBadge score={d.score} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Детали района / Типы мусора ── */}
        <div className="card">
          {selected ? (
            <>
              <div className="card-header">
                <span className="card-title">📍 {selected.name}</span>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-hover)',
                    fontFamily: 'var(--font)',
                    transition: 'all var(--transition)',
                  }}
                >
                  ← Назад
                </button>
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Балл',        value: selected.score,          color: scoreColor(selected.score) },
                    { label: 'Нарушений',   value: selected.violations,     color: 'var(--critical)'  },
                    { label: 'Контейнеров', value: selected.total,          color: 'var(--accent)'    },
                    { label: 'Заполнение',  value: `${selected.avg_fill}%`, color: 'var(--warning)'   },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: s.color, letterSpacing: '-0.5px' }}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Container list */}
                <div>
                  <div className="section-title" style={{ marginBottom: 8 }}>Контейнеры</div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}>
                    {distContainers.map(c => {
                      const cfg = WASTE[c.waste_type] || WASTE['смешанный']
                      const isViolation = c.has_violation
                      const isCritical  = c.status === 'critical'
                      const isWarning   = c.status === 'warning'
                      const dotColor = isViolation ? 'var(--accent)'
                        : isCritical ? 'var(--critical)'
                        : isWarning  ? 'var(--warning)'
                        : 'var(--success)'

                      return (
                        <div key={c.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          background: 'var(--bg-surface-2)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                              {c.waste_type} · {c.fill_level}%
                            </div>
                          </div>
                          <div style={{
                            width: 7, height: 7,
                            borderRadius: '50%',
                            background: dotColor,
                            flexShrink: 0,
                          }}/>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <span className="card-title">Типы мусора</span>
              </div>
              <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {waste_types.map(w => {
                  const cfg = WASTE[w.type] || { color: 'var(--text-tertiary)', emoji: '⚪' }
                  return (
                    <div key={w.type}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                          {cfg.emoji} {w.type}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                          {w.avg_fill}%
                        </span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{
                          width: `${w.avg_fill}%`,
                          background: cfg.color,
                        }}/>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        Нарушений: {w.violations} из {w.total} контейнеров
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ── ML прогноз ── */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}>
            🤖 ML — Предсказание и рекомендации
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            На основе текущих данных пик заполнения ожидается около{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>18:00</span>.
            Рекомендуем дополнительный маршрут в{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {districts[districts.length - 1]?.name || 'Жетысуский'}
            </span>{' '}
            район — он показывает наихудший балл экологичности.
            Основная проблема — неправильная сортировка{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>органики</span> и{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>пластика</span>.
          </p>
        </div>

      </div>
    </div>
  )
}