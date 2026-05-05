import { useEffect, useState } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, X } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

function headers() {
    return { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` }
}

async function fetchJSON(url) {
    const res = await fetch(url, { headers: headers() })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { throw new Error(`Respuesta inesperada del servidor (${res.status})`) }
    if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)
    return data
}

export default function TPV() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [categoriaActiva, setCategoriaActiva] = useState('todas')
    const [carrito, setCarrito] = useState([])
    const [vistaMovil, setVistaMovil] = useState('productos')

    useEffect(() => {
        async function cargar() {
            setLoading(true)
            setError('')
            try {
                const data = await fetchJSON(`${API_URL}/productos?pagina=1&porPagina=999`)
                const lista = data.datos ?? []
                setProductos(lista)
                const cats = [...new Map(lista.map(p => [p.idCategoria, { id: p.idCategoria, nombre: p.categoria }])).values()]
                setCategorias(cats)
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        cargar()
    }, [])

    const productosFiltrados = productos.filter(p => {
        const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        const matchCategoria = categoriaActiva === 'todas' || String(p.idCategoria) === String(categoriaActiva)
        return matchBusqueda && matchCategoria && p.stock > 0
    })

    function agregarAlCarrito(producto) {
        setCarrito(prev => {
            const existe = prev.find(item => item.id === producto.id)
            if (existe) {
                if (existe.cantidad >= producto.stock) return prev
                return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item)
            }
            return [...prev, { ...producto, cantidad: 1 }]
        })
    }

    function cambiarCantidad(id, delta) {
        setCarrito(prev =>
            prev.map(item => item.id === id ? { ...item, cantidad: item.cantidad + delta } : item)
                .filter(item => item.cantidad > 0)
        )
    }

    function eliminarDelCarrito(id) {
        setCarrito(prev => prev.filter(item => item.id !== id))
    }

    const total = carrito.reduce((acc, item) => acc + parseFloat(item.precioVenta) * item.cantidad, 0)
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0)

    const panelProductos = (
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100 min-w-0">
            {/* Buscador y categorías */}
            <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                                    focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-kaja-blue transition"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setCategoriaActiva('todas')}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition
                            ${categoriaActiva === 'todas'
                                ? 'bg-kaja-orange text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Todas
                    </button>
                    {categorias.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoriaActiva(String(cat.id))}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition
                                ${categoriaActiva === String(cat.id)
                                    ? 'bg-kaja-orange text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de productos */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                    <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
                        <Loader2 className="animate-spin w-5 h-5 text-kaja-orange" />
                        <span className="text-sm">Cargando productos...</span>
                    </div>
                )}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
                )}
                {!loading && !error && (
                    productosFiltrados.length === 0
                        ? <div className="text-center py-16 text-gray-400 text-sm">No se encontraron productos</div>
                        : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {productosFiltrados.map(p => {
                                    const enCarrito = carrito.find(item => item.id === p.id)
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => agregarAlCarrito(p)}
                                            className={`relative flex flex-col items-start p-3 rounded-xl border-2 text-left transition active:scale-95
                                                ${enCarrito
                                                    ? 'border-kaja-orange bg-orange-50'
                                                    : 'border-gray-100 bg-white hover:border-kaja-orange/50 hover:bg-orange-50/40 shadow-sm'}`}
                                        >
                                            <span className="text-xs text-gray-400 mb-1 truncate w-full">{p.categoria}</span>
                                            <span className="text-sm font-semibold text-gray-800 leading-tight mb-3 line-clamp-2">{p.nombre}</span>
                                            <span className="text-base font-bold text-kaja-orange mt-auto">
                                                {parseFloat(p.precioVenta).toFixed(2)} €
                                            </span>
                                            {enCarrito && (
                                                <span className="absolute top-2 right-2 w-5 h-5 bg-kaja-orange rounded-full text-white text-xs flex items-center justify-center font-bold">
                                                    {enCarrito.cantidad}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )
                )}
            </div>
        </div>
    )

    const panelCarrito = (
        <div className="w-full md:w-80 shrink-0 flex flex-col bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-kaja-blue" />
                    <span className="font-semibold text-kaja-blue text-sm">Ticket</span>
                    {totalItems > 0 && (
                        <span className="text-xs bg-kaja-orange text-white rounded-full px-2 py-0.5 font-bold">{totalItems}</span>
                    )}
                </div>
                {carrito.length > 0 && (
                    <button
                        onClick={() => setCarrito([])}
                        className="text-xs text-red-400 hover:text-red-600 transition font-medium flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" />
                        Limpiar
                    </button>
                )}
            </div>

            {/* Líneas */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {carrito.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3 py-12">
                        <ShoppingCart className="w-12 h-12" />
                        <p className="text-sm">El ticket está vacío</p>
                    </div>
                ) : (
                    carrito.map(item => (
                        <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-50">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-800 leading-tight flex-1">{item.nombre}</span>
                                <button
                                    onClick={() => eliminarDelCarrito(item.id)}
                                    className="text-gray-300 hover:text-red-400 transition shrink-0 mt-0.5"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => cambiarCantidad(item.id, -1)}
                                        className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-bold w-5 text-center text-gray-800">{item.cantidad}</span>
                                    <button
                                        onClick={() => cambiarCantidad(item.id, 1)}
                                        disabled={item.cantidad >= item.stock}
                                        className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <span className="text-sm font-bold text-kaja-orange">
                                    {(parseFloat(item.precioVenta) * item.cantidad).toFixed(2)} €
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total y cobrar */}
            <div className="border-t border-gray-200 p-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-bold text-kaja-blue">TOTAL</span>
                    <span className="text-2xl font-bold text-kaja-blue">{total.toFixed(2)} €</span>
                </div>
                <button
                    disabled={carrito.length === 0}
                    className="w-full py-3.5 bg-kaja-orange text-white font-bold text-base rounded-xl
                                hover:brightness-90 active:scale-95 transition
                                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                    COBRAR
                </button>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* Tabs móvil */}
            <div className="flex md:hidden border-b border-gray-200 shrink-0 bg-white">
                <button
                    onClick={() => setVistaMovil('productos')}
                    className={`flex-1 py-3 text-sm font-semibold transition
                        ${vistaMovil === 'productos'
                            ? 'text-kaja-orange border-b-2 border-kaja-orange'
                            : 'text-gray-400'}`}
                >
                    Productos
                </button>
                <button
                    onClick={() => setVistaMovil('carrito')}
                    className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2
                        ${vistaMovil === 'carrito'
                            ? 'text-kaja-orange border-b-2 border-kaja-orange'
                            : 'text-gray-400'}`}
                >
                    Ticket
                    {totalItems > 0 && (
                        <span className="text-xs bg-kaja-orange text-white rounded-full px-2 py-0.5 font-bold">{totalItems}</span>
                    )}
                </button>
            </div>

            {/* Contenido */}
            <div className="flex flex-1 overflow-hidden">
                {/* Móvil: alternar paneles */}
                <div className={`flex-1 flex flex-col overflow-hidden md:hidden ${vistaMovil === 'productos' ? '' : 'hidden'}`}>
                    {panelProductos}
                </div>
                <div className={`flex-1 flex flex-col overflow-hidden md:hidden ${vistaMovil === 'carrito' ? '' : 'hidden'}`}>
                    {panelCarrito}
                </div>

                {/* Desktop: ambos paneles */}
                <div className="hidden md:flex flex-1 overflow-hidden">
                    {panelProductos}
                    {panelCarrito}
                </div>
            </div>

        </div>
    )
}
