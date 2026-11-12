import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Mic, Plus, Square } from 'lucide-react'
import type { Question } from '#/genius/blueprint/schema'
import type { QuestionAnswer } from '#/genius/state/types'
import type { ChatItem } from '#/stores/studioStore'
import { STEP_TITLE } from '#/stores/studioStore'
import { Icon } from '#/components/ui/Icon'
import { Menu } from '#/components/ui/Popover'
import { Spinner } from '#/components/ui/misc'
import { cn } from '#/utils/id'

export const EXAMPLE_PROMPTS = [
  'A CRM for my school academy: students, guardians, classes, attendance and fees',
  'A CRM for a letting agency with landlords, properties, enquiries, tenancies and rent payments',
  'A sales CRM for a small agency: contacts, companies, deals and follow-ups',
]

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-line bg-surface', className)}>{children}</div>
}

const THINKING_WORDS = ['Thinking hard', 'Reading your request', 'Understanding your business', 'Organizing modules', 'Mapping relationships', 'Designing fields', 'Sketching the dashboard', 'Adding sample data', 'Validating the design', 'Polishing details', 'Preparing the preview']

/** A line of text that settles in out of a blur each time it changes. */
export function BlurText({ text, className, pulse }: { text: string; className?: string; pulse?: boolean }) {
  return <span key={text} className={cn('blur-in inline-block', className)}>{pulse ? <span className="shine-text">{text}</span> : text}</span>
}

function useCycle(on: boolean, list: string[], ms = 2400) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!on) return
    setI(0)
    const t = setInterval(() => setI((n) => Math.min(n + 1, list.length - 1)), ms)
    return () => clearInterval(t)
  }, [on, list, ms])
  return list[i]
}

function StepsRow({ item }: { item: Extract<ChatItem, { kind: 'steps' }> }) {
  const [open, setOpen] = useState(true)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!item.running) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [item.running])
  const secs = Math.max(1, Math.round(((item.running ? now : item.startedAt + (item.ms ?? 0)) - item.startedAt) / 1000))
  const word = useCycle(item.running, THINKING_WORDS)
  const title = item.running ? word : item.steps.some((s) => s.status === 'error') ? `Stopped after ${secs}s` : `Worked for ${secs}s`
  return (
    <Row className="rise-in">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[13px]">
        {item.running ? <Spinner size={14} /> : <Icon name={item.steps.some((s) => s.status === 'error') ? 'AlertTriangle' : 'CircleCheck'} size={15} className={item.steps.some((s) => s.status === 'error') ? 'text-danger' : 'text-success'} />}
        <span className="flex-1 font-medium">{item.running ? <BlurText text={title} pulse /> : title}</span>
        {open ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
      </button>
      {open && (
        <ol aria-label="Progress" className="space-y-2.5 border-t border-line px-3.5 py-3">
          {item.steps.filter((s) => s.status !== 'skipped').map((s) => (
            <li key={s.id} className={cn(s.status === 'error' ? 'shake-once' : 'rise-in', 'flex items-start gap-2.5 text-[13px]')}>
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                {s.status === 'running' ? <Spinner size={12} /> : s.status === 'done' ? <Icon name="Check" size={14} className="text-success" /> : <Icon name="AlertTriangle" size={13} className="text-danger" />}
              </span>
              <span className="min-w-0">
                <BlurText text={STEP_TITLE[s.id] ?? s.label} pulse={s.status === 'running'} className={cn(s.status === 'running' ? 'text-fg' : 'text-muted')} />
                {s.detail && <span className="blur-in block text-xs text-muted-2">{s.detail}</span>}
              </span>
            </li>
          ))}
          {item.steps.length === 0 && <li className="text-[13px] text-muted">Starting</li>}
        </ol>
      )}
    </Row>
  )
}

function QaRow({ item }: { item: Extract<ChatItem, { kind: 'qa' }> }) {
  const [open, setOpen] = useState(true)
  return (
    <Row className="rise-in">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3.5 py-3 text-left text-[13px] font-medium">
        <span className="flex-1">{item.title}</span>
        <ChevronRight size={15} className={cn('text-muted transition', open && 'rotate-90')} />
      </button>
      {open && (
        <dl className="divide-y divide-line border-t border-line">
          {item.pairs.map((p, i) => (
            <div key={i} className="px-3.5 py-2.5">
              <dt className="text-xs text-muted">{p.q}</dt>
              <dd className="mt-0.5 text-[13px]">{p.a}{p.auto && <span className="ml-2 text-[11px] text-muted-2">assumed</span>}</dd>
            </div>
          ))}
        </dl>
      )}
    </Row>
  )
}

