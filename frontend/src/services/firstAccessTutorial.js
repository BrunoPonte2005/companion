// Controle de exibição do tutorial de primeiro acesso (por usuário, no navegador).
const STORAGE_PREFIX = 'companion:tutorial:'

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`
}

// Chamado ao concluir o onboarding: marca que o tutorial deve aparecer no
// primeiro acesso ao feed.
export function markTutorialPending(userId) {
  if (userId == null) return
  try {
    localStorage.setItem(storageKey(userId), 'pending')
  } catch {
    // Sem armazenamento disponível, o tutorial simplesmente não aparece.
  }
}

export function isTutorialPending(userId) {
  if (userId == null) return false
  try {
    return localStorage.getItem(storageKey(userId)) === 'pending'
  } catch {
    return false
  }
}

export function markTutorialDone(userId) {
  try {
    localStorage.setItem(storageKey(userId), 'done')
  } catch {
    // Ignora: pior caso, o tutorial reaparece no próximo acesso.
  }
}
