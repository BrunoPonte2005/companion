import { useEffect, useRef, useState } from 'react'
import { isTutorialPending, markTutorialDone } from '../../services/firstAccessTutorial.js'

// Cada passo aponta para um elemento da tela marcado com data-tour="...".
// Sem alvo (ou se o elemento ainda não existe, ex.: feed vazio), a explicação
// aparece centralizada.
const steps = [
  {
    icon: 'bi-stars',
    title: 'Bem-vindo ao Companion!',
    text: 'Vamos fazer um tour rápido de menos de um minuto mostrando onde ficam as principais coisas.',
  },
  {
    target: 'nav',
    icon: 'bi-compass',
    title: 'Navegação',
    text: 'Aqui você alterna entre o Feed (dúvidas da comunidade), o Explorar (busca de dúvidas e de alunos), os Salvos e as Configurações.',
  },
  {
    target: 'post-button',
    icon: 'bi-pencil-square',
    title: 'Postar uma dúvida',
    text: 'Clique aqui para escrever uma dúvida. Dê um título claro e descreva com detalhes para receber ajuda mais rápido.',
  },
  {
    target: 'post-tags',
    icon: 'bi-tags',
    title: 'Aplique a tag correta',
    text: 'Ao postar, você escolhe a(s) disciplina(s) da dúvida: elas viram tags como estas. É assim que quem domina a matéria encontra a sua pergunta.',
  },
  {
    target: 'post-card',
    icon: 'bi-chat-left-text',
    title: 'Veja as respostas',
    text: 'Clique em qualquer dúvida para ler as respostas de outros alunos. Lá você também pode responder, curtir e salvar para consultar depois.',
  },
  {
    target: 'post-author',
    icon: 'bi-people',
    title: 'Conheça outros alunos',
    text: 'Clique no nome ou na foto de alguém para abrir o perfil: disciplinas que domina, dúvidas e respostas. Siga quem for útil para você.',
  },
]

const SPOTLIGHT_PADDING = 6
const POPOVER_WIDTH = 360
const GAP = 14
const MARGIN = 12

function findTarget(name) {
  if (!name) return null
  const element = document.querySelector(`[data-tour="${name}"]`)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 ? element : null
}

function sameRect(a, b) {
  if (!a || !b) return a === b
  return (
    a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height
  )
}

// Escolhe o lado do destaque com espaço para o balão: direita, abaixo ou acima.
function placePopover(rect, popoverHeight) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(POPOVER_WIDTH, vw - MARGIN * 2)
  const clampLeft = (left) => Math.max(MARGIN, Math.min(left, vw - width - MARGIN))
  const clampTop = (top) => Math.max(MARGIN, Math.min(top, vh - popoverHeight - MARGIN))

  if (rect.right + GAP + width + MARGIN <= vw) {
    return { width, left: rect.right + GAP, top: clampTop(rect.top) }
  }
  if (rect.bottom + GAP + popoverHeight + MARGIN <= vh) {
    return { width, left: clampLeft(rect.left), top: rect.bottom + GAP }
  }
  if (rect.top - GAP - popoverHeight - MARGIN >= 0) {
    return { width, left: clampLeft(rect.left), top: rect.top - GAP - popoverHeight }
  }
  return { width, left: clampLeft(rect.left), top: clampTop(vh - popoverHeight - MARGIN) }
}

