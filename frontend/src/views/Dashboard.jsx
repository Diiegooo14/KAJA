import { useState, useCallback, useEffect } from 'react'
import {
  Search, Menu, X, LogOut,
  Home, ShoppingCart, Package, Receipt, Users, BarChart3, Settings,
  ShoppingBag, AlertTriangle, ArrowRight, TrendingUp, Clock, Zap,
} from 'lucide-react'
import Inventario from './Inventario'
import VentasHoy from './VentasHoy'
import TPV from './TPV'
import Gastos from './Gastos'
import Usuarios from './Usuarios'
import Configuracion from './Configuracion'
import GestionFinanciera from './GestionFinanciera'

const DEFAULT_AVATAR        = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778341124/basica_usuario_qvq2fm.png'
const DEFAULT_EMPRESA_LOGO  = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778342336/empresa-basico_ykh1p1.png'
const API_URL               = import.meta.env.VITE_API_URL

// ─── Avatares ─────────────────────────────────────────────────────────────────

function Avatar({ nombre, imagenPerfil, size = 'md' }) {
  const [src, setSrc] = useState(imagenPerfil || DEFAULT_AVATAR)
  const handleError   = useCallback(() => setSrc(null), [])
  useEffect(() => { setSrc(imagenPerfil || DEFAULT_AVATAR) }, [imagenPerfil])

  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const sizePx = size === 'sm' ? 32 : 40

  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        onError={handleError}
        width={sizePx}
        height={sizePx}
        className={`${cls} rounded-full object-cover ring-2 ring-white/20 shrink-0`}
      />
    )
  }
  return (
    <div className={`${cls} rounded-full bg-kaja-orange flex items-center justify-center text-white font-bold shrink-0`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

function EmpresaAvatar({ nombre, logo, size = 'md' }) {
  const [src, setSrc] = useState(logo || DEFAULT_EMPRESA_LOGO)
  const handleError   = useCallback(() => setSrc(null), [])
  useEffect(() => { setSrc(logo || DEFAULT_EMPRESA_LOGO) }, [logo])

  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  const sizePx = size === 'sm' ? 32 : size === 'lg' ? 48 : 40

  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        onError={handleError}
        width={sizePx}
        height={sizePx}
        className={`${cls} rounded-full object-cover ring-2 ring-white/20 shrink-0`}
      />
    )
  }
  return (
    <div className={`${cls} rounded-full bg-kaja-orange flex items-center justify-center text-white font-bold shrink-0`}>
      {nombre?.charAt(0)?.toUpperCase() ?? 'E'}
    </div>
  )
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Inicio',             icon: Home },
  { id: 'tpv',        label: 'TPV',                icon: ShoppingCart },
  { id: 'inventario', label: 'Inventario',          icon: Package },
  { id: 'gastos',     label: 'Gastos',             icon: Receipt,   soloAdmin: true },
  { id: 'usuarios',   label: 'Usuarios',           icon: Users,     soloAdmin: true },
  { id: 'financiero', label: 'Gestión Financiera', icon: BarChart3, soloAdmin: true },
  { id: 'config',     label: 'Configuración',      icon: Settings },
]

// ─── KPI stat card ────────────────────────────────────────────────────────────

