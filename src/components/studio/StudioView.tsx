import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Volume2, VolumeX, Check, ChevronDown, Copy, ExternalLink, Layers, Monitor, MessageSquare, Smartphone, Tablet, Share2, Menu as Menu2, History, SquarePen, Code2, Database, Eye } from 'lucide-react'
import type { Question } from '#/genius/blueprint/schema'
import type { QuestionAnswer } from '#/genius/state/types'
import type { ChatItem } from '#/stores/studioStore'
import { Icon } from '#/components/ui/Icon'
import { Menu, Popover } from '#/components/ui/Popover'
import { cn } from '#/utils/id'
import { setSound, soundOn } from '#/utils/sound'
import { AppPreview, OVERVIEW, type Device } from './AppPreview'
import { CrmCard } from './CrmCard'
import { ChatList, ClarifyDock, Composer } from './ChatPanel'
import { formatCell, rowsFor, type PApp } from './previewModel'

type Tab = 'preview' | 'code' | 'data' | 'review'

export interface StudioViewProps {
  title: string
  projects: { id: string; name: string; current: boolean }[]
  onPickProject: (id: string | 'new') => void
  onHistory: () => void
  onNewChat: () => void
  chat: ChatItem[]
  running: boolean
  asking: Question[] | null
  onSend: (text: string) => void
  onCancel: () => void
  onAnswers: (a: QuestionAnswer[]) => void
  onSkip: () => void
  /** a quiet inline note in the chat (for example: the AI model is not connected) */
  notice?: ReactNode
  onRetry?: () => void
  published?: { name: string; onOpen: () => void } | null
  app: PApp | null
  blueprintJson: string | null
  /** a calculation / rule / dashboard drafted from words: shown in the Preview tab (its JSON in Code) instead of the app */
  config?: { id: string; card: ReactNode; json: string } | null
  /** a link under a chat line (for example "Open Calculations") */
  onLink?: (link: NonNullable<Extract<ChatItem, { kind: 'assistant' }>['link']>) => void
  review: ReactNode | null
  publish: { label: string; disabled: boolean; busy: boolean; onClick: () => void; hidden?: boolean }
  onShare: () => void
  onOpenTab: () => void
  onMenu?: () => void
}