// Tour exibido uma única vez, logo depois do onboarding, destacando na tela
// os botões de verdade.
function FirstAccessTutorial({ userId }) {
  const [isOpen, setIsOpen] = useState(() => isTutorialPending(userId))
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [popoverHeight, setPopoverHeight] = useState(220)
  const popoverRef = useRef(null)
  const primaryButtonRef = useRef(null)

  const step = steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  function close() {
    markTutorialDone(userId)
    setIsOpen(false)
  }

  // Bloqueia a rolagem e fecha com Esc.
  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        markTutorialDone(userId)
        setIsOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, userId])

  // Traz o alvo para a tela e acompanha sua posição (o feed carrega depois,
  // e a janela pode ser redimensionada).
  useEffect(() => {
    if (!isOpen) return undefined
    const targetName = step.target

    findTarget(targetName)?.scrollIntoView({ block: 'center', behavior: 'instant' })

    function measure() {
      const element = findTarget(targetName)
      const next = element ? element.getBoundingClientRect() : null
      const snapshot = next
        ? { top: next.top, left: next.left, width: next.width, height: next.height }
        : null
      setTargetRect((current) => (sameRect(current, snapshot) ? current : snapshot))
    }

    const interval = setInterval(measure, 200)
    const first = setTimeout(measure, 0)
    window.addEventListener('resize', measure)
    return () => {
      clearInterval(interval)
      clearTimeout(first)
      window.removeEventListener('resize', measure)
    }
  }, [isOpen, step.target])

  // Mede o balão para posicioná-lo sem sair da tela.
  useEffect(() => {
    if (!isOpen) return
    const height = popoverRef.current?.offsetHeight
    if (height) setPopoverHeight((current) => (current === height ? current : height))
  }, [isOpen, stepIndex, targetRect])

  useEffect(() => {
    if (isOpen) primaryButtonRef.current?.focus()
  }, [isOpen, stepIndex])

  if (!isOpen) return null

  const hasTarget = step.target && targetRect
  const spot = hasTarget
    ? {
        top: targetRect.top - SPOTLIGHT_PADDING,
        left: targetRect.left - SPOTLIGHT_PADDING,
        width: targetRect.width + SPOTLIGHT_PADDING * 2,
        height: targetRect.height + SPOTLIGHT_PADDING * 2,
      }
    : null
  const placement = spot
    ? placePopover(
        {
          top: spot.top,
          left: spot.left,
          right: spot.left + spot.width,
          bottom: spot.top + spot.height,
        },
        popoverHeight,
      )
    : null

  return (
    <div className="fixed inset-0 z-50">
      {/* Camada que bloqueia cliques no resto da tela durante o tour. */}
      <div className="absolute inset-0" aria-hidden="true" />
      {spot ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl ring-2 ring-companion-orange transition-all duration-200"
          style={{
            ...spot,
            boxShadow: '0 0 0 9999px rgba(33, 23, 15, 0.6)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#21170f]/60" aria-hidden="true" />
      )}

      <section
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-access-title"
        className={`absolute rounded-3xl border border-companion-border/70 bg-companion-surface p-6 shadow-[0_24px_80px_rgba(33,23,15,0.28)] ${
          placement ? '' : 'left-1/2 top-1/2 w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2'
        }`}
        style={placement ?? undefined}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-companion-muted">
          Passo {stepIndex + 1} de {steps.length}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-companion-orange/10 text-xl text-companion-orange"
          >
            <i className={`bi ${step.icon}`} />
          </span>
          <h2 id="first-access-title" className="text-lg font-bold text-companion-text">
            {step.title}
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-companion-muted">{step.text}</p>

        <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 rounded-full transition-all ${
                index === stepIndex
                  ? 'w-6 bg-companion-orange'
                  : 'w-1.5 bg-companion-border'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={close}
            className="text-sm font-bold text-companion-muted transition hover:text-companion-text"
          >
            {isLast ? 'Fechar' : 'Pular tour'}
          </button>
          <div className="flex gap-3">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((index) => index - 1)}
                className="rounded-xl border border-companion-border bg-companion-panel px-4 py-2.5 text-sm font-bold text-companion-text transition hover:bg-companion-orange/5"
              >
                Voltar
              </button>
            )}
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={isLast ? close : () => setStepIndex((index) => index + 1)}
              className="rounded-xl bg-companion-orange px-4 py-2.5 text-sm font-bold text-white transition hover:bg-companion-orange-hover"
            >
              {isLast ? 'Começar' : 'Próximo'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FirstAccessTutorial
