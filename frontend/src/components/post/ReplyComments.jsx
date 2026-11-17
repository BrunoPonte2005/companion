import { useEffect, useId, useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import { usePostActions } from '../../hooks/usePostActions.js'
import { useToast } from '../../hooks/useToast.js'
import { getApiErrorMessage } from '../../services/apiError.js'
import {
  createReplyComment,
  deleteReplyComment,
  getReplyComments,
  MAX_COMMENTS_PER_REPLY,
  REPLY_COMMENT_MAX_LENGTH,
} from '../../services/postService.js'
import ProfileLink from '../user/ProfileLink.jsx'

function formatRelativeTime(dateValue) {
  const elapsedMinutes = Math.max(
    1,
    Math.floor((Date.now() - new Date(dateValue).getTime()) / 60000),
  )

  if (elapsedMinutes < 60) return `há ${elapsedMinutes} min`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h atrás`

  return `${Math.floor(elapsedHours / 24)}d atrás`
}

function initials(name) {
  return (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

// Comentários dentro de uma resposta: lista (carregada ao abrir) e caixa para
// comentar. onCountChange(n) avisa o card da resposta para atualizar o contador.
function ReplyComments({ replyId, currentUserId, onCountChange }) {
  const showToast = useToast()
  const { canModerate } = usePostActions()
  const inputId = useId()
  const [comments, setComments] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let active = true
    getReplyComments(replyId)
      .then((data) => {
        if (!active) return
        setComments(data)
        setLoadError('')
        onCountChange(data.length)
      })
      .catch((error) => {
        if (active) setLoadError(getApiErrorMessage(error, 'Não foi possível carregar os comentários.'))
      })
    return () => {
      active = false
    }
    // onCountChange troca a cada render do card; só recarrega por replyId ou "tentar de novo".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyId, reloadKey])

  async function handleSubmit(event) {
    event.preventDefault()
    const text = content.trim()
    if (!text || isSending) return
    setIsSending(true)
    setSendError('')
    try {
      const created = await createReplyComment(replyId, text)
      const next = [...(comments ?? []), created]
      setComments(next)
      onCountChange(next.length)
      setContent('')
    } catch (error) {
      setSendError(getApiErrorMessage(error, 'Não foi possível enviar seu comentário.'))
    } finally {
      setIsSending(false)
    }
  }

  async function confirmDelete() {
    setIsDeleting(true)
    try {
      await deleteReplyComment(toDelete.id)
    } catch (error) {
      // 404: já tinha sido apagado; só some da tela.
      if (error.response?.status !== 404) {
        showToast(getApiErrorMessage(error, 'Não foi possível excluir o comentário.'), { type: 'error' })
        setIsDeleting(false)
        return
      }
    }
    const next = comments.filter((comment) => comment.id !== toDelete.id)
    setComments(next)
    onCountChange(next.length)
    setToDelete(null)
    setIsDeleting(false)
    showToast('Comentário excluído.')
  }

  const isFull = (comments?.length ?? 0) >= MAX_COMMENTS_PER_REPLY

  return (
    <div className="mt-4 border-l-2 border-companion-orange/30 pl-4">
      {loadError ? (
        <div role="alert" className="flex items-center gap-3 text-sm">
          <p className="font-semibold text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="font-bold text-companion-brand hover:underline"
          >
            Tentar de novo
          </button>
        </div>
      ) : comments === null ? (
        <p role="status" className="text-sm text-companion-muted">
          Carregando comentários...
        </p>
      ) : (
        comments.length > 0 && (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <ProfileLink
                  user={comment.author}
                  currentUserId={currentUserId}
                  className="h-fit shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-companion-orange"
                >
                  {comment.author.avatarUrl ? (
                    <img src={comment.author.avatarUrl} alt="" className="size-7 rounded-full object-cover" />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="grid size-7 place-items-center rounded-full bg-companion-orange/10 text-[0.65rem] font-bold text-companion-brand"
                    >
                      {initials(comment.author.name)}
                    </div>
                  )}
                </ProfileLink>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <ProfileLink
                      user={comment.author}
                      currentUserId={currentUserId}
                      className="text-sm font-semibold text-companion-text hover:text-companion-brand"
                    >
                      {comment.author.name}
                    </ProfileLink>
                    <span className="text-companion-muted">@{comment.author.username}</span>
                    <span aria-hidden="true" className="text-companion-muted">
                      ·
                    </span>
                    <time dateTime={comment.createdAt} className="text-companion-muted">
                      {formatRelativeTime(comment.createdAt)}
                    </time>
                    {(comment.ownedByCurrentUser || canModerate) && (
                      <button
                        type="button"
                        onClick={() => setToDelete(comment)}
                        aria-label="Excluir comentário"
                        title="Excluir comentário"
                        className="ml-auto text-companion-muted transition-colors hover:text-red-600"
                      >
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-5 text-companion-text">
                    {comment.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {isFull ? (
        <p className="mt-3 text-xs text-companion-muted">
          Esta resposta já tem o máximo de {MAX_COMMENTS_PER_REPLY} comentários.
        </p>
      ) : (
      <form onSubmit={handleSubmit} className="mt-3">
        <label htmlFor={inputId} className="sr-only">
          Comentar esta resposta
        </label>
        <div className="flex items-start gap-2">
          <input
            id={inputId}
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              setSendError('')
            }}
            maxLength={REPLY_COMMENT_MAX_LENGTH}
            placeholder="Complemente ou esclareça esta resposta..."
            aria-invalid={Boolean(sendError)}
            className="h-10 min-w-0 flex-1 rounded-xl border border-companion-border bg-companion-panel/80 px-3 text-sm text-companion-text outline-none transition placeholder:text-companion-muted/75 focus:border-companion-orange focus:ring-4 focus:ring-companion-orange/15"
          />
          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-companion-orange px-3 text-sm font-bold text-white transition hover:bg-companion-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="bi bi-send" aria-hidden="true" />
            <span className="hidden sm:inline">{isSending ? 'Enviando...' : 'Comentar'}</span>
          </button>
        </div>
        {content.length > REPLY_COMMENT_MAX_LENGTH - 50 && (
          <p className="mt-1 text-right text-xs text-companion-muted">
            {content.length}/{REPLY_COMMENT_MAX_LENGTH}
          </p>
        )}
        {sendError && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700">
            {sendError}
          </p>
        )}
      </form>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Excluir este comentário?"
          description={
            toDelete.ownedByCurrentUser
              ? 'O comentário deixa de aparecer para todo mundo. Essa ação não pode ser desfeita.'
              : 'Você está excluindo o comentário de outra pessoa como moderação. Essa ação não pode ser desfeita.'
          }
          confirmLabel="Excluir comentário"
          tone="danger"
          isConfirming={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => !isDeleting && setToDelete(null)}
        />
      )}
    </div>
  )
}

export default ReplyComments
