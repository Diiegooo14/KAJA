import { useEffect, useState } from 'react'
import { Trash2, Loader2, Plus, X, Receipt, Pencil } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const FORM_VACIO = { tipo: '', concepto: '', importe: '', fecha: '' }

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

export default function Gastos() {
    const hoy = new Date()
    const [mes, setMes] = useState(hoy.getMonth() + 1)
    const [anio, setAnio] = useState(hoy.getFullYear())

    const [gastos, setGastos] = useState([])
    const [resumen, setResumen] = useState({ totalMes: 0, totalFijos: 0, totalVariables: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [form, setForm] = useState(FORM_VACIO)
    const [formError, setFormError] = useState('')
    const [camposError, setCamposError] = useState({})
    const [guardando, setGuardando] = useState(false)

    const [eliminando, setEliminando] = useState(null)
    const [toast, setToast] = useState('')
    const [mostrarForm, setMostrarForm] = useState(false)
    const [gastoVisor, setGastoVisor] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [camposErrorEdit, setCamposErrorEdit] = useState({})
    const [editForm, setEditForm] = useState(FORM_VACIO)
    const [editError, setEditError] = useState('')
    const [guardandoEdit, setGuardandoEdit] = useState(false)

    function mostrarToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(''), 3000)
    }

    useEffect(() => { cargar() }, [mes, anio])

    async function cargar() {
        setLoading(true)
        setError('')
        try {
            const data = await fetchJSON(`${API_URL}/gastos?mes=${mes}&anio=${anio}`)
            setGastos(data.gastos ?? [])
            setResumen(data.resumen ?? { totalMes: 0, totalFijos: 0, totalVariables: 0 })
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function handleChange(e) {
        const { name, value } = e.target
        let finalValue = value
        let warning = ''
        if (name === 'importe' && value !== '' && parseFloat(value) > 9999.99) {
            finalValue = '9999.99'
            warning = 'El importe máximo es 9.999,99 €.'
        }
        setForm(prev => ({ ...prev, [name]: finalValue }))
        setCamposError(prev => ({ ...prev, [name]: warning }))
        setFormError('')
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.tipo) return setFormError('Selecciona el tipo de gasto.')
        if (!form.concepto.trim()) return setFormError('El concepto es obligatorio.')
        if (!form.importe || parseFloat(form.importe) <= 0) return setFormError('El importe debe ser mayor que 0.')
        if (!form.fecha) return setFormError('La fecha es obligatoria.')

        setGuardando(true)
        setFormError('')
        try {
            await fetchJSON(`${API_URL}/gastos`, {
                method: 'POST',
                body: JSON.stringify({
                    tipo: form.tipo,
                    concepto: form.concepto.trim(),
                    importe: parseFloat(form.importe),
                    fecha: form.fecha,
                }),
            })
            setForm(FORM_VACIO)
            mostrarToast('Gasto registrado correctamente')
            await cargar()
        } catch (e) {
            setFormError(e.message)
        } finally {
            setGuardando(false)
        }
    }

    function cerrarModal() {
        setGastoVisor(null)
        setModoEdicion(false)
        setEditError('')
    }

    function abrirEdicion() {
        setEditForm({
            tipo: gastoVisor.tipo,
            concepto: gastoVisor.concepto,
            importe: String(gastoVisor.importe),
            fecha: gastoVisor.fecha,
        })
        setEditError('')
        setModoEdicion(true)
    }

    function abrirEdicionDirecta(g) {
        setGastoVisor(g)
        setEditForm({
            tipo: g.tipo,
            concepto: g.concepto,
            importe: String(g.importe),
            fecha: g.fecha,
        })
        setEditError('')
        setModoEdicion(true)
    }

    function handleEditChange(e) {
        const { name, value } = e.target
        let finalValue = value
        let warning = ''
        if (name === 'importe' && value !== '' && parseFloat(value) > 9999.99) {
            finalValue = '9999.99'
            warning = 'El importe máximo es 9.999,99 €.'
        }
        setEditForm(prev => ({ ...prev, [name]: finalValue }))
        setCamposErrorEdit(prev => ({ ...prev, [name]: warning }))
        setEditError('')
    }

    async function handleGuardarEdicion() {
        if (!editForm.tipo) return setEditError('Selecciona el tipo de gasto.')
        if (!editForm.concepto.trim()) return setEditError('El concepto es obligatorio.')
        if (!editForm.importe || parseFloat(editForm.importe) <= 0) return setEditError('El importe debe ser mayor que 0.')
        if (!editForm.fecha) return setEditError('La fecha es obligatoria.')

        setGuardandoEdit(true)
        setEditError('')
        try {
            await fetchJSON(`${API_URL}/gastos`, {
                method: 'PUT',
                body: JSON.stringify({
                    id: gastoVisor.id,
                    tipo: editForm.tipo,
                    concepto: editForm.concepto.trim(),
                    importe: parseFloat(editForm.importe),
                    fecha: editForm.fecha,
                }),
            })
            mostrarToast('Gasto actualizado correctamente')
            cerrarModal()
            await cargar()
        } catch (e) {
            setEditError(e.message)
        } finally {
            setGuardandoEdit(false)
        }
    }

    async function handleEliminar(id) {
        setEliminando(id)
        try {
            await fetchJSON(`${API_URL}/gastos`, {
                method: 'DELETE',
                body: JSON.stringify({ id }),
            })
            mostrarToast('Gasto eliminado')
            await cargar()
        } catch (e) {
            mostrarToast('Error: ' + e.message)
        } finally {
            setEliminando(null)
        }
    }


    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* Mensaje */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-kaja-blueText text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
                    {toast}
                </div>
            )}

            <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3 bg-white">
                <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-kaja-orange mb-0.5">Administración</p>
                    <h1 className="text-xl font-bold text-kaja-blueText">
                        Gastos — <span className="text-kaja-orange">{MESES[mes - 1]} {anio}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={mes}
                        onChange={e => setMes(Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-kaja-blueText
                                    focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 cursor-pointer"
                    >
                        {MESES.map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={anio}
                        onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setAnio(v ? Number(v) : '') }}
                        maxLength={4}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-kaja-blueText
                                    focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 w-24"
                    />
                </div>
                <button
                    onClick={() => setMostrarForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-kaja-orange text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Registrar gasto
                </button>
            </div>

            {/* Cuerpo */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">

                {/* Panel izquierdo — formulario */}
                <div className={"w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col bg-white" + (mostrarForm ? "" : " hidden")}>
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-m font-bold text-kaja-blueText">Registrar Gasto</h2>
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
                                    Tipo de Gasto <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="tipo"
                                    value={form.tipo}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                text-kaja-blueText transition"
                                >
                                    <option value="">Seleccionar tipo</option>
                                    <option value="Fijo">Fijo</option>
                                    <option value="Variable">Variable</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Concepto <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="concepto"
                                    value={form.concepto}
                                    onChange={handleChange}
                                    placeholder="Ej: Alquiler local"
                                    maxLength={30}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                transition"
                                />
                                {form.concepto.length === 30 && <p className="text-xs text-amber-500 mt-1">Límite de 30 caracteres alcanzado</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Importe (€) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="importe"
                                    value={form.importe}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0.01"
                                    max="9999.99"
                                    step="0.01"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                transition"
                                />
                                {camposError.importe && <p className="text-xs text-red-500 mt-1">{camposError.importe}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Fecha <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={form.fecha}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                transition"
                                />
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
                                    : 'Registrar Gasto'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Panel derecho — resumen + tabla */}
                <div className="flex-1 flex flex-col overflow-hidden bg-kaja-light min-h-0">

                    {/* Tarjetas datos */}
                    <div className="shrink-0 px-4 sm:px-6 py-4 grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-linear-to-br from-kaja-sidebar to-slate-700 rounded-2xl px-5 py-4 shadow-sm">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">Total Mes</p>
                            <p className="text-2xl font-bold text-white">{parseFloat(resumen.totalMes).toFixed(2)} €</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gastos fijos</p>
                            <p className="text-2xl font-bold text-kaja-blueText">{parseFloat(resumen.totalFijos).toFixed(2)} €</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gastos variables</p>
                            <p className="text-2xl font-bold text-kaja-orange">{parseFloat(resumen.totalVariables).toFixed(2)} €</p>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="flex-1 min-h-0 mx-4 sm:mx-6 mb-4 sm:mb-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-auto h-full">
                            <div className="grid grid-cols-[1fr_120px_140px_120px_96px] min-w-140 bg-kaja-sidebar">
                                <div className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Concepto</div>
                                <div className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Tipo</div>
                                <div className="px-3 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Fecha</div>
                                <div className="px-3 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-white/60">Importe</div>
                                <div className="px-3 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-white/60">Acc.</div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin text-kaja-orange" />
                                    <span className="text-sm">Cargando gastos…</span>
                                </div>
                            ) : error ? (
                                <div className="px-5 py-4 text-sm text-red-600 bg-red-50">{error}</div>
                            ) : gastos.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 text-sm">
                                    Sin gastos para este período
                                </div>
                            ) : (
                                gastos.map((g) => (
                                    <div
                                        key={g.id}
                                        onClick={() => setGastoVisor(g)}
                                        className="grid grid-cols-[1fr_120px_140px_120px_96px] items-center min-w-140
                                            text-sm border-b border-gray-50 hover:bg-kaja-orange/5 transition cursor-pointer"
                                    >
                                        <div className="px-5 py-3.5 font-medium text-kaja-blueText">{g.concepto}</div>
                                        <div className="px-3 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                                ${g.tipo === 'Fijo'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-kaja-orange'}`}>
                                                {g.tipo}
                                            </span>
                                        </div>
                                        <div className="px-3 py-3.5">
                                            <span className="text-xs font-mono text-kaja-blueText/60">
                                                {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="px-3 py-3.5 text-right">
                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-orange/10 text-kaja-orange font-bold tabular-nums">
                                                {parseFloat(g.importe).toFixed(2)} €
                                            </span>
                                        </div>
                                        <div className="px-3 py-3.5 flex justify-center gap-1">
                                            <button
                                                onClick={e => { e.stopPropagation(); abrirEdicionDirecta(g) }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-kaja-blueText hover:bg-gray-100 transition"
                                                title="Editar gasto"
                                                aria-label="Editar gasto"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleEliminar(g.id) }}
                                                disabled={eliminando === g.id}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition
                                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Eliminar gasto"
                                                aria-label="Eliminar gasto"
                                            >
                                                {eliminando === g.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal detalle / edición gasto */}
            {gastoVisor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-kaja-blueText flex items-center gap-2">
                                {modoEdicion
                                    ? <><Pencil className="w-5 h-5 text-kaja-orange" /> Editar gasto</>
                                    : <><Receipt className="w-5 h-5 text-kaja-orange" /> Detalle del gasto</>}
                            </h2>
                            <button onClick={cerrarModal}
                                aria-label="Cerrar"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {modoEdicion ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                        Tipo de Gasto <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="tipo"
                                        value={editForm.tipo}
                                        onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                    focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                    text-kaja-blueText transition"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        <option value="Fijo">Fijo</option>
                                        <option value="Variable">Variable</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                        Concepto <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="concepto"
                                        value={editForm.concepto}
                                        onChange={handleEditChange}
                                        maxLength={30}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                    focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                    />
                                    {editForm.concepto.length === 30 && <p className="text-xs text-amber-500 mt-1">Límite de 30 caracteres alcanzado</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Importe (€) <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="importe"
                                            value={editForm.importe}
                                            onChange={handleEditChange}
                                            min="0.01"
                                            max="9999.99"
                                            step="0.01"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                        focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                        />
                                        {camposErrorEdit.importe && <p className="text-xs text-red-500 mt-1">{camposErrorEdit.importe}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Fecha <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="fecha"
                                            value={editForm.fecha}
                                            onChange={handleEditChange}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                        focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange transition"
                                        />
                                    </div>
                                </div>
                                {editError && (
                                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Concepto</p>
                                    <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">{gastoVisor.concepto}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo</p>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                                ${gastoVisor.tipo === 'Fijo'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-kaja-orange'}`}>
                                                {gastoVisor.tipo}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Importe</p>
                                        <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold text-kaja-orange">
                                            {parseFloat(gastoVisor.importe).toFixed(2)} €
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fecha</p>
                                    <p className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-mono text-kaja-blueText/70">
                                        {new Date(gastoVisor.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            {modoEdicion ? (
                                <>
                                    <button onClick={cerrarModal}
                                        className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleGuardarEdicion}
                                        disabled={guardandoEdit}
                                        className="flex-1 py-2.5 bg-kaja-orange text-white rounded-lg text-sm font-semibold
                                                   hover:brightness-90 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        {guardandoEdit
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                                            : 'Guardar cambios'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={cerrarModal}
                                        className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                                        Cerrar
                                    </button>
                                    <button onClick={abrirEdicion}
                                        className="flex-1 py-2.5 bg-kaja-blueText text-white rounded-lg text-sm font-semibold
                                                   hover:brightness-90 active:scale-95 transition flex items-center justify-center gap-2">
                                        <Pencil className="w-4 h-4" /> Editar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
