import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function Login({ onLogin, onRegistro }) {
    const [nif, setNif] = useState('')
    const [password, setPassword] = useState('')
    const [camposError, setCamposError] = useState({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        const errores = {}
        if (!nif.trim()) errores.nif = 'El NIF es obligatorio.'
        if (!password) errores.password = 'La contraseña es obligatoria.'

        if (Object.keys(errores).length > 0) {
            setCamposError(errores)
            return
        }
        setCamposError({})

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
        <div className="min-h-screen flex items-center justify-center bg-kaja-light px-4">
            <div className="w-full max-w-sm">

                <div className="text-center mb-1">
                    <img src="/img/kaja-transparente.png" alt="Logo KAJA" />
                    <p className="text-kaja-light text-sm mt-3">Sistema de Punto de Venta</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-xl font-semibold text-kaja-blueText mb-6">Iniciar sesión</h2>

                    <form onSubmit={handleSubmit} noValidate>

                        <div className="mb-4">
                            <label htmlFor="nif" className="block text-sm font-medium text-gray-700 mb-1">
                                NIF
                            </label>
                            <input
                                id="nif"
                                type="text"
                                value={nif}
                                onChange={e => { setNif(e.target.value); setCamposError(prev => ({ ...prev, nif: '' })) }}
                                placeholder="12345678A"
                                autoComplete="username"
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition
                                    ${camposError.nif
                                        ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
                                        : 'border-gray-300 focus:ring-kaja-light focus:border-kaja-blueText'}`}
                            />
                            {camposError.nif && <p className="mt-1 text-xs text-red-500">{camposError.nif}</p>}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setCamposError(prev => ({ ...prev, password: '' })) }}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition
                                    ${camposError.password
                                        ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
                                        : 'border-gray-300 focus:ring-kaja-light focus:border-kaja-blueText'}`}
                            />
                            {camposError.password && <p className="mt-1 text-xs text-red-500">{camposError.password}</p>}
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
                        hover:opacity-90 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Accediendo...' : 'Entrar'}
                        </button>

                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 mb-1">¿Aún no tienes cuenta?</p>
                        <button
                            type="button"
                            onClick={onRegistro}
                            className="text-sm font-semibold text-kaja-orange hover:underline"
                        >
                            Darse de alta en el sistema KAJA
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-kaja-light mt-6 opacity-60">
                    Sistema KAJA
                </p>
            </div>
        </div>
    )
}
