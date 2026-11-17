import api from '../api/api.js'

// Tickets de suporte. Cada item: { id, author, subject, message,
// status: 'OPEN' | 'ANSWERED' | 'CLOSED', response, respondedBy, createdAt,
// respondedAt, closedAt }.

// Limites iguais aos do backend (TicketCreateRequestDTO e TicketReplyRequestDTO).
export const TICKET_SUBJECT_MAX_LENGTH = 120
export const TICKET_MESSAGE_MAX_LENGTH = 2000
export const TICKET_RESPONSE_MAX_LENGTH = 2000

export const TICKET_STATUS_LABELS = {
  OPEN: 'Aguardando resposta',
  ANSWERED: 'Respondido',
  CLOSED: 'Encerrado',
}

export async function createTicket({ subject, message }) {
  const response = await api.post('/tickets', { subject, message })
  return response.data
}

// Tickets da própria conta, do mais novo para o mais antigo.
export async function getMyTickets({ page = 0, size = 5 } = {}) {
  const response = await api.get('/tickets/mine', { params: { page, size } })
  return response.data
}

// Fila da administração (só ADMIN), do mais antigo para o mais novo.
export async function getAdminTickets({ status = 'OPEN', page = 0, size = 10 } = {}) {
  const response = await api.get('/admin/tickets', { params: { status, page, size } })
  return response.data
}

export async function replyTicket(ticketId, responseText) {
  const response = await api.post(`/admin/tickets/${ticketId}/reply`, { response: responseText })
  return response.data
}

export async function closeTicket(ticketId) {
  const response = await api.post(`/admin/tickets/${ticketId}/close`)
  return response.data
}
