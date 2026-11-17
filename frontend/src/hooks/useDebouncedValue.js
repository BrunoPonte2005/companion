import { useEffect, useState } from 'react'

// Devolve o valor só depois de parar de mudar por "delay" ms (busca sem chamar
// a API a cada tecla).
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
