import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  TrendingUp, TrendingDown, Wallet,
  ChevronDown, ChevronUp, Calendar,
  ReceiptText, BarChart3, CalendarDays,
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const API_URL = import.meta.env.VITE_API_URL
const DEFAULT_AVATAR = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778341124/basica_usuario_qvq2fm.png'
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MESES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const token = () => localStorage.getItem('kaja_token')
const authHdr = () => ({ Authorization: `Bearer ${token()}` })
const fmtEur = v => Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
const fmtFecha = iso => {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES') + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Filtros({ children }) {
  return (
    <div className="flex flex-wrap gap-3 items-end mb-6">
      {children}
    </div>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-kaja-blueText/50 uppercase tracking-widest">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); onChange(v ? Number(v) : '') }}
        maxLength={4}
        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-kaja-blueText shadow-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 w-24"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-kaja-blueText/50 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-200 rounded-xl px-4 pr-9 py-2.5 text-sm font-medium text-kaja-blueText shadow-sm focus:outline-none focus:ring-2 focus:ring-kaja-orange/30 cursor-pointer"
        >
          {options.map(({ value: v, label: l }) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, variant = 'default', sub }) {
  const styles = {
    default: 'bg-white border border-gray-100 text-kaja-blueText',
    orange: 'bg-linear-to-br from-kaja-orange to-amber-500 text-white',
    navy: 'bg-linear-to-br from-kaja-sidebar to-slate-700 text-white',
    green: 'bg-linear-to-br from-emerald-500 to-teal-500 text-white',
    red: 'bg-linear-to-br from-rose-500 to-red-600 text-white',
  }
  const iconBg = {
    default: 'bg-kaja-light/60',
    orange: 'bg-white/20',
    navy: 'bg-white/20',
    green: 'bg-white/20',
    red: 'bg-white/20',
  }
  return (
    <div className={`rounded-2xl p-5 shadow-sm flex items-center gap-4 ${styles[variant]}`}>
      <div className={`rounded-xl p-3 shrink-0 ${iconBg[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${variant === 'default' ? 'text-kaja-blueText/50' : 'text-white/70'}`}>
          {label}
        </p>
        <p className="text-2xl font-bold leading-tight truncate">{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${variant === 'default' ? 'text-kaja-blueText/40' : 'text-white/60'}`}>{sub}</p>}
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {title && (
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-sm font-bold text-kaja-blueText/60 uppercase tracking-widest">{title}</h3>
        </div>
      )}
      <div className="p-6 pt-4">{children}</div>
    </div>
  )
}

const CHART_OPTS = (tooltipTitle) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { font: { size: 12, family: 'inherit', weight: '600' }, padding: 16, boxWidth: 12, boxHeight: 12, borderRadius: 4, useBorderRadius: true },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 13, weight: '700' },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        title: ([ctx]) => tooltipTitle ? tooltipTitle(ctx) : ctx.label,
        label: ctx => `  ${ctx.dataset.label}: ${fmtEur(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { callback: v => fmtEur(v), font: { size: 11 }, color: '#94a3b8' },
    },
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: { font: { size: 12, weight: '500' }, color: '#64748b' },
    },
  },
})

const DATASETS = (ventas, gastos) => ({
  datasets: [
    {
      label: 'Ventas',
      data: ventas,
      backgroundColor: 'rgba(217,119,6,0.85)',
      borderColor: 'rgba(217,119,6,1)',
      borderWidth: 0,
      borderRadius: 8,
      borderSkipped: false,
    },
    {
      label: 'Gastos',
      data: gastos,
      backgroundColor: 'rgba(44,62,80,0.75)',
      borderColor: 'rgba(44,62,80,1)',
      borderWidth: 0,
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
})

// ─── Tab Ventas ────────────────────────────────────────────────────────────────

function TabVentas() {
  const ahora = new Date()
  const [mes, setMes] = useState(ahora.getMonth() + 1)
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [expandida, setExpandida] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    setExpandida(null)
    fetch(`${API_URL}/ventas?mes=${mes}&anio=${anio}`, { headers: authHdr() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDatos)
      .catch(() => setError('No se pudieron cargar las ventas'))
      .finally(() => setCargando(false))
  }, [mes, anio])

  const ventas = datos?.ventas ?? []
  const resumen = datos?.resumen ?? {}

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      <Filtros>
        <SelectField
          label="Mes"
          value={mes}
          onChange={setMes}
          options={MESES.map((m, i) => ({ value: i + 1, label: m }))}
        />
        <NumberField label="Año" value={anio} onChange={setAnio} />
        <div className="ml-auto self-end flex items-center gap-2 text-sm text-kaja-blueText/50 font-medium pb-0.5">
          <Calendar className="w-4 h-4" />
          {MESES[mes - 1]} {anio}
        </div>
      </Filtros>

      {!cargando && !error && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            label="Total ventas"
            value={resumen.totalVentas ?? 0}
            icon={ReceiptText}
            variant="orange"
            sub={`${MESES[mes - 1]} ${anio}`}
          />
          <KpiCard
            label="Total recaudado"
            value={fmtEur(resumen.totalRecaudado ?? 0)}
            icon={TrendingUp}
            variant="navy"
            sub={`${MESES[mes - 1]} ${anio}`}
          />
        </div>
      )}

      {cargando && (
        <div className="flex items-center justify-center py-20 text-kaja-blueText/30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-kaja-orange/30 border-t-kaja-orange rounded-full animate-spin" />
            <span className="text-sm font-medium">Cargando ventas...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-rose-500 font-medium">{error}</p>
        </div>
      )}

      {!cargando && !error && ventas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-kaja-blueText/30">
          <ReceiptText className="w-12 h-12" />
          <p className="text-sm font-medium">Sin ventas en {MESES[mes - 1]} de {anio}</p>
        </div>
      )}

      {!cargando && !error && ventas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-160">
              <thead>
                <tr className="bg-kaja-sidebar">
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-white/60">Fecha</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-white/60">Vendedor</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-white/60">Base</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-white/60">IVA</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-white/60">Total</th>
                  <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-white/60">Líneas</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <>
                    <tr
                      key={venta.id}
                      onClick={() => setExpandida(expandida === venta.id ? null : venta.id)}
                      className="border-t border-gray-100 hover:bg-kaja-orange/5 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-kaja-light/60 text-xs font-mono text-kaja-blueText/70">
                          {fmtFecha(venta.fecha)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={venta.imagenVendedor || DEFAULT_AVATAR}
                            alt={venta.vendedor}
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
                          {venta.lineas?.length ?? 0} art.
                          {expandida === venta.id
                            ? <ChevronUp className="w-3.5 h-3.5" />
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
                                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Producto</th>
                                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Cant.</th>
                                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">P. Unit.</th>
                                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">IVA</th>
                                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-kaja-blueText/50">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(venta.lineas ?? []).map((l, li) => (
                                  <tr key={li} className="border-t border-kaja-light">
                                    <td className="px-4 py-2.5 font-medium text-kaja-blueText/80">{l.producto}</td>
                                    <td className="px-4 py-2.5 text-right text-kaja-blueText/50 font-mono">{l.cantidad}</td>
                                    <td className="px-4 py-2.5 text-right text-kaja-blueText/50 tabular-nums">{fmtEur(parseFloat(l.subtotal) / parseFloat(l.cantidad) / (1 + parseFloat(l.ivaAplicado) / 100))}</td>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-kaja-blueText/60 font-mono">{l.ivaAplicado}%</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-bold text-kaja-blueText tabular-nums">{fmtEur(l.subtotal)}</td>
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
    </div>
  )
}

// ─── Tab Resumen Mensual ───────────────────────────────────────────────────────

function TabResumenMensual() {
  const ahora = new Date()
  const [mes, setMes] = useState(ahora.getMonth() + 1)
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    fetch(`${API_URL}/financiero?mes=${mes}&anio=${anio}`, { headers: authHdr() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDatos)
      .catch(() => setError('No se pudo cargar el resumen mensual'))
      .finally(() => setCargando(false))
  }, [mes, anio])

  const ventas = datos?.ventas ?? []
  const gastos = datos?.gastos ?? []
  const dias = datos?.dias ?? 0

  const totalVentas = ventas.reduce((a, b) => a + b, 0)
  const totalGastos = gastos.reduce((a, b) => a + b, 0)
  const beneficio = totalVentas - totalGastos
  const positivo = beneficio >= 0

  const chartData = {
    labels: dias > 0 ? Array.from({ length: dias }, (_, i) => String(i + 1)) : [],
    ...DATASETS(ventas, gastos),
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      <Filtros>
        <SelectField
          label="Mes"
          value={mes}
          onChange={setMes}
          options={MESES.map((m, i) => ({ value: i + 1, label: m }))}
        />
        <NumberField label="Año" value={anio} onChange={setAnio} />
        <div className="ml-auto self-end flex items-center gap-2 text-sm text-kaja-blueText/50 font-medium pb-0.5">
          <Calendar className="w-4 h-4" />
          {MESES[mes - 1]} {anio}
        </div>
      </Filtros>

      {!cargando && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard label={`Ventas ${MESES[mes - 1]}`} value={fmtEur(totalVentas)} icon={TrendingUp} variant="orange" />
          <KpiCard label={`Gastos ${MESES[mes - 1]}`} value={fmtEur(totalGastos)} icon={TrendingDown} variant="navy" />
          <KpiCard label={`Beneficio ${MESES[mes - 1]}`} value={fmtEur(beneficio)} icon={Wallet} variant={positivo ? 'green' : 'red'} />
        </div>
      )}

      {cargando && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-kaja-blueText/30">
          <div className="w-8 h-8 border-2 border-kaja-orange/30 border-t-kaja-orange rounded-full animate-spin" />
          <span className="text-sm font-medium">Cargando resumen mensual...</span>
        </div>
      )}
      {error && <p className="text-center text-sm text-rose-500 py-12 font-medium">{error}</p>}

      {!cargando && !error && (
        <ChartCard title={`Ventas vs Gastos · ${MESES[mes - 1]} ${anio} · por día`}>
          <div style={{ height: 360 }}>
            <Bar
              data={chartData}
              options={CHART_OPTS(ctx => `Día ${ctx.label} de ${MESES[mes - 1]}`)}
            />
          </div>
        </ChartCard>
      )}
    </div>
  )
}

