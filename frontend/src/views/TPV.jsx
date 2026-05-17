import { useEffect, useState } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, X, CheckCircle, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'

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

async function generarTicketPDF(venta, empresa) {
    // Carga el logo como base64
    let logoInfo = null
    try {
        logoInfo = await new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                canvas.getContext('2d').drawImage(img, 0, 0)
                resolve({ data: canvas.toDataURL('image/png'), aspect: img.height / img.width })
            }
            img.onerror = reject
            img.src = '/img/kaja-transparente.webp'
        })
    } catch { /* sin logo, usará texto */ }

    const alturaEstimada = 160 + venta.lineas.length * 26
    const doc = new jsPDF({ unit: 'mm', format: [80, alturaEstimada], orientation: 'portrait' })
    const W = 80
    let y = 8

    const centro = (txt, size = 10, bold = false) => {
        doc.setFontSize(size)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.text(String(txt), W / 2, y, { align: 'center' })
        y += size * 0.45 + 2
    }
    const par = (a, b, size = 8) => {
        doc.setFontSize(size)
        doc.setFont('helvetica', 'normal')
        doc.text(a, 5, y)
        doc.text(b, W - 5, y, { align: 'right' })
        y += size * 0.45 + 1.5
    }
    const separador = () => {
        doc.setLineWidth(0.2)
        doc.line(5, y, W - 5, y)
        y += 3
    }

    // Cabecera: logo o texto
    if (logoInfo) {
        const logoW = 38
        const logoH = logoW * logoInfo.aspect
        doc.addImage(logoInfo.data, 'PNG', (W - logoW) / 2, y, logoW, logoH)
        y += logoH + 3
    } else {
        centro('KAJA', 16, true)
    }

    // Datos del negocio
    if (empresa) {
        if (empresa.nombreComercial) centro(empresa.nombreComercial, 10, true)
        if (empresa.razonSocial && empresa.razonSocial !== empresa.nombreComercial)
            centro(empresa.razonSocial, 8)
        if (empresa.nif) centro('NIF: ' + empresa.nif, 7)
        if (empresa.direccion) centro(empresa.direccion, 7)
        if (empresa.email) centro(empresa.email, 7)
    }
    separador()

    // Info de la venta
    const fecha = new Date(venta.fecha)
    par('Fecha:', fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }))
    par('Hora:', fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    par('Vendedor:', venta.vendedor)
    par('Nº Venta:', String(venta.id))
    separador()

    // Cabecera columnas
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Producto', 5, y)
    doc.text('Ud', 53, y, { align: 'center' })
    doc.text('Total', W - 5, y, { align: 'right' })
    y += 5
    separador()

    // Líneas con desglose de IVA
    for (const item of venta.lineas) {
        const precioConIva = parseFloat(item.precioVenta)
        const ivaRate = (item.iva ?? 21) / 100
        const precioSinIva = ivaRate > 0 ? precioConIva / (1 + ivaRate) : precioConIva
        const ivaUnit = precioConIva - precioSinIva
        const subtotal = precioConIva * item.cantidad

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)

        // Nombre completo con salto de línea automático
        const lineasNombre = doc.splitTextToSize(item.nombre, 43)
        doc.text(lineasNombre[0], 5, y)
        doc.text(String(item.cantidad), 53, y, { align: 'center' })
        doc.text(subtotal.toFixed(2) + ' €', W - 5, y, { align: 'right' })
        y += 4
        for (let i = 1; i < lineasNombre.length; i++) {
            doc.text(lineasNombre[i], 5, y)
            y += 4
        }

        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(110, 110, 110)
        doc.text(`P.unit s/IVA: ${precioSinIva.toFixed(2)}€   IVA(${item.iva ?? 21}%): ${ivaUnit.toFixed(2)}€`, 7, y)
        doc.setTextColor(0, 0, 0)
        y += 5
    }
    separador()

    // Resumen fiscal
    par('Base imponible:', parseFloat(venta.baseImponible).toFixed(2) + ' €')
    par('IVA total:', parseFloat(venta.totalIva).toFixed(2) + ' €')
    y += 2
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', 5, y)
    doc.text(parseFloat(venta.totalFinal).toFixed(2) + ' €', W - 5, y, { align: 'right' })
    y += 9
    separador()
    centro('¡Gracias por su compra!', 9)

    doc.save(`ticket-venta-${venta.id}.pdf`)
}

