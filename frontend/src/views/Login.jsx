import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function Login({ onLogin }) {
  const [nif, setNif] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!nif.trim() || !password) {
      setError('El NIF y la contraseña son obligatorios')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nif: nif.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }

      localStorage.setItem('kaja_token', data.token)
      localStorage.setItem('kaja_user', JSON.stringify({ nombre: data.nombre, rol: data.rol }))

      if (onLogin) onLogin({ nombre: data.nombre, rol: data.rol })

    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kaja-blue px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-1">
          <img src="/img/Kaja-blanco.png" alt="Logo KAJA" />
          <p className="text-kaja-light text-sm mt-3">Sistema de Punto de Venta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-kaja-blue mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} noValidate>

            <div className="mb-4">
              <label htmlFor="nif" className="block text-sm font-medium text-gray-700 mb-1">
                NIF
              </label>
              <input
                id="nif"
                type="text"
                value={nif}
                onChange={e => setNif(e.target.value)}
                placeholder="12345678A"
                autoComplete="username"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-kaja-blue
                          transition"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-kaja-blue
                          transition"
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-kaja-orange text-white font-semibold rounded-lg
                        hover:bg-[#b8660a] active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Accediendo...' : 'Entrar'}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-kaja-light mt-6 opacity-60">
          Sistema KAJA
        </p>
      </div>
    </div>
  )
}
