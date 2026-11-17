import { useState } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth.js'
import AdminOverview from './AdminOverview.jsx'
import AdminPostsTab from './AdminPostsTab.jsx'
import AdminTicketsTab from './AdminTicketsTab.jsx'
import AdminUsersTab from './AdminUsersTab.jsx'

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: 'bi-pie-chart' },
  { id: 'users', label: 'Alunos', icon: 'bi-people' },
  { id: 'posts', label: 'Dúvidas', icon: 'bi-question-circle' },
  { id: 'tickets', label: 'Tickets', icon: 'bi-life-preserver' },
]

// Painel de administração: números em gráficos, gerenciar alunos, dúvidas e tickets e
// exportar relatórios. Quem não é administrador volta ao feed (o backend
// também confere a permissão).
function AdminPage() {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') return <Navigate to="/feed" replace />
  return <AdminPanel />
}

function AdminPanel() {
  const [tab, setTab] = useState('overview')

  return (
    <section aria-labelledby="admin-title">
      <h1
        id="admin-title"
        className="mb-5 text-2xl font-bold tracking-tight text-companion-text sm:text-3xl"
      >
        Administração
      </h1>

      <div
        role="tablist"
        aria-label="Seções da administração"
        className="mb-5 flex overflow-hidden rounded-2xl border border-companion-border/70 bg-companion-surface shadow-sm"
      >
        {tabs.map((item) => {
          const isActive = item.id === tab
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`admin-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls="admin-tabpanel"
              onClick={() => setTab(item.id)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3.5 text-sm font-bold transition ${
                isActive
                  ? 'border-companion-orange text-companion-brand'
                  : 'border-transparent text-companion-muted hover:text-companion-text'
              }`}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>

      <div id="admin-tabpanel" role="tabpanel" aria-labelledby={`admin-tab-${tab}`}>
        {tab === 'overview' && <AdminOverview />}
        {tab === 'users' && <AdminUsersTab />}
        {tab === 'posts' && <AdminPostsTab />}
        {tab === 'tickets' && <AdminTicketsTab />}
      </div>
    </section>
  )
}

export default AdminPage
