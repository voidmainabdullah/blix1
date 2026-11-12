import { useEffect, useState, type ReactNode } from 'react'
import { PanelLeft } from 'lucide-react'
import { useSettingsStore } from '#/stores/settingsStore'
import { useUiStore } from '#/stores/uiStore'
import { useWorkspaceStore } from '#/stores/workspaceStore'
import { initApp } from '#/stores'
import { useHydrated } from '#/hooks/useData'
import { Toasts, ConfirmHost } from '#/components/ui/Overlays'
import { Skeleton } from '#/components/ui/misc'
import { RecordDrawer } from '#/components/records/RecordDrawer'
import { NewRecordModal } from '#/components/records/NewRecordModal'
import { cn } from '#/utils/id'
import { Sidebar } from './Sidebar'
import { WorkspaceDialog } from './WorkspaceDialog'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { usePathname } from './AppLink'

/** Dark only. Applies the brand accent (used for the primary colour) and the density; nothing else is themeable. */
export function ThemeApplier() {
  const brand = useSettingsStore((s) => s.settings.brand)
  useEffect(() => {
    const el = document.documentElement
    el.classList.add('dark')
    if (brand.primary) el.style.setProperty('--primary', brand.primary)
    el.dataset.density = brand.density
  }, [brand])
  return null
}

/** Boots stores from localStorage on the client; SSR renders only the skeleton. */
export function AppBoot({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useHydrated()
  const ready = useWorkspaceStore((s) => s.ready)
  useEffect(() => {
    if (hydrated) initApp()
  }, [hydrated])
  return (
    <>
      <ThemeApplier />
      {hydrated && ready ? children : (fallback ?? <ShellSkeleton />)}
      {hydrated && <Toasts />}
      {hydrated && <ConfirmHost />}
    </>
  )
}

export function ShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-app" aria-busy="true" aria-label="Loading Sortblink">
      <aside className="hidden w-64 shrink-0 space-y-3 border-r border-line bg-side p-4 lg:block">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
      </aside>
      <div className="flex-1">
        <div className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-8 w-72" /></div>
        <div className="space-y-4 p-6"><Skeleton className="h-7 w-56" /><div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-64" /></div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const mobileOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobile = useUiStore((s) => s.setMobileNav)
  const newProject = useUiStore((s) => s.newProjectOpen)
  const setNewProject = useUiStore((s) => s.setNewProjectOpen)
  const [desktopHidden, setDesktopHidden] = useState(false)
  const path = usePathname()
  // Studio draws its own title bar, so the global top bar steps aside there
  const studio = path === '/genius'

  return (
    <div className="flex h-screen min-h-0 bg-app">
      <aside className={cn('no-print hidden h-screen w-[248px] shrink-0 border-r border-line bg-side lg:block', desktopHidden && 'lg:hidden')}>
        <Sidebar onHide={() => setDesktopHidden(true)} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobile(false)} />
          <aside className="slide-in-left absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-line bg-side"><Sidebar mobile /></aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {!studio && (
          <Topbar
            onToggleSidebar={() => {
              if (window.matchMedia('(min-width: 1024px)').matches) setDesktopHidden((v) => !v)
              else setMobile(!mobileOpen)
            }}
          />
        )}
        {studio && desktopHidden && (
          <button type="button" aria-label="Show sidebar" onClick={() => setDesktopHidden(false)} className="fixed top-2.5 left-2 z-20 hidden rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-fg lg:block"><PanelLeft size={16} /></button>
        )}
        <main className={cn('min-h-0 min-w-0 flex-1', studio ? 'overflow-hidden' : 'scroll-thin overflow-y-auto p-4 sm:p-6')}>{children}</main>
      </div>
      <CommandPalette />
      <RecordDrawer />
      <NewRecordModal />
      <WorkspaceDialog open={newProject} onClose={() => setNewProject(false)} />
    </div>
  )
}
