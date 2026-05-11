import { useEffect, useRef, useState } from 'react'
import { Camera, Pencil, UserX, Loader2, X, Plus } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL
const DEFAULT_AVATAR = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778341124/basica_usuario_qvq2fm.png'

const FORM_VACIO = { nombre: '', nif: '', password: '', rol: 'Empleado' }

function headers() {
    return {
        Authorization: `Bearer ${localStorage.getItem('kaja_token')}`,
        'Content-Type': 'application/json',
    }
}

async function fetchJSON(url, opciones = {}) {
    const res = await fetch(url, {
        ...opciones,
        headers: { ...headers(), ...(opciones.headers ?? {}) },
    })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { throw new Error(`Respuesta inesperada del servidor (${res.status})`) }
    if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)
    return data
}

function FotoUsuario({ idUsuario, imagenActual, nombre, onSubida }) {
    const inputRef = useRef(null)
    const [preview, setPreview] = useState(imagenActual || DEFAULT_AVATAR)
    const [subiendo, setSubiendo] = useState(false)
    const [errorFoto, setErrorFoto] = useState('')

    async function handleFile(e) {
        const file = e.target.files[0]
        if (!file) return
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            setErrorFoto('Solo JPG, PNG, GIF o WEBP')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorFoto('Máximo 5MB')
            return
        }
        setErrorFoto('')
        setPreview(URL.createObjectURL(file))
        setSubiendo(true)
        const fd = new FormData()
        fd.append('imagen', file)
        try {
            const res = await fetch(`${API_URL}/usuarios?id=${idUsuario}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
                body: fd,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al subir')
            onSubida(data.url)
        } catch (err) {
            setErrorFoto(err.message)
            setPreview(imagenActual || DEFAULT_AVATAR)
        } finally {
            setSubiendo(false)
            e.target.value = ''
        }
    }

    return (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100">
                    <img
                        src={preview}
                        alt={nombre}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = DEFAULT_AVATAR }}
                    />
                </div>
                {subiendo && (
                    <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                )}
            </div>
            <div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFile}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => inputRef.current.click()}
                    disabled={subiendo}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg
                               text-xs text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                >
                    <Camera className="w-3.5 h-3.5" />
                    Cambiar foto
                </button>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF o WEBP · Máx. 5MB</p>
                {errorFoto && <p className="text-xs text-red-500 mt-0.5">{errorFoto}</p>}
            </div>
        </div>
    )
}

export default function Usuarios({ usuario }) {
    const [usuarios, setUsuarios] = useState([])
    const [resumen, setResumen] = useState({ total: 0, activos: 0, inactivos: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [form, setForm] = useState(FORM_VACIO)
    const [editando, setEditando] = useState(null)
    const [formError, setFormError] = useState('')
    const [guardando, setGuardando] = useState(false)

    const [procesando, setProcesando] = useState(null)
    const [toast, setToast] = useState('')
    const [mostrarForm, setMostrarForm] = useState(false)

    function mostrarToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(''), 3000)
    }

    useEffect(() => { cargar() }, [])

    async function cargar() {
        setLoading(true)
        setError('')
        try {
            const data = await fetchJSON(`${API_URL}/usuarios`)
            setUsuarios(data.usuarios ?? [])
            setResumen(data.resumen ?? { total: 0, activos: 0, inactivos: 0 })
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        setFormError('')
    }

    function iniciarEdicion(u) {
        setEditando(u)
        setForm({ nombre: u.nombre, nif: u.nif, password: '', rol: u.rol })
        setFormError('')
    }

    function cancelarEdicion() {
        setEditando(null)
        setForm(FORM_VACIO)
        setFormError('')
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.nombre.trim()) return setFormError('El nombre es obligatorio.')
        if (!editando && !form.nif.trim()) return setFormError('El NIF es obligatorio.')
        if (!editando && form.password.length < 8) return setFormError('La contraseña debe tener al menos 8 caracteres.')
        if (editando && form.password && form.password.length < 8) return setFormError('La contraseña debe tener al menos 8 caracteres.')

        setGuardando(true)
        setFormError('')
        try {
            if (editando) {
                const body = { nombre: form.nombre.trim(), rol: form.rol }
                if (form.password) body.password = form.password
                await fetchJSON(`${API_URL}/usuarios?id=${editando.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                })
                mostrarToast('Usuario actualizado correctamente')
                cancelarEdicion()
            } else {
                await fetchJSON(`${API_URL}/usuarios`, {
                    method: 'POST',
                    body: JSON.stringify({
                        nif: form.nif.trim(),
                        nombre: form.nombre.trim(),
                        password: form.password,
                        rol: form.rol,
                    }),
                })
                setForm(FORM_VACIO)
                mostrarToast('Usuario creado correctamente')
            }
            await cargar()
        } catch (e) {
            setFormError(e.message)
        } finally {
            setGuardando(false)
        }
    }

    async function handleDesactivar(u) {
        setProcesando(u.id)
        try {
            await fetchJSON(`${API_URL}/usuarios?id=${u.id}`, { method: 'DELETE' })
            mostrarToast(`${u.nombre} desactivado`)
            if (editando?.id === u.id) cancelarEdicion()
            await cargar()
        } catch (e) {
            mostrarToast('Error: ' + e.message)
        } finally {
            setProcesando(null)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-kaja-blueText text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
                    {toast}
                </div>
            )}

            <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center bg-white">
                <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-kaja-orange mb-0.5">Administración</p>
                    <h1 className="text-xl font-bold text-kaja-blueText">Gestión de Usuarios</h1>
                </div>
                <button
                    onClick={() => setMostrarForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-kaja-orange text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition shrink-0"
                >
                    {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {mostrarForm ? 'Cerrar' : editando ? 'Editar usuario' : 'Nuevo usuario'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">

                {/* Panel izquierdo — formulario */}
                <div className={"w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col bg-white" + (mostrarForm ? "" : " hidden")}>
                    <div className="p-5">
                        <h2 className="text-m font-bold text-kaja-blueText mb-4">
                            {editando ? 'Editar Usuario' : 'Nuevo Empleado'}
                        </h2>

                        {editando && (
                            <FotoUsuario
                                idUsuario={editando.id}
                                imagenActual={editando.imagen_perfil}
                                nombre={editando.nombre}
                                onSubida={url => {
                                    setEditando(prev => ({ ...prev, imagen_perfil: url }))
                                    setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, imagen_perfil: url } : u))
                                    mostrarToast('Foto actualizada correctamente')
                                }}
                            />
                        )}

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Nombre completo <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Ana García"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                text-kaja-blueText transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    NIF {!editando && <span className="text-red-400">*</span>}
                                </label>
                                <input
                                    type="text"
                                    name="nif"
                                    value={form.nif}
                                    onChange={handleChange}
                                    disabled={!!editando}
                                    placeholder="Ej: 12345678A"
                                    className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm transition
                                        ${editando
                                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : 'focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange text-kaja-blueText'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    {editando
                                        ? 'Nueva contraseña (vacío para no cambiar)'
                                        : <> Contraseña <span className="text-red-400">*</span></>}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Rol <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="rol"
                                    value={form.rol}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                text-kaja-blueText transition"
                                >
                                    <option value="Empleado">Empleado</option>
                                    <option value="Administrador">Administrador</option>
                                </select>
                            </div>

                            {formError && (
                                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={guardando}
                                className="w-full py-2.5 bg-kaja-orange text-white font-bold rounded-xl
                                            hover:brightness-90 active:scale-95 transition
                                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {guardando
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                                    : editando ? 'Guardar Cambios' : 'Crear Usuario'}
                            </button>

                            {editando && (
                                <button
                                    type="button"
                                    onClick={cancelarEdicion}
                                    className="w-full py-2.5 border border-gray-200 text-kaja-blueText font-medium rounded-xl
                                                hover:bg-gray-50 active:scale-95 transition flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Cancelar
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Panel derecho — resumen + tabla */}
                <div className="flex-1 flex flex-col overflow-hidden bg-kaja-light min-h-0">

                    <div className="shrink-0 px-4 sm:px-6 py-4 grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-linear-to-br from-kaja-sidebar to-slate-700 rounded-2xl px-5 py-4 shadow-sm">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">Total usuarios</p>
                            <p className="text-2xl font-bold text-white">{resumen.total}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Activos</p>
                            <p className="text-2xl font-bold text-emerald-600">{resumen.activos}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Inactivos</p>
                            <p className="text-2xl font-bold text-kaja-orange">{resumen.inactivos}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto mx-4 sm:mx-6 mb-4 sm:mb-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="grid grid-cols-[1fr_130px_130px_100px_140px_88px] border-b border-gray-100 min-w-195">
                            <div className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Nombre</div>
                            <div className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">NIF</div>
                            <div className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Rol</div>
                            <div className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Estado</div>
                            <div className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Alta</div>
                            <div className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Acc.</div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin text-kaja-orange" />
                                <span className="text-sm">Cargando usuarios…</span>
                            </div>
                        ) : error ? (
                            <div className="px-5 py-4 text-sm text-red-600 bg-red-50">{error}</div>
                        ) : usuarios.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 text-sm">Sin usuarios registrados</div>
                        ) : (
                            usuarios.map((u, i) => (
                                <div
                                    key={u.id}
                                    className={`grid grid-cols-[1fr_130px_130px_100px_140px_88px] items-center min-w-195
                                        text-sm border-b border-gray-50 hover:bg-gray-50 transition
                                        ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                >
                                    <div className="px-5 py-3 font-medium text-kaja-blueText flex items-center gap-2 min-w-0">
                                        <img
                                            src={u.imagen_perfil || DEFAULT_AVATAR}
                                            alt={u.nombre}
                                            className="w-7 h-7 rounded-full object-cover shrink-0"
                                            onError={e => { e.target.src = DEFAULT_AVATAR }}
                                        />
                                        {u.nombre}
                                    </div>
                                    <div className="px-3 py-3 text-gray-500 font-mono text-xs">{u.nif}</div>
                                    <div className="px-3 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            ${u.rol === 'Administrador'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-orange-100 text-kaja-orange'}`}>
                                            {u.rol}
                                        </span>
                                    </div>
                                    <div className="px-3 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            ${u.estado === 'Activo'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-600'}`}>
                                            {u.estado}
                                        </span>
                                    </div>
                                    <div className="px-3 py-3 text-gray-500 text-xs">
                                        {new Date(u.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="px-3 py-3 flex justify-center gap-1">
                                        <button
                                            onClick={() => iniciarEdicion(u)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-kaja-blueText hover:bg-gray-100 transition"
                                            title="Editar usuario"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {u.estado === 'Activo' && u.id !== usuario?.id && (
                                            <button
                                                onClick={() => handleDesactivar(u)}
                                                disabled={procesando === u.id}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition
                                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Desactivar usuario"
                                            >
                                                {procesando === u.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <UserX className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
