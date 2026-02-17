import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `Ты — AI-помощник системы SmartSort, умной системы мониторинга мусорных контейнеров города Алматы.
Ты получаешь реальные данные о контейнерах и помогаешь сборщикам мусора принимать решения.
Отвечай коротко, по делу, на русском языке. Используй эмодзи для наглядности.
Давай конкретные рекомендации: куда ехать, что делать, какие районы проблемные.`

const QUICK = ['Куда ехать первым?', 'Какой район хуже всех?', 'Сколько нарушений?']

export default function AIChat({ containers, analytics }) {
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Привет! Я AI-помощник SmartSort.\nСпроси меня:\n• Куда ехать первым?\n• Какой район проблемный?\n• Что делать с нарушениями?' }
  ])
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function buildContext() {
    const critical   = containers.filter(c => c.status === 'critical' || c.has_violation)
    const violations = containers.filter(c => c.has_violation)
    return `
ТЕКУЩИЕ ДАННЫЕ СИСТЕМЫ:
- Всего контейнеров: ${containers.length}
- Критических (нужен вывоз): ${critical.length}
- Нарушений сортировки: ${violations.length}

КОНТЕЙНЕРЫ ТРЕБУЮЩИЕ ВНИМАНИЯ:
${critical.slice(0, 8).map(c =>
  `• ${c.name} (${c.district}) — ${c.fill_level}% заполнен, тип: ${c.waste_type}${c.has_violation ? `, нарушение: выброшен ${c.violation_type}` : ''}`
).join('\n')}

РЕЙТИНГ РАЙОНОВ:
${(analytics?.districts || []).map((d, i) =>
  `${i + 1}. ${d.name} — балл ${d.score}/100, нарушений: ${d.violations}, заполнение: ${d.avg_fill}%`
).join('\n')}
    `.trim()
  }

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const userMsg = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(1) // пропускаем первое приветствие
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: SYSTEM_PROMPT + '\n\n' + buildContext(),
          messages: [...history, userMsg],
        }),
      })
      const data  = await res.json()
      const reply = data.content?.[0]?.text || '❌ Пустой ответ'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Ошибка подключения к AI' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* ── FAB ── */}
      <button
        className={`ai-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 16 }}>{open ? '✕' : '🤖'}</span>
        {!open && <span>AI помощник</span>}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div className="ai-window">

          {/* Header */}
          <div className="ai-header">
            <div className="ai-header-left">
              <div className="ai-avatar">🤖</div>
              <div>
                <div className="ai-title">SmartSort AI</div>
                <div className="ai-subtitle">Помощник диспетчера</div>
              </div>
            </div>
            <div className="ai-online">
              <div className="ai-online-dot"/>
              онлайн
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="ai-bubble assistant ai-typing">
                <div className="ai-typing-dot"/>
                <div className="ai-typing-dot"/>
                <div className="ai-typing-dot"/>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick */}
          <div className="ai-quick-row">
            {QUICK.map(q => (
              <button key={q} className="ai-quick-btn" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="ai-input-row">
            <input
              className="ai-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Спроси что-нибудь..."
            />
            <button
              className="ai-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}