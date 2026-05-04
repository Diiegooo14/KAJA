import { useEffect, useState } from 'react'
import { Loader2, ShoppingBag, TrendingUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

export default function VentasHoy() {
    const [ventas, setVentas] = useState([])
    const [resumen, setResumen] = useState({ totalVentas: 0, totalRecaudado: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => { cargar() }, [])

    async function cargar() {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_URL}/ventas`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
            })
            const text = await res.text()
            let data
            try { data = JSON.parse(text) } catch { throw new Error(`Respuesta inesperada (${res.status})`) }
            if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)
            setVentas(data.ventas)
            setResumen(data.resumen)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function formatHora(fechaStr) {
        return new Date(fechaStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    return (
        <div className="p-6 max-w-5xl mx-auto w-full">

            {/* Cabecera */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-kaja-blue">Ventas de hoy</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Estado carga / error */}
            {loading && (
                <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
                    <Loader2 className="animate-spin w-5 h-5 text-kaja-orange" />
                    <span className="text-sm">Cargando ventas...</span>
                </div>
            )}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {!loading && !error && (
                <>
                    {/* Tarjetas resumen */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-kaja-light rounded-xl px-5 py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-kaja-orange/20 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-5 h-5 text-kaja-orange" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ventas realizadas</p>
                                <p className="text-2xl font-bold text-kaja-blue">{resumen.totalVentas}</p>
                            </div>
                        </div>
                        <div className="bg-kaja-light rounded-xl px-5 py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total recaudado</p>
                                <p className="text-2xl font-bold text-kaja-blue">
                                    {parseFloat(resumen.totalRecaudado).toFixed(2)} €
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sin ventas */}
                    {ventas.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
                            <p className="text-gray-400 text-sm">No hay ventas registradas hoy</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-160">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Hora</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Vendedor</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                                            <th className="text-center px-4 py-3 font-semibold text-gray-600">Cant.</th>
                                            <th className="text-right px-4 py-3 font-semibold text-gray-600">P. Unit.</th>
                                            <th className="text-right px-4 py-3 font-semibold text-gray-600">IVA</th>
                                            <th className="text-right px-4 py-3 font-semibold text-gray-600">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventas.map((venta) => (
                                            <>
                                                {/* Líneas de detalle */}
                                                {venta.lineas.map((linea, idx) => (
                                                    <tr
                                                        key={`${venta.id}-${idx}`}
                                                        className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                                                    >
                                                        {idx === 0 ? (
                                                            <td
                                                                className="px-4 py-3 text-gray-500 font-mono text-xs align-top"
                                                                rowSpan={venta.lineas.length + 1}
                                                            >
                                                                {formatHora(venta.fecha)}
                                                            </td>
                                                        ) : null}
                                                        {idx === 0 ? (
                                                            <td
                                                                className="px-4 py-3 font-medium text-gray-700 align-top"
                                                                rowSpan={venta.lineas.length + 1}
                                                            >
                                                                {venta.vendedor}
                                                            </td>
                                                        ) : null}
                                                        <td className="px-4 py-3 text-gray-800">{linea.producto}</td>
                                                        <td className="px-4 py-3 text-center text-gray-600">{linea.cantidad}</td>
                                                        <td className="px-4 py-3 text-right text-gray-600">
                                                            {(parseFloat(linea.precioVentaHistorico) / (1 + parseFloat(linea.ivaAplicado) / 100)).toFixed(2)} €
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-500">
                                                            {parseFloat(linea.ivaAplicado).toFixed(0)}%
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                            {parseFloat(linea.subtotal).toFixed(2)} €
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Fila totales de la venta */}
                                                <tr className="border-b-4 border-gray-100 bg-gray-50/70">
                                                    <td colSpan={3} className="px-4 py-2 text-xs text-gray-400">
                                                        Base: {parseFloat(venta.baseImponible).toFixed(2)} € &nbsp;|&nbsp;
                                                        IVA: {parseFloat(venta.totalIva).toFixed(2)} €
                                                    </td>
                                                    <td colSpan={2} className="px-4 py-2 text-right text-sm font-bold text-kaja-blue">
                                                        Total: {parseFloat(venta.totalFinal).toFixed(2)} €
                                                    </td>
                                                </tr>
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
