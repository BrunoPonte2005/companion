import { useCallback, useId, useState } from 'react'
import LoadMoreTrigger from '../common/LoadMoreTrigger.jsx'
import { usePaginatedPosts } from '../../hooks/usePaginatedPosts.js'
import { useToast } from '../../hooks/useToast.js'
import { getApiErrorMessage } from '../../services/apiError.js'
import {
  createTicket,
  getMyTickets,
  TICKET_MESSAGE_MAX_LENGTH,
  TICKET_STATUS_LABELS,
  TICKET_SUBJECT_MAX_LENGTH,
} from '../../services/ticketService.js'

const STATUS_STYLES = {
  OPEN: 'bg-amber-100 text-amber-800',
  ANSWERED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-companion-border/60 text-companion-muted',
}

function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// "Ainda não solucionou sua dúvida? Nos envie um ticket": formulário de envio
// e a lista dos tickets da conta, com a resposta da equipe.
function TicketSection() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  // Muda a cada ticket enviado para a lista recarregar.
  const [listKey, setListKey] = useState(0)

  return (
    <section aria-labelledby="ticket-title" className="space-y-4">
      <div className="flex gap-4 rounded-2xl border border-companion-border/70 bg-companion-surface p-5 shadow-sm sm:p-6">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-companion-orange/10 text-lg text-companion-brand"
        >
          <i className="bi bi-life-preserver" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="ticket-title" className="text-base font-bold text-companion-text">
            Ainda não solucionou sua dúvida?
          </h2>
          <p className="mt-0.5 text-sm text-companion-muted">
            Nos envie um ticket e a equipe do Companion responde por aqui.
          </p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-companion-orange px-4 py-2.5 text-sm font-bold text-white transition hover:bg-companion-orange-hover"
            >
              <i className="bi bi-send" aria-hidden="true" />
              Enviar ticket
            </button>
          )}
          {isFormOpen && (
            <TicketForm
              onCancel={() => setIsFormOpen(false)}
              onSent={() => {
                setIsFormOpen(false)
                setListKey((key) => key + 1)
              }}
            />
          )}
        </div>
      </div>

      <MyTickets key={listKey} />
    </section>
  )
}

function TicketForm({ onCancel, onSent }) {
  const showToast = useToast()
  const subjectId = useId()
  const messageId = useId()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  const canSend = subject.trim() !== '' && message.trim() !== '' && !isSending

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSend) return
    setIsSending(true)
    setError('')
    try {
      await createTicket({ subject: subject.trim(), message: message.trim() })
      showToast('Ticket enviado. Avisaremos por aqui quando a equipe responder.')
      onSent()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível enviar o ticket.'))
      setIsSending(false)
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-companion-border bg-companion-surface px-4 py-2.5 text-sm text-companion-text outline-none transition placeholder:text-companion-muted focus:border-companion-orange focus:ring-4 focus:ring-companion-orange/15'

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor={subjectId} className="mb-1 block text-sm font-semibold text-companion-text">
          Assunto
        </label>
        <input
          id={subjectId}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={TICKET_SUBJECT_MAX_LENGTH}
          placeholder="Resuma o problema em poucas palavras"
          className={fieldClass}
        />
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor={messageId} className="text-sm font-semibold text-companion-text">
            Mensagem
          </label>
          <span className="text-xs text-companion-muted">
            {message.length}/{TICKET_MESSAGE_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={messageId}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={TICKET_MESSAGE_MAX_LENGTH}
          rows={6}
          placeholder="Conte o que aconteceu, com o máximo de detalhes."
          className={fieldClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSending}
          className="rounded-xl border border-companion-border bg-companion-panel px-4 py-2.5 text-sm font-bold text-companion-text transition hover:bg-companion-orange/5 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-xl bg-companion-orange px-4 py-2.5 text-sm font-bold text-white transition hover:bg-companion-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? 'Enviando…' : 'Enviar ticket'}
        </button>
      </div>
    </form>
  )
}

function MyTickets() {
  const fetchPage = useCallback((page) => getMyTickets({ page }), [])
  const { posts: tickets, isLoading, error, hasMore, loadMore, retry } = usePaginatedPosts(
    fetchPage,
    'Não foi possível carregar seus tickets.',
  )

  if (isLoading && tickets.length === 0) return null
  if (tickets.length === 0 && !error) return null

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-companion-muted">
        Meus tickets
      </h3>
      <ul className="space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <article className="rounded-2xl border border-companion-border/70 bg-companion-surface p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className="min-w-0 flex-1 font-bold text-companion-text">{ticket.subject}</h4>
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[ticket.status]}`}>
                  {TICKET_STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-companion-muted">Enviado em {formatDate(ticket.createdAt)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-companion-text">{ticket.message}</p>

              {ticket.response && (
                <div className="mt-3 rounded-xl border border-companion-border/70 bg-companion-panel/60 p-3">
                  <p className="text-xs font-bold text-companion-brand">
                    Resposta da equipe
                    {ticket.respondedAt && ` · ${formatDate(ticket.respondedAt)}`}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-companion-text">{ticket.response}</p>
                </div>
              )}
            </article>
          </li>
        ))}
      </ul>

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
        hasMore && <LoadMoreTrigger onLoadMore={loadMore} isLoading={isLoading} label="Carregar mais tickets" />
      )}
    </div>
  )
}

export default TicketSection
