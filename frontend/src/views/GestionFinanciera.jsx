import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const API_URL = import.meta.env.VITE_API_URL
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function token() {
  return localStorage.getItem('kaja_token')
}

function fmtEur(valor) {
  return Number(valor).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function fmtFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function aniosDisponibles() {
  const actual = new Date().getFullYear()
  return Array.from({ length: actual - 2023 }, (_, i) => 2024 + i)
}

// ─── Tab Ventas ──────────────────────────────────────────────────────────────

function TabVentas() {
  const ahora = new Date()
  const [mes, setMes]   = useState(ahora.getMonth() + 1)
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [datos, setDatos]     = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState(null)
  const [expandida, setExpandida] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    setExpandida(null)
    fetch(`${API_URL}/ventas?mes=${mes}&anio=${anio}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDatos)
      .catch(() => setError('No se pudieron cargar las ventas'))
      .finally(() => setCargando(false))
  }, [mes, anio])

  const ventas  = datos?.ventas  ?? []
  const resumen = datos?.resumen ?? {}

  return (
    <div className="flex flex-col gap-6">

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes</label>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kaja-blue/30"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</label>
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kaja-blue/30"
          >
            {aniosDisponibles().map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-400 self-end pb-2">
          {MESES[mes - 1]} {anio}
        </div>
      </div>

      {/* Tarjetas resumen */}
      {!cargando && !error && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-kaja-light rounded-xl px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total ventas</p>
            <p className="text-3xl font-bold text-kaja-blueText">{resumen.totalVentas ?? 0}</p>
          </div>
          <div className="bg-kaja-light rounded-xl px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total recaudado</p>
            <p className="text-3xl font-bold text-kaja-blueText">{fmtEur(resumen.totalRecaudado ?? 0)}</p>
          </div>
        </div>
      )}

      {/* Estado */}
      {cargando && (
        <p className="text-center text-gray-400 py-12">Cargando ventas...</p>
      )}
      {error && (
        <p className="text-center text-red-500 py-12">{error}</p>
      )}

      {/* Tabla */}
      {!cargando && !error && ventas.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          No hay ventas registradas en {MESES[mes - 1]} de {anio}.
        </p>
      )}

      {!cargando && !error && ventas.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-kaja-light text-kaja-blueText text-xs font-semibold uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Fecha / Hora</th>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-right">Base imponible</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta, idx) => (
                <>
                  <tr
                    key={venta.id}
                    className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3 text-gray-700">{fmtFecha(venta.fecha)}</td>
                    <td className="px-4 py-3 text-gray-700">{venta.vendedor}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtEur(venta.baseImponible)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtEur(venta.totalIva)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-kaja-blueText">{fmtEur(venta.totalFinal)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandida(expandida === venta.id ? null : venta.id)}
                        className="text-xs font-medium text-kaja-blue hover:underline"
                      >
                        {expandida === venta.id ? 'Ocultar' : `Ver (${venta.lineas?.length ?? 0})`}
                      </button>
                    </td>
                  </tr>
                  {expandida === venta.id && (
                    <tr key={`det-${venta.id}`} className="border-t border-gray-100 bg-kaja-light/40">
                      <td colSpan={6} className="px-6 py-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500 font-semibold uppercase tracking-wide">
                              <th className="text-left pb-1">Producto</th>
                              <th className="text-right pb-1">Cant.</th>
                              <th className="text-right pb-1">Precio unit.</th>
                              <th className="text-right pb-1">IVA</th>
                              <th className="text-right pb-1">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(venta.lineas ?? []).map((l, li) => (
                              <tr key={li} className="border-t border-gray-100/60">
                                <td className="py-1 text-gray-700">{l.producto}</td>
                                <td className="py-1 text-right text-gray-600">{l.cantidad}</td>
                                <td className="py-1 text-right text-gray-600">{fmtEur(l.precioVentaHistorico)}</td>
                                <td className="py-1 text-right text-gray-600">{l.ivaAplicado}%</td>
                                <td className="py-1 text-right font-medium text-gray-700">{fmtEur(l.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab Resumen Financiero ───────────────────────────────────────────────────

function TabResumen() {
  const ahora = new Date()
  const [mes, setMes]           = useState(ahora.getMonth() + 1)
  const [anio, setAnio]         = useState(ahora.getFullYear())
  const [datos, setDatos]       = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    fetch(`${API_URL}/financiero?mes=${mes}&anio=${anio}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDatos)
      .catch(() => setError('No se pudo cargar el resumen financiero'))
      .finally(() => setCargando(false))
  }, [mes, anio])

  const ventas = datos?.ventas ?? []
  const gastos = datos?.gastos ?? []
  const dias   = datos?.dias   ?? 0

  const totalVentas = ventas.reduce((a, b) => a + b, 0)
  const totalGastos = gastos.reduce((a, b) => a + b, 0)
  const beneficio   = totalVentas - totalGastos

  const labels = dias > 0
    ? Array.from({ length: dias }, (_, i) => String(i + 1))
    : []

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ventas',
        data: ventas,
        backgroundColor: 'rgba(255, 163, 26, 0.85)',
        borderColor: 'rgba(255, 163, 26, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Gastos',
        data: gastos,
        backgroundColor: 'rgba(30, 64, 110, 0.75)',
        borderColor: 'rgba(30, 64, 110, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 13, family: 'inherit' },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          title: ([ctx]) => `Día ${ctx.label}`,
          label: ctx => `${ctx.dataset.label}: ${fmtEur(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: v => fmtEur(v),
          font: { size: 11 },
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
        title: {
          display: true,
          text: 'Día del mes',
          font: { size: 12 },
          color: '#6b7280',
        },
      },
    },
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Selectores */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes</label>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kaja-blue/30"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</label>
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kaja-blue/30"
          >
            {aniosDisponibles().map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-400 self-end pb-2">
          {MESES[mes - 1]} {anio}
        </div>
      </div>

      {/* Tarjetas */}
      {!cargando && !error && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-kaja-light rounded-xl px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Ventas {MESES[mes - 1]}
            </p>
            <p className="text-2xl font-bold text-kaja-blueText">{fmtEur(totalVentas)}</p>
          </div>
          <div className="bg-kaja-light rounded-xl px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Gastos {MESES[mes - 1]}
            </p>
            <p className="text-2xl font-bold text-kaja-blueText">{fmtEur(totalGastos)}</p>
          </div>
          <div className={`rounded-xl px-6 py-4 ${beneficio >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Beneficio {MESES[mes - 1]}
            </p>
            <p className={`text-2xl font-bold ${beneficio >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {fmtEur(beneficio)}
            </p>
          </div>
        </div>
      )}

      {/* Estado */}
      {cargando && (
        <p className="text-center text-gray-400 py-12">Cargando resumen financiero...</p>
      )}
      {error && (
        <p className="text-center text-red-500 py-12">{error}</p>
      )}

      {/* Gráfico */}
      {!cargando && !error && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div style={{ height: 380 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab Resumen Anual ────────────────────────────────────────────────────────

function TabResumenAnual() {
  const [anio, setAnio]         = useState(new Date().getFullYear())
  const [datos, setDatos]       = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    fetch(`${API_URL}/financiero?anio=${anio}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDatos)
      .catch(() => setError('No se pudo cargar el resumen anual'))
      .finally(() => setCargando(false))
  }, [anio])

  const ventas = datos?.ventas ?? Array(12).fill(0)
  const gastos = datos?.gastos ?? Array(12).fill(0)

  const totalVentas = ventas.reduce((a, b) => a + b, 0)
  const totalGastos = gastos.reduce((a, b) => a + b, 0)
  const beneficio   = totalVentas - totalGastos

  const chartData = {
    labels: MESES_CORTOS,
    datasets: [
      {
        label: 'Ventas',
        data: ventas,
        backgroundColor: 'rgba(255, 163, 26, 0.85)',
        borderColor: 'rgba(255, 163, 26, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'Gastos',
        data: gastos,
        backgroundColor: 'rgba(30, 64, 110, 0.75)',
        borderColor: 'rgba(30, 64, 110, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 13, family: 'inherit' }, padding: 20 },
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${fmtEur(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => fmtEur(v), font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        ticks: { font: { size: 12 } },
        grid: { display: false },
      },
    },
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Selector de año */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</label>
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kaja-blue/30"
          >
            {aniosDisponibles().map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas anuales */}
      {!cargando && !error && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-kaja-light rounded-xl px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ventas {anio}</p>
            <p className="text-2xl font-bold text-kaja-blueText">{fmtEur(totalVentas)}</p>
          </div>
          <div className="bg-kaja-light rounded-xl px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gastos {anio}</p>
            <p className="text-2xl font-bold text-kaja-blueText">{fmtEur(totalGastos)}</p>
          </div>
          <div className={`rounded-xl px-6 py-4 ${beneficio >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Beneficio {anio}</p>
            <p className={`text-2xl font-bold ${beneficio >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {fmtEur(beneficio)}
            </p>
          </div>
        </div>
      )}

      {cargando && <p className="text-center text-gray-400 py-12">Cargando resumen anual...</p>}
      {error    && <p className="text-center text-red-500 py-12">{error}</p>}

      {/* Gráfico */}
      {!cargando && !error && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div style={{ height: 380 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GestionFinanciera() {
  const [tab, setTab] = useState('ventas')

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-8 pb-0 shrink-0">
        <h1 className="text-2xl font-bold text-kaja-blueText mb-6">Gestión Financiera</h1>
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'ventas',         label: 'Ventas' },
            { id: 'resumenMensual', label: 'Resumen mensual' },
            { id: 'resumenAnual',   label: 'Resumen anual' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition border-b-2 -mb-px
                ${tab === t.id
                  ? 'border-kaja-blueText text-kaja-blueText bg-white'
                  : 'border-transparent text-gray-400 hover:text-kaja-blueText hover:bg-gray-50'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tab === 'ventas'         && <TabVentas />}
        {tab === 'resumenMensual' && <TabResumen />}
        {tab === 'resumenAnual'   && <TabResumenAnual />}
      </div>
    </div>
  )
}
