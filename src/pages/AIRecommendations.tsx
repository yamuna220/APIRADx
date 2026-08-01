import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw, Code2, ChevronRight, TrendingDown, AlertCircle, Wrench, Eye, CheckCircle2 } from 'lucide-react'
import { aiRecommendationService } from '../services/aiRecommendationService'
import { useNotifications } from '../context/NotificationContext'
import type { Page } from '../App'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

interface Message { id: number; role: 'user' | 'assistant'; content: string; code?: string; thinking?: boolean }

const sevC: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)' }

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-3 rounded-[12px] overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2"><Code2 size={11} style={{ color: 'var(--text-muted)' }} /><span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>typescript</span></div>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="text-[10px] flex items-center gap-1 transition-colors"
          style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}>
          <Copy size={10} />{copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{ background: 'var(--card-elevated)', padding: '12px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', overflowX: 'auto', lineHeight: 1.6, margin: 0 }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function MsgBubble({ msg }: { msg: Message }) {
  if (msg.thinking) {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand)' }}>
          <Sparkles size={12} style={{ color: 'var(--brand-text)' }} />
        </div>
        <div className="px-4 py-3 rounded-[12px] border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2"><RefreshCw size={10} className="animate-spin" style={{ color: 'var(--brand)' }} /><span className="text-[12px] italic" style={{ color: 'var(--text-muted)' }}>{msg.content}</span></div>
        </div>
      </div>
    )
  }
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] px-4 py-3 rounded-[12px] text-[13px] leading-relaxed" style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}>
          {msg.content}
        </div>
      </div>
    )
  }
  const parts = msg.content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g)
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--brand)' }}>
        <Sparkles size={12} style={{ color: 'var(--brand-text)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="px-4 py-3.5 rounded-[12px] border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
            {parts.map((p, i) => {
              if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-600" style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong>
              if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="px-1.5 py-0.5 rounded-[4px] font-mono text-[11px]" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{p.slice(1, -1)}</code>
              return <span key={i}>{p}</span>
            })}
          </p>
          {msg.code && <CodeBlock code={msg.code} />}
        </div>
        <div className="flex items-center gap-1 mt-1.5 ml-1">
          <button className="p-1 rounded transition-colors" style={{ color: 'var(--border)' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--success)')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--border)')}><ThumbsUp size={11} /></button>
          <button className="p-1 rounded transition-colors" style={{ color: 'var(--border)' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--error)')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--border)')}><ThumbsDown size={11} /></button>
          <button className="p-1 rounded transition-colors" style={{ color: 'var(--border)' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--border)')}><Copy size={11} /></button>
        </div>
      </div>
    </div>
  )
}

