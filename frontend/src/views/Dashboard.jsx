import { useState, useCallback, useEffect } from 'react'
import {
  Search, Menu, X, LogOut,
  Home, ShoppingCart, Package, Receipt, Users, BarChart3, Settings,
  ShoppingBag, AlertTriangle, ArrowRight, TrendingUp,
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

  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        onError={handleError}
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

  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'

  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        onError={handleError}
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

// ─── Tarjeta de acceso rápido ─────────────────────────────────────────────────

function ActionCard({ icon: Icon, iconBg, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-kaja-blueText text-base mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-kaja-orange group-hover:gap-3 transition-all duration-200">
        Ver <ArrowRight className="w-3.5 h-3.5" />
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
        onActualizarEmpresa={url => setEmpresa(prev => ({ ...prev, logo_empresa: url }))}
      />
    )

    // ─── Home ──────────────────────────────────────────────────────────────────
    return (
      <div className="p-8 max-w-4xl mx-auto w-full animate-fade-in">

        <div className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-kaja-orange mb-2">Panel principal</p>
          <h1 className="text-3xl font-bold text-kaja-blueText mb-1">
            Bienvenido, {usuario.nombre}
          </h1>
          <p className="text-gray-400 text-sm">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {empresa && <span className="ml-3 text-gray-300">·</span>}
            {empresa && <span className="ml-3 text-gray-400">{empresa.nombreComercial}</span>}
          </p>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Acceso rápido</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ActionCard
            icon={ShoppingBag}
            iconBg="bg-kaja-orange"
            title="Ventas de hoy"
            description="Consulta el historial completo de ventas realizadas hoy"
            onClick={() => navegarA('ventashoy')}
          />
          <ActionCard
            icon={AlertTriangle}
            iconBg="bg-rose-500"
            title="Stock bajo"
            description="Productos que necesitan reposición urgente"
            onClick={navegarAStockBajo}
          />
          {esAdmin && (
            <ActionCard
              icon={BarChart3}
              iconBg="bg-indigo-500"
              title="Gestión Financiera"
              description="Analiza las ventas y gastos de tu negocio"
              onClick={() => navegarA('financiero')}
            />
          )}
        </div>
      </div>
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
          <img
            src="/img/kaja-transparente.png"
            alt="KAJA"
            className="h-9 object-contain brightness-0 invert"
          />
          <button
            className="md:hidden text-white/50 hover:text-white transition"
            onClick={() => setSidebarAbierto(false)}
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
                className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${activo
                    ? 'bg-kaja-orange/15 text-kaja-orange'
                    : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                  }`}
              >
                {activo && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.75 bg-kaja-orange rounded-full" />
                )}
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Usuario + logout */}
        <div className="px-3 py-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 mb-1">
            <Avatar nombre={usuario.nombre} imagenPerfil={usuario.imagen_perfil} size="sm" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight truncate">{usuario.nombre}</p>
              <p className="text-white/40 text-xs capitalize mt-0.5">{usuario.rol}</p>
            </div>
          </div>
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
        <main className="flex-1 overflow-y-auto bg-kaja-light flex flex-col">
          {renderContenido()}
        </main>

      </div>
    </div>
  )
}
