// Tela inicial de cada perfil depois do login: administração cai no painel
// Admin; estudantes (e moderação) caem no feed.
export function homePathFor(role) {
  return role === 'ADMIN' ? '/admin' : '/feed'
}
