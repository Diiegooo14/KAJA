import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

const campoVacio = () => ({
    empresaNif: '', razonSocial: '', nombreComercial: '',
    direccion: '', telefono: '', empresaEmail: '',
    adminNif: '', adminNombre: '', adminPassword: '', adminPasswordConfirm: '',
})

export default function Register({ onVolver }) {
    const [form, setForm] = useState(campoVacio)
    const [errores, setErrores] = useState({})
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)
    const [loading, setLoading] = useState(false)

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        setErrores(prev => ({ ...prev, [name]: '' }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const data = await res.json()

            if (res.status === 422) {
                setErrores(data.errores ?? {})
                return
            }

            if (!res.ok) {
                setError(data.error ?? 'Error al registrar la empresa')
                return
            }

            setExito(true)

        } catch {
            setError('No se pudo conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    if (exito) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kaja-light px-4">
                <div className="w-full max-w-sm text-center">
                    <div className="text-center mb-1">
                        <img src="/img/kaja-transparente.png" alt="Logo KAJA" />
                    </div>
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="mb-4 text-green-600">
                            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-xl font-semibold text-kaja-blueText mb-2">¡Alta completada!</h2>
                            <p className="text-sm text-gray-600">
                                Tu empresa ha sido registrada correctamente en el sistema KAJA.
                                Ya puedes iniciar sesión con las credenciales del administrador.
                            </p>
                        </div>
                        <button
                            onClick={onVolver}
                            className="w-full py-2.5 bg-kaja-orange text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition"
                        >
                            Ir al inicio de sesión
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-kaja-light px-4 py-10">
            <div className="w-full max-w-lg">

                <div className="text-center mb-1">
                    <img src="/img/kaja-transparente.png" alt="Logo KAJA" />
                    <p className="text-kaja-light text-sm mt-3">Sistema de Punto de Venta</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-xl font-semibold text-kaja-blueText mb-1">Alta en el sistema KAJA</h2>
                    <p className="text-sm text-gray-500 mb-6">Introduce los datos de tu empresa y del administrador principal.</p>

                    <form onSubmit={handleSubmit} noValidate>

                        {/* Sección empresa */}
                        <p className="text-xs font-semibold text-kaja-orange uppercase tracking-wide mb-3">Datos de la empresa</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <Campo label="NIF de la empresa *" name="empresaNif" value={form.empresaNif} onChange={handleChange} placeholder="B12345678" error={errores.empresaNif} />
                            <Campo label="Razón Social *" name="razonSocial" value={form.razonSocial} onChange={handleChange} placeholder="Empresa S.L." error={errores.razonSocial} />
                            <Campo label="Nombre Comercial *" name="nombreComercial" value={form.nombreComercial} onChange={handleChange} placeholder="Mi Tienda" error={errores.nombreComercial} />
                            <Campo label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle Mayor 1" error={errores.direccion} />
                            <Campo label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="600 000 000" error={errores.telefono} />
                            <Campo label="Email de la empresa" name="empresaEmail" type="email" value={form.empresaEmail} onChange={handleChange} placeholder="contacto@empresa.es" error={errores.empresaEmail} />
                        </div>

                        {/* Sección administrador */}
                        <p className="text-xs font-semibold text-kaja-orange uppercase tracking-wide mb-3 mt-2">Datos del administrador</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <Campo label="NIF del administrador *" name="adminNif" value={form.adminNif} onChange={handleChange} placeholder="12345678A" error={errores.adminNif} />
                            <Campo label="Nombre completo *" name="adminNombre" value={form.adminNombre} onChange={handleChange} placeholder="Ana García" error={errores.adminNombre} />
                            <Campo label="Contraseña *" name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} placeholder="Mínimo 8 caracteres" error={errores.adminPassword} autoComplete="new-password" />
                            <Campo label="Confirmar contraseña *" name="adminPasswordConfirm" type="password" value={form.adminPasswordConfirm} onChange={handleChange} placeholder="Repite la contraseña" error={errores.adminPasswordConfirm} autoComplete="new-password" />
                        </div>

                        {error && (
                            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-kaja-orange text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed mb-3"
                        >
                            {loading ? 'Registrando...' : 'Crear cuenta'}
                        </button>

                        <button
                            type="button"
                            onClick={onVolver}
                            className="w-full py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 active:scale-95 transition"
                        >
                            Volver al inicio de sesión
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

function Campo({ label, name, value, onChange, placeholder, error, type = 'text', autoComplete }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition
                    ${error
                        ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
                        : 'border-gray-300 focus:ring-kaja-light focus:border-kaja-blueText'}`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}
