import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import AlertFeed from './AlertFeed'
import 'leaflet/dist/leaflet.css'

const STATUS_COLOR = {
  ok:        '#3BA776',
  warning:   '#E8922A',
  critical:  '#E5484D',
  violation: '#4C82F7',
}

const WASTE_TYPES = ['все', 'пластик', 'стекло', 'металл', 'органика', 'бумага']

export default function Map({ containers = [] }) {
  const [filter, setFilter] = useState('все')

  const filtered = filter === 'все'
    ? containers
    : containers.filter(c => c.waste_type === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {WASTE_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filter === t
                ? '1px solid rgba(76,130,247,0.4)'
                : '1px solid var(--border-subtle)',
              background: filter === t ? 'var(--accent-light)' : 'var(--bg-surface)',
              color: filter === t ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: filter === t ? 500 : 400,
              cursor: 'pointer',
              transition: 'all var(--transition)',
              fontFamily: 'var(--font)',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span style={{
          marginLeft: 'auto',
          fontSize: 13,
          color: 'var(--text-tertiary)',
          alignSelf: 'center',
        }}>
          {filtered.length} из {containers.length}
        </span>
      </div>

      {/* Map + Alerts */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Map */}
        <div className="card" style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
          <MapContainer
            center={[43.2220, 76.8512]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {filtered.map(c => {
              const color = STATUS_COLOR[c.has_violation ? 'violation' : c.status] ?? STATUS_COLOR.ok
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={7}
                  fillColor={color}
                  color="#fff"
                  fillOpacity={0.9}
                  weight={2.5}
                >
                  <Popup>
                    <div style={{
                      fontFamily: 'var(--font)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      minWidth: 180,
                      color: 'var(--text-primary)',
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                        {c.name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <span>📍 {c.district}</span><br/>
                        <span>📦 {c.waste_type}</span><br/>
                        <span>🔋 Заполнен на {c.fill_level}%</span>
                      </div>
                      {c.has_violation && (
                        <div style={{
                          marginTop: 8,
                          padding: '5px 8px',
                          borderRadius: 6,
                          background: 'var(--critical-light)',
                          color: 'var(--critical)',
                          fontSize: 12,
                          fontWeight: 500,
                        }}>
                          ⚠️ Нарушение: {c.violation_type}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        {/* Alert feed */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <AlertFeed />
        </div>
      </div>
    </div>
  )
}