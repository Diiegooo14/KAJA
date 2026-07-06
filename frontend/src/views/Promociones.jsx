import { useEffect, useState } from 'react'
import { Pencil, Plus, Loader2, Check, X, Trash2, Percent, Tag, Package } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const FORM_VACIO = { tipo: 'PRODUCTO', idProducto: '', idCategoria: '', cantidad: '', precioTotal: '', estado: 'Activo' }

export default function Promociones() {
    const [promociones, setPromociones] = useState([])
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [notificacion, setToast] = useState('')
    function mostrarNotificacion(mensaje) {
        setToast(mensaje)
        setTimeout(() => setToast(''), 3000)
    }

    const [modalAbierto, setModalAbierto] = useState(false)
    const [promoEditando, setPromoEditando] = useState(null)
    const [form, setForm] = useState(FORM_VACIO)
    const [camposError, setCamposError] = useState({})
    const [formError, setFormError] = useState('')
    const [guardando, setGuardando] = useState(false)

    const [promoParaEliminar, setPromoParaEliminar] = useState(null)
    const [eliminando, setEliminando] = useState(false)

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

    async function cargarTodo() {
        setLoading(true)
        setError('')
        try {
            const [promos, prods, cats] = await Promise.all([
                fetchJSON(`${API_URL}/promociones`),
                fetchJSON(`${API_URL}/productos?pagina=1&porPagina=999`),
                fetchJSON(`${API_URL}/categorias`),
            ])
            setPromociones(promos)
            setProductos(prods.datos ?? [])
            setCategorias(cats)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargarTodo() }, [])

    function abrirModal(promo = null) {
        setPromoEditando(promo)
        setCamposError({})
        setFormError('')
        setForm(promo
            ? {
                tipo: promo.tipo,
                idProducto: promo.idProducto ? String(promo.idProducto) : '',
                idCategoria: promo.idCategoria ? String(promo.idCategoria) : '',
                cantidad: String(promo.cantidad),
                precioTotal: String(promo.precioTotal),
                estado: promo.estado,
            }
            : FORM_VACIO)
        setModalAbierto(true)
    }

    function cerrarModal() {
        if (guardando) return
        setModalAbierto(false)
        setPromoEditando(null)
    }

    function handleFormChange(e) {
        const { name, value } = e.target
        setForm(prev => {
            const updated = { ...prev, [name]: value }
            if (name === 'tipo') { updated.idProducto = ''; updated.idCategoria = '' }
            return updated
        })
        setCamposError(prev => ({ ...prev, [name]: '' }))
    }

    async function handleGuardar(e) {
        e.preventDefault()
        setFormError('')

        const idProducto = parseInt(form.idProducto, 10)
        const idCategoria = parseInt(form.idCategoria, 10)
        const cantidad = parseInt(form.cantidad, 10)
        const precioTotal = parseFloat(form.precioTotal)

        const errores = {}
        if (form.tipo === 'PRODUCTO' && !idProducto) errores.idProducto = 'Selecciona un producto.'
        if (form.tipo === 'CATEGORIA' && !idCategoria) errores.idCategoria = 'Selecciona una categoría.'
        if (isNaN(cantidad) || cantidad < 2) errores.cantidad = 'Mínimo 2 unidades.'
        if (isNaN(precioTotal) || precioTotal <= 0) errores.precioTotal = 'Debe ser mayor que 0.'

        if (Object.keys(errores).length > 0) {
            setCamposError(errores)
            return
        }

        setGuardando(true)
        try {
            if (promoEditando) {
                await fetchJSON(`${API_URL}/promociones?id=${promoEditando.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cantidad, precioTotal, estado: form.estado }),
                })
            } else {
                await fetchJSON(`${API_URL}/promociones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tipo: form.tipo, idProducto, idCategoria, cantidad, precioTotal }),
                })
            }
            setModalAbierto(false)
            setPromoEditando(null)
            mostrarNotificacion(promoEditando ? 'Promoción actualizada correctamente' : 'Promoción creada correctamente')
            cargarTodo()
        } catch (e) {
            setFormError(e.message)
        } finally {
            setGuardando(false)
        }
    }

    async function eliminarPromo() {
        if (!promoParaEliminar) return
        setEliminando(true)
        try {
            await fetchJSON(`${API_URL}/promociones?id=${promoParaEliminar.id}`, { method: 'DELETE' })
            setPromoParaEliminar(null)
            mostrarNotificacion('Promoción eliminada correctamente')
            cargarTodo()
        } catch (e) {
            mostrarNotificacion('Error: ' + e.message)
            setPromoParaEliminar(null)
        } finally {
            setEliminando(false)
        }
    }

    function inputCls(campo) {
        const base = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition'
        return camposError[campo]
            ? `${base} border-red-400 focus:ring-red-100 focus:border-red-400`
            : `${base} border-gray-200 focus:ring-kaja-light focus:border-kaja-blue`
    }

    const productosSinPromo = productos.filter(p => !promociones.some(pr => pr.idProducto === p.id))
    const categoriasSinPromo = categorias.filter(c => !promociones.some(pr => pr.idCategoria === c.id))

    return (
        <div className="p-6 max-w-5xl mx-auto w-full">

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-kaja-blue">Promociones</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Ofertas de N unidades por precio fijo</p>
                </div>
                <button
                    onClick={() => abrirModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-kaja-orange text-white text-sm font-semibold
                                rounded-lg hover:brightness-90 active:scale-95 transition"
                >
                    <Plus className="w-4 h-4" />
                    Nueva promoción
                </button>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
                    <Loader2 className="animate-spin w-5 h-5 text-kaja-orange" />
                    <span className="text-sm">Cargando promociones...</span>
                </div>
            )}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {promociones.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 text-sm">No hay promociones creadas todavía</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-150">
                                <thead>
                                    <tr className="bg-kaja-sidebar">
                                        <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Tipo</th>
                                        <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Producto / Categoría</th>
                                        <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Oferta</th>
                                        <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Estado</th>
                                        <th className="w-20 bg-kaja-sidebar"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promociones.map(p => (
                                        <tr key={p.id} className="border-b border-gray-100 hover:bg-kaja-orange/5 transition">
                                            <td className="px-4 py-3.5">
                                                {p.tipo === 'PRODUCTO'
                                                    ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-kaja-light text-kaja-blueText/70"><Package className="w-3.5 h-3.5" /> Producto</span>
                                                    : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600"><Tag className="w-3.5 h-3.5" /> Categoría</span>}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-kaja-blueText">
                                                {p.tipo === 'PRODUCTO' ? p.producto : p.categoria}
                                                {p.tipo === 'PRODUCTO' && (
                                                    <span className="ml-2 text-xs text-kaja-blueText/40 tabular-nums">{parseFloat(p.precioVenta).toFixed(2)} €/ud</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-kaja-orange/10 text-kaja-orange font-bold tabular-nums">
                                                    <Percent className="w-3.5 h-3.5" />
                                                    {p.cantidad} × {parseFloat(p.precioTotal).toFixed(2)} €
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {p.estado === 'Activo'
                                                    ? <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">Activa</span>
                                                    : <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500">Inactiva</span>}
                                            </td>
                                            <td className="px-3 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => abrirModal(p)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-kaja-blue hover:bg-kaja-light transition"
                                                        title="Editar promoción"
                                                        aria-label="Editar promoción"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setPromoParaEliminar(p)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                                        title="Eliminar promoción"
                                                        aria-label="Eliminar promoción"
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

            {notificacion && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3
                                bg-green-600 text-white text-sm font-medium rounded-xl shadow-lg
                                animate-fade-in">
                    <Check className="w-5 h-5 shrink-0" />
                    {notificacion}
                </div>
            )}

            {promoParaEliminar && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !eliminando && setPromoParaEliminar(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <div className="flex flex-col items-center gap-3 mb-5 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">Eliminar promoción</h3>
                            <p className="text-sm text-gray-500">
                                ¿Seguro que quieres eliminar la promoción de <span className="font-semibold text-gray-700">"{promoParaEliminar.tipo === 'PRODUCTO' ? promoParaEliminar.producto : promoParaEliminar.categoria}"</span>?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPromoParaEliminar(null)}
                                disabled={eliminando}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={eliminarPromo}
                                disabled={eliminando}
                                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {eliminando ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando…</> : 'Sí, eliminar'}
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
                                {promoEditando ? 'Editar promoción' : 'Nueva promoción'}
                            </h2>
                            <button onClick={cerrarModal}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} noValidate>
                            <div className="space-y-4">
                                {!promoEditando && (
                                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                                        {[{ v: 'PRODUCTO', l: 'Producto' }, { v: 'CATEGORIA', l: 'Categoría' }].map(op => (
                                            <button
                                                key={op.v}
                                                type="button"
                                                onClick={() => handleFormChange({ target: { name: 'tipo', value: op.v } })}
                                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition
                                                    ${form.tipo === op.v ? 'bg-white text-kaja-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {op.l}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {form.tipo === 'PRODUCTO' ? (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Producto
                                        </label>
                                        <select
                                            name="idProducto" value={form.idProducto} onChange={handleFormChange}
                                            disabled={!!promoEditando}
                                            className={inputCls('idProducto') + (promoEditando ? ' bg-gray-50 text-gray-400' : '')}
                                        >
                                            <option value="">Selecciona un producto...</option>
                                            {promoEditando && (
                                                <option value={promoEditando.idProducto}>{promoEditando.producto}</option>
                                            )}
                                            {!promoEditando && productosSinPromo.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre} ({parseFloat(p.precioVenta).toFixed(2)} €/ud)</option>
                                            ))}
                                        </select>
                                        {camposError.idProducto && <p className="mt-1 text-xs text-red-500">{camposError.idProducto}</p>}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Categoría
                                        </label>
                                        <select
                                            name="idCategoria" value={form.idCategoria} onChange={handleFormChange}
                                            disabled={!!promoEditando}
                                            className={inputCls('idCategoria') + (promoEditando ? ' bg-gray-50 text-gray-400' : '')}
                                        >
                                            <option value="">Selecciona una categoría...</option>
                                            {promoEditando && (
                                                <option value={promoEditando.idCategoria}>{promoEditando.categoria}</option>
                                            )}
                                            {!promoEditando && categoriasSinPromo.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                        {camposError.idCategoria && <p className="mt-1 text-xs text-red-500">{camposError.idCategoria}</p>}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Unidades
                                        </label>
                                        <input
                                            name="cantidad" type="number" min="2" step="1"
                                            value={form.cantidad} onChange={handleFormChange}
                                            placeholder="Ej: 2"
                                            className={inputCls('cantidad')}
                                        />
                                        {camposError.cantidad && <p className="mt-1 text-xs text-red-500">{camposError.cantidad}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Precio total (€)
                                        </label>
                                        <input
                                            name="precioTotal" type="number" min="0" step="0.01"
                                            value={form.precioTotal} onChange={handleFormChange}
                                            placeholder="Ej: 5.00"
                                            className={inputCls('precioTotal')}
                                        />
                                        {camposError.precioTotal && <p className="mt-1 text-xs text-red-500">{camposError.precioTotal}</p>}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {form.tipo === 'PRODUCTO'
                                        ? 'Ejemplo: 2 unidades por 5,00 € — al añadir 2 (o múltiplos) de este producto en el TPV, se aplicará el precio de oferta.'
                                        : 'Ejemplo: 2 unidades por 5,00 € — al combinar 2 (o múltiplos) de cualquier producto de esta categoría en el TPV, se aplicará el precio de oferta.'}
                                </p>

                                {promoEditando && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                            Estado
                                        </label>
                                        <select
                                            name="estado" value={form.estado} onChange={handleFormChange}
                                            className={inputCls('estado')}
                                        >
                                            <option value="Activo">Activa</option>
                                            <option value="Inactivo">Inactiva</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {formError && (
                                <div className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={cerrarModal} disabled={guardando}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium
                                            text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="flex-1 py-2.5 bg-kaja-orange text-white rounded-lg text-sm font-semibold
                                                hover:brightness-90 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed">
                                    {guardando ? 'Guardando...' : promoEditando ? 'Guardar cambios' : 'Crear promoción'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