function KpiStat({ icon: Icon, label, value, sub, gradient, onClick, clickable }) {
  return (
    <div
      onClick={onClick}
      className={`bg-linear-to-br ${gradient} rounded-2xl p-5 shadow-sm text-white flex flex-col gap-3
        ${clickable ? 'cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-white/50 mt-1.5 capitalize">{sub}</p>
      </div>
    </div>
  )
}

// ─── Quick action row ─────────────────────────────────────────────────────────

function QuickAction({ icon: Icon, color, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-kaja-light active:scale-[0.98] transition-all group text-left"
    >
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kaja-blueText">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-kaja-orange group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  )
}

// ─── Home panel ───────────────────────────────────────────────────────────────

function HomePanel({ usuario, empresa, esAdmin, onNavegar, onStockBajo }) {
  const [kpis, setKpis]         = useState(null)
  const [loadingKpis, setLoading] = useState(true)

  useEffect(() => { cargarKpis() }, [])

  async function cargarKpis() {
    setLoading(true)
    const h   = { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` }
    const hoy = new Date()
    try {
      const [ventasRes, stockRes, gastosRes] = await Promise.all([
        fetch(`${API_URL}/ventas`, { headers: h }),
        fetch(`${API_URL}/productos?stockBajo=1&porPagina=1`, { headers: h }),
        esAdmin
          ? fetch(`${API_URL}/gastos?mes=${hoy.getMonth() + 1}&anio=${hoy.getFullYear()}`, { headers: h })
          : Promise.resolve(null),
      ])
      const ventas = ventasRes.ok ? await ventasRes.json() : null
      const stock  = stockRes.ok  ? await stockRes.json()  : null
      const gastos = gastosRes?.ok ? await gastosRes.json() : null

      setKpis({
        ventasHoy:      ventas?.resumen?.totalVentas    ?? 0,
        recaudadoHoy:   ventas?.resumen?.totalRecaudado ?? 0,
        stockBajoCount: stock?.total ?? 0,
        gastosMes:      gastos?.resumen?.totalMes ?? 0,
        ultimasVentas:  (ventas?.ventas ?? []).slice(-4).reverse(),
      })
    } catch {
      setKpis({ ventasHoy: 0, recaudadoHoy: 0, stockBajoCount: 0, gastosMes: 0, ultimasVentas: [] })
    } finally {
      setLoading(false)
    }
  }

  const hora    = new Date().getHours()
  const saludo  = hora < 13 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'
  const fmtEur  = v => Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
  const fmtHora = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const mesTxt  = new Date().toLocaleDateString('es-ES', { month: 'long' })

  return (
    <div className="p-6 max-w-5xl mx-auto w-full animate-fade-in flex flex-col gap-5">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative bg-kaja-sidebar rounded-2xl overflow-hidden px-8 py-7 flex items-center justify-between gap-6 shadow-lg">
        <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-white/4 pointer-events-none" />
        <div className="absolute -bottom-10 right-28 w-36 h-36 rounded-full bg-kaja-orange/8 pointer-events-none" />
        <div className="absolute top-6 right-60 w-14 h-14 rounded-full bg-white/3 pointer-events-none" />

        <div className="relative z-10">
          <p className="text-kaja-orange text-xs font-bold uppercase tracking-widest mb-1">{saludo}</p>
          <h1 className="text-3xl font-bold text-white mb-1">{usuario.nombre}</h1>
          <p className="text-white/40 text-sm capitalize">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {empresa && (
          <div className="relative z-10 hidden sm:flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-white font-semibold text-sm">{empresa.nombreComercial}</p>
              <p className="text-white/40 text-xs mt-0.5">{empresa.razonSocial ?? 'Empresa'}</p>
            </div>
            <EmpresaAvatar nombre={empresa.nombreComercial} logo={empresa.logo_empresa} size="lg" />
          </div>
        )}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <div className={`grid gap-4 ${esAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <KpiStat
          icon={ShoppingBag}
          label="Ventas hoy"
          value={loadingKpis ? '—' : kpis.ventasHoy}
          sub="tickets realizados"
          gradient="from-kaja-orange to-amber-400"
          onClick={() => onNavegar('ventashoy')}
          clickable
        />
        <KpiStat
          icon={TrendingUp}
          label="Recaudado hoy"
          value={loadingKpis ? '—' : fmtEur(kpis.recaudadoHoy)}
          sub="total del día"
          gradient="from-kaja-sidebar to-slate-600"
        />
        <KpiStat
          icon={AlertTriangle}
          label="Stock bajo"
          value={loadingKpis ? '—' : kpis.stockBajoCount}
          sub="productos a reponer"
          gradient="from-rose-500 to-rose-400"
          onClick={onStockBajo}
          clickable
        />
        {esAdmin && (
          <KpiStat
            icon={Receipt}
            label="Gastos del mes"
            value={loadingKpis ? '—' : fmtEur(kpis.gastosMes)}
            sub={mesTxt}
            gradient="from-indigo-600 to-indigo-400"
          />
        )}
      </div>

      {/* ── Bottom row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-kaja-orange" />
            Acceso rápido
          </p>
          <div className="flex flex-col gap-1">
            <QuickAction icon={ShoppingCart} color="bg-kaja-orange"  label="TPV"            sub="Cobrar una venta"          onClick={() => onNavegar('tpv')} />
            <QuickAction icon={ShoppingBag}  color="bg-amber-500"    label="Ventas de hoy"  sub="Historial del día"         onClick={() => onNavegar('ventashoy')} />
            <QuickAction icon={Package}      color="bg-emerald-500"  label="Inventario"     sub="Gestión de productos"      onClick={() => onNavegar('inventario')} />
            {esAdmin && (
              <QuickAction icon={BarChart3} color="bg-indigo-500"  label="Financiero"     sub="Análisis de resultados"    onClick={() => onNavegar('financiero')} />
            )}
          </div>
        </div>

        {/* Últimas ventas */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-kaja-orange" />
              Últimas ventas
            </p>
            <button
              onClick={() => onNavegar('ventashoy')}
              className="text-xs font-semibold text-kaja-orange hover:underline"
            >
              Ver todas
            </button>
          </div>

          {loadingKpis ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-kaja-orange/30 border-t-kaja-orange rounded-full animate-spin" />
            </div>
          ) : !kpis || kpis.ultimasVentas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-300">
              <ShoppingBag className="w-10 h-10" />
              <p className="text-sm font-medium">Sin ventas hoy todavía</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {kpis.ultimasVentas.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-kaja-light hover:bg-gray-100/80 transition">
                  <div className="w-9 h-9 rounded-xl bg-kaja-orange/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-kaja-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-kaja-blueText truncate">{v.vendedor}</p>
                    <p className="text-xs text-gray-400">{v.lineas.length} producto{v.lineas.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-kaja-blueText">{fmtEur(v.totalFinal)}</p>
                    <p className="text-xs text-gray-400 font-mono">{fmtHora(v.fecha)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({ usuario, onLogout, onActualizarUsuario }) {
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const [filtroStockBajo, setFiltroStockBajo] = useState(false)
  const [busquedaGlobal, setBusquedaGlobal] = useState('')
  const [empresa, setEmpresa] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/empresa`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setEmpresa(data))
      .catch(() => {})
  }, [])

  function navegarA(id) {
    setSeccionActiva(id)
    setFiltroStockBajo(false)
    setSidebarAbierto(false)
    if (id !== 'inventario') setBusquedaGlobal('')
  }

  function navegarAStockBajo() {
    setFiltroStockBajo(true)
    setBusquedaGlobal('')
    setSeccionActiva('inventario')
    setSidebarAbierto(false)
  }

  function handleBusquedaGlobal(e) {
    const val = e.target.value
    setBusquedaGlobal(val)
    setFiltroStockBajo(false)
    setSeccionActiva('inventario')
  }

  const esAdmin = usuario.rol === 'Administrador'

  function renderContenido() {
    if ((seccionActiva === 'usuarios' || seccionActiva === 'gastos') && !esAdmin) navegarA('dashboard')
    if (seccionActiva === 'inventario')  return <Inventario filtroStockBajo={filtroStockBajo} busquedaInicial={busquedaGlobal} />
    if (seccionActiva === 'ventashoy')   return <VentasHoy />
    if (seccionActiva === 'tpv')         return <TPV usuario={usuario} />
    if (seccionActiva === 'gastos')      return <Gastos />
    if (seccionActiva === 'usuarios')    return <Usuarios usuario={usuario} />
    if (seccionActiva === 'financiero')  return <GestionFinanciera />
    if (seccionActiva === 'config')      return (
      <Configuracion
        usuario={usuario}
        onActualizarUsuario={onActualizarUsuario}
        onActualizarEmpresa={datos => setEmpresa(prev => ({ ...prev, ...datos }))}
      />
    )

    // ─── Home ──────────────────────────────────────────────────────────────────
    return (
      <HomePanel
        usuario={usuario}
        empresa={empresa}
        esAdmin={esAdmin}
        onNavegar={navegarA}
        onStockBajo={navegarAStockBajo}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-kaja-light">

      {/* Overlay móvil */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-kaja-sidebar flex flex-col shrink-0
        transition-transform duration-300
        ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 shrink-0 border-b border-white/10">
          <button onClick={() => navegarA('dashboard')} className="focus:outline-none cursor-pointer">
            <img
              src="/img/kaja-transparente.webp"
              alt="KAJA"
              width="180"
              height="36"
              className="h-9 object-contain brightness-0 invert"
            />
          </button>
          <button
            className="md:hidden text-white/50 hover:text-white transition"
            onClick={() => setSidebarAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.soloAdmin || esAdmin).map(item => {
            const activo = seccionActiva === item.id
            return (
              <button
                key={item.id}
                onClick={() => navegarA(item.id)}
                className={`relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-medium transition-all text-left
                  ${activo
                    ? 'bg-kaja-orange/15 text-kaja-orange'
                    : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                  }`}
              >
                {activo && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-0.75 bg-kaja-orange rounded-full" />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Usuario + logout */}
        <div className="px-3 py-3 border-t border-white/10 shrink-0">
          <button
            onClick={() => navegarA('config')}
            className="w-full flex items-center gap-3 px-4 py-2.5 mb-1 rounded-xl hover:bg-white/8 transition-all text-left group"
          >
            <Avatar nombre={usuario.nombre} imagenPerfil={usuario.imagen_perfil} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold leading-tight truncate group-hover:text-white/90">{usuario.nombre}</p>
              <p className="text-white/40 text-xs capitalize mt-0.5">{usuario.rol}</p>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-white/8 hover:text-white/70 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 shrink-0 bg-kaja-sidebar border-b border-white/10 flex items-center px-5 gap-4">

          <button
            className="md:hidden p-2 rounded-lg text-white/60 hover:bg-white/10 transition"
            onClick={() => setSidebarAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input
                type="text"
                value={busquedaGlobal}
                onChange={handleBusquedaGlobal}
                placeholder="Buscar producto..."
                className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/35
                  focus:outline-none focus:ring-2 focus:ring-kaja-orange/60 focus:border-kaja-orange/50 transition"
              />
            </div>
          </div>

          {/* Empresa + usuario */}
          <div className="flex items-center gap-4 ml-auto">
            {empresa && (
              <div className="hidden md:flex items-center gap-2.5 pr-4 border-r border-white/15">
                <EmpresaAvatar nombre={empresa.nombreComercial} logo={empresa.logo_empresa} size="sm" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{empresa.nombreComercial}</p>
                  <p className="text-xs text-white/45">Empresa</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Avatar nombre={usuario.nombre} imagenPerfil={usuario.imagen_perfil} size="sm" />
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-white">{usuario.nombre}</p>
                <p className="text-xs text-white/45 capitalize">{usuario.rol}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 bg-kaja-light flex flex-col ${seccionActiva === 'financiero' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {renderContenido()}
        </main>

      </div>
    </div>
  )
}
