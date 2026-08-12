import { Fragment, useEffect, useState } from 'react'
import {
    Building2, LogOut, Loader2, X, Ban, Pencil, ShoppingBag,
    Users, Package, ChevronLeft, ChevronDown, ChevronUp, ShieldAlert, AlertTriangle, RefreshCw,
} from 'lucide-react'

const API_URL        = import.meta.env.VITE_API_URL
const DEFAULT_AVATAR = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778341124/basica_usuario_qvq2fm.png'

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

const TABS = [
    { id: 'ventas',    label: 'Ventas',    icon: ShoppingBag },
    { id: 'usuarios',  label: 'Usuarios',  icon: Users },
    { id: 'productos', label: 'Productos', icon: Package },
]

export default function SuperAdminPanel({ usuario, onLogout }) {
    const [empresas, setEmpresas] = useState([])
    const [loadingEmpresas, setLoadingEmpresas] = useState(true)
    const [error, setError] = useState('')
    const [toast, setToast] = useState('')

    const [empresaSel, setEmpresaSel] = useState(null)
    const [tab, setTab] = useState('ventas')

    const [ventas, setVentas] = useState([])
    const [ventaExpandida, setVentaExpandida] = useState(null)
    const [usuarios, setUsuarios] = useState([])
    const [productos, setProductos] = useState([])
    const [loadingTab, setLoadingTab] = useState(false)

    const [modalAnular, setModalAnular] = useState(null)
    const [motivoAnular, setMotivoAnular] = useState('')
    const [anulando, setAnulando] = useState(false)

    const [modalReemitir, setModalReemitir] = useState(null)
    const [motivoReemitir, setMotivoReemitir] = useState('')
    const [idUsuarioDestino, setIdUsuarioDestino] = useState('')
    const [usuariosParaReemitir, setUsuariosParaReemitir] = useState([])
    const [cargandoUsuariosReemitir, setCargandoUsuariosReemitir] = useState(false)
    const [reemitiendo, setReemitiendo] = useState(false)

    const [modalUsuario, setModalUsuario] = useState(null)
    const [formUsuario, setFormUsuario] = useState({ nombre: '', rol: 'Empleado', estado: 'Activo', password: '' })
    const [guardandoUsuario, setGuardandoUsuario] = useState(false)

    const [modalProducto, setModalProducto] = useState(null)
    const [formProducto, setFormProducto] = useState({ nombre: '', precioCoste: '', precioVenta: '', iva: 21, stock: 0, idCategoria: 0 })
    const [guardandoProducto, setGuardandoProducto] = useState(false)

    const [accionError, setAccionError] = useState('')

    function mostrarToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(''), 3000)
    }

    useEffect(() => { cargarEmpresas() }, [])

    async function cargarEmpresas() {
        setLoadingEmpresas(true)
        setError('')
        try {
            const data = await fetchJSON(`${API_URL}/superadmin?recurso=empresas`)
            setEmpresas(data.empresas ?? [])
        } catch (e) {
            setError(e.message)
        } finally {
            setLoadingEmpresas(false)
        }
    }

    function seleccionarEmpresa(e) {
        setEmpresaSel(e)
        setTab('ventas')
    }

    useEffect(() => {
        if (!empresaSel) return
        cargarTab()
    }, [empresaSel, tab])

    async function cargarTab() {
        setLoadingTab(true)
        setAccionError('')
        setVentaExpandida(null)
        try {
            if (tab === 'ventas') {
                const data = await fetchJSON(`${API_URL}/superadmin?recurso=ventas&idEmpresa=${empresaSel.id}`)
                setVentas(data.ventas ?? [])
            } else if (tab === 'usuarios') {
                const data = await fetchJSON(`${API_URL}/superadmin?recurso=usuarios&idEmpresa=${empresaSel.id}`)
                setUsuarios(data.usuarios ?? [])
            } else if (tab === 'productos') {
                const data = await fetchJSON(`${API_URL}/superadmin?recurso=productos&idEmpresa=${empresaSel.id}`)
                setProductos(data.productos ?? [])
            }
        } catch (e) {
            setAccionError(e.message)
        } finally {
            setLoadingTab(false)
        }
    }

    async function confirmarAnular() {
        if (motivoAnular.trim().length < 5) {
            setAccionError('El motivo debe tener al menos 5 caracteres')
            return
        }
        setAnulando(true)
        setAccionError('')
        try {
            await fetchJSON(`${API_URL}/superadmin?recurso=anular`, {
                method: 'POST',
                body: JSON.stringify({ idVenta: modalAnular.id, idEmpresa: empresaSel.id, motivo: motivoAnular.trim() }),
            })
            mostrarToast('Venta anulada correctamente')
            setModalAnular(null)
            setMotivoAnular('')
            await cargarTab()
            await cargarEmpresas()
        } catch (e) {
            setAccionError(e.message)
        } finally {
            setAnulando(false)
        }
    }

    async function abrirReemitir(v) {
        setModalReemitir(v)
        setMotivoReemitir('')
        setIdUsuarioDestino('')
        setAccionError('')
        setCargandoUsuariosReemitir(true)
        try {
            const data = await fetchJSON(`${API_URL}/superadmin?recurso=usuarios&idEmpresa=${empresaSel.id}`)
            const activos = (data.usuarios ?? []).filter(u => u.estado === 'Activo')
            setUsuariosParaReemitir(activos)
            if (activos.length === 1) setIdUsuarioDestino(String(activos[0].id))
        } catch (e) {
            setAccionError(e.message)
        } finally {
            setCargandoUsuariosReemitir(false)
        }
    }

    async function confirmarReemitir() {
        if (motivoReemitir.trim().length < 5) {
            setAccionError('El motivo debe tener al menos 5 caracteres')
            return
        }
        if (!idUsuarioDestino) {
            setAccionError('Selecciona a quién se atribuye la venta nueva')
            return
        }
        setReemitiendo(true)
        setAccionError('')
        try {
            const data = await fetchJSON(`${API_URL}/superadmin?recurso=reemitir`, {
                method: 'POST',
                body: JSON.stringify({
                    idVenta: modalReemitir.id,
                    idEmpresa: empresaSel.id,
                    idUsuarioDestino: Number(idUsuarioDestino),
                    motivo: motivoReemitir.trim(),
                }),
            })
            mostrarToast(`Venta reemitida como #${data.idVentaNueva} (${Number(data.totalFinal).toFixed(2)} €)`)
            setModalReemitir(null)
            await cargarTab()
            await cargarEmpresas()
        } catch (e) {
            setAccionError(e.message)
        } finally {
            setReemitiendo(false)
        }
    }

    function abrirEditarUsuario(u) {
        setModalUsuario(u)
        setFormUsuario({ nombre: u.nombre, rol: u.rol, estado: u.estado, password: '' })
        setAccionError('')
    }

    async function guardarUsuario(e) {
        e.preventDefault()
        setGuardandoUsuario(true)
        setAccionError('')
        try {
            const body = { nombre: formUsuario.nombre.trim(), rol: formUsuario.rol, estado: formUsuario.estado }
            if (formUsuario.password) body.password = formUsuario.password
            await fetchJSON(`${API_URL}/superadmin?recurso=usuarios&idEmpresa=${empresaSel.id}&id=${modalUsuario.id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            })
            mostrarToast('Usuario actualizado correctamente')
            setModalUsuario(null)
            await cargarTab()
        } catch (e) {
            setAccionError(e.message)
        } finally {
            setGuardandoUsuario(false)
        }
    }

    function abrirEditarProducto(p) {
        setModalProducto(p)
        setFormProducto({
            nombre: p.nombre, precioCoste: p.precioCoste, precioVenta: p.precioVenta,
            iva: Math.round(Number(p.iva ?? 21)), stock: p.stock, idCategoria: p.idCategoria,
        })
        setAccionError('')
    }

    async function guardarProducto(e) {
        e.preventDefault()
        setGuardandoProducto(true)
        setAccionError('')
        try {
            await fetchJSON(`${API_URL}/superadmin?recurso=productos&idEmpresa=${empresaSel.id}&id=${modalProducto.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nombre: formProducto.nombre.trim(),
                    idCategoria: formProducto.idCategoria,
                    precioCoste: Number(formProducto.precioCoste),
                    precioVenta: Number(formProducto.precioVenta),
                    iva: Number(formProducto.iva),
                    stock: Number(formProducto.stock),
                }),
            })
            mostrarToast('Producto actualizado correctamente')
            setModalProducto(null)
            await cargarTab()
        } catch (e) {
            setAccionError(e.message)
        } finally {
            setGuardandoProducto(false)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-kaja-light">
            {toast && (
                <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-kaja-blueText text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg text-center sm:text-left">
                    {toast}
                </div>
            )}

            <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 bg-kaja-sidebar text-white">
                <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-kaja-orange" />
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">KAJA</p>
                        <h1 className="text-base font-bold font-display leading-none">Panel SuperAdmin</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-white/70 hidden sm:inline">{usuario.nombre}</span>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition"
                    >
                        <LogOut className="w-4 h-4" /> Salir
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Lista de empresas */}
                <aside className={`w-full sm:w-80 shrink-0 border-r border-gray-100 bg-white overflow-y-auto ${empresaSel ? 'hidden sm:block' : ''}`}>
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-kaja-blueText flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-kaja-orange" /> Empresas ({empresas.length})
                        </h2>
                    </div>
                    {loadingEmpresas ? (
                        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin text-kaja-orange" />
                        </div>
                    ) : error ? (
                        <div className="px-5 py-4 text-sm text-kaja-rose">{error}</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {empresas.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => seleccionarEmpresa(e)}
                                    className={`w-full text-left px-5 py-3.5 hover:bg-kaja-orange/5 transition
                                        ${empresaSel?.id === e.id ? 'bg-kaja-orange/10' : ''}`}
                                >
                                    <p className="font-semibold text-sm text-kaja-blueText truncate">{e.nombreComercial}</p>
                                    <p className="text-xs text-gray-400 font-mono mt-0.5">{e.nif}</p>
                                    <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                                        <span>{e.numUsuarios} usuarios</span>
                                        <span>{e.numVentas} ventas</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Detalle de empresa */}
                <main className="flex-1 overflow-y-auto">
                    {!empresaSel ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 px-6 text-center">
                            <Building2 className="w-10 h-10 opacity-30" />
                            <p className="text-sm">Selecciona una empresa para ver sus datos</p>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6">
                            <button
                                onClick={() => setEmpresaSel(null)}
                                className="sm:hidden flex items-center gap-1 text-sm text-gray-500 mb-3"
                            >
                                <ChevronLeft className="w-4 h-4" /> Empresas
                            </button>

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-kaja-blueText font-display">{empresaSel.nombreComercial}</h2>
                                    <p className="text-xs text-gray-400 font-mono">{empresaSel.nif} · {empresaSel.email ?? 'sin email'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-kaja-blueText font-mono">{Number(empresaSel.totalFacturado).toFixed(2)} €</p>
                                    <p className="text-xs text-gray-400">facturado</p>
                                </div>
                            </div>

                            <div className="flex gap-1 mb-4 border-b border-gray-200">
                                {TABS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition
                                            ${tab === t.id
                                                ? 'border-kaja-orange text-kaja-orange'
                                                : 'border-transparent text-gray-400 hover:text-kaja-blueText'}`}
                                    >
                                        <t.icon className="w-4 h-4" /> {t.label}
                                    </button>
                                ))}
                            </div>

                            {accionError && (
                                <div className="mb-4 px-4 py-3 bg-kaja-rose-soft border border-kaja-rose/30 rounded-xl text-sm text-kaja-rose flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" /> {accionError}
                                </div>
                            )}

                            {loadingTab ? (
                                <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin text-kaja-orange" />
                                </div>
                            ) : tab === 'ventas' ? (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    {ventas.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 text-sm">Sin ventas registradas</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm min-w-225">
                                                <thead>
                                                    <tr className="bg-kaja-sidebar">
                                                        <th className="px-4 py-3.5 text-left   text-[11px] font-bold uppercase tracking-widest text-white/60">Fecha</th>
                                                        <th className="px-4 py-3.5 text-left   text-[11px] font-bold uppercase tracking-widest text-white/60">Vendedor</th>
                                                        <th className="px-4 py-3.5 text-right  text-[11px] font-bold uppercase tracking-widest text-white/60">Base</th>
                                                        <th className="px-4 py-3.5 text-right  text-[11px] font-bold uppercase tracking-widest text-white/60">IVA</th>
                                                        <th className="px-4 py-3.5 text-right  text-[11px] font-bold uppercase tracking-widest text-white/60">Total</th>
                                                        <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-white/60">Líneas</th>
                                                        <th className="px-4 py-3.5 text-left   text-[11px] font-bold uppercase tracking-widest text-white/60">Estado</th>
                                                        <th className="px-4 py-3.5 text-left   text-[11px] font-bold uppercase tracking-widest text-white/60">Anulada por</th>
                                                        <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-white/60">Acc.</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ventas.map(v => {
                                                        const expandida = ventaExpandida === v.id
                                                        return (
                                                            <Fragment key={v.id}>
                                                                <tr
                                                                    onClick={() => setVentaExpandida(expandida ? null : v.id)}
                                                                    className="border-t border-gray-100 hover:bg-kaja-orange/5 cursor-pointer transition-colors"
                                                                >
                                                                    <td className="px-4 py-3.5">
                                                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-light/60 text-xs font-mono text-kaja-blueText/70 whitespace-nowrap">
                                                                            {new Date(v.fecha).toLocaleDateString('es-ES')}{' '}
                                                                            {new Date(v.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <img
                                                                                src={v.imagenVendedor || DEFAULT_AVATAR}
                                                                                alt={v.vendedor}
                                                                                width="28"
                                                                                height="28"
                                                                                loading="lazy"
                                                                                className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                                                                                onError={e => { e.target.src = DEFAULT_AVATAR }}
                                                                            />
                                                                            <span className="text-kaja-blueText/80 font-medium truncate">{v.vendedor}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 text-right text-kaja-blueText/40 text-xs font-mono tabular-nums">{Number(v.baseImponible).toFixed(2)} €</td>
                                                                    <td className="px-4 py-3.5 text-right text-kaja-blueText/40 text-xs font-mono tabular-nums">{Number(v.totalIva).toFixed(2)} €</td>
                                                                    <td className="px-4 py-3.5 text-right">
                                                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-orange/10 text-kaja-orange font-bold font-mono tabular-nums">
                                                                            {Number(v.totalFinal).toFixed(2)} €
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 text-center">
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-kaja-blueText/70">
                                                                            {(v.lineas ?? []).length} art.
                                                                            {expandida ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5">
                                                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap
                                                                            ${v.estado === 'Emitida' ? 'bg-kaja-teal-soft text-kaja-teal' : 'bg-kaja-rose-soft text-kaja-rose'}`}>
                                                                            {v.estado}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 text-xs text-gray-400 truncate">{v.anuladoPor ?? '—'}</td>
                                                                    <td className="px-4 py-3.5">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            {v.estado === 'Emitida' && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={e => { e.stopPropagation(); setModalAnular(v); setMotivoAnular(''); setAccionError('') }}
                                                                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-kaja-rose hover:bg-kaja-rose-soft transition"
                                                                                        title="Anular venta"
                                                                                    >
                                                                                        <Ban className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={e => { e.stopPropagation(); abrirReemitir(v) }}
                                                                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-kaja-orange hover:bg-orange-50 transition"
                                                                                        title="Anular y reemitir con datos corregidos"
                                                                                    >
                                                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {expandida && (
                                                                    <tr>
                                                                        <td colSpan={9} className="px-4 pb-4 pt-1 bg-kaja-light/20">
                                                                            <div className="rounded-xl overflow-hidden border border-kaja-light shadow-sm">
                                                                                <table className="w-full text-xs">
                                                                                    <thead>
                                                                                        <tr className="bg-gray-50">
                                                                                            <th className="px-4 py-2.5 text-left  text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Producto</th>
                                                                                            <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Cant.</th>
                                                                                            <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">P. Unit.</th>
                                                                                            <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">IVA</th>
                                                                                            <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Subtotal</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {(v.lineas ?? []).map((l, i) => (
                                                                                            <tr key={i} className="border-t border-kaja-light">
                                                                                                <td className="px-4 py-2.5 font-medium text-kaja-blueText/80">{l.producto}</td>
                                                                                                <td className="px-4 py-2.5 text-right text-kaja-blueText/50 font-mono tabular-nums">{l.cantidad}</td>
                                                                                                <td className="px-4 py-2.5 text-right text-kaja-blueText/50 font-mono tabular-nums">
                                                                                                    {(parseFloat(l.subtotal) / parseFloat(l.cantidad) / (1 + parseFloat(l.ivaAplicado) / 100)).toFixed(2)} €
                                                                                                </td>
                                                                                                <td className="px-4 py-2.5 text-right">
                                                                                                    <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-kaja-blueText/60 font-mono tabular-nums">{parseFloat(l.ivaAplicado).toFixed(0)}%</span>
                                                                                                </td>
                                                                                                <td className="px-4 py-2.5 text-right font-bold text-kaja-blueText font-mono tabular-nums">{Number(l.subtotal).toFixed(2)} €</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>

                                                                            {v.estado === 'Anulada' && (
                                                                                <div className="mt-3 px-3 py-2.5 bg-kaja-rose-soft border border-kaja-rose/20 rounded-lg text-xs text-kaja-rose">
                                                                                    <p><strong>Motivo de anulación:</strong> {v.motivoAnulacion}</p>
                                                                                    <p className="mt-0.5 text-kaja-rose/70">
                                                                                        Anulada por {v.anuladoPor} el {v.fechaAnulacion ? new Date(v.fechaAnulacion).toLocaleString('es-ES') : '—'}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </Fragment>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : tab === 'usuarios' ? (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <div className="grid grid-cols-[1fr_110px_110px_100px_80px] min-w-150 bg-kaja-sidebar">
                                            {['Nombre', 'NIF', 'Rol', 'Estado', 'Acc.'].map(h => (
                                                <div key={h} className="px-3 py-3 text-[11px] font-bold uppercase tracking-widest text-white/60">{h}</div>
                                            ))}
                                        </div>
                                        {usuarios.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400 text-sm">Sin usuarios</div>
                                        ) : usuarios.map(u => (
                                            <div key={u.id} className="grid grid-cols-[1fr_110px_110px_100px_80px] min-w-150 items-center text-sm border-b border-gray-50">
                                                <div className="px-3 py-3 text-kaja-blueText truncate">{u.nombre}</div>
                                                <div className="px-3 py-3 text-xs font-mono text-gray-500">{u.nif}</div>
                                                <div className="px-3 py-3 text-xs">{u.rol}</div>
                                                <div className="px-3 py-3">
                                                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold
                                                        ${u.estado === 'Activo' ? 'bg-kaja-teal-soft text-kaja-teal' : 'bg-kaja-rose-soft text-kaja-rose'}`}>
                                                        {u.estado}
                                                    </span>
                                                </div>
                                                <div className="px-3 py-3">
                                                    <button
                                                        onClick={() => abrirEditarUsuario(u)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-kaja-blueText hover:bg-gray-100 transition"
                                                        title="Editar usuario"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <div className="grid grid-cols-[1fr_100px_100px_80px_80px] min-w-150 bg-kaja-sidebar">
                                            {['Nombre', 'Coste', 'Venta', 'Stock', 'Acc.'].map(h => (
                                                <div key={h} className="px-3 py-3 text-[11px] font-bold uppercase tracking-widest text-white/60">{h}</div>
                                            ))}
                                        </div>
                                        {productos.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400 text-sm">Sin productos</div>
                                        ) : productos.map(p => (
                                            <div key={p.id} className="grid grid-cols-[1fr_100px_100px_80px_80px] min-w-150 items-center text-sm border-b border-gray-50">
                                                <div className="px-3 py-3 text-kaja-blueText truncate">{p.nombre}</div>
                                                <div className="px-3 py-3 font-mono text-xs">{Number(p.precioCoste).toFixed(2)} €</div>
                                                <div className="px-3 py-3 font-mono text-xs">{Number(p.precioVenta).toFixed(2)} €</div>
                                                <div className="px-3 py-3 font-mono text-xs">{p.stock}</div>
                                                <div className="px-3 py-3">
                                                    <button
                                                        onClick={() => abrirEditarProducto(p)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-kaja-blueText hover:bg-gray-100 transition"
                                                        title="Editar producto"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal anular venta */}
            {modalAnular && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !anulando && setModalAnular(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-kaja-blueText flex items-center gap-2">
                                <Ban className="w-5 h-5 text-kaja-rose" /> Anular venta #{modalAnular.id}
                            </h2>
                            <button onClick={() => setModalAnular(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            La venta no se borra: queda marcada como <strong>Anulada</strong> con tu nombre, fecha y motivo,
                            y el stock vendido se repone. Es irreversible.
                        </p>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo de la anulación *</label>
                        <textarea
                            value={motivoAnular}
                            onChange={e => setMotivoAnular(e.target.value)}
                            rows={3}
                            maxLength={255}
                            placeholder="Ej: el cliente reportó un cobro duplicado"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                        />
                        {accionError && <p className="text-xs text-kaja-rose mt-2">{accionError}</p>}
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setModalAnular(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarAnular}
                                disabled={anulando}
                                className="flex-1 py-2.5 bg-kaja-rose text-white font-bold rounded-xl hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {anulando ? <><Loader2 className="w-4 h-4 animate-spin" /> Anulando…</> : 'Confirmar anulación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal anular y reemitir venta */}
            {modalReemitir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !reemitiendo && setModalReemitir(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-kaja-blueText flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-kaja-orange" /> Anular y reemitir #{modalReemitir.id}
                            </h2>
                            <button onClick={() => setModalReemitir(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Anula esta venta y crea una nueva con las mismas líneas, recalculadas con el
                            precio/IVA <strong>actual</strong> de cada producto. Útil cuando el error ya
                            está corregido en el producto y solo falta rehacer el ticket. Irreversible.
                        </p>

                        <label className="block text-xs font-semibold text-gray-600 mb-1">Atribuir venta nueva a *</label>
                        {cargandoUsuariosReemitir ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando empleados…
                            </div>
                        ) : (
                            <select
                                value={idUsuarioDestino}
                                onChange={e => setIdUsuarioDestino(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer mb-4
                                            focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                            >
                                <option value="">— Selecciona —</option>
                                {usuariosParaReemitir.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                                ))}
                            </select>
                        )}

                        <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo *</label>
                        <textarea
                            value={motivoReemitir}
                            onChange={e => setMotivoReemitir(e.target.value)}
                            rows={3}
                            maxLength={255}
                            placeholder="Ej: IVA erróneo en el producto, ya corregido; se reemite el ticket"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                        />
                        {accionError && <p className="text-xs text-kaja-rose mt-2">{accionError}</p>}
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setModalReemitir(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarReemitir}
                                disabled={reemitiendo || cargandoUsuariosReemitir}
                                className="flex-1 py-2.5 bg-kaja-orange text-white font-bold rounded-xl hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {reemitiendo ? <><Loader2 className="w-4 h-4 animate-spin" /> Reemitiendo…</> : 'Anular y reemitir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal editar usuario */}
            {modalUsuario && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalUsuario(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-kaja-blueText">Editar usuario</h2>
                            <button onClick={() => setModalUsuario(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={guardarUsuario} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formUsuario.nombre}
                                    onChange={e => setFormUsuario(f => ({ ...f, nombre: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
                                <select
                                    value={formUsuario.rol}
                                    onChange={e => setFormUsuario(f => ({ ...f, rol: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                >
                                    <option value="Empleado">Empleado</option>
                                    <option value="Administrador">Administrador</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                                <select
                                    value={formUsuario.estado}
                                    onChange={e => setFormUsuario(f => ({ ...f, estado: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Nueva contraseña <span className="text-gray-400 font-normal">(vacío para no cambiar)</span>
                                </label>
                                <input
                                    type="password"
                                    value={formUsuario.password}
                                    onChange={e => setFormUsuario(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Mínimo 8 caracteres"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                />
                            </div>
                            {accionError && <p className="text-xs text-kaja-rose">{accionError}</p>}
                            <div className="flex gap-3 mt-1">
                                <button type="button" onClick={() => setModalUsuario(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoUsuario}
                                    className="flex-1 py-2.5 bg-kaja-orange text-white font-bold rounded-xl hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {guardandoUsuario ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal editar producto */}
            {modalProducto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalProducto(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-kaja-blueText">Editar producto</h2>
                            <button onClick={() => setModalProducto(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={guardarProducto} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formProducto.nombre}
                                    onChange={e => setFormProducto(f => ({ ...f, nombre: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Precio coste</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={formProducto.precioCoste}
                                        onChange={e => setFormProducto(f => ({ ...f, precioCoste: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Precio venta</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={formProducto.precioVenta}
                                        onChange={e => setFormProducto(f => ({ ...f, precioVenta: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">IVA</label>
                                    <select
                                        value={formProducto.iva}
                                        onChange={e => setFormProducto(f => ({ ...f, iva: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                    >
                                        {[0, 4, 10, 21].map(v => <option key={v} value={v}>{v}%</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stock</label>
                                    <input
                                        type="number" min="0"
                                        value={formProducto.stock}
                                        onChange={e => setFormProducto(f => ({ ...f, stock: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                    />
                                </div>
                            </div>
                            {accionError && <p className="text-xs text-kaja-rose">{accionError}</p>}
                            <div className="flex gap-3 mt-1">
                                <button type="button" onClick={() => setModalProducto(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoProducto}
                                    className="flex-1 py-2.5 bg-kaja-orange text-white font-bold rounded-xl hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {guardandoProducto ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