// ─── Tab Resumen Anual ─────────────────────────────────────────────────────────

function TabResumenAnual() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    fetch(`${API_URL}/financiero?anio=${anio}`, { headers: authHdr() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDatos)
      .catch(() => setError('No se pudo cargar el resumen anual'))
      .finally(() => setCargando(false))
  }, [anio])

  const ventas = datos?.ventas ?? Array(12).fill(0)
  const gastos = datos?.gastos ?? Array(12).fill(0)

  const totalVentas = ventas.reduce((a, b) => a + b, 0)
  const totalGastos = gastos.reduce((a, b) => a + b, 0)
  const beneficio = totalVentas - totalGastos
  const positivo = beneficio >= 0

  const chartData = { labels: MESES_C, ...DATASETS(ventas, gastos) }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      <Filtros>
        <NumberField label="Año" value={anio} onChange={setAnio} />
      </Filtros>

      {!cargando && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard label={`Ventas ${anio}`} value={fmtEur(totalVentas)} icon={TrendingUp} variant="orange" />
          <KpiCard label={`Gastos ${anio}`} value={fmtEur(totalGastos)} icon={TrendingDown} variant="navy" />
          <KpiCard label={`Beneficio ${anio}`} value={fmtEur(beneficio)} icon={Wallet} variant={positivo ? 'green' : 'red'} />
        </div>
      )}

      {cargando && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-kaja-blueText/30">
          <div className="w-8 h-8 border-2 border-kaja-orange/30 border-t-kaja-orange rounded-full animate-spin" />
          <span className="text-sm font-medium">Cargando resumen anual...</span>
        </div>
      )}
      {error && <p className="text-center text-sm text-rose-500 py-12 font-medium">{error}</p>}

      {!cargando && !error && (
        <ChartCard title={`Ventas vs Gastos · ${anio} · por mes`}>
          <div style={{ height: 360 }}>
            <Bar data={chartData} options={CHART_OPTS()} />
          </div>
        </ChartCard>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

const TABS = [
  { id: 'ventas', label: 'Ventas', icon: ReceiptText },
  { id: 'mensual', label: 'Resumen mensual', icon: BarChart3 },
  { id: 'anual', label: 'Resumen anual', icon: CalendarDays },
]

export default function GestionFinanciera() {
  const [tab, setTab] = useState('ventas')

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 pt-5 sm:pt-7 pb-0 shrink-0" >
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-kaja-orange mb-1">Panel</p>
            <h1 className="text-2xl font-bold text-kaja-blueText">Gestión Financiera</h1>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map(t => {
            const activo = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 -mb-px transition-all
                  ${activo
                    ? 'bg-kaja-blueText text-white border-kaja-blueText'
                    : 'text-kaja-blueText/50 border-transparent hover:text-kaja-blueText hover:bg-gray-50'
                  }`}
              >
                <t.icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 sm:px-8 py-5 sm:py-6">
        {tab === 'ventas' && <TabVentas />}
        {tab === 'mensual' && <TabResumenMensual />}
        {tab === 'anual' && <TabResumenAnual />}
      </div>

    </div>
  )
}
