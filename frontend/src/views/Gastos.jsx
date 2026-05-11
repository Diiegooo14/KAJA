import { useEffect, useState } from 'react'
import { Trash2, Loader2, Plus, X } from 'lucide-react'

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
    const [guardando, setGuardando] = useState(false)

    const [eliminando, setEliminando] = useState(null)
    const [toast, setToast] = useState('')
    const [mostrarForm, setMostrarForm] = useState(false)

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
        setForm(prev => ({ ...prev, [name]: value }))
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

    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i)

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
                    <select
                        value={anio}
                        onChange={e => setAnio(Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-kaja-blueText
                                    focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 cursor-pointer"
                    >
                        {anios.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => setMostrarForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-kaja-orange text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition shrink-0"
                >
                    {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {mostrarForm ? 'Cerrar' : 'Registrar gasto'}
                </button>
            </div>

            {/* Cuerpo */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">

                {/* Panel izquierdo — formulario */}
                <div className={"w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col bg-white" + (mostrarForm ? "" : " hidden")}>
                    <div className="p-5">
                        <h2 className="text-m font-bold text-kaja-blueText flex items-center gap-2 mb-5">
                            Registrar Gasto
                        </h2>

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
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                transition"
                                />
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
                                    step="0.01"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 focus:border-kaja-orange
                                                transition"
                                />
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
                    <div className="flex-1 overflow-x-auto mx-4 sm:mx-6 mb-4 sm:mb-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="grid grid-cols-[1fr_120px_140px_120px_64px] border-b border-gray-100 min-w-[560px]">
                            <div className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Concepto</div>
                            <div className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Tipo</div>
                            <div className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Fecha</div>
                            <div className="px-3 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Importe</div>
                            <div className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Acc.</div>
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
                            gastos.map((g, i) => (
                                <div
                                    key={g.id}
                                    className={`grid grid-cols-[1fr_120px_140px_120px_64px] items-center min-w-[560px]
                                        text-sm border-b border-gray-50 hover:bg-gray-50 transition
                                        ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                >
                                    <div className="px-5 py-3 font-medium text-kaja-blueText">{g.concepto}</div>
                                    <div className="px-3 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            ${g.tipo === 'Fijo'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-orange-100 text-kaja-orange'}`}>
                                            {g.tipo}
                                        </span>
                                    </div>
                                    <div className="px-3 py-3 text-gray-500">
                                        {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="px-3 py-3 text-right font-semibold text-kaja-blueText">
                                        {parseFloat(g.importe).toFixed(2)} €
                                    </div>
                                    <div className="px-3 py-3 flex justify-center">
                                        <button
                                            onClick={() => handleEliminar(g.id)}
                                            disabled={eliminando === g.id}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition
                                                        disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Eliminar gasto"
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
    )
}
