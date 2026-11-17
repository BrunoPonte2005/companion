import { useCallback, useEffect, useRef, useState } from 'react'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import LoadMoreTrigger from '../../components/common/LoadMoreTrigger.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { useToast } from '../../hooks/useToast.js'
import {
  changeUserRole,
  changeUserStatus,
  deleteUser,
  listUsers,
  USER_ROLES,
  USER_STATUS_LABELS,
} from '../../services/adminService.js'
import { getApiErrorMessage } from '../../services/apiError.js'

function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR')
}

// Gerenciar alunos: buscar, mudar o papel, suspender/reativar e excluir contas.
function AdminUsersTab() {
  const [search, setSearch] = useState('')
  const query = useDebouncedValue(search.trim())

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="admin-user-search" className="sr-only">
          Buscar alunos
        </label>
        <input
          id="admin-user-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, @username ou e-mail..."
          className="h-12 w-full rounded-xl border border-companion-border bg-companion-surface px-4 text-sm text-companion-text outline-none transition placeholder:text-companion-muted focus:border-companion-orange focus:ring-4 focus:ring-companion-orange/15"
        />
      </div>
      {/* A key recria a lista a cada busca nova. */}
      <UserList key={query} query={query} />
    </div>
  )
}

function UserList({ query }) {
  const { user: me } = useAuth()
  const showToast = useToast()
  const [state, setState] = useState({
    users: [],
    page: -1,
    last: false,
    total: 0,
    isLoading: true,
    error: '',
  })
  const requestRef = useRef(0)
  const [pending, setPending] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  const fetchPage = useCallback(
    (page) => {
      const requestId = ++requestRef.current
      listUsers({ query, page }).then(
        (data) => {
          if (requestId !== requestRef.current) return
          setState((current) => {
            const known = new Set(current.users.map((item) => item.id))
            return {
              users: page === 0 ? data.content : [...current.users, ...data.content.filter((item) => !known.has(item.id))],
              page: data.page,
              last: data.last,
              total: data.totalElements,
              isLoading: false,
              error: '',
            }
          })
        },
        (error) => {
          if (requestId !== requestRef.current) return
          setState((current) => ({
            ...current,
            isLoading: false,
            error: getApiErrorMessage(error, 'Não foi possível carregar os alunos.'),
          }))
        },
      )
    },
    [query],
  )

  useEffect(() => {
    fetchPage(0)
  }, [fetchPage])

  const loadNext = useCallback(() => {
    setState((current) => ({ ...current, isLoading: true, error: '' }))
    fetchPage(state.page + 1)
  }, [fetchPage, state.page])

  const loadMore = useCallback(() => {
    if (!state.isLoading && !state.last && !state.error) loadNext()
  }, [state.isLoading, state.last, state.error, loadNext])

  function replaceUser(updated) {
    setState((current) => ({
      ...current,
      users: current.users.map((item) => (item.id === updated.id ? updated : item)),
    }))
  }

  async function handleRoleChange(target, role) {
    if (role === target.role) return
    // Dar poder de administração pede confirmação.
    if (role === 'ADMIN') {
      setPending({ type: 'promote', user: target })
      return
    }
    await applyRole(target, role)
  }

  async function applyRole(target, role) {
    setIsBusy(true)
    try {
      replaceUser(await changeUserRole(target.id, role))
      showToast('Papel atualizado.')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Não foi possível alterar o papel.'), { type: 'error' })
    } finally {
      setIsBusy(false)
    }
  }

  async function confirmPending() {
    const { type, user: target } = pending
    setIsBusy(true)
    try {
      if (type === 'promote') {
        replaceUser(await changeUserRole(target.id, 'ADMIN'))
        showToast('Papel atualizado.')
      } else if (type === 'suspend') {
        replaceUser(await changeUserStatus(target.id, 'SUSPENDED'))
        showToast('Conta suspensa.')
      } else if (type === 'reactivate') {
        replaceUser(await changeUserStatus(target.id, 'ACTIVE'))
        showToast('Conta reativada.')
      } else if (type === 'delete') {
        await deleteUser(target.id)
        // A conta continua na lista, agora como excluída (anonimizada).
        replaceUser({ ...target, name: 'Usuário excluído', username: null, status: 'DELETED' })
        showToast('Conta excluída.')
      }
      setPending(null)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Não foi possível concluir a ação.'), { type: 'error' })
    } finally {
      setIsBusy(false)
    }
  }

  if (state.isLoading && state.users.length === 0) {
    return (
      <p role="status" className="py-16 text-center text-lg font-semibold text-companion-muted">
        Carregando alunos...
      </p>
    )
  }

  return (
    <>
      <p className="text-xs text-companion-muted">
        {state.total} {state.total === 1 ? 'conta' : 'contas'}
        {query && ` para "${query}"`}
      </p>

      {state.users.length === 0 && !state.error ? (
        <p role="status" className="py-12 text-center font-semibold text-companion-muted">
          Nenhum aluno encontrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {state.users.map((item) => (
            <li key={item.id}>
              <UserRow
                item={item}
                isMe={Number(item.id) === Number(me?.id)}
                isBusy={isBusy}
                onRoleChange={handleRoleChange}
                onAction={(type) => setPending({ type, user: item })}
              />
            </li>
          ))}
        </ul>
      )}

      {state.error ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm font-semibold text-red-700">{state.error}</p>
          <button
            type="button"
            onClick={loadNext}
            className="rounded-xl bg-companion-orange px-4 py-2 text-sm font-bold text-white transition hover:bg-companion-orange-hover"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        !state.last &&
        state.users.length > 0 && (
          <LoadMoreTrigger onLoadMore={loadMore} isLoading={state.isLoading} label="Carregar mais alunos" />
        )
      )}

      {pending && (
        <ConfirmDialog
          {...dialogFor(pending)}
          isConfirming={isBusy}
          onConfirm={confirmPending}
          onCancel={() => !isBusy && setPending(null)}
        />
      )}
    </>
  )
}