export function ChatList({ chat, waiting, running, footer, onLink }: { chat: ChatItem[]; waiting: boolean; running: boolean; footer?: React.ReactNode; onLink?: (link: NonNullable<Extract<ChatItem, { kind: 'assistant' }>['link']>) => void }) {
  const end = useRef<HTMLDivElement | null>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [chat, waiting, running])
  return (
    <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3" aria-live="polite">
      {chat.map((c) => {
        if (c.kind === 'user') return <div key={c.id} className="rise-in ml-8 rounded-xl bg-subtle px-3.5 py-2.5 text-[13.5px] whitespace-pre-wrap">{c.text}</div>
        if (c.kind === 'assistant') {
          const text = <p className={cn(c.tone === 'error' ? 'shake-once' : 'rise-in', 'px-1 text-[13.5px] leading-relaxed whitespace-pre-wrap', c.tone === 'muted' ? 'text-muted' : c.tone === 'error' ? 'text-fg' : 'text-fg')}>{c.tone === 'error' && <Icon name="AlertTriangle" size={14} className="mr-1.5 inline -translate-y-px text-danger" />}{c.text}</p>
          if (!c.link) return <div key={c.id}>{text}</div>
          const link = c.link
          return <div key={c.id}>{text}<button type="button" data-testid="chat-link" onClick={() => onLink?.(link)} className="mt-2 ml-1 flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-link transition hover:bg-subtle">{link.label}<ChevronRight size={14} /></button></div>
        }
        if (c.kind === 'steps') return <StepsRow key={c.id} item={c} />
        if (c.kind === 'qa') return <QaRow key={c.id} item={c} />
        return null
      })}
      {waiting && <Row><div className="flex items-center gap-2 px-3.5 py-3 text-[13px] font-medium"><span className="flex-1">Waiting for answers</span><ChevronRight size={15} className="text-muted" /></div></Row>}
      {footer}
      <div ref={end} />
    </div>
  )
}

/** The docked card above the composer: one question at a time, radio options, "Write your own…", Skip and Submit. */
export function ClarifyDock({ questions, onSubmit, onSkip, disabled }: { questions: Question[]; onSubmit: (a: QuestionAnswer[]) => void; onSkip: () => void; disabled?: boolean }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [own, setOwn] = useState<Record<string, boolean>>({})
  const [collapsed, setCollapsed] = useState(false)
  const q = questions[Math.min(i, questions.length - 1)]
  if (!q) return null
  const value = picked[q.id]
  const isOwn = own[q.id]
  const answerOf = (x: Question) => (picked[x.id] ?? '').trim() || x.safeDefault || x.options[0] || ''
  const canSubmit = !!value?.trim() || !!q.safeDefault || q.options.length > 0
  const submit = () => {
    if (!canSubmit || disabled) return
    const at = new Date().toISOString()
    onSubmit(questions.map((x) => ({ questionId: x.id, question: x.question, answer: answerOf(x) || 'Use your best judgement', at })))
  }
  return (
    <div className="mx-3 mb-2 overflow-hidden rounded-xl border border-line bg-surface" role="group" aria-label="Clarifying question">
      <div className="flex items-start gap-3 px-3.5 pt-3 pb-2">
        <p className="flex-1 text-[13px] leading-snug font-medium">{q.question}</p>
        <button type="button" aria-label={collapsed ? 'Expand question' : 'Collapse question'} onClick={() => setCollapsed((c) => !c)} className="mt-0.5 text-muted hover:text-fg">
          {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-0.5 px-2 pb-1" role="radiogroup" aria-label={q.question}>
          {q.options.map((o) => {
            const on = value === o && !isOwn
            return (
              <button key={o} type="button" role="radio" aria-checked={on} onClick={() => { setPicked((p) => ({ ...p, [q.id]: o })); setOwn((p) => ({ ...p, [q.id]: false })) }} className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition', on ? 'bg-subtle font-medium' : 'text-muted hover:bg-subtle/60 hover:text-fg')}>
                <Radio on={on} />{o}
              </button>
            )
          })}
          <div className={cn('flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13px] transition', isOwn ? 'bg-subtle' : 'hover:bg-subtle/60')}>
            <button type="button" role="radio" aria-checked={!!isOwn} aria-label="Write your own answer" onClick={() => { setOwn((p) => ({ ...p, [q.id]: true })); setPicked((p) => ({ ...p, [q.id]: '' })) }}><Radio on={!!isOwn} /></button>
            <input aria-label={`Your own answer: ${q.question}`} value={isOwn ? (value ?? '') : ''} onFocus={() => { if (!isOwn) { setOwn((p) => ({ ...p, [q.id]: true })); setPicked((p) => ({ ...p, [q.id]: '' })) } }} onChange={(e) => setPicked((p) => ({ ...p, [q.id]: e.target.value }))} placeholder="Write your own..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-2" onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 border-t border-line px-2 py-2">
        <button type="button" aria-label="Previous question" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))} className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-fg disabled:opacity-30"><ChevronLeft size={16} /></button>
        <button type="button" aria-label="Next question" disabled={i >= questions.length - 1} onClick={() => setI((n) => Math.min(questions.length - 1, n + 1))} className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-fg disabled:opacity-30"><ChevronRight size={16} /></button>
        {questions.length > 1 && <span className="ml-1 text-[11px] text-muted-2">{i + 1} of {questions.length}</span>}
        <button type="button" onClick={onSkip} disabled={disabled} className="ml-auto h-7 rounded-md px-2.5 text-[13px] text-muted hover:text-fg disabled:opacity-40">Skip</button>
        <button type="button" onClick={submit} disabled={!canSubmit || disabled} className="h-7 rounded-full bg-primary px-3.5 text-[13px] font-medium text-white transition hover:bg-primary-strong disabled:opacity-40">Submit</button>
      </div>
    </div>
  )
}

