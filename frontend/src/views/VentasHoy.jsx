import { useEffect, useState } from 'react'
import { ShoppingBag, TrendingUp, RefreshCw, ReceiptText } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const fmtEur = v => Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
const fmtHora = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

function KpiCard({ icon: Icon, label, value, variant }) {
  const styles = {
    orange: 'bg-linear-to-br from-kaja-orange to-amber-500 text-white',
    navy:   'bg-linear-to-br from-kaja-sidebar to-slate-700 text-white',
  }
  return (
    <div className={`rounded-2xl p-5 shadow-sm flex items-center gap-4 ${styles[variant]}`}>
      <div className="rounded-xl p-3 bg-white/15 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/65 mb-0.5">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  )
}

export default function VentasHoy() {
  const [ventas, setVentas]   = useState([])
  const [resumen, setResumen] = useState({ totalVentas: 0, totalRecaudado: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API_URL}/ventas`, {
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

  return (
    <div className="p-8 max-w-5xl mx-auto w-full animate-fade-in">

      {/* Cabecera */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-kaja-orange mb-1">Hoy</p>
          <h1 className="text-2xl font-bold text-kaja-blueText">Ventas del día</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600
            hover:bg-gray-50 active:scale-95 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Estado carga / error */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-kaja-blueText/30">
          <div className="w-8 h-8 border-2 border-kaja-orange/30 border-t-kaja-orange rounded-full animate-spin" />
          <span className="text-sm font-medium">Cargando ventas...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 text-sm text-rose-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <KpiCard icon={ShoppingBag} label="Ventas realizadas"  value={resumen.totalVentas}          variant="orange" />
            <KpiCard icon={TrendingUp}  label="Total recaudado"    value={fmtEur(resumen.totalRecaudado)} variant="navy"   />
          </div>

          {/* Sin ventas */}
          {ventas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3 text-kaja-blueText/25">
              <ReceiptText className="w-12 h-12" />
              <p className="text-sm font-medium">No hay ventas registradas hoy</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-1 border-b border-gray-50">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">
                  Detalle de ventas
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-160">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Hora</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Vendedor</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Producto</th>
                      <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Cant.</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">P. Unit.</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">IVA</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-kaja-blueText/40">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((venta) => (
                      <>
                        {venta.lineas.map((linea, idx) => (
                          <tr
                            key={`${venta.id}-${idx}`}
                            className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                          >
                            {idx === 0 && (
                              <td
                                rowSpan={venta.lineas.length + 1}
                                className="px-5 py-3.5 align-top"
                              >
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-light/50 text-kaja-blueText/70 text-xs font-mono font-medium">
                                  {fmtHora(venta.fecha)}
                                </span>
                              </td>
                            )}
                            {idx === 0 && (
                              <td
                                rowSpan={venta.lineas.length + 1}
                                className="px-5 py-3.5 font-medium text-kaja-blueText/80 align-top text-sm"
                              >
                                {venta.vendedor}
                              </td>
                            )}
                            <td className="px-5 py-3.5 text-gray-700">{linea.producto}</td>
                            <td className="px-5 py-3.5 text-center text-gray-500">{linea.cantidad}</td>
                            <td className="px-5 py-3.5 text-right text-gray-500">
                              {fmtEur(parseFloat(linea.precioVentaHistorico) / (1 + parseFloat(linea.ivaAplicado) / 100))}
                            </td>
                            <td className="px-5 py-3.5 text-right text-gray-400">{parseFloat(linea.ivaAplicado).toFixed(0)}%</td>
                            <td className="px-5 py-3.5 text-right font-semibold text-kaja-blueText/80">
                              {fmtEur(linea.subtotal)}
                            </td>
                          </tr>
                        ))}

                        {/* Fila totales de la venta */}
                        <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                          <td colSpan={4} className="px-5 py-2.5 text-xs text-gray-400">
                            Base: {fmtEur(venta.baseImponible)} &nbsp;·&nbsp; IVA: {fmtEur(venta.totalIva)}
                          </td>
                          <td colSpan={2} className="px-5 py-2.5 text-right text-sm font-bold text-kaja-blueText">
                            {fmtEur(venta.totalFinal)}
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
