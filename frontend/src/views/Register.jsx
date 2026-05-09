import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const campoVacio = () => ({
    empresaNif: '', razonSocial: '', nombreComercial: '',
    direccion: '', telefono: '', empresaEmail: '',
    adminNif: '', adminNombre: '', adminPassword: '', adminPasswordConfirm: '',
})

function SelectorImagen({ label, preview, onSeleccionar, error }) {
    const inputRef = useRef(null)

    return (
        <div className="flex items-center gap-3 mb-5">
            <div
                className={`w-16 h-16 rounded-full overflow-hidden border-2 bg-gray-50 shrink-0 cursor-pointer hover:border-kaja-orange transition
                    ${error ? 'border-red-400' : 'border-gray-200'}`}
                onClick={() => inputRef.current.click()}
            >
                {preview
                    ? <img src={preview} alt={label} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Camera className={`w-5 h-5 ${error ? 'text-red-300' : 'text-gray-300'}`} />
                      </div>
                }
            </div>
            <div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={onSeleccionar}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => inputRef.current.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg
                               text-xs text-gray-600 hover:bg-gray-50 transition"
                >
                    <Camera className="w-3.5 h-3.5" />
                    {label}
                </button>
                <p className="text-xs text-gray-400 mt-0.5">Opcional · JPG, PNG, GIF o WEBP · Máx. 5MB</p>
                {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
            </div>
        </div>
    )
}

export default function Register({ onVolver }) {
    const [form, setForm] = useState(campoVacio)
    const [errores, setErrores] = useState({})
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)
    const [loading, setLoading] = useState(false)

    const [logoEmpresa, setLogoEmpresa] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const [errorLogo, setErrorLogo] = useState('')
    const [fotoAdmin, setFotoAdmin] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [errorFoto, setErrorFoto] = useState('')

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        setErrores(prev => ({ ...prev, [name]: '' }))
    }

    function seleccionarLogo(e) {
        const file = e.target.files[0]
        if (!file) return
        if (!TIPOS_VALIDOS.includes(file.type)) {
            setErrorLogo('Solo se permiten imágenes JPG, PNG, GIF o WEBP')
            e.target.value = ''
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorLogo('La imagen no puede superar 5MB')
            e.target.value = ''
            return
        }
        setErrorLogo('')
        setLogoEmpresa(file)
        setLogoPreview(URL.createObjectURL(file))
        e.target.value = ''
    }

    function seleccionarFoto(e) {
        const file = e.target.files[0]
        if (!file) return
        if (!TIPOS_VALIDOS.includes(file.type)) {
            setErrorFoto('Solo se permiten imágenes JPG, PNG, GIF o WEBP')
            e.target.value = ''
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorFoto('La imagen no puede superar 5MB')
            e.target.value = ''
            return
        }
        setErrorFoto('')
        setFotoAdmin(file)
        setFotoPreview(URL.createObjectURL(file))
        e.target.value = ''
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const fd = new FormData()
            Object.entries(form).forEach(([k, v]) => fd.append(k, v))
            if (logoEmpresa) fd.append('logoEmpresa', logoEmpresa)
            if (fotoAdmin)   fd.append('fotoAdmin', fotoAdmin)

            const res = await fetch(`${API_URL}/registro`, {
                method: 'POST',
                body: fd,
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
        <div className="h-screen flex flex-col items-center justify-center bg-kaja-light px-6 gap-4">

            <img src="/img/kaja-transparente.png" alt="Logo KAJA" className="h-14 object-contain" />

            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl px-10 py-8">
                <h2 className="text-xl font-semibold text-kaja-blueText mb-1">Alta en el sistema KAJA</h2>
                <p className="text-sm text-gray-500 mb-6">Introduce los datos de tu empresa y del administrador principal.</p>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-2 gap-x-10">

                        {/* Columna izquierda — Empresa */}
                        <div>
                            <p className="text-xs font-semibold text-kaja-orange uppercase tracking-wide mb-4">Datos de la empresa</p>

                            <SelectorImagen
                                label="Subir logo de la empresa"
                                preview={logoPreview}
                                onSeleccionar={seleccionarLogo}
                                error={errorLogo}
                            />

                            <div className="flex flex-col gap-3">
                                <Campo label="NIF de la empresa *" name="empresaNif" value={form.empresaNif} onChange={handleChange} placeholder="B12345678" error={errores.empresaNif} />
                                <Campo label="Razón Social *" name="razonSocial" value={form.razonSocial} onChange={handleChange} placeholder="Empresa S.L." error={errores.razonSocial} />
                                <Campo label="Nombre Comercial *" name="nombreComercial" value={form.nombreComercial} onChange={handleChange} placeholder="Mi Tienda" error={errores.nombreComercial} />
                                <Campo label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle Mayor 1" error={errores.direccion} />
                                <Campo label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="600 000 000" error={errores.telefono} />
                                <Campo label="Email de la empresa" name="empresaEmail" type="email" value={form.empresaEmail} onChange={handleChange} placeholder="contacto@empresa.es" error={errores.empresaEmail} />
                            </div>
                        </div>

                        {/* Columna derecha — Administrador */}
                        <div className="flex flex-col">
                            <p className="text-xs font-semibold text-kaja-orange uppercase tracking-wide mb-4">Datos del administrador</p>

                            <SelectorImagen
                                label="Subir foto de perfil"
                                preview={fotoPreview}
                                onSeleccionar={seleccionarFoto}
                                error={errorFoto}
                            />

                            <div className="flex flex-col gap-3">
                                <Campo label="NIF del administrador *" name="adminNif" value={form.adminNif} onChange={handleChange} placeholder="12345678A" error={errores.adminNif} />
                                <Campo label="Nombre completo *" name="adminNombre" value={form.adminNombre} onChange={handleChange} placeholder="Ana García" error={errores.adminNombre} />
                                <Campo label="Contraseña *" name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} placeholder="Mínimo 8 caracteres" error={errores.adminPassword} autoComplete="new-password" />
                                <Campo label="Confirmar contraseña *" name="adminPasswordConfirm" type="password" value={form.adminPasswordConfirm} onChange={handleChange} placeholder="Repite la contraseña" error={errores.adminPasswordConfirm} autoComplete="new-password" />
                            </div>

                            <div className="mt-auto pt-6">
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
                            </div>
                        </div>

                    </div>
                </form>
            </div>

            <p className="text-xs text-kaja-light opacity-60">Sistema KAJA</p>
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
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition
                    ${error
                        ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
                        : 'border-gray-300 focus:ring-kaja-light focus:border-kaja-blueText'}`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}