export default function AIRecommendations({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const recs = aiRecommendationService.getAllRecommendations()
  const initMsgs = aiRecommendationService.getInitialMessages()
  const suggestions = aiRecommendationService.getSuggestions()
  const thinking = aiRecommendationService.getThinkingPhrases()
  const { addNotification } = useNotifications()
  
  const [messages, setMessages] = useState<Message[]>(initMsgs)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedRec, setExpandedRec] = useState<number | null>(null)
  const [fixingRec, setFixingRec] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(initMsgs.length + 1)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleFixNow = (recIndex: number) => {
    setFixingRec(recIndex)
    
    // Simulate applying the fix
    setTimeout(() => {
      setFixingRec(null)
      addNotification({
        category: 'ai_recommendation',
        priority: 'high',
        title: 'Fix Applied Successfully',
        message: `${recs[recIndex].title} has been fixed`,
        actionUrl: 'security-analysis',
        actionLabel: 'View Changes'
      })
    }, 2000)
  }

  const handleViewDetails = (recIndex: number) => {
    onNavigate('security-analysis')
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Viewing Details',
      message: `Navigating to detailed view for ${recs[recIndex].title}`
    })
  }

  const send = (text?: string) => {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    const userMsg: Message = { id: nextId.current++, role: 'user', content }
    const thinkMsg: Message = { id: nextId.current++, role: 'assistant', content: thinking[Math.floor(Math.random() * thinking.length)], thinking: true }
    setMessages((m) => [...m, userMsg, thinkMsg])
    setLoading(true)
    setTimeout(() => {
      const aiResponse = aiRecommendationService.getCannedResponse(content)
      const aiMsg: Message = { id: nextId.current++, role: 'assistant', ...aiResponse }
      setMessages((m) => [...m.slice(0, -1), aiMsg])
      setLoading(false)
    }, 1800)
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>AI Recommendations</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>AI-powered security analysis, remediation guidance, and code generation.</p>
      </div>

      <div className="space-y-3">
        {recs.map((rec, i) => {
          const sc = sevC[rec.severity]
          const open = expandedRec === i
          return (
            <div key={i} style={{ ...card, overflow: 'hidden' }}>
              <button className="w-full flex items-start gap-4 p-5 text-left" onClick={() => setExpandedRec(open ? null : i)}>
                <AlertCircle size={16} style={{ color: sc, flexShrink: 0, marginTop: 1 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-600" style={{ color: 'var(--text-primary)' }}>{rec.title}</span>
                    <span className="text-[10px] font-600 px-2 py-0.5 rounded-[5px]" style={{ color: sc, background: `color-mix(in srgb, ${sc} 14%, transparent)` }}>{rec.severity}</span>
                    <span className="text-[10px] font-700 px-2 py-0.5 rounded-[5px]" style={{ color: sc, background: `color-mix(in srgb, ${sc} 14%, transparent)` }}>{rec.priority}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
                      <TrendingDown size={10} />
                      <span className="text-[11px]">{rec.reduction} risk reduction if fixed</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className={`transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)' }} />
              </button>
              {open && (
                <div className="px-5 pb-5 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="p-3.5 rounded-[12px]" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="text-[10px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>AI Explanation</div>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rec.explanation}</p>
                  </div>
                  <div className="p-3.5 rounded-[12px] border" style={{ background: 'color-mix(in srgb, var(--success) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 22%, transparent)' }}>
                    <div className="text-[10px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--success)' }}>Suggested Fix</div>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rec.fix}</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-[10px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Code Snippet</div>
                    <pre className="p-3 rounded-[10px] text-[11px] font-mono overflow-x-auto" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}><code>{rec.snippet}</code></pre>
                  </div>
                  <div className="md:col-span-2 flex gap-2 pt-2">
                    <button
                      onClick={() => handleFixNow(i)}
                      disabled={fixingRec === i}
                      className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] font-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                    >
                      {fixingRec === i ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Applying Fix...
                        </>
                      ) : (
                        <>
                          <Wrench size={12} />
                          Fix Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleViewDetails(i)}
                      className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    >
                      <Eye size={12} />
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 flex flex-col" style={{ ...card, overflow: 'hidden', height: 480 }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--brand)' }}>
              <Sparkles size={14} style={{ color: 'var(--brand-text)' }} />
            </div>
            <div>
              <div className="text-[13px] font-600" style={{ color: 'var(--text-primary)' }}>Security AI</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Online · RADx-Sec v2.1</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => <MsgBubble key={msg.id} msg={msg} />)}
            <div ref={bottomRef} />
          </div>
          <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about vulnerabilities, request fix code..." disabled={loading}
                className="flex-1 px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none disabled:opacity-50"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-[12px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)' }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--brand)' }}
              ><Send size={14} /></button>
            </div>
          </div>
        </div>

        <div className="w-56 space-y-3 flex-shrink-0">
          <div style={card} className="p-4">
            <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Quick questions</h4>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading}
                  className="w-full text-left text-[11px] px-3 py-2.5 rounded-[10px] border transition-all disabled:opacity-50"
                  style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.color = 'var(--brand)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
                >{s}</button>
              ))}
            </div>
          </div>
          <div style={card} className="p-4">
            <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Context</h4>
            <div className="space-y-2">
              {[['APIs analyzed', '284'], ['Active findings', '39'], ['Fixed this month', '14'], ['Model', 'RADx-Sec v2.1']].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{l}</span>
                  <span className="text-[10px] font-500" style={{ color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
