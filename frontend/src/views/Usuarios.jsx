import { useEffect, useRef, useState } from 'react'
import { Camera, Pencil, Loader2, X, Plus } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL
const DEFAULT_AVATAR = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778341124/basica_usuario_qvq2fm.png'

const FORM_VACIO = { nombre: '', nif: '', password: '', rol: 'Empleado', estado: '' }

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
                        width="56"
                        height="56"
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

export default function Usuarios({ usuario, onActualizarUsuario }) {
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
    const [usuarioVisor, setUsuarioVisor] = useState(null)

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
        setForm({ nombre: u.nombre, nif: u.nif, password: '', rol: u.rol, estado: u.estado })
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
                if (form.estado !== editando.estado) body.estado = form.estado
                await fetchJSON(`${API_URL}/usuarios?id=${editando.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                })
                if (editando.id === usuario.id) {
                    onActualizarUsuario({ ...usuario, nombre: form.nombre.trim(), rol: form.rol })
                }
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
                    onClick={() => setMostrarForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-kaja-orange text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo usuario
                </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">

                {/* Panel izquierdo — formulario */}
                <div className={"w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col bg-white" + (mostrarForm ? "" : " hidden")}>
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-m font-bold text-kaja-blueText">Nuevo Empleado</h2>
                            <button
                                type="button"
                                onClick={() => setMostrarForm(false)}
                                aria-label="Cerrar panel"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-kaja-sidebar hover:bg-gray-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

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
                                    maxLength={30}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                text-kaja-blueText transition"
                                />
                                {form.nombre.length === 30 && (
                                    <p className="text-xs text-amber-500 mt-1">Límite de 30 caracteres alcanzado</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    NIF <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nif"
                                    value={form.nif}
                                    onChange={handleChange}
                                    placeholder="Ej: 12345678A"
                                    maxLength={9}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                text-kaja-blueText transition"
                                />
                                {form.nif.length === 9 && (
                                    <p className="text-xs text-amber-500 mt-1">Límite de 9 caracteres alcanzado</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Contraseña <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                    maxLength={15}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                transition"
                                />
                                {form.password.length === 15 && (
                                    <p className="text-xs text-amber-500 mt-1">Límite de 15 caracteres alcanzado</p>
                                )}
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
                                    : 'Crear Usuario'}
                            </button>
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
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-1">Activos</p>
                            <p className="text-2xl font-bold text-emerald-600">{resumen.activos}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-1">Inactivos</p>
                            <p className="text-2xl font-bold text-kaja-orange">{resumen.inactivos}</p>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 mx-4 sm:mx-6 mb-4 sm:mb-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-auto h-full">
                            <div className="grid grid-cols-[1fr_130px_130px_100px_140px_88px] min-w-195 bg-kaja-sidebar">
                                <div className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Nombre</div>
                                <div className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">NIF</div>
                                <div className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Rol</div>
                                <div className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Estado</div>
                                <div className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Alta</div>
                                <div className="px-3 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-white/60">Acc.</div>
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
                                usuarios.map((u) => (
                                    <div
                                        key={u.id}
                                        onClick={() => setUsuarioVisor(u)}
                                        className="grid grid-cols-[1fr_130px_130px_100px_140px_88px] items-center min-w-195
                                            text-sm border-b border-gray-50 hover:bg-kaja-orange/5 transition cursor-pointer"
                                    >
                                        <div className="px-5 py-3.5 font-medium text-kaja-blueText flex items-center gap-2.5 min-w-0">
                                            <img
                                                src={u.imagen_perfil || DEFAULT_AVATAR}
                                                alt={u.nombre}
                                                width="32"
                                                height="32"
                                                loading="lazy"
                                                className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                                                onError={e => { e.target.src = DEFAULT_AVATAR }}
                                            />
                                            {u.nombre}
                                        </div>
                                        <div className="px-3 py-3.5">
                                            <span className="text-xs font-mono text-kaja-blueText/60 bg-gray-50 px-2 py-1 rounded-md">{u.nif}</span>
                                        </div>
                                        <div className="px-3 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                                ${u.rol === 'Administrador'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-kaja-orange'}`}>
                                                {u.rol}
                                            </span>
                                        </div>
                                        <div className="px-3 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                                ${u.estado === 'Activo'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-600'}`}>
                                                {u.estado}
                                            </span>
                                        </div>
                                        <div className="px-3 py-3.5">
                                            <span className="text-xs font-mono text-kaja-blueText/60">
                                                {new Date(u.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="px-3 py-3.5 flex justify-center gap-1">
                                            <button
                                                onClick={e => { e.stopPropagation(); iniciarEdicion(u) }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-kaja-blueText hover:bg-gray-100 transition"
                                                title="Editar usuario"
                                                aria-label="Editar usuario"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal editar usuario */}
            {editando && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cancelarEdicion} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-kaja-blueText flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-kaja-orange" />
                                Editar usuario
                            </h2>
                            <button onClick={cancelarEdicion}
                                aria-label="Cerrar"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

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
                                    maxLength={30}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                text-kaja-blueText transition"
                                />
                                {form.nombre.length === 30 && (
                                    <p className="text-xs text-amber-500 mt-1">Límite de 30 caracteres alcanzado</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">NIF</label>
                                <input
                                    type="text"
                                    value={editando.nif}
                                    disabled
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Nueva contraseña <span className="text-gray-400 font-normal">(vacío para no cambiar)</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                    maxLength={15}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                />
                                {form.password.length === 15 && (
                                    <p className="text-xs text-amber-500 mt-1">Límite de 15 caracteres alcanzado</p>
                                )}
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
                            {editando.id !== usuario?.id && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                                    <select
                                        name="estado"
                                        value={form.estado}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer
                                                    focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                    text-kaja-blueText transition"
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>
                            )}
                            {formError && (
                                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={cancelarEdicion}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-1 py-2.5 bg-kaja-orange text-white font-bold rounded-xl
                                                hover:brightness-90 active:scale-95 transition
                                                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {guardando
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                                        : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* Modal detalle usuario */}
            {usuarioVisor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUsuarioVisor(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-kaja-blueText">Detalle del usuario</h2>
                            <button onClick={() => setUsuarioVisor(null)}
                                aria-label="Cerrar"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                            <img
                                src={usuarioVisor.imagen_perfil || DEFAULT_AVATAR}
                                alt={usuarioVisor.nombre}
                                width="64"
                                height="64"
                                loading="lazy"
                                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 shadow-sm shrink-0"
                                onError={e => { e.target.src = DEFAULT_AVATAR }}
                            />
                            <div>
                                <p className="font-bold text-kaja-blueText">{usuarioVisor.nombre}</p>
                                <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold
                                    ${usuarioVisor.rol === 'Administrador'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-orange-100 text-kaja-orange'}`}>
                                    {usuarioVisor.rol}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">NIF</p>
                                    <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-mono text-gray-800">{usuarioVisor.nif}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado</p>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                            ${usuarioVisor.estado === 'Activo'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-600'}`}>
                                            {usuarioVisor.estado}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fecha de alta</p>
                                <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-mono text-kaja-blueText/70">
                                    {new Date(usuarioVisor.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setUsuarioVisor(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                Cerrar
                            </button>
                            <button
                                onClick={() => { setUsuarioVisor(null); iniciarEdicion(usuarioVisor) }}
                                className="flex-1 py-2.5 bg-kaja-orange text-white rounded-lg text-sm font-semibold
                                           hover:brightness-90 active:scale-95 transition flex items-center justify-center gap-2">
                                <Pencil className="w-4 h-4" /> Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
