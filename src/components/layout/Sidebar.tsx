import { useEffect, useState } from 'react'
import { ChevronRight, Sparkles, LogOut, Pencil, PanelLeftClose, X } from 'lucide-react'
import { useCurrentUser, useModules, useRoles, useWorkspace } from '#/hooks/useData'
import { useUiStore } from '#/stores/uiStore'
import { useUserStore } from '#/stores/userStore'
import { useSettingsStore } from '#/stores/settingsStore'
import { useWorkspaceStore } from '#/stores/workspaceStore'
import { signOut, useAuthStore } from '#/genius/auth/authStore'
import { DEFAULT_SECTIONS } from '#/services/navService'
import { isHomeWorkspace } from '#/services/workspaceService'
import { Icon } from '#/components/ui/Icon'
import { Popover } from '#/components/ui/Popover'
import { Avatar } from '#/components/ui/misc'
import { cn } from '#/utils/id'
import { AppLink, usePathname } from './AppLink'
import { NavTree } from './NavTree'

const TOOLS_KEY = 'sortblink:tools-open'

export function Brand({ compact }: { compact?: boolean }) {
  const brand = useSettingsStore((s) => s.settings.brand)
  return (
    <AppLink to="/" className="flex items-center gap-2.5">
      {brand.logo ? (
        <img src={brand.logo} alt={brand.brandName} className="size-7 rounded-lg object-contain" />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-white">{brand.brandName.slice(0, 1).toUpperCase()}</span>
      )}
      {!compact && <span className="text-[15px] font-medium tracking-tight">{brand.brandName}</span>}
    </AppLink>
  )
}

function Item({ to, icon, label, active, onClick, count }: { to: string; icon: string; label: string; active: boolean; onClick?: () => void; count?: number }) {
  return (
    <AppLink to={to} onClick={onClick} className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition', active ? 'bg-subtle text-fg' : 'text-muted hover:bg-surface hover:text-fg')}>
      {icon === 'Studio' ? <span className="studio-mark" aria-hidden><Sparkles size={11} color="#fff" strokeWidth={2.2} /></span> : <Icon name={icon} size={16} />}
      <span className="flex-1 truncate">{label}</span>
      {count != null && count > 0 && <span className="text-[11px] text-muted-2 tabular-nums">{count}</span>}
    </AppLink>
  )
}