/** The Playground layout: title bar, a chat column and a preview panel, each a rounded flat panel. */
export function StudioView(p: StudioViewProps) {
  const [tab, setTab] = useState<Tab>('preview')
  const [device, setDevice] = useState<Device>('desktop')
  const [page, setPage] = useState(OVERVIEW)
  const [mobile, setMobile] = useState<'chat' | 'preview'>('chat')
  const [seed, setSeed] = useState<string | undefined>()
  const pages = useMemo(() => (p.app ? [{ id: OVERVIEW, label: 'Overview', icon: 'LayoutDashboard' }, ...p.app.modules.map((m) => ({ id: m.id, label: m.plural, icon: m.icon }))] : []), [p.app])
  const current = pages.find((x) => x.id === page) ?? pages[0]
  const configId = p.config?.id
  useEffect(() => { if (configId) setTab('preview') }, [configId])
  const showVideo = (!p.app && !p.config) || p.running
  const hasApp = !!p.app || !!p.config
  const [sound, setSoundState] = useState(true)
  useEffect(() => setSoundState(soundOn()), [])
  const toggleSound = () => { const n = !sound; setSound(n); setSoundState(n) }
  const landing = p.chat.length === 0 && !p.running && !p.app && !p.asking

  if (landing) {
    return (
      <div className="flex h-full min-h-0 flex-col" data-testid="studio-landing">
        <div className="flex h-12 shrink-0 items-center gap-2 px-4">
          {p.onMenu && <button type="button" aria-label="Open menu" onClick={p.onMenu} className="-ml-1 flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg lg:hidden"><Menu2 size={17} /></button>}
          <span className="text-[15px] font-medium">Studio</span>
          <span className="ml-auto" />
          <IconBtn label={sound ? 'Mute sounds' : 'Turn sounds on'} onClick={toggleSound}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</IconBtn>
          <IconBtn label="History" onClick={p.onHistory}><History size={15} /></IconBtn>
        </div>
        <div className="scroll-thin flex min-h-0 flex-1 items-center overflow-y-auto px-6 py-6 lg:px-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <div>
              <h1 className="text-[32px] leading-tight font-medium">Start building with Sortblink</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">Describe your business in plain words. Sortblink designs the CRM, shows it with sample data, and creates it as its own project when you publish.</p>
              <ul className="mt-6 space-y-3 text-[13.5px]">
                {['A CRM for my school academy: students, guardians, classes, attendance and fees', 'A CRM for a letting agency with landlords, properties, enquiries and rent payments', 'A sales CRM for a small agency: contacts, companies, deals and follow-ups'].map((t) => (
                  <li key={t}><button type="button" onClick={() => setSeed(t)} className="text-left text-fg/90 transition hover:text-link">{t}</button></li>
                ))}
              </ul>
            </div>
            <LandingArt />
          </div>
        </div>
        <Composer hero onSend={p.onSend} onCancel={p.onCancel} running={p.running} seed={seed} onSeedUsed={() => setSeed(undefined)} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="studio">
      <div className="flex h-12 shrink-0 items-center gap-2 px-3">
        {p.onMenu && <button type="button" aria-label="Open menu" onClick={p.onMenu} className="-ml-1 flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg lg:hidden"><Menu2 size={17} /></button>}
        <div className="hidden w-[412px] shrink-0 items-center text-[15px] font-medium lg:flex">Studio</div>
        <div className="flex rounded-full border border-line bg-surface p-0.5 lg:hidden" role="tablist" aria-label="Panel">
          {([['chat', 'Chat', MessageSquare], ['preview', 'Preview', Eye]] as const).map(([id, label, I]) => (
            <button key={id} type="button" role="tab" aria-selected={mobile === id} onClick={() => setMobile(id)} className={cn('flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium', mobile === id ? 'bg-primary text-white' : 'text-muted')}><I size={14} />{label}</button>
          ))}
        </div>

        <div className="flex rounded-full border border-line bg-surface p-0.5 max-lg:hidden" role="tablist" aria-label="Preview mode">
          <TabBtn active={tab === 'preview'} onClick={() => setTab('preview')} label="Preview" icon={<Eye size={14} />} text />
          <TabBtn active={tab === 'code'} onClick={() => setTab('code')} label="Code" icon={<Code2 size={14} />} disabled={!hasApp} />
          <TabBtn active={tab === 'data'} onClick={() => setTab('data')} label="Data" icon={<Database size={14} />} disabled={!hasApp} />
          <TabBtn active={tab === 'review'} onClick={() => setTab('review')} label="Review changes" icon={<Layers size={14} />} disabled={!p.review} />
        </div>

        <div className="mx-auto flex min-w-0 items-center gap-1.5 max-lg:hidden">
          <Menu align="left" width={170} items={([['desktop', 'Desktop', 'Monitor'], ['tablet', 'Tablet', 'Tablet'], ['mobile', 'Mobile', 'Smartphone']] as const).map(([id, label]) => ({ label, checked: device === id, onClick: () => setDevice(id) }))} trigger={({ toggle, ref }) => (
            <button ref={ref} type="button" aria-label="Device" onClick={toggle} className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-surface hover:text-fg">{device === 'desktop' ? <Monitor size={15} /> : device === 'tablet' ? <Tablet size={15} /> : <Smartphone size={15} />}</button>
          )} />
          <Menu align="left" width={220} items={pages.map((x) => ({ label: x.label, icon: x.icon, checked: current?.id === x.id, onClick: () => { setPage(x.id); if (tab !== 'data' && tab !== 'preview') setTab('preview') } }))} trigger={({ toggle, ref }) => (
            <button ref={ref} type="button" aria-label="Page" onClick={toggle} disabled={!hasApp} className="flex h-8 w-52 items-center justify-between rounded-lg border border-line px-3 text-[13px] text-fg transition hover:bg-surface disabled:text-muted-2 xl:w-60"><span className="truncate">{current?.label ?? 'Overview'}</span><ChevronDown size={14} className="text-muted" /></button>
          )} />
          <button type="button" aria-label="Open preview in a new tab" onClick={p.onOpenTab} disabled={!hasApp} className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-fg disabled:opacity-40"><ExternalLink size={15} /></button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button type="button" onClick={p.onShare} disabled={!hasApp} className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] text-fg transition hover:bg-surface disabled:text-muted-2"><Share2 size={14} className="lg:hidden" />Share</button>
          {!p.publish.hidden && (
            <button type="button" onClick={p.publish.onClick} disabled={p.publish.disabled || p.publish.busy} className="h-8 rounded-lg bg-primary px-4 text-[13px] font-medium text-white transition hover:bg-primary-strong disabled:bg-subtle disabled:text-muted-2">{p.publish.busy ? 'Publishing…' : p.publish.label}</button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <section aria-label="Chat" className={cn('flex min-h-0 w-full flex-col rounded-xl border border-line bg-app lg:w-[420px] lg:shrink-0', mobile !== 'chat' && 'max-lg:hidden')}>
          <div className="flex h-11 shrink-0 items-center gap-1 border-b border-line px-3">
            <Popover width={260} trigger={({ toggle, ref }) => (
              <button ref={ref} type="button" onClick={toggle} aria-label="Switch project" className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] font-medium transition hover:bg-surface">
                <Icon name="Sparkles" size={15} className="shrink-0 text-link" /><span className="truncate">{p.title}</span><ChevronDown size={14} className="shrink-0 text-muted" />
              </button>
            )}>
              {(close) => (
                <div>
                  <div className="section-label px-2.5 py-1.5">Project</div>
                  <button type="button" onClick={() => { close(); p.onPickProject('new') }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-subtle"><Icon name="Plus" size={14} className="text-muted" />New project</button>
                  {p.projects.length > 0 && <div className="my-1 h-px bg-line" />}
                  {p.projects.map((x) => (
                    <button key={x.id} type="button" onClick={() => { close(); p.onPickProject(x.id) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-subtle"><Icon name="FolderKanban" size={14} className="text-muted" /><span className="flex-1 truncate">{x.name}</span>{x.current && <Check size={14} className="text-link" />}</button>
                  ))}
                </div>
              )}
            </Popover>
            <span className="ml-auto" />
            <IconBtn label={sound ? 'Mute sounds' : 'Turn sounds on'} onClick={toggleSound}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</IconBtn>
            <IconBtn label="History" onClick={p.onHistory}><History size={15} /></IconBtn>
            <IconBtn label="New chat" onClick={p.onNewChat}><SquarePen size={15} /></IconBtn>
          </div>

          <ChatList
            chat={p.chat}
            running={p.running}
            waiting={!!p.asking}
            onLink={p.onLink}
            footer={
              <>
                {p.notice}
                {p.onRetry && !p.running && <button type="button" onClick={p.onRetry} className="px-1 text-[13px] text-link hover:underline">Try again</button>}
                {p.published && (
                  <div className="rounded-xl border border-line bg-surface p-3.5 text-[13px]">
                    <div className="flex items-center gap-2 font-medium"><Check size={15} className="text-success" />Published as “{p.published.name}”</div>
                    <p className="mt-1 text-xs text-muted">It is a separate project with its own sidebar. Find it any time under My projects.</p>
                    <button type="button" onClick={p.published.onOpen} className="mt-3 h-8 rounded-lg border border-line px-3 text-[13px] hover:bg-subtle">Open project</button>
                  </div>
                )}
                {p.chat.length === 0 && !p.running && <EmptyChat onPick={(t) => setSeed(t)} />}
              </>
            }
          />
          {p.asking && <ClarifyDock key={p.asking.map((q) => q.id).join()} questions={p.asking} onSubmit={p.onAnswers} onSkip={p.onSkip} disabled={p.running} />}
          <Composer onSend={p.onSend} onCancel={p.onCancel} running={p.running} seed={seed} onSeedUsed={() => setSeed(undefined)} />
        </section>

        <section aria-label="Preview" className={cn('relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-line bg-app', mobile !== 'preview' && 'max-lg:hidden')}>
          {showVideo ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-app p-8" data-testid="preview-loader">
              <CrmCard className="h-auto w-full max-w-[560px]" />
              {p.running && <span className="shine-text text-base font-semibold">Generating</span>}
            </div>
          ) : (
            <div key={`${tab}-${page}`} className="rise-in h-full"><PreviewBody tab={tab} app={p.app} config={p.config ?? null} page={page} setPage={setPage} device={device} json={p.config && (tab === 'code' || !p.app) ? p.config.json : p.blueprintJson} review={p.review} pages={pages} /></div>
          )}
        </section>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, label, icon, disabled, text }: { active: boolean; onClick: () => void; label: string; icon: ReactNode; disabled?: boolean; text?: boolean }) {
  return (
    <button type="button" role="tab" aria-selected={active} aria-label={label} title={label} disabled={disabled} onClick={onClick} className={cn('flex h-7 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition disabled:opacity-40', text ? 'px-3.5' : 'w-8', active ? 'bg-primary text-white' : 'text-muted hover:text-fg')}>
      {icon}{text && label}
    </button>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-fg">{children}</button>
}

function LandingArt() {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-link"><Icon name="Sparkles" size={12} />Built by Sortblink</div>
      <CrmCard className="h-auto w-full" />
    </div>
  )
}

function EmptyChat({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="px-1 pt-2">
      <p className="text-[13.5px] leading-relaxed">Describe the CRM you want. Sortblink designs the modules, fields and dashboard, shows you the result with sample data, and creates it as a separate project when you press Publish.</p>
      <div className="mt-4 space-y-1.5">
        <div className="section-label">Try asking</div>
        {['A CRM for my school academy: students, guardians, classes, attendance and fees', 'A CRM for a letting agency with landlords, properties, enquiries and rent payments', 'A sales CRM for a small agency: contacts, companies, deals and follow-ups'].map((t) => (
          <button key={t} type="button" onClick={() => onPick(t)} className="block w-full rounded-lg border border-line px-3 py-2 text-left text-[13px] text-muted transition hover:border-line-strong hover:text-fg">{t}</button>
        ))}
      </div>
    </div>
  )
}

function PreviewBody({ tab, app, config, page, setPage, device, json, review, pages }: { tab: Tab; app: PApp | null; config: { id: string; card: ReactNode; json: string } | null; page: string; setPage: (p: string) => void; device: Device; json: string | null; review: ReactNode | null; pages: { id: string; label: string }[] }) {
  if (tab === 'code') return <CodeView json={json} />
  if (tab === 'review') return <div className="scroll-thin h-full overflow-y-auto">{review}</div>
  // a drafted configuration takes the preview; the Data tab keeps showing the project's own sample data
  if (config && tab === 'preview') return <>{config.card}</>
  if (!app) return <>{config?.card}</>
  if (tab === 'data') return <DataView app={app} page={page === OVERVIEW ? (pages[1]?.id ?? OVERVIEW) : page} setPage={setPage} />
  return <Framed app={app} page={page} setPage={setPage} device={device} />
}

/** Fits the generated app to the panel: a narrow panel renders the compact layouts whatever device is picked. */
function Framed({ app, page, setPage, device }: { app: PApp; page: string; setPage: (p: string) => void; device: Device }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [w, setW] = useState(1000)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const eff: Device = device === 'desktop' ? (w < 520 ? "mobile" : w < 640 ? "tablet" : "desktop") : device
  return (
    <div ref={ref} className="flex h-full justify-center bg-surface">
      <div className={cn('h-full w-full min-w-0 bg-app', device === 'tablet' && 'max-w-[768px] border-x border-line', device === 'mobile' && 'max-w-[390px] border-x border-line')}>
        <AppPreview app={app} page={page} onPage={setPage} device={device === 'desktop' ? eff : device === 'tablet' ? (w < 520 ? 'mobile' : 'tablet') : 'mobile'} />
      </div>
    </div>
  )
}

function CodeView({ json }: { json: string | null }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative h-full">
      <button type="button" aria-label="Copy configuration" onClick={() => { void navigator.clipboard?.writeText(json ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="absolute top-3 right-4 z-10 flex h-7 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs text-muted hover:text-fg">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}</button>
      <pre className="scroll-thin h-full overflow-auto p-5 text-xs leading-relaxed whitespace-pre text-muted" aria-label="Generated configuration"><code>{json ?? ''}</code></pre>
    </div>
  )
}

function DataView({ app, page, setPage }: { app: PApp; page: string; setPage: (p: string) => void }) {
  const mod = app.modules.find((m) => m.id === page) ?? app.modules[0]
  const rows = useMemo(() => (mod ? rowsFor(app, mod, 10) : []), [app, mod])
  if (!mod) return null
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 py-2.5">
        {app.modules.map((m) => <button key={m.id} type="button" onClick={() => setPage(m.id)} className={cn('flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px]', m.id === mod.id ? 'bg-subtle text-fg' : 'text-muted hover:text-fg')}><Icon colorful name={m.icon} size={14} />{m.plural}</button>)}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-auto p-5">
        <div className="mb-3 flex items-baseline gap-2"><h2 className="text-[15px] font-medium">{mod.plural}</h2><span className="text-xs text-muted">{rows.length} sample records · {mod.fields.length} fields</span></div>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-max text-left text-[13px]">
            <thead><tr className="border-b border-line">{mod.fields.map((f) => <th key={f.id} className="section-label px-3 py-2.5 font-medium whitespace-nowrap">{f.label}<span className="ml-1.5 text-[10px] normal-case tracking-normal text-muted-2">{f.type}</span></th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-line last:border-0">{mod.fields.map((f, ci) => <td key={f.id} className={cn('px-3 py-2 whitespace-nowrap', ci === 0 ? 'font-medium' : 'text-muted')}>{formatCell(f, r[f.id])}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