function Radio({ on }: { on: boolean }) {
  return <span aria-hidden className={cn('flex size-4 shrink-0 items-center justify-center rounded-full border', on ? 'border-primary' : 'border-line-strong')}>{on && <span className="size-2 rounded-full bg-primary" />}</span>
}

export function Composer({ onSend, onCancel, running, disabled, seed, onSeedUsed, hero }: { hero?: boolean; onSend: (text: string) => void; onCancel: () => void; running: boolean; disabled?: boolean; seed?: string; onSeedUsed?: () => void }) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'build' | 'ask'>('build')
  const ref = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    if (seed) {
      setText(seed)
      onSeedUsed?.()
      ref.current?.focus()
    }
  }, [seed, onSeedUsed])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])
  const send = () => {
    const t = text.trim()
    if (!t || running || disabled) return
    onSend(mode === 'ask' && !t.endsWith('?') ? `${t}?` : t)
    setText('')
  }
  return (
    <div className={hero ? 'mx-auto w-full max-w-3xl px-4 pb-5' : 'px-3 pb-3'}>
      <div className="rounded-2xl border border-line bg-surface px-3 pt-2.5 pb-2">
        <textarea ref={ref} id="studio-request" aria-label="Describe the CRM you want to build" rows={1} maxLength={40000} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={mode === 'ask' ? 'Ask about your CRM...' : hero ? 'Start typing a prompt: describe the CRM you want to build' : 'Describe the CRM you want to build...'} className="block max-h-40 min-h-[24px] w-full resize-none bg-transparent text-[13.5px] outline-none placeholder:text-muted-2" />
        <div className="mt-2 flex items-center gap-1.5">
          <Menu align="left" width={300} items={EXAMPLE_PROMPTS.map((p) => ({ label: p, icon: 'Sparkles', onClick: () => setText(p) }))} trigger={({ toggle, ref: r }) => (
            <button ref={r} type="button" aria-label="Add an example prompt" onClick={toggle} className="flex size-7 items-center justify-center rounded-full border border-line text-muted transition hover:bg-subtle hover:text-fg"><Plus size={15} /></button>
          )} />
          <label className="relative">
            <span className="sr-only">Mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as 'build' | 'ask')} className="h-7 appearance-none rounded-lg border border-line bg-subtle pr-6 pl-2.5 text-[13px] text-fg outline-none hover:border-line-strong">
              <option value="build">Build</option>
              <option value="ask">Ask</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted" />
          </label>
          <span className="ml-auto" />
          <button type="button" disabled aria-label="Voice input (coming soon)" title="Voice input is not available yet" className="flex size-7 items-center justify-center rounded-full text-muted opacity-60"><Mic size={15} /></button>
          {running ? (
            <button type="button" aria-label="Stop" onClick={onCancel} className="flex size-7 items-center justify-center rounded-full bg-fg text-app"><Square size={11} fill="currentColor" /></button>
          ) : (
            hero ? (
              <button type="button" aria-label="Run" onClick={send} disabled={!text.trim() || disabled} className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-fg transition hover:bg-subtle disabled:text-muted-2 disabled:hover:bg-transparent">Run<ArrowUp size={14} className="rotate-90" /></button>
            ) : (
              <button type="button" aria-label="Send" onClick={send} disabled={!text.trim() || disabled} className="flex size-7 items-center justify-center rounded-full bg-fg text-app transition disabled:bg-subtle disabled:text-muted"><ArrowUp size={15} /></button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