function displayName(item) {
  return item.name || item.username || item.email
}

function dialogFor({ type, user }) {
  const name = displayName(user)
  switch (type) {
    case 'promote':
      return {
        title: 'Tornar administrador?',
        description: `${name} passará a ter acesso total ao painel de administração, inclusive para gerenciar outras contas.`,
        confirmLabel: 'Tornar administrador',
      }
    case 'suspend':
      return {
        title: 'Suspender esta conta?',
        description: `${name} não conseguirá usar o Companion até a conta ser reativada.`,
        confirmLabel: 'Suspender',
        tone: 'danger',
      }
    case 'reactivate':
      return {
        title: 'Reativar esta conta?',
        description: `${name} volta a poder entrar e usar o Companion.`,
        confirmLabel: 'Reativar',
      }
    default:
      return {
        title: 'Excluir esta conta?',
        description: `A conta de ${name} será anonimizada e não poderá mais ser usada. Essa ação não pode ser desfeita.`,
        confirmLabel: 'Excluir conta',
        tone: 'danger',
      }
  }
}

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  SUSPENDED: 'bg-amber-100 text-amber-800',
  DELETED: 'bg-companion-border/60 text-companion-muted',
}

function UserRow({ item, isMe, isBusy, onRoleChange, onAction }) {
  const isDeleted = item.status === 'DELETED'
  const isSuspended = item.status === 'SUSPENDED'

  return (
    <article className="rounded-2xl border border-companion-border/70 bg-companion-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-companion-text">
            {displayName(item)}
            {isMe && <span className="ml-2 text-xs font-semibold text-companion-brand">(você)</span>}
          </p>
          <p className="truncate text-sm text-companion-muted">
            {item.username && `@${item.username} · `}
            {item.email}
          </p>
          <p className="mt-1 text-xs text-companion-muted">
            Cadastro em {formatDate(item.createdAt)}
            {item.registrationNumber && ` · Matrícula ${item.registrationNumber}`}
          </p>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[item.status] ?? STATUS_STYLES.DELETED}`}
        >
          {USER_STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>

      {!isDeleted && !isMe && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-companion-border/70 pt-4 text-sm">
          <label className="inline-flex items-center gap-2 font-semibold text-companion-muted">
            Papel
            <select
              value={item.role}
              disabled={isBusy}
              onChange={(event) => onRoleChange(item, event.target.value)}
              className="rounded-xl border border-companion-border bg-companion-surface px-3 py-2 text-sm font-semibold text-companion-text disabled:opacity-60"
            >
              {USER_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAction(isSuspended ? 'reactivate' : 'suspend')}
              className="inline-flex items-center gap-2 rounded-xl border border-companion-border bg-companion-panel px-3 py-2 font-bold text-companion-text transition hover:bg-companion-orange/5 disabled:opacity-60"
            >
              <i className={`bi ${isSuspended ? 'bi-person-check' : 'bi-person-slash'}`} aria-hidden="true" />
              {isSuspended ? 'Reativar' : 'Suspender'}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAction('delete')}
              aria-label={`Excluir conta de ${displayName(item)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-companion-border bg-companion-panel px-3 py-2 font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              <i className="bi bi-trash" aria-hidden="true" />
              Excluir
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default AdminUsersTab