const isActive = (pathname: string, path: string) => (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/'))

export function AccountMenu() {
  const email = useAuthStore((s) => s.email)
  const user = useCurrentUser()
  const users = useUserStore((s) => s.users)
  const roles = useRoles()
  const updateUser = useUserStore((s) => s.updateUser)
  const setCurrentUser = useSettingsStore((s) => s.setCurrentUser)
  const role = roles.find((r) => r.id === user?.roleId)
  return (
    <Popover
      width={264}
      trigger={({ toggle, ref }) => (
        <button ref={ref} type="button" onClick={toggle} aria-label="Account and role" className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface">
          <Avatar name={user?.name ?? email ?? '?'} color={user?.color} size={26} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px]">{user?.name ?? 'Account'}</span>
            <span className="block truncate text-[11px] text-muted-2">{email ?? role?.name}</span>
          </span>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="section-label px-2.5 py-1.5">Acting as</div>
          {users.map((u) => (
            <button key={u.id} type="button" onClick={() => { setCurrentUser(u.id); close() }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-subtle">
              <Avatar name={u.name} color={u.color} size={20} />
              <span className="flex-1 truncate">{u.name}</span>
              <span className="text-[11px] text-muted">{roles.find((r) => r.id === u.roleId)?.name}</span>
              {u.id === user?.id && <Icon name="Check" size={14} className="text-link" />}
            </button>
          ))}
          <div className="my-1 h-px bg-line" />
          <div className="section-label px-2.5 py-1.5">Role for {user?.name}</div>
          {roles.map((r) => (
            <button key={r.id} type="button" onClick={() => { if (user) updateUser(user.id, { roleId: r.id }); close() }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-subtle">
              <span className="flex-1">{r.name}</span>
              {r.id === user?.roleId && <Icon name="Check" size={14} className="text-link" />}
            </button>
          ))}
          <p className="mt-1 px-2.5 py-1.5 text-[11px] leading-snug text-muted-2">Roles tidy the interface in this browser. They are not server-side security.</p>
          <div className="my-1 h-px bg-line" />
          <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-subtle"><LogOut size={14} className="text-muted" />Sign out</button>
        </div>
      )}
    </Popover>
  )
}

/** Sidebar: Explore, the open project's own modules (if any), and one collapsible Tools section. */
export function Sidebar({ mobile, onHide }: { mobile?: boolean; onHide?: () => void }) {
  const pathname = usePathname()
  const ws = useWorkspace()
  const all = useWorkspaceStore((s) => s.workspaces)
  const modules = useModules()
  const editing = useUiStore((s) => s.navEditing)
  const setEditing = useUiStore((s) => s.setNavEditing)
  const setMobile = useUiStore((s) => s.setMobileNav)
  const [toolsOpen, setToolsOpen] = useState(true)
  const projects = all.filter((w) => !isHomeWorkspace(w, all)).length
  const inProject = !!ws && !isHomeWorkspace(ws, all)
  const close = mobile ? () => setMobile(false) : undefined

  useEffect(() => {
    try {
      const v = localStorage.getItem(TOOLS_KEY)
      if (v !== null) setToolsOpen(v === '1')
    } catch { /* storage unavailable */ }
  }, [])
  // projects built earlier kept their modules in a folder called "AI-built": name it after the project instead
  useEffect(() => {
    if (!ws || !inProject) return
    const st = useSettingsStore.getState()
    const old = st.getNav(ws.id).find((i) => i.type === 'category' && i.label === 'AI-built')
    if (old) st.updateNavItem(ws.id, old.id, { label: ws.name })
  }, [ws, inProject])
  const toggleTools = () => {
    setToolsOpen((o) => {
      try { localStorage.setItem(TOOLS_KEY, o ? '0' : '1') } catch { /* storage unavailable */ }
      return !o
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <Brand />
        {mobile ? (
          <button type="button" aria-label="Close menu" onClick={() => setMobile(false)} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg"><X size={16} /></button>
        ) : (
          onHide && <button type="button" aria-label="Hide sidebar" onClick={onHide} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg"><PanelLeftClose size={16} /></button>
        )}
      </div>

      <nav aria-label="Main navigation" className="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 pt-2 pb-4">
        <div>
          <div className="section-label px-2.5 pb-1.5">Explore</div>
          <div className="space-y-0.5">
            <Item to="/" icon="LayoutDashboard" label="Overview" active={pathname === '/'} onClick={close} />
            <Item to="/genius" icon="Studio" label="Studio" active={isActive(pathname, '/genius')} onClick={close} />
            <Item to="/projects" icon="FolderKanban" label="My projects" active={isActive(pathname, '/projects')} onClick={close} count={projects} />
            <Item to="/history" icon="History" label="History" active={isActive(pathname, '/history')} onClick={close} />
          </div>
        </div>

        {inProject && (
          <div>
            <div className="section-label flex items-center justify-between px-2.5 pb-1.5">
              <span className="truncate">{ws?.name}</span>
              {modules.length > 0 && (
                <button type="button" aria-label={editing ? 'Done customising' : 'Customise navigation'} title={editing ? 'Done customising' : 'Customise navigation'} onClick={() => setEditing(!editing)} className={cn('rounded p-1 normal-case hover:text-fg', editing ? 'text-link' : 'text-muted-2')}><Pencil size={12} /></button>
              )}
            </div>
            {modules.length === 0 ? (
              <p className="px-2.5 text-xs leading-relaxed text-muted-2">No modules yet. Describe this project in Studio, or add a module in the builder.</p>
            ) : (
              <NavTree editing={editing} onNavigate={close} />
            )}
          </div>
        )}

        <div>
          <button type="button" aria-expanded={toolsOpen} onClick={toggleTools} className="section-label flex w-full items-center gap-1 px-2.5 pb-1.5 text-left hover:text-fg">
            <ChevronRight size={12} className={cn('transition', toolsOpen && 'rotate-90')} />Tools
          </button>
          {toolsOpen && (
            <div className="space-y-3">
              {DEFAULT_SECTIONS.map((s) => (
                <div key={s.key} className="space-y-0.5">
                  {s.key !== 'tools' && <div className="px-2.5 pt-1 text-[11px] text-muted-2">{s.label}</div>}
                  {s.items.map((i) => <Item key={i.key} to={i.path} icon={i.icon} label={i.label} active={isActive(pathname, i.path)} onClick={close} />)}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="shrink-0 border-t border-line p-2"><AccountMenu /></div>
    </div>
  )
}
