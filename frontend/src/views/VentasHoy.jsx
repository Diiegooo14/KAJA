import { useEffect, useState } from 'react'
import { ShoppingBag, TrendingUp, RefreshCw, ReceiptText, ChevronDown, ChevronUp } from 'lucide-react'

const API_URL        = import.meta.env.VITE_API_URL
const DEFAULT_AVATAR = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778341124/basica_usuario_qvq2fm.png'

const fmtEur  = v   => Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
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
  const [ventas, setVentas]     = useState([])
  const [resumen, setResumen]   = useState({ totalVentas: 0, totalRecaudado: 0 })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [expandida, setExpandida] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    setError('')
    setExpandida(null)
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

  function toggleExpandida(id) {
    setExpandida(prev => prev === id ? null : id)
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full animate-fade-in">

      {/* Cabecera */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-kaja-orange mb-1">Hoy</p>
          <h1 className="text-2xl font-bold text-kaja-blueText">Ventas del día</h1>
          <p className="text-sm text-gray-600 mt-0.5">
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

      {/* Carga */}
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
            <KpiCard icon={ShoppingBag} label="Ventas realizadas"  value={resumen.totalVentas}            variant="orange" />
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
                <table className="w-full text-sm min-w-150">
                  <thead>
                    <tr className="bg-kaja-sidebar">
                      <th className="px-5 py-4 text-left   text-[11px] font-bold uppercase tracking-widest text-white/60">Hora</th>
                      <th className="px-5 py-4 text-left   text-[11px] font-bold uppercase tracking-widest text-white/60">Vendedor</th>
                      <th className="px-5 py-4 text-right  text-[11px] font-bold uppercase tracking-widest text-white/60">Base</th>
                      <th className="px-5 py-4 text-right  text-[11px] font-bold uppercase tracking-widest text-white/60">IVA</th>
                      <th className="px-5 py-4 text-right  text-[11px] font-bold uppercase tracking-widest text-white/60">Total</th>
                      <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-white/60">Líneas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map(venta => (
                      <>
                        <tr
                          key={venta.id}
                          onClick={() => toggleExpandida(venta.id)}
                          className="border-t border-gray-100 hover:bg-kaja-orange/5 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-light/60 text-xs font-mono text-kaja-blueText/70">
                              {fmtHora(venta.fecha)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={venta.imagenVendedor || DEFAULT_AVATAR}
                                alt={venta.vendedor}
                                width="28"
                                height="28"
                                loading="lazy"
                                className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                                onError={e => { e.target.src = DEFAULT_AVATAR }}
                              />
                              <span className="text-kaja-blueText/80 font-medium">{venta.vendedor}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right text-kaja-blueText/40 text-xs tabular-nums">{fmtEur(venta.baseImponible)}</td>
                          <td className="px-5 py-4 text-right text-kaja-blueText/40 text-xs tabular-nums">{fmtEur(venta.totalIva)}</td>
                          <td className="px-5 py-4 text-right">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-orange/10 text-kaja-orange font-bold tabular-nums">
                              {fmtEur(venta.totalFinal)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-kaja-blueText/70">
                              {venta.lineas.length} art.
                              {expandida === venta.id
                                ? <ChevronUp   className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />
                              }
                            </span>
                          </td>
                        </tr>

                        {expandida === venta.id && (
                          <tr key={`det-${venta.id}`}>
                            <td colSpan={6} className="px-5 pb-4 pt-1 bg-kaja-light/20">
                              <div className="rounded-xl overflow-hidden border border-kaja-light shadow-sm">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="px-4 py-2.5 text-left   text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Producto</th>
                                      <th className="px-4 py-2.5 text-right  text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Cant.</th>
                                      <th className="px-4 py-2.5 text-right  text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">P. Unit.</th>
                                      <th className="px-4 py-2.5 text-right  text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">IVA</th>
                                      <th className="px-4 py-2.5 text-right  text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {venta.lineas.map((linea, li) => (
                                      <tr key={li} className="border-t border-kaja-light">
                                        <td className="px-4 py-2.5 font-medium text-kaja-blueText/80">{linea.producto}</td>
                                        <td className="px-4 py-2.5 text-right text-kaja-blueText/50 font-mono">{linea.cantidad}</td>
                                        <td className="px-4 py-2.5 text-right text-kaja-blueText/50 tabular-nums">
                                          {fmtEur(parseFloat(linea.subtotal) / parseFloat(linea.cantidad) / (1 + parseFloat(linea.ivaAplicado) / 100))}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-kaja-blueText/60 font-mono">{parseFloat(linea.ivaAplicado).toFixed(0)}%</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-kaja-blueText tabular-nums">{fmtEur(linea.subtotal)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
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
