import { HeadContent, Outlet, Scripts, createRootRoute, Link } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { AppBoot, AppShell } from '#/components/layout/AppShell'
import { usePathname } from '#/components/layout/AppLink'
import { AuthGate } from '#/components/layout/AuthGate'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Sortblink: describe your CRM and it builds it' },
      { name: 'description', content: 'Sortblink designs your CRM from a plain description: modules, fields, dashboards and workflows, stored privately in your browser.' },
      { name: 'color-scheme', content: 'dark' },
      { name: 'theme-color', content: '#232422' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const path = usePathname()
  if (path === '/login' || path === '/signup') return <AuthGate mode="auth"><Outlet /></AuthGate>
  // the sample preview is static: no session, no workspace, nothing to boot
  if (path === '/genius-preview' || path === '/preview') return <Outlet />
  const isPublic = path.startsWith('/f/')
  return (
    <AuthGate mode={isPublic ? 'public' : 'app'}>
      <AppBoot>{isPublic ? <Outlet /> : <AppShell><Outlet /></AppShell>}</AppBoot>
    </AuthGate>
  )
}

function NotFound() {
  return (
    <AppBoot>
      <AppShell>
        <div className="mx-auto max-w-md py-20 text-center">
          <div className="section-label">404</div>
          <h1 className="mt-2 text-xl font-medium">Page not found</h1>
          <p className="mt-1 text-[13px] text-muted">That page does not exist in this project.</p>
          <Link to="/" className="mt-5 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-strong">Back to overview</Link>
        </div>
      </AppShell>
    </AppBoot>
  )
}
