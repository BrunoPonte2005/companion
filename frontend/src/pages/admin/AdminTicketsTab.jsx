import { useCallback, useState } from 'react'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import LoadMoreTrigger from '../../components/common/LoadMoreTrigger.jsx'
import { usePaginatedPosts } from '../../hooks/usePaginatedPosts.js'
import { useToast } from '../../hooks/useToast.js'
import { getApiErrorMessage } from '../../services/apiError.js'
import {
  closeTicket,
  getAdminTickets,
  replyTicket,
  TICKET_RESPONSE_MAX_LENGTH,
} from '../../services/ticketService.js'

const statusTabs = [
  { status: 'OPEN', label: 'Abertos', emptyText: 'Nenhum ticket aguardando resposta.' },
  { status: 'ANSWERED', label: 'Respondidos', emptyText: 'Nenhum ticket respondido aguardando encerramento.' },
  { status: 'CLOSED', label: 'Encerrados', emptyText: 'Nenhum ticket encerrado ainda.' },
]

function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// Gerenciar tickets de suporte: listar por situação, responder e encerrar.
function AdminTicketsTab() {
  const [status, setStatus] = useState('OPEN')
  const activeTab = statusTabs.find((tab) => tab.status === status)

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Situação dos tickets"
        className="flex overflow-hidden rounded-2xl border border-companion-border/70 bg-companion-surface shadow-sm"
      >
        {statusTabs.map((tab) => {
          const isActive = tab.status === status
          return (
            <button
              key={tab.status}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatus(tab.status)}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-bold transition ${
                isActive
                  ? 'border-companion-orange text-companion-brand'
                  : 'border-transparent text-companion-muted hover:text-companion-text'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* A key recria a lista ao trocar de situação. */}
      <TicketList key={status} status={status} emptyText={activeTab.emptyText} />
    </div>
  )
}

function TicketList({ status, emptyText }) {
  const fetchPage = useCallback((page) => getAdminTickets({ status, page }), [status])
  const { posts: tickets, removePost, isLoading, error, hasMore, loadMore, retry } = usePaginatedPosts(
    fetchPage,
    'Não foi possível carregar os tickets.',
  )

  if (isLoading && tickets.length === 0) {
    return (
      <p role="status" className="py-16 text-center text-lg font-semibold text-companion-muted">
        Carregando tickets...
      </p>
    )
  }

  return (
    <>
      {tickets.length === 0 && !error ? (
        <p role="status" className="py-12 text-center font-semibold text-companion-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              {/* Responder ou encerrar tira o ticket desta situação. */}
              <TicketCard ticket={ticket} onMoved={removePost} />
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-xl bg-companion-orange px-4 py-2 text-sm font-bold text-white transition hover:bg-companion-orange-hover"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        hasMore &&
        tickets.length > 0 && (
          <LoadMoreTrigger onLoadMore={loadMore} isLoading={isLoading} label="Carregar mais tickets" />
        )
      )}
    </>
  )
}

function TicketCard({ ticket, onMoved }) {
  const showToast = useToast()
  const [response, setResponse] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const isOpen = ticket.status === 'OPEN'

  async function run(action, message) {
    setIsBusy(true)
    try {
      await action()
      showToast(message)
      onMoved(ticket.id)
    } catch (error) {
      setIsBusy(false)
      // 409: outra pessoa já tratou este ticket; basta tirá-lo da lista.
      if (error.response?.status === 409) {
        showToast('Este ticket já foi tratado.')
        onMoved(ticket.id)
        return
      }
      showToast(getApiErrorMessage(error, 'Não foi possível atualizar o ticket.'), { type: 'error' })
    }
  }

  function handleReply(event) {
    event.preventDefault()
    if (!response.trim()) return
    run(() => replyTicket(ticket.id, response.trim()), 'Resposta enviada.')
  }

  async function handleClose() {
    await run(() => closeTicket(ticket.id), 'Ticket encerrado.')
    setIsCloseOpen(false)
  }

  return (
    <>
      <article className="rounded-2xl border border-companion-border/70 bg-companion-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="min-w-0 flex-1 font-bold text-companion-text">{ticket.subject}</h3>
          <time dateTime={ticket.createdAt} className="text-xs text-companion-muted">
            {formatDate(ticket.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 text-sm text-companion-muted">
          de {ticket.author.name ?? 'usuário'}
          {ticket.author.username && ` (@${ticket.author.username})`}
        </p>
        <p className="mt-3 whitespace-pre-wrap rounded-xl border border-companion-border/70 bg-companion-panel/60 px-4 py-3 text-sm text-companion-text">
          {ticket.message}
        </p>

        {ticket.response && (
          <div className="mt-3 text-sm">
            <p className="text-xs font-bold text-companion-brand">
              Resposta{ticket.respondedBy?.name && ` de ${ticket.respondedBy.name}`}
              {ticket.respondedAt && ` · ${formatDate(ticket.respondedAt)}`}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-companion-text">{ticket.response}</p>
          </div>
        )}

        {isOpen && (
          <form onSubmit={handleReply} className="mt-4 space-y-3 border-t border-companion-border/70 pt-4">
            <label htmlFor={`ticket-response-${ticket.id}`} className="sr-only">
              Resposta ao ticket
            </label>
            <textarea
              id={`ticket-response-${ticket.id}`}
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              maxLength={TICKET_RESPONSE_MAX_LENGTH}
              rows={4}
              placeholder="Escreva a resposta para a pessoa..."
              className="w-full rounded-xl border border-companion-border bg-companion-surface px-4 py-2.5 text-sm text-companion-text outline-none transition placeholder:text-companion-muted focus:border-companion-orange focus:ring-4 focus:ring-companion-orange/15"
            />
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setIsCloseOpen(true)}
                className="rounded-xl border border-companion-border bg-companion-panel px-4 py-2 text-sm font-bold text-companion-text transition hover:bg-companion-orange/5 disabled:opacity-60"
              >
                Encerrar sem responder
              </button>
              <button
                type="submit"
                disabled={isBusy || !response.trim()}
                className="rounded-xl bg-companion-orange px-4 py-2 text-sm font-bold text-white transition hover:bg-companion-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Responder
              </button>
            </div>
          </form>
        )}

        {ticket.status === 'ANSWERED' && (
          <div className="mt-4 flex justify-end border-t border-companion-border/70 pt-4">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setIsCloseOpen(true)}
              className="rounded-xl border border-companion-border bg-companion-panel px-4 py-2 text-sm font-bold text-companion-text transition hover:bg-companion-orange/5 disabled:opacity-60"
            >
              Encerrar ticket
            </button>
          </div>
        )}
      </article>

      {isCloseOpen && (
        <ConfirmDialog
          title="Encerrar este ticket?"
          description="O ticket sai da fila e não poderá mais ser respondido."
          confirmLabel="Encerrar"
          isConfirming={isBusy}
          onConfirm={handleClose}
          onCancel={() => !isBusy && setIsCloseOpen(false)}
        />
      )}
    </>
  )
}

export default AdminTicketsTab
