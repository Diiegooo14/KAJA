import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

const FORM_VACIO = {
    nombre: '',
    idCategoria: '',
    nuevaCategoria: '',
    precioCoste: '',
    precioVenta: '',
    stock: '',
}

export default function Inventario() {
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busqueda, setBusqueda] = useState('')

    // Modal
    const [modalAbierto, setModalAbierto] = useState(false)
    const [categorias, setCategorias] = useState([])
    const [form, setForm] = useState(FORM_VACIO)
    const [formError, setFormError] = useState('')
    const [guardando, setGuardando] = useState(false)

    useEffect(() => { cargarProductos() }, [])

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

    async function cargarProductos(search = '') {
        setLoading(true)
        setError('')
        try {
            const url = search ? `${API_URL}/productos?search=${encodeURIComponent(search)}` : `${API_URL}/productos`
            setProductos(await fetchJSON(url))
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
        window._busquedaTimer = setTimeout(() => cargarProductos(val), 300)
    }

    async function abrirModal() {
        setForm(FORM_VACIO)
        setFormError('')
        setModalAbierto(true)
        try {
            const data = await fetchJSON(`${API_URL}/categorias`)
            setCategorias(data)
        } catch (e) {
            setFormError('No se pudieron cargar las categorías: ' + e.message)
        }
    }

    function cerrarModal() {
        if (guardando) return
        setModalAbierto(false)
        setFormError('')
    }

    function handleFormChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleGuardar(e) {
        e.preventDefault()
        setFormError('')

        const nombre = form.nombre.trim()
        const precioCoste = parseFloat(form.precioCoste)
        const precioVenta = parseFloat(form.precioVenta)
        const stock = parseInt(form.stock, 10)
        const esNueva = form.idCategoria === '__nueva__'
        const nombreCat = form.nuevaCategoria.trim()

        if (!nombre) return setFormError('El nombre del producto es obligatorio.')
        if (!form.idCategoria) return setFormError('Selecciona o crea una categoría.')
        if (esNueva && !nombreCat) return setFormError('Escribe el nombre de la nueva categoría.')
        if (isNaN(precioCoste) || precioCoste <= 0) return setFormError('El precio de coste debe ser mayor que 0.')
        if (isNaN(precioVenta) || precioVenta <= 0) return setFormError('El precio de venta debe ser mayor que 0.')
        if (isNaN(stock) || stock < 0) return setFormError('El stock no puede ser negativo.')

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

            await fetchJSON(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, idCategoria, precioCoste, precioVenta, stock }),
            })

            setModalAbierto(false)
            cargarProductos(busqueda)
        } catch (e) {
            setFormError(e.message)
        } finally {
            setGuardando(false)
        }
    }

    function badgeStock(stock) {
        if (stock === 0)
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Sin stock</span>
        if (stock <= 5)
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{stock} uds</span>
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{stock} uds</span>
    }

    const inputCls = `w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
    focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-kaja-blue transition`

    return (
        <div className="p-6 max-w-5xl mx-auto w-full">

            {/* Cabecera */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-kaja-blue">Inventario</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Listado de productos en la base de datos</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{productos.length} productos</span>
                    <button
                        onClick={abrirModal}
                        className="flex items-center gap-2 px-4 py-2 bg-kaja-orange text-white text-sm font-semibold
                                    rounded-lg hover:brightness-90 active:scale-95 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir producto
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="mb-5">
                <div className="relative max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={handleBusqueda}
                        placeholder="Buscar producto..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                                    focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-kaja-blue transition"
                    />
                </div>
            </div>

            {/* Estado carga / error */}
            {loading && (
                <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
                    <svg className="animate-spin w-5 h-5 text-kaja-orange" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
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
                        <div className="text-center py-16 text-gray-400 text-sm">No se encontraron productos</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-600">P. Coste</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-600">P. Venta</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((p, i) => (
                                    <tr key={p.id}
                                        className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}>
                                        <td className="px-4 py-3 text-gray-400">{p.id}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-kaja-light text-kaja-blue font-medium">
                                                {p.categoria}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">{parseFloat(p.precioCoste).toFixed(2)} €</td>
                                        <td className="px-4 py-3 text-right font-semibold text-kaja-blue">{parseFloat(p.precioVenta).toFixed(2)} €</td>
                                        <td className="px-4 py-3 text-center">{badgeStock(p.stock)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-kaja-blue">Nuevo producto</h2>
                            <button onClick={cerrarModal}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Categoría
                                    </label>
                                    <select
                                        name="idCategoria" value={form.idCategoria} onChange={handleFormChange}
                                        className={inputCls}
                                    >
                                        <option value="">Selecciona una categoría...</option>
                                        {categorias.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                        <option value="__nueva__">+ Crear nueva categoría</option>
                                    </select>
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
                                            className={inputCls}
                                            autoFocus
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Precio de coste (€)
                                        </label>
                                        <input
                                            name="precioCoste" type="number" min="0" step="0.01"
                                            value={form.precioCoste} onChange={handleFormChange}
                                            placeholder="0.00"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Precio de venta (€)
                                        </label>
                                        <input
                                            name="precioVenta" type="number" min="0" step="0.01"
                                            value={form.precioVenta} onChange={handleFormChange}
                                            placeholder="0.00"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Stock (unidades)
                                    </label>
                                    <input
                                        name="stock" type="number" min="0" step="1"
                                        value={form.stock} onChange={handleFormChange}
                                        placeholder="0"
                                        className={inputCls}
                                    />
                                </div>
                            </div>
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
                                    {guardando ? 'Guardando...' : 'Guardar producto'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    )
}
