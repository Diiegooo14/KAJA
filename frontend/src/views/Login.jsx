import { useState } from 'react'
import { Eye, EyeOff, ShoppingCart, BarChart3, Package } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white/70" />
      </div>
      <span className="text-sm text-white/60">{text}</span>
    </div>
  )
}

function InputField({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, extra }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 text-gray-900 placeholder-gray-400
            focus:outline-none focus:bg-white focus:ring-2 transition
            ${error
              ? 'border-rose-400 focus:ring-rose-100 focus:border-rose-400'
              : 'border-gray-200 focus:ring-kaja-orange/20 focus:border-kaja-orange/50'
            }`}
        />
        {extra}
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

export default function Login({ onLogin, onRegistro }) {
  const [nif, setNif]               = useState('')
  const [password, setPassword]     = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [camposError, setCamposError] = useState({})
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  function limpiarCampo(campo) {
    setCamposError(prev => ({ ...prev, [campo]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errores = {}
    if (!nif.trim())  errores.nif      = 'El NIF es obligatorio.'
    if (!password)    errores.password = 'La contraseña es obligatoria.'
    if (Object.keys(errores).length) { setCamposError(errores); return }
    setCamposError({})

    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nif: nif.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al iniciar sesión'); return }

      const user = { nombre: data.nombre, rol: data.rol, imagen_perfil: data.imagen_perfil ?? null }
      localStorage.setItem('kaja_token', data.token)
      localStorage.setItem('kaja_user', JSON.stringify(user))
      if (onLogin) onLogin(user)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ─── Panel izquierdo (branding) ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-kaja-sidebar flex-col justify-between p-12 relative overflow-hidden">

        {/* Círculos decorativos */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-8 w-48 h-48 rounded-full bg-kaja-orange/10" />

        {/* Logo */}
        <div className="relative z-10">
          <img
            src="/img/kaja-transparente.png"
            alt="KAJA"
            className="h-12 object-contain brightness-0 invert"
          />
        </div>

        {/* Contenido central */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Tu punto de venta,<br />
              <span className="text-kaja-orange">inteligente</span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Gestiona ventas, inventario y finanzas de tu negocio desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Feature icon={ShoppingCart} text="Punto de venta rápido e intuitivo" />
            <Feature icon={Package}      text="Control de inventario en tiempo real" />
            <Feature icon={BarChart3}    text="Análisis financiero detallado" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs">© 2026 Sistema KAJA. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* ─── Panel derecho (formulario) ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">

        {/* Logo móvil */}
        <div className="lg:hidden mb-10">
          <img src="/img/kaja-transparente.png" alt="KAJA" className="h-10 object-contain" />
        </div>

        <div className="w-full max-w-sm">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-kaja-blueText mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-400">Introduce tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            <InputField
              id="nif"
              label="NIF"
              value={nif}
              onChange={e => { setNif(e.target.value); limpiarCampo('nif') }}
              error={camposError.nif}
              placeholder="12345678A"
              autoComplete="username"
            />

            <InputField
              id="password"
              label="Contraseña"
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); limpiarCampo('password') }}
              error={camposError.password}
              placeholder="••••••••"
              autoComplete="current-password"
              extra={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setVerPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {error && (
              <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-kaja-orange text-white font-semibold rounded-xl
                hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Accediendo...</>
                : 'Entrar'
              }
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400 mb-2">¿Aún no tienes cuenta?</p>
            <button
              type="button"
              onClick={onRegistro}
              className="text-sm font-semibold text-kaja-orange hover:underline underline-offset-2 transition"
            >
              Darse de alta en el sistema KAJA
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
