import api from '../api/api.js'

// Exportações em CSV da administração (só ADMIN). O arquivo vem como Blob e é
// baixado pelo navegador; precisa passar pelo axios para enviar o token.
async function downloadCsv(path, params, fileName) {
  const response = await api.get(path, { params, responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportUsersCsv() {
  return downloadCsv('/admin/export/users.csv', undefined, 'usuarios')
}

// status opcional: 'PENDING' | 'RESOLVED' | 'DISMISSED'. Sem ele, exporta todas.
export function exportReportsCsv(status) {
  return downloadCsv('/admin/export/reports.csv', { status }, 'denuncias')
}
