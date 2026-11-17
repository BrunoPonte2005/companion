import { useEffect, useState } from 'react'
import DonutChart from '../../components/admin/DonutChart.jsx'
import { useToast } from '../../hooks/useToast.js'
import { getAdminStats } from '../../services/adminService.js'
import { getApiErrorMessage } from '../../services/apiError.js'
import { exportReportsCsv, exportUsersCsv } from '../../services/exportService.js'

const numberFormat = new Intl.NumberFormat('pt-BR')

// Visão geral: cada indicador é uma parte de um todo, mostrada em gráfico de setores.
function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  // Muda a cada clique em "Atualizar" para buscar os números de novo.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    getAdminStats()
      .then((data) => {
        if (!active) return
        setStats(data)
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Não foi possível carregar o painel.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  function reload() {
    setIsLoading(true)
    setReloadKey((key) => key + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={reload}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-companion-border bg-companion-panel px-3 py-2 text-sm font-bold text-companion-text transition hover:bg-companion-orange/5 disabled:opacity-60"
        >
          <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          Atualizar
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!stats && isLoading && (
        <p role="status" className="py-16 text-center text-lg font-semibold text-companion-muted">
          Carregando números...
        </p>
      )}

      {stats && <Charts stats={stats} />}

      <ExportSection />
    </div>
  )
}

function Charts({ stats }) {
  const { users, content, reports, topSubjects } = stats

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Alunos por situação" note={`${numberFormat.format(users.total)} contas no total`}>
        <DonutChart
          title="Alunos por situação"
          centerLabel="alunos"
          slices={[
            { key: 'active', label: 'Ativos', value: users.total - users.suspended },
            { key: 'suspended', label: 'Suspensos', value: users.suspended },
          ]}
        />
      </ChartCard>

      <ChartCard title="Alunos que responderam dúvidas" note="Responderam a pelo menos uma dúvida de outra pessoa">
        <DonutChart
          title="Alunos que responderam dúvidas"
          centerLabel="alunos"
          slices={[
            { key: 'answered', label: 'Responderam', value: users.answeredAtLeastOne },
            {
              key: 'not-answered',
              label: 'Ainda não responderam',
              value: Math.max(0, users.total - users.answeredAtLeastOne),
            },
          ]}
        />
      </ChartCard>

      <ChartCard title="Alunos por tempo de cadastro" note="Novos = criaram a conta nos últimos 7 dias">
        <DonutChart
          title="Alunos por tempo de cadastro"
          centerLabel="alunos"
          slices={[
            { key: 'new', label: 'Novos', value: users.newLast7Days },
            { key: 'older', label: 'Anteriores', value: Math.max(0, users.total - users.newLast7Days) },
          ]}
        />
      </ChartCard>

      <ChartCard title="Denúncias por situação" note={`${numberFormat.format(reports.total)} denúncias no total`}>
        <DonutChart
          title="Denúncias por situação"
          centerLabel="denúncias"
          slices={[
            { key: 'resolved', label: 'Resolvidas', value: reports.resolved },
            { key: 'pending', label: 'Aguardando análise', value: reports.pending },
            { key: 'dismissed', label: 'Descartadas', value: reports.dismissed },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Dúvidas com e sem resposta"
        note={`${numberFormat.format(content.replies)} respostas publicadas no total`}
      >
        <DonutChart
          title="Dúvidas com e sem resposta"
          centerLabel="dúvidas"
          slices={[
            { key: 'answered', label: 'Com resposta', value: Math.max(0, content.posts - content.withoutReplies) },
            { key: 'unanswered', label: 'Sem resposta', value: content.withoutReplies },
          ]}
        />
      </ChartCard>

      <ChartCard title="Dúvidas por data de publicação" note="Recentes = publicadas nos últimos 7 dias">
        <DonutChart
          title="Dúvidas por data de publicação"
          centerLabel="dúvidas"
          slices={[
            { key: 'recent', label: 'Recentes', value: content.postsLast7Days },
            { key: 'older', label: 'Anteriores', value: Math.max(0, content.posts - content.postsLast7Days) },
          ]}
        />
      </ChartCard>

      <div className="lg:col-span-2">
        <ChartCard title="Matérias com mais dúvidas" note="Top 5 dos últimos 30 dias">
          {topSubjects.length === 0 ? (
            <p className="text-sm text-companion-muted">Nenhuma dúvida publicada no período.</p>
          ) : (
            <DonutChart
              title="Matérias com mais dúvidas"
              centerLabel="dúvidas"
              slices={topSubjects.map((subject) => ({
                key: subject.code,
                label: subject.name,
                detail: subject.code,
                value: subject.postCount,
              }))}
            />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, note, children }) {
  return (
    <section className="rounded-2xl border border-companion-border/70 bg-companion-surface p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-companion-text">{title}</h2>
      {note && <p className="mb-4 text-xs text-companion-muted">{note}</p>}
      {children}
    </section>
  )
}

const REPORT_EXPORT_OPTIONS = [
  { value: '', label: 'Todas as denúncias' },
  { value: 'PENDING', label: 'Só pendentes' },
  { value: 'RESOLVED', label: 'Só resolvidas' },
  { value: 'DISMISSED', label: 'Só descartadas' },
]

function ExportSection() {
  const showToast = useToast()
  const [busy, setBusy] = useState(null)
  const [reportStatus, setReportStatus] = useState('')

  async function run(key, action) {
    if (busy) return
    setBusy(key)
    try {
      await action()
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Não foi possível exportar.'), { type: 'error' })
    } finally {
      setBusy(null)
    }
  }

  const buttonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-companion-orange px-4 py-2.5 text-sm font-bold text-white transition hover:bg-companion-orange-hover disabled:opacity-60'

  return (
    <section className="rounded-2xl border border-companion-border/70 bg-companion-surface p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-companion-text">Exportar relatórios</h2>
      <p className="text-xs text-companion-muted">
        Arquivos CSV (separados por ponto e vírgula), prontos para abrir no Excel.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-companion-border/70 bg-companion-panel/60 p-4">
          <p className="font-bold text-companion-text">Usuários</p>
          <p className="mt-1 text-sm text-companion-muted">
            Nome, e-mail, curso, perfil, situação e data de cadastro.
          </p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run('users', exportUsersCsv)}
            className={`mt-3 ${buttonClass}`}
          >
            <i className="bi bi-download" aria-hidden="true" />
            {busy === 'users' ? 'Exportando...' : 'Exportar usuários (CSV)'}
          </button>
        </div>

        <div className="rounded-xl border border-companion-border/70 bg-companion-panel/60 p-4">
          <p className="font-bold text-companion-text">Denúncias</p>
          <p className="mt-1 text-sm text-companion-muted">
            Motivo, conteúdo denunciado, quem denunciou e quem analisou.
          </p>
          <label htmlFor="report-export-status" className="sr-only">
            Situação das denúncias a exportar
          </label>
          <select
            id="report-export-status"
            value={reportStatus}
            onChange={(event) => setReportStatus(event.target.value)}
            className="mt-3 w-full rounded-xl border border-companion-border bg-companion-surface px-3 py-2 text-sm text-companion-text"
          >
            {REPORT_EXPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run('reports', () => exportReportsCsv(reportStatus || undefined))}
            className={`mt-3 ${buttonClass}`}
          >
            <i className="bi bi-download" aria-hidden="true" />
            {busy === 'reports' ? 'Exportando...' : 'Exportar denúncias (CSV)'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default AdminOverview
