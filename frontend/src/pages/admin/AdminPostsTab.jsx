import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import LoadMoreTrigger from '../../components/common/LoadMoreTrigger.jsx'
import SubjectTag from '../../components/common/SubjectTag.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { usePaginatedPosts } from '../../hooks/usePaginatedPosts.js'
import { usePostActions } from '../../hooks/usePostActions.js'
import { getPosts } from '../../services/postService.js'

function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// Gerenciar dúvidas: buscar e excluir (a exclusão usa a mesma ação da moderação).
function AdminPostsTab() {
  const [search, setSearch] = useState('')
  const query = useDebouncedValue(search.trim())

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="admin-post-search" className="sr-only">
          Buscar dúvidas
        </label>
        <input
          id="admin-post-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por título, texto ou matéria..."
          className="h-12 w-full rounded-xl border border-companion-border bg-companion-surface px-4 text-sm text-companion-text outline-none transition placeholder:text-companion-muted focus:border-companion-orange focus:ring-4 focus:ring-companion-orange/15"
        />
      </div>
      {/* A key recria a lista a cada busca nova. */}
      <PostList key={query} query={query} />
    </div>
  )
}

function PostList({ query }) {
  const fetchPage = useCallback((page) => getPosts({ page, query: query || undefined }), [query])
  const { posts, removePost, totalElements, isLoading, error, hasMore, loadMore, retry } =
    usePaginatedPosts(fetchPage)
  const { deletePost } = usePostActions()
  const [toDelete, setToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function confirmDelete() {
    setIsDeleting(true)
    try {
      // Falhas já mostram um aviso; a confirmação continua aberta.
      await deletePost(toDelete.id)
      removePost(toDelete.id)
      setToDelete(null)
    } catch {
      // Mantém a janela aberta para tentar de novo.
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading && posts.length === 0) {
    return (
      <p role="status" className="py-16 text-center text-lg font-semibold text-companion-muted">
        Carregando dúvidas...
      </p>
    )
  }

  return (
    <>
      <p className="text-xs text-companion-muted">
        {totalElements} {totalElements === 1 ? 'dúvida' : 'dúvidas'}
        {query && ` para "${query}"`}
      </p>

      {posts.length === 0 && !error ? (
        <p role="status" className="py-12 text-center font-semibold text-companion-muted">
          Nenhuma dúvida encontrada.
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="rounded-2xl border border-companion-border/70 bg-companion-surface p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="min-w-0 flex-1 font-bold text-companion-text">{post.title}</h3>
                  <time dateTime={post.createdAt} className="text-xs text-companion-muted">
                    {formatDate(post.createdAt)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-companion-muted">
                  por {post.author.name ?? 'usuário'}
                  {post.author.username && ` (@${post.author.username})`}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-companion-text">{post.content}</p>
                {post.subjects?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Matérias">
                    {post.subjects.map((subject) => (
                      <li key={subject.id}>
                        <SubjectTag name={subject.name} />
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-companion-border/70 pt-4 text-sm">
                  <span className="text-xs text-companion-muted">
                    <i className="bi bi-heart" aria-hidden="true" /> {post.likeCount}
                    <span className="mx-2">·</span>
                    <i className="bi bi-chat" aria-hidden="true" /> {post.commentCount}{' '}
                    {post.commentCount === 1 ? 'resposta' : 'respostas'}
                  </span>
                  <Link
                    to={`?duvida=${post.id}`}
                    state={{ postModal: true }}
                    className="ml-auto inline-flex items-center gap-2 font-semibold text-companion-brand hover:underline"
                  >
                    <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                    Ver dúvida
                  </Link>
                  <button
                    type="button"
                    onClick={() => setToDelete(post)}
                    aria-label={`Excluir dúvida: ${post.title}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-companion-border bg-companion-panel px-3 py-2 font-bold text-red-700 transition hover:bg-red-50"
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </article>
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
        posts.length > 0 && (
          <LoadMoreTrigger onLoadMore={loadMore} isLoading={isLoading} label="Carregar mais dúvidas" />
        )
      )}

      {toDelete && (
        <ConfirmDialog
          title="Excluir esta dúvida?"
          description="A dúvida deixa de aparecer para todo mundo. Essa ação não pode ser desfeita."
          confirmLabel="Excluir dúvida"
          tone="danger"
          isConfirming={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => !isDeleting && setToDelete(null)}
        />
      )}
    </>
  )
}

export default AdminPostsTab
