import { useState } from 'react'
import './DonutChart.css'

const SIZE = 176
const STROKE = 28
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

const numberFormat = new Intl.NumberFormat('pt-BR')

function formatNumber(value) {
  return numberFormat.format(value)
}

function formatPercent(value, total) {
  if (total <= 0) return '0%'
  const percent = (value / total) * 100
  return `${percent < 10 && percent % 1 !== 0 ? percent.toFixed(1).replace('.', ',') : Math.round(percent)}%`
}

// Gráfico de setores (rosca) para uma parte de um todo. Até 5 setores, cada
// um com uma cor fixa pela posição. A legenda ao lado repete nome, valor e
// porcentagem, então a cor nunca é a única forma de identificar o setor.
//
// slices: [{ key, label, value, detail? }]
// centerLabel: o que o número do centro representa (ex.: "alunos").
function DonutChart({ title, slices, centerLabel }) {
  const [activeKey, setActiveKey] = useState(null)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const visible = slices.filter((slice) => slice.value > 0)
  const gap = visible.length > 1 ? GAP : 0
  const active = slices.find((slice) => slice.key === activeKey)

  // Cada setor começa onde o anterior termina.
  const segments = visible.map((slice, position) => {
    const before = visible.slice(0, position).reduce((sum, item) => sum + item.value, 0)
    return {
      slice,
      length: (slice.value / total) * CIRCUMFERENCE,
      offset: (before / total) * CIRCUMFERENCE,
    }
  })

  const summary = slices
    .map((slice) => `${slice.label}: ${formatNumber(slice.value)} (${formatPercent(slice.value, total)})`)
    .join('; ')

  return (
    <figure className="donut-chart flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`${title}. ${summary}`}
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              style={{ stroke: 'var(--donut-track)' }}
            />
            {segments.map(({ slice, length, offset: start }) => {
              const index = slices.indexOf(slice)
              const dimmed = activeKey != null && activeKey !== slice.key
              return (
                <circle
                  key={slice.key}
                  className="donut-segment"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                  strokeDasharray={`${Math.max(length - gap, 0.5)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-start}
                  style={{ stroke: `var(--series-${index + 1})`, opacity: dimmed ? 0.35 : 1 }}
                  tabIndex={0}
                  aria-label={`${slice.label}: ${formatNumber(slice.value)}`}
                  onMouseEnter={() => setActiveKey(slice.key)}
                  onMouseLeave={() => setActiveKey(null)}
                  onFocus={() => setActiveKey(slice.key)}
                  onBlur={() => setActiveKey(null)}
                />
              )
            })}
          </g>
        </svg>

        {/* O centro mostra o total, ou o setor sob o mouse/foco. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center"
        >
          <span className="text-2xl font-bold leading-none text-companion-text">
            {formatNumber(active ? active.value : total)}
          </span>
          <span className="mt-1 text-xs leading-tight text-companion-muted">
            {active
              ? `${active.label} · ${formatPercent(active.value, total)}`
              : total === 0
                ? 'sem dados'
                : centerLabel}
          </span>
        </div>
      </div>

      <figcaption className="w-full min-w-0 flex-1">
        <ul className="space-y-2">
          {slices.map((slice, index) => (
            <li
              key={slice.key}
              onMouseEnter={() => setActiveKey(slice.key)}
              onMouseLeave={() => setActiveKey(null)}
              className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm"
            >
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-[4px]"
                style={{ background: `var(--series-${index + 1})` }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-companion-text">{slice.label}</span>
                {slice.detail && (
                  <span className="block truncate text-xs text-companion-muted">{slice.detail}</span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-bold text-companion-text">{formatNumber(slice.value)}</span>
                <span className="block text-xs text-companion-muted">
                  {formatPercent(slice.value, total)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}

export default DonutChart