export default function TPV({ usuario }) {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [categoriaActiva, setCategoriaActiva] = useState('todas')
    const [carrito, setCarrito] = useState([])
    const [vistaMovil, setVistaMovil] = useState('productos')

    // Cobro
    const [modalConfirmar, setModalConfirmar] = useState(false)
    const [cargandoCobro, setCargandoCobro] = useState(false)
    const [errorCobro, setErrorCobro] = useState('')
    const [ventaCobrada, setVentaCobrada] = useState(null)
    const [empresa, setEmpresa] = useState(null)

    useEffect(() => {
        async function cargar() {
            setLoading(true)
            setError('')
            try {
                const [dataProductos, dataEmpresa] = await Promise.all([
                    fetchJSON(`${API_URL}/productos?pagina=1&porPagina=999`),
                    fetchJSON(`${API_URL}/empresa`).catch(() => null),
                ])
                const lista = dataProductos.datos ?? []
                setProductos(lista)
                const cats = [...new Map(lista.map(p => [p.idCategoria, { id: p.idCategoria, nombre: p.categoria }])).values()]
                setCategorias(cats)
                setEmpresa(dataEmpresa)
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

    async function confirmarVenta() {
        setCargandoCobro(true)
        setErrorCobro('')
        try {
            const lineas = carrito.map(item => ({
                id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precioVenta: item.precioVenta,
                iva: item.iva ?? 21,
            }))
            const res = await fetch(`${API_URL}/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers() },
                body: JSON.stringify({ lineas }),
            })
            const text = await res.text()
            let data
            try { data = JSON.parse(text) } catch { throw new Error('Respuesta inesperada del servidor') }
            if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)

            setVentaCobrada({
                ...data,
                fecha: new Date().toISOString(),
                vendedor: usuario?.nombre ?? '',
                lineas: carrito,
            })
            setModalConfirmar(false)
            setCarrito([])
        } catch (e) {
            setErrorCobro(e.message)
        } finally {
            setCargandoCobro(false)
        }
    }

    const total = carrito.reduce((acc, item) => acc + parseFloat(item.precioVenta) * item.cantidad, 0)
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0)

    const panelProductos = (
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100 min-w-0">
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
                                            <div className="flex items-end justify-between w-full mt-auto">
                                                <span className="text-base font-bold text-kaja-orange">
                                                    {parseFloat(p.precioVenta).toFixed(2)} €
                                                </span>
                                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                                                    p.stock <= 5
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {p.stock} uds
                                                </span>
                                            </div>
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

            <div className="border-t border-gray-200 p-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-bold text-kaja-blue">TOTAL</span>
                    <span className="text-2xl font-bold text-kaja-blue">{total.toFixed(2)} €</span>
                </div>
                <button
                    onClick={() => { setErrorCobro(''); setModalConfirmar(true) }}
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
                <div className={`flex-1 flex flex-col overflow-hidden md:hidden ${vistaMovil === 'productos' ? '' : 'hidden'}`}>
                    {panelProductos}
                </div>
                <div className={`flex-1 flex flex-col overflow-hidden md:hidden ${vistaMovil === 'carrito' ? '' : 'hidden'}`}>
                    {panelCarrito}
                </div>
                <div className="hidden md:flex flex-1 overflow-hidden">
                    {panelProductos}
                    {panelCarrito}
                </div>
            </div>

            {/* Modal confirmación */}
            {modalConfirmar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
                        <h2 className="text-lg font-bold text-kaja-blue text-center">Confirmar cobro</h2>

                        {/* Resumen del ticket */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 max-h-52 overflow-y-auto">
                            {carrito.map(item => (
                                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                    <span className="flex-1 truncate pr-2">{item.nombre} <span className="text-gray-400">×{item.cantidad}</span></span>
                                    <span className="font-semibold shrink-0">{(parseFloat(item.precioVenta) * item.cantidad).toFixed(2)} €</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-kaja-blue">
                                <span>TOTAL</span>
                                <span>{total.toFixed(2)} €</span>
                            </div>
                        </div>

                        {errorCobro && (
                            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorCobro}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setModalConfirmar(false)}
                                disabled={cargandoCobro}
                                className="flex-1 py-3 rounded-xl bg-kaja-light text-kaja-blueText font-bold
                                            hover:brightness-90 active:scale-95 transition disabled:opacity-50"
                            >
                                No
                            </button>
                            <button
                                onClick={confirmarVenta}
                                disabled={cargandoCobro}
                                className="flex-1 py-3 rounded-xl bg-kaja-orange text-kaja-blueText font-bold
                                            hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {cargandoCobro
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</>
                                    : 'Sí, cobrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal ticket cobrado */}
            {ventaCobrada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                            <h2 className="text-lg font-bold text-kaja-blue">¡Venta registrada!</h2>
                            <p className="text-sm text-gray-400">Nº {ventaCobrada.id}</p>
                        </div>

                        {/* Vista previa del ticket */}
                        <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs space-y-1 max-h-72 overflow-y-auto">
                            {/* Cabecera negocio */}
                            <img src="/img/kaja-transparente.webp" alt="KAJA" className="h-10 object-contain mx-auto mb-1" />
                            {empresa && (
                                <div className="text-center space-y-0.5 mb-1 mt-1">
                                    {empresa.nombreComercial && <p className="font-bold">{empresa.nombreComercial}</p>}
                                    {empresa.razonSocial && empresa.razonSocial !== empresa.nombreComercial && <p className="text-gray-500">{empresa.razonSocial}</p>}
                                    {empresa.nif && <p className="text-gray-400">NIF: {empresa.nif}</p>}
                                    {empresa.direccion && <p className="text-gray-400">{empresa.direccion}</p>}
                                    {empresa.email && <p className="text-gray-400">{empresa.email}</p>}
                                </div>
                            )}
                            <div className="border-t border-dashed border-gray-300 my-1" />

                            {/* Info venta */}
                            <div className="flex justify-between text-gray-500">
                                <span>Fecha</span>
                                <span>{new Date(ventaCobrada.fecha).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Hora</span>
                                <span>{new Date(ventaCobrada.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Vendedor</span>
                                <span>{ventaCobrada.vendedor}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Nº Venta</span>
                                <span>{ventaCobrada.id}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-300 my-1" />

                            {/* Líneas con desglose */}
                            {ventaCobrada.lineas.map(item => {
                                const precioConIva = parseFloat(item.precioVenta)
                                const ivaRate = (item.iva ?? 21) / 100
                                const precioSinIva = ivaRate > 0 ? precioConIva / (1 + ivaRate) : precioConIva
                                const ivaUnit = precioConIva - precioSinIva
                                const subtotal = precioConIva * item.cantidad
                                return (
                                    <div key={item.id} className="space-y-0.5 py-0.5">
                                        <div className="flex justify-between font-semibold gap-2">
                                            <span className="flex-1 min-w-0 wrap-break-word leading-tight">{item.nombre} ×{item.cantidad}</span>
                                            <span className="shrink-0">{subtotal.toFixed(2)} €</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400 pl-2">
                                            <span>P.unit s/IVA: {precioSinIva.toFixed(2)} €</span>
                                            <span>IVA({item.iva ?? 21}%): {ivaUnit.toFixed(2)} €</span>
                                        </div>
                                    </div>
                                )
                            })}
                            <div className="border-t border-dashed border-gray-300 my-1" />

                            {/* Resumen fiscal */}
                            <div className="flex justify-between text-gray-500">
                                <span>Base imponible</span>
                                <span>{parseFloat(ventaCobrada.baseImponible).toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>IVA total</span>
                                <span>{parseFloat(ventaCobrada.totalIva).toFixed(2)} €</span>
                            </div>
                            <div className="border-t border-dashed border-gray-300 my-1" />
                            <div className="flex justify-between font-bold text-sm">
                                <span>TOTAL</span>
                                <span>{parseFloat(ventaCobrada.totalFinal).toFixed(2)} €</span>
                            </div>
                            <p className="text-center text-gray-400 mt-2">¡Gracias por su compra!</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setVentaCobrada(null)}
                                className="flex-1 py-3 rounded-xl bg-kaja-light text-kaja-blueText font-bold
                                            hover:brightness-90 active:scale-95 transition"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => generarTicketPDF(ventaCobrada, empresa).then(() => setVentaCobrada(null))}
                                className="flex-1 py-3 rounded-xl bg-kaja-orange text-kaja-blueText font-bold
                                            hover:brightness-90 active:scale-95 transition flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Descargar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
