import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Loader2, Check, X, AlertTriangle, Tag, Trash2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL
const POR_PAGINA = 10

const FORM_VACIO = {
    nombre: '',
    idCategoria: '',
    nuevaCategoria: '',
    precioCoste: '',
    precioVenta: '',
    iva: '21',
    stock: '',
    estado: 'Activo',
}

export default function Inventario({ filtroStockBajo = false, busquedaInicial = '' }) {
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busqueda, setBusqueda] = useState(busquedaInicial)

    // Paginación
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)

    // Toast
    const [notificacion, setToast] = useState('')

    function mostrarNotificacion(mensaje) {
        setToast(mensaje)
        setTimeout(() => setToast(''), 3000)
    }

    // Modal detalle (solo lectura)
    const [productoVisor, setProductoVisor] = useState(null)

    // Modal edición
    const [modalAbierto, setModalAbierto] = useState(false)
    const [productoEditando, setProductoEditando] = useState(null) // null = crear, objeto = editar
    const [categorias, setCategorias] = useState([])
    const [form, setForm] = useState(FORM_VACIO)
    const [camposError, setCamposError] = useState({})
    const [formError, setFormError] = useState('')
    const [guardando, setGuardando] = useState(false)

    // Pestaña activos/inactivos
    const [tabEstado, setTabEstado] = useState('Activo')

    // Modal categorías
    const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false)
    const [categoriasLista, setCategoriasLista] = useState([])
    const [cargandoCategorias, setCargandoCategorias] = useState(false)
    const [categoriaParaEliminar, setCategoriaParaEliminar] = useState(null)
    const [eliminandoCategoria, setEliminandoCategoria] = useState(false)

    // Modal eliminar producto
    const [productoParaEliminar, setProductoParaEliminar] = useState(null)
    const [eliminandoProducto, setEliminandoProducto] = useState(false)

    useEffect(() => {
        setBusqueda(busquedaInicial)
        cargarProductos(busquedaInicial, 1, tabEstado)
    }, [filtroStockBajo, busquedaInicial, tabEstado])

    function headers() {
        return { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` }
    }

    async function fetchJSON(url, opciones = {}) {
        const res = await fetch(url, { ...opciones, headers: { ...headers(), ...opciones.headers } })
        const text = await res.text()
        let data
        try { data = JSON.parse(text) } catch { throw new Error(`Respuesta inesperada del servidor (${res.status})`) }
        if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)
        return data
    }

    async function cargarProductos(search = '', pag = 1, estado = tabEstado) {
        setLoading(true)
        setError('')
        try {
            const params = new URLSearchParams({ pagina: pag, porPagina: POR_PAGINA })
            if (search) params.set('search', search)
            if (filtroStockBajo) params.set('stockBajo', '1')
            params.set('estado', estado)
            const respuesta = await fetchJSON(`${API_URL}/productos?${params}`)
            setProductos(respuesta.datos)
            setTotal(respuesta.total)
            setTotalPaginas(respuesta.totalPaginas)
            setPagina(respuesta.pagina)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function handleBusqueda(e) {
        const val = e.target.value
        setBusqueda(val)
        clearTimeout(window._busquedaTimer)
        window._busquedaTimer = setTimeout(() => cargarProductos(val, 1, tabEstado), 300)
    }

    function irAPagina(pag) {
        cargarProductos(busqueda, pag, tabEstado)
    }

    async function abrirModal(producto = null) {
        setProductoEditando(producto)
        setCamposError({})
        setForm(producto ? {
            nombre: producto.nombre,
            idCategoria: String(producto.idCategoria),
            nuevaCategoria: '',
            precioCoste: producto.precioCoste,
            precioVenta: producto.precioVenta,
            iva: String(producto.iva ?? 21),
            stock: producto.stock,
            estado: producto.estado ?? 'Activo',
        } : FORM_VACIO)
        setFormError('')
        setModalAbierto(true)
        try {
            const data = await fetchJSON(`${API_URL}/categorias`)
            setCategorias(data)
        } catch (e) {
            setFormError('No se pudieron cargar las categorías: ' + e.message)
        }
    }

    function abrirVisor(producto) {
        setProductoVisor(producto)
    }

    function cerrarVisor() {
        setProductoVisor(null)
    }

    function cerrarModal() {
        if (guardando) return
        setModalAbierto(false)
        setFormError('')
        setCamposError({})
        setProductoEditando(null)
    }

    async function abrirModalCategorias() {
        setModalCategoriasAbierto(true)
        setCargandoCategorias(true)
        try {
            const data = await fetchJSON(`${API_URL}/categorias`)
            setCategoriasLista(data)
        } catch {
            setCategoriasLista([])
        } finally {
            setCargandoCategorias(false)
        }
    }

    async function eliminarProducto() {
        if (!productoParaEliminar) return
        setEliminandoProducto(true)
        try {
            const data = await fetchJSON(`${API_URL}/productos?id=${productoParaEliminar.id}`, { method: 'DELETE' })
            setProductoParaEliminar(null)
            mostrarNotificacion(data.mensaje ?? 'Producto eliminado correctamente')
            cargarProductos(busqueda, pagina, tabEstado)
        } catch (e) {
            mostrarNotificacion('Error: ' + e.message)
            setProductoParaEliminar(null)
        } finally {
            setEliminandoProducto(false)
        }
    }

    async function eliminarCategoria() {
        if (!categoriaParaEliminar) return
        setEliminandoCategoria(true)
        try {
            await fetchJSON(`${API_URL}/categorias?id=${categoriaParaEliminar.id}`, { method: 'DELETE' })
            setCategoriaParaEliminar(null)
            const data = await fetchJSON(`${API_URL}/categorias`)
            setCategoriasLista(data)
            mostrarNotificacion('Categoría eliminada correctamente')
        } catch (e) {
            mostrarNotificacion('Error: ' + e.message)
            setCategoriaParaEliminar(null)
        } finally {
            setEliminandoCategoria(false)
        }
    }

    function handleFormChange(e) {
        const { name, value } = e.target
        let finalValue = value
        let warning = ''

        if ((name === 'precioCoste' || name === 'precioVenta') && value !== '' && parseFloat(value) > 9999.99) {
            finalValue = '9999.99'
            warning = 'El precio máximo es 9.999,99 €.'
        }
        if (name === 'stock' && value !== '' && parseInt(value, 10) > 9999) {
            finalValue = '9999'
            warning = 'El stock no puede superar 9.999 unidades.'
        }

        setForm(prev => {
            const updated = { ...prev, [name]: finalValue }
            if (name === 'stock') updated.estado = parseInt(finalValue, 10) > 0 ? 'Activo' : 'Inactivo'
            return updated
        })
        setCamposError(prev => ({ ...prev, [name]: warning }))
    }

    async function handleGuardar(e) {
        e.preventDefault()
        setFormError('')

        const nombre = form.nombre.trim()
        const precioCoste = parseFloat(form.precioCoste)
        const precioVenta = parseFloat(form.precioVenta)
        const iva = parseInt(form.iva, 10)
        const stock = parseInt(form.stock, 10)
        const esNueva = form.idCategoria === '__nueva__'
        const nombreCat = form.nuevaCategoria.trim()

        const errores = {}
        if (!nombre) errores.nombre = 'El nombre es obligatorio.'
        if (!form.idCategoria) errores.idCategoria = 'Selecciona o crea una categoría.'
        if (esNueva && !nombreCat) errores.nuevaCategoria = 'Escribe el nombre de la nueva categoría.'
        if (isNaN(precioCoste) || precioCoste <= 0) errores.precioCoste = 'Debe ser mayor que 0.'
        if (isNaN(precioVenta) || precioVenta <= 0) errores.precioVenta = 'Debe ser mayor que 0.'
        if (isNaN(iva) || ![0, 4, 10, 21].includes(iva)) errores.iva = 'Selecciona un tipo de IVA válido.'
        if (isNaN(stock) || stock < 0) errores.stock = 'No puede ser negativo.'

        if (Object.keys(errores).length > 0) {
            setCamposError(errores)
            return
        }

        setGuardando(true)
        try {
            let idCategoria = parseInt(form.idCategoria, 10)

            // Crear categoría nueva si hace falta
            if (esNueva) {
                const cat = await fetchJSON(`${API_URL}/categorias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: nombreCat }),
                })
                idCategoria = cat.id
            }

            if (productoEditando) {
                await fetchJSON(`${API_URL}/productos?id=${productoEditando.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, idCategoria, precioCoste, precioVenta, iva, stock, estado: form.estado }),
                })
            } else {
                await fetchJSON(`${API_URL}/productos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, idCategoria, precioCoste, precioVenta, iva, stock }),
                })
            }

            setModalAbierto(false)
            setProductoEditando(null)
            mostrarNotificacion(productoEditando ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
            cargarProductos(busqueda, productoEditando ? pagina : 1, tabEstado)
        } catch (e) {
            setFormError(e.message)
        } finally {
            setGuardando(false)
        }
    }

    function badgeStock(stock) {
        if (stock === 0)
            return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">Sin stock</span>
        if (stock <= 5)
            return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">{stock} uds</span>
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">{stock} uds</span>
    }

    function badgeEstado(estado) {
        if (estado === 'Activo')
            return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">Activo</span>
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">Inactivo</span>
    }

    function inputCls(campo) {
        const base = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition'
        return camposError[campo]
            ? `${base} border-red-400 focus:ring-red-100 focus:border-red-400`
            : `${base} border-gray-200 focus:ring-kaja-light focus:border-kaja-blue`
    }

    return (
        <div className="p-6 max-w-5xl mx-auto w-full">

            {/* Cabecera */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-kaja-blue">Inventario</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Listado de productos en la base de datos</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{total} productos</span>
                    <button
                        onClick={abrirModalCategorias}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-kaja-blue text-sm font-semibold
                                    rounded-lg hover:bg-gray-50 active:scale-95 transition"
                    >
                        <Tag className="w-4 h-4" />
                        Categorías
                    </button>
                    <button
                        onClick={() => abrirModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-kaja-orange text-white text-sm font-semibold
                                    rounded-lg hover:brightness-90 active:scale-95 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir producto
                    </button>
                </div>
            </div>

            {/* Pestañas Activos / Inactivos */}
            <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
                {['Activo', 'Inactivo'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setTabEstado(tab)}
                        className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition
                            ${tabEstado === tab
                                ? 'bg-white text-kaja-blue shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab === 'Activo' ? 'Activos' : 'Inactivos'}
                    </button>
                ))}
            </div>

            {/* Mensaje filtro stock bajo */}
            {filtroStockBajo && (
                <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" />
                    Mostrando solo productos con stock bajo (&lt;15 unidades)
                </div>
            )}

            {/* Buscador + paginación superior */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={handleBusqueda}
                        placeholder="Buscar producto..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                                    focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-kaja-blue transition"
                    />
                </div>

                {!loading && !error && (
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <span className="text-sm text-gray-600 mr-1">
                            {total === 0
                                ? 'Sin resultados'
                                : `${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, total)} de ${total}`}
                        </span>
                        {totalPaginas > 1 && (<>
                            <button
                                onClick={() => irAPagina(1)}
                                disabled={pagina === 1}
                                className="px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                title="Primera página"
                                aria-label="Primera página"
                            >«</button>
                            <button
                                onClick={() => irAPagina(pagina - 1)}
                                disabled={pagina === 1}
                                aria-label="Página anterior"
                                className="px-2.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >‹</button>

                            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                                .reduce((acc, p, idx, arr) => {
                                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map((item, idx) =>
                                    item === '...'
                                        ? <span key={`sep-${idx}`} className="px-1 text-sm text-gray-400">…</span>
                                        : <button
                                            key={item}
                                            onClick={() => irAPagina(item)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition
                                                ${item === pagina
                                                    ? 'bg-kaja-orange text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'}`}
                                        >{item}</button>
                                )
                            }

                            <button
                                onClick={() => irAPagina(pagina + 1)}
                                disabled={pagina === totalPaginas}
                                aria-label="Página siguiente"
                                className="px-2.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >›</button>
                            <button
                                onClick={() => irAPagina(totalPaginas)}
                                disabled={pagina === totalPaginas}
                                className="px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                title="Última página"
                                aria-label="Última página"
                            >»</button>
                        </>)}
                    </div>
                )}
            </div>

            {/* Estado carga / error */}
            {loading && (
                <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
                    <Loader2 className="animate-spin w-5 h-5 text-kaja-orange" />
                    <span className="text-sm">Cargando productos...</span>
                </div>
            )}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Tabla */}
            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {productos.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 text-sm">No se encontraron productos</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-150">
                                <thead>
                                    <tr className="bg-kaja-sidebar">
                                        <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60 w-12">#</th>
                                        <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Nombre</th>
                                        <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Categoría</th>
                                        <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">P. Coste</th>
                                        <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">P. Venta</th>
                                        <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Stock</th>
                                        <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Estado</th>
                                        <th className="w-20 bg-kaja-sidebar"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos.map((p, i) => (
                                        <tr key={p.id}
                                            onClick={() => abrirVisor(p)}
                                            className="border-b border-gray-100 hover:bg-kaja-orange/5 transition cursor-pointer">
                                            <td className="px-4 py-3.5 text-kaja-blueText/30 text-xs tabular-nums">{p.id}</td>
                                            <td className="px-4 py-3.5 font-medium text-kaja-blueText">{p.nombre}</td>
                                            <td className="px-4 py-3.5">
                                                <span className="px-2.5 py-1 rounded-lg text-xs bg-kaja-light text-kaja-blueText/70 font-medium">
                                                    {p.categoria}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-kaja-blueText/40 text-xs tabular-nums">{parseFloat(p.precioCoste).toFixed(2)} €</td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-orange/10 text-kaja-orange font-bold tabular-nums">
                                                    {parseFloat(p.precioVenta).toFixed(2)} €
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">{badgeStock(p.stock)}</td>
                                            <td className="px-4 py-3.5 text-center">{badgeEstado(p.estado)}</td>
                                            <td className="px-3 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); abrirModal(p) }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-kaja-blue hover:bg-kaja-light transition"
                                                        title="Editar producto"
                                                        aria-label="Editar producto"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setProductoParaEliminar(p) }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                                        title="Eliminar producto"
                                                        aria-label="Eliminar producto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}


            {/* Toast de éxito */}
            {notificacion && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3
                                bg-green-600 text-white text-sm font-medium rounded-xl shadow-lg
                                animate-fade-in">
                    <Check className="w-5 h-5 shrink-0" />
                    {notificacion}
                </div>
            )}

            {/* Modal categorías */}
            {modalCategoriasAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalCategoriasAbierto(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-kaja-blue flex items-center gap-2">
                                <Tag className="w-5 h-5" />
                                Categorías
                            </h2>
                            <button onClick={() => setModalCategoriasAbierto(false)}
                                aria-label="Cerrar"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {cargandoCategorias ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
                                <Loader2 className="animate-spin w-5 h-5 text-kaja-orange" />
                                <span className="text-sm">Cargando...</span>
                            </div>
                        ) : categoriasLista.length === 0 ? (
                            <p className="text-sm text-gray-600 text-center py-8">No hay categorías registradas</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                                {categoriasLista.map(c => (
                                    <li key={c.id} className="flex items-center gap-3 py-2.5">
                                        <span className="w-6 h-6 rounded-full bg-kaja-light flex items-center justify-center text-xs font-bold text-kaja-blue shrink-0">
                                            {c.nombre.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-800 flex-1">{c.nombre}</span>
                                        <span className="text-xs text-gray-600 shrink-0">
                                            {c.totalProductos} producto{c.totalProductos !== 1 ? 's' : ''}
                                        </span>
                                        <button
                                            onClick={() => setCategoriaParaEliminar(c)}
                                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition shrink-0"
                                            title="Eliminar categoría"
                                            aria-label="Eliminar categoría"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <p className="text-xs text-gray-400 mt-4 text-right">
                            {!cargandoCategorias && `${categoriasLista.length} categoría${categoriasLista.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Modal aviso / confirmación al eliminar categoría */}
            {categoriaParaEliminar && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !eliminandoCategoria && setCategoriaParaEliminar(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        {parseInt(categoriaParaEliminar.totalProductos) > 0 ? (
                            <>
                                <div className="flex flex-col items-center gap-3 mb-5 text-center">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800">No se puede eliminar</h3>
                                    <p className="text-sm text-gray-500">
                                        La categoría <span className="font-semibold text-gray-700">"{categoriaParaEliminar.nombre}"</span> tiene{' '}
                                        <span className="font-semibold text-red-600">{categoriaParaEliminar.totalProductos} producto{categoriaParaEliminar.totalProductos !== 1 ? 's' : ''}</span> asociado{categoriaParaEliminar.totalProductos !== 1 ? 's' : ''}.
                                        Reasigna o elimina los productos antes de borrar esta categoría.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setCategoriaParaEliminar(null)}
                                    className="w-full py-2.5 bg-kaja-orange text-white font-semibold rounded-lg hover:brightness-90 active:scale-95 transition"
                                >
                                    Entendido
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-3 mb-5 text-center">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                        <Trash2 className="w-6 h-6 text-kaja-orange" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800">Eliminar categoría</h3>
                                    <p className="text-sm text-gray-500">
                                        ¿Seguro que quieres eliminar <span className="font-semibold text-gray-700">"{categoriaParaEliminar.nombre}"</span>?
                                        Esta acción no se puede deshacer.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCategoriaParaEliminar(null)}
                                        disabled={eliminandoCategoria}
                                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={eliminarCategoria}
                                        disabled={eliminandoCategoria}
                                        className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {eliminandoCategoria
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando…</>
                                            : 'Sí, eliminar'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal confirmación eliminar producto */}
            {productoParaEliminar && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !eliminandoProducto && setProductoParaEliminar(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <div className="flex flex-col items-center gap-3 mb-5 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">Eliminar producto</h3>
                            <p className="text-sm text-gray-500">
                                ¿Seguro que quieres eliminar <span className="font-semibold text-gray-700">"{productoParaEliminar.nombre}"</span>?
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setProductoParaEliminar(null)}
                                disabled={eliminandoProducto}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={eliminarProducto}
                                disabled={eliminandoProducto}
                                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {eliminandoProducto
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando…</>
                                    : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal detalle producto (solo lectura) */}
            {productoVisor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarVisor} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-kaja-blue">Detalle del producto</h2>
                            <button onClick={cerrarVisor}
                                aria-label="Cerrar"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nombre del producto</p>
                                <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">{productoVisor.nombre}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Precio de coste</p>
                                    <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">
                                        {parseFloat(productoVisor.precioCoste).toFixed(2)} €
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Precio de venta</p>
                                    <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-semibold text-kaja-blue">
                                        {parseFloat(productoVisor.precioVenta).toFixed(2)} €
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo de IVA</p>
                                <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">
                                    {productoVisor.iva ?? 21}%
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Stock</p>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                                        {badgeStock(productoVisor.stock)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado</p>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                                        {badgeEstado(productoVisor.estado)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={cerrarVisor}
                                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                Cerrar
                            </button>
                            <button onClick={() => { cerrarVisor(); abrirModal(productoVisor) }}
                                className="flex-1 py-2.5 bg-kaja-orange text-white rounded-lg text-sm font-semibold
                                           hover:brightness-90 active:scale-95 transition">
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-kaja-blue">
                                {productoEditando ? 'Editar producto' : 'Nuevo producto'}
                            </h2>
                            <button onClick={cerrarModal}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} noValidate>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Nombre del producto
                                    </label>
                                    <input
                                        name="nombre" value={form.nombre} onChange={handleFormChange}
                                        placeholder="Ej: Coca-Cola 33cl"
                                        maxLength={30}
                                        className={inputCls('nombre')}
                                    />
                                    {form.nombre.length === 30 && <p className="mt-1 text-xs text-amber-500">Límite de 30 caracteres alcanzado</p>}
                                    {camposError.nombre && <p className="mt-1 text-xs text-red-500">{camposError.nombre}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Categoría
                                    </label>
                                    <select
                                        name="idCategoria" value={form.idCategoria} onChange={handleFormChange}
                                        className={inputCls('idCategoria')}
                                    >
                                        <option value="">Selecciona una categoría...</option>
                                        {categorias.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                        <option value="__nueva__">+ Crear nueva categoría</option>
                                    </select>
                                    {camposError.idCategoria && <p className="mt-1 text-xs text-red-500">{camposError.idCategoria}</p>}
                                </div>

                                {/* Campo nueva categoría (solo si se elige crear nueva) */}
                                {form.idCategoria === '__nueva__' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Nombre de la nueva categoría
                                        </label>
                                        <input
                                            name="nuevaCategoria" value={form.nuevaCategoria} onChange={handleFormChange}
                                            placeholder="Ej: Bebidas"
                                            maxLength={30}
                                            className={inputCls('nuevaCategoria')}
                                            autoFocus
                                        />
                                        {form.nuevaCategoria.length === 30 && <p className="mt-1 text-xs text-amber-500">Límite de 30 caracteres alcanzado</p>}
                                        {camposError.nuevaCategoria && <p className="mt-1 text-xs text-red-500">{camposError.nuevaCategoria}</p>}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Precio de coste (€)
                                        </label>
                                        <input
                                            name="precioCoste" type="number" min="0" max="9999.99" step="0.01"
                                            value={form.precioCoste} onChange={handleFormChange}
                                            placeholder="0.00"
                                            className={inputCls('precioCoste')}
                                        />
                                        {camposError.precioCoste && <p className="mt-1 text-xs text-red-500">{camposError.precioCoste}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Precio de venta (€)
                                        </label>
                                        <input
                                            name="precioVenta" type="number" min="0" max="9999.99" step="0.01"
                                            value={form.precioVenta} onChange={handleFormChange}
                                            placeholder="0.00"
                                            className={inputCls('precioVenta')}
                                        />
                                        {camposError.precioVenta && <p className="mt-1 text-xs text-red-500">{camposError.precioVenta}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Tipo de IVA
                                    </label>
                                    <select
                                        name="iva" value={form.iva} onChange={handleFormChange}
                                        className={inputCls('iva')}
                                    >
                                        <option value="21">21% — General</option>
                                        <option value="10">10% — Reducido</option>
                                        <option value="4">4% — Superreducido</option>
                                        <option value="0">0% — Exento</option>
                                    </select>
                                    {camposError.iva && <p className="mt-1 text-xs text-red-500">{camposError.iva}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Stock (unidades)
                                    </label>
                                    <input
                                        name="stock" type="number" min="0" max="9999" step="1"
                                        value={form.stock} onChange={handleFormChange}
                                        placeholder="0"
                                        className={inputCls('stock')}
                                    />
                                    {camposError.stock && <p className="mt-1 text-xs text-red-500">{camposError.stock}</p>}
                                </div>
                            </div>
                            {productoEditando && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Estado
                                    </label>
                                    <select
                                        name="estado" value={form.estado} onChange={handleFormChange}
                                        className={inputCls('estado')}
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>
                            )}
                            {/* Error del formulario */}
                            {formError && (
                                <div className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={cerrarModal} disabled={guardando}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium
                                            text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="flex-1 py-2.5 bg-kaja-orange text-white rounded-lg text-sm font-semibold
                                                hover:brightness-90 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed">
                                    {guardando ? 'Guardando...' : productoEditando ? 'Guardar cambios' : 'Guardar producto'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    )
}
