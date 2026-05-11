import { useState, useRef } from 'react'
import {
    Eye, EyeOff, ShoppingCart, BarChart3, Package,
    Users, TrendingUp, Zap, ChevronDown, ArrowRight,
    Check, Shield,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

function NavBar({ onLoginClick }) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 border-b border-white/10 backdrop-blur-md bg-kaja-sidebar/80">
            <img
                src="/img/kaja-transparente.png"
                alt="KAJA"
                className="h-8 object-contain brightness-0 invert"
            />
            <div className="flex items-center gap-6">
                <a
                    href="#caracteristicas"
                    className="text-sm text-white/50 hover:text-white transition hidden sm:block"
                >
                    Características
                </a>
                <button
                    onClick={onLoginClick}
                    className="px-4 py-2 bg-kaja-orange text-white text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition"
                >
                    Iniciar sesión
                </button>
            </div>
        </nav>
    )
}

function DashboardMockup() {
    return (
        <div className="relative w-full max-w-lg mx-auto select-none">
            <div className="absolute inset-0 bg-kaja-orange/15 blur-3xl rounded-full scale-75" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                    <div className="flex-1 mx-4 h-4 bg-white/5 rounded" />
                </div>
                <div className="flex" style={{ height: 220 }}>
                    <div className="w-12 bg-white/5 border-r border-white/10 flex flex-col items-center pt-4 gap-3">
                        {[true, false, false, false, false].map((active, i) => (
                            <div
                                key={i}
                                className={`w-7 h-7 rounded-lg transition ${active ? 'bg-kaja-orange/80' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                'bg-orange-500/20',
                                'bg-slate-600/40',
                                'bg-rose-500/20',
                            ].map((bg, i) => (
                                <div key={i} className={`${bg} rounded-lg p-2`}>
                                    <div className="w-8 h-1.5 bg-white/20 rounded mb-1.5" />
                                    <div className="w-12 h-3 bg-white/40 rounded" />
                                </div>
                            ))}
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex items-end gap-1 flex-1">
                            {[40, 70, 45, 85, 55, 90, 65, 75, 50, 80].map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-t"
                                    style={{
                                        height: `${h}%`,
                                        background: i % 3 === 0
                                            ? 'rgba(249,115,22,0.6)'
                                            : 'rgba(255,255,255,0.1)',
                                    }}
                                />
                            ))}
                        </div>
                        <div className="space-y-1">
                            {[80, 60].map((w, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 rounded p-1.5">
                                    <div className="w-5 h-5 rounded-full bg-white/20 shrink-0" />
                                    <div className="flex-1 h-2 bg-white/15 rounded" style={{ width: `${w}%` }} />
                                    <div className="w-8 h-2 bg-kaja-orange/40 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description, accent }) {
    return (
        <div className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
    )
}

function InputField({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, extra }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 text-gray-900 placeholder-gray-400
            focus:outline-none focus:bg-white focus:ring-2 transition
            ${error
                            ? 'border-rose-400 focus:ring-rose-100 focus:border-rose-400'
                            : 'border-gray-200 focus:ring-kaja-orange/20 focus:border-kaja-orange/50'
                        }`}
                />
                {extra}
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
    )
}

export default function Login({ onLogin, onRegistro }) {
    const [nif, setNif] = useState('')
    const [password, setPassword] = useState('')
    const [verPassword, setVerPassword] = useState(false)
    const [camposError, setCamposError] = useState({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const loginRef = useRef(null)

    function scrollToLogin() {
        loginRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    function limpiarCampo(campo) {
        setCamposError(prev => ({ ...prev, [campo]: '' }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        const errores = {}
        if (!nif.trim()) errores.nif = 'El NIF es obligatorio.'
        if (!password) errores.password = 'La contraseña es obligatoria.'
        if (Object.keys(errores).length) { setCamposError(errores); return }
        setCamposError({})
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nif: nif.trim(), password }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error ?? 'Error al iniciar sesión'); return }
            const user = { nombre: data.nombre, rol: data.rol, imagen_perfil: data.imagen_perfil ?? null }
            localStorage.setItem('kaja_token', data.token)
            localStorage.setItem('kaja_user', JSON.stringify(user))
            sessionStorage.setItem('kaja_user', JSON.stringify(user))
            if (onLogin) onLogin(user)
        } catch {
            setError('No se pudo conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white">

            <NavBar onLoginClick={scrollToLogin} />

            <section className="relative min-h-screen bg-kaja-sidebar flex items-center overflow-hidden pt-16">

                <div className="absolute -top-32 -right-32 w-175 h-175 rounded-full bg-kaja-orange/5 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-48 -left-48 w-150 h-150 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-225 rounded-full border border-white/4 pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-kaja-orange/10 border border-kaja-orange/20 text-kaja-orange text-xs font-medium mb-8">
                            <Zap className="w-3 h-3" />
                            Sistema TPV para tu negocio
                        </div>

                        <h1 className="text-5xl lg:text-[3.75rem] font-bold text-white leading-[1.1] mb-6 tracking-tight">
                            Tu punto de venta,{' '}
                            <span className="text-kaja-orange">inteligente</span>
                        </h1>

                        <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-md">
                            Gestiona ventas, inventario y finanzas de tu negocio desde un único lugar.
                            Diseñado para ser rápido, claro y sin complicaciones.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-10">
                            <button
                                onClick={scrollToLogin}
                                className="px-6 py-3.5 bg-kaja-orange text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2"
                            >
                                Empezar ahora <ArrowRight className="w-4 h-4" />
                            </button>
                            <a
                                href="#caracteristicas"
                                className="px-6 py-3.5 bg-white/5 border border-white/10 text-white/80 font-medium rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2"
                            >
                                Ver características <ChevronDown className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {[
                                'Sin instalación, funciona en el navegador',
                                'Control de accesos por roles',
                                'Informes financieros en tiempo real',
                            ].map(item => (
                                <div key={item} className="flex items-center gap-2.5 text-sm text-white/40">
                                    <Check className="w-4 h-4 text-kaja-orange shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <DashboardMockup />
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <ChevronDown className="w-5 h-5 text-white/20" />
                </div>
            </section>

            <section className="bg-kaja-sidebar border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-x divide-white/10">
                    {[
                        { value: '4', label: 'Módulos integrados' },
                        { value: 'Web', label: 'Sin instalación' },
                        { value: '2', label: 'Roles de acceso' },
                        { value: '24/7', label: 'Disponibilidad' },
                    ].map(({ value, label }) => (
                        <div key={label} className="text-center px-4 first:pl-0 last:pr-0">
                            <div className="text-2xl font-bold text-white mb-1">{value}</div>
                            <div className="text-xs text-white/40 uppercase tracking-wider">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="caracteristicas" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <p className="text-kaja-orange text-sm font-semibold uppercase tracking-widest mb-3">Funcionalidades</p>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Todo lo que necesita tu negocio
                        </h2>
                        <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                            Desde el cobro hasta el análisis financiero, KAJA cubre cada aspecto de tu operación diaria.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <FeatureCard
                            icon={ShoppingCart}
                            title="Punto de Venta"
                            description="Cobra a tus clientes en segundos con una interfaz clara y optimizada para cualquier dispositivo."
                            accent="bg-gradient-to-br from-orange-400 to-orange-600"
                        />
                        <FeatureCard
                            icon={Package}
                            title="Control de Inventario"
                            description="Stock en tiempo real. Alertas de nivel bajo e historial completo de movimientos de productos."
                            accent="bg-gradient-to-br from-blue-500 to-blue-700"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Análisis Financiero"
                            description="Visualiza ingresos, gastos y márgenes con informes detallados para tomar mejores decisiones."
                            accent="bg-gradient-to-br from-emerald-500 to-emerald-700"
                        />
                        <FeatureCard
                            icon={Users}
                            title="Gestión de Usuarios"
                            description="Crea cuentas con roles diferenciados. Administradores con acceso total y empleados con acceso limitado."
                            accent="bg-gradient-to-br from-violet-500 to-violet-700"
                        />
                    </div>
                </div>
            </section>

            <section ref={loginRef} className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">

                    <div>
                        <p className="text-kaja-orange text-sm font-semibold uppercase tracking-widest mb-3">Acceso</p>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Accede a tu panel de control
                        </h2>
                        <p className="text-gray-400 mb-10 leading-relaxed text-sm max-w-md">
                            Inicia sesión con tus credenciales para acceder a todas las funcionalidades
                            de KAJA adaptadas a tu rol en el negocio.
                        </p>

                        <div className="space-y-5">
                            {[
                                {
                                    icon: Zap,
                                    title: 'Acceso instantáneo',
                                    desc: 'Sin tiempos de carga. Tu panel operativo en segundos.',
                                },
                                {
                                    icon: Shield,
                                    title: 'Seguridad con JWT',
                                    desc: 'Sesiones autenticadas con tokens seguros.',
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Datos en tiempo real',
                                    desc: 'Toda la información de tu negocio actualizada al momento.',
                                },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-kaja-orange/10 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-kaja-orange" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm mb-0.5">{title}</p>
                                        <p className="text-sm text-gray-400">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm">

                        <img
                            src="/img/kaja-transparente.png"
                            alt="KAJA"
                            className="h-8 object-contain mb-7"
                        />

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Iniciar sesión</h3>
                            <p className="text-sm text-gray-400">Introduce tus credenciales para continuar</p>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                            <InputField
                                id="nif"
                                label="NIF"
                                value={nif}
                                onChange={e => { setNif(e.target.value); limpiarCampo('nif') }}
                                error={camposError.nif}
                                placeholder="12345678A"
                                autoComplete="username"
                            />

                            <InputField
                                id="password"
                                label="Contraseña"
                                type={verPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); limpiarCampo('password') }}
                                error={camposError.password}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                extra={
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setVerPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    >
                                        {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            {error && (
                                <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full py-3 bg-kaja-orange text-white font-semibold rounded-xl
                                        hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed
                                        flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Accediendo...</>
                                    : 'Entrar'
                                }
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-400 mb-2">¿Aún no tienes cuenta?</p>
                            <button
                                type="button"
                                onClick={onRegistro}
                                className="text-sm font-semibold text-kaja-orange hover:underline underline-offset-2 transition"
                            >
                                Darse de alta en el sistema KAJA
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-kaja-sidebar border-t border-white/10 py-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img
                        src="/img/kaja-transparente.png"
                        alt="KAJA"
                        className="h-7 object-contain brightness-0 invert opacity-30"
                    />
                    <p className="text-white/20 text-xs">© 2026 Sistema KAJA. Todos los derechos reservados.</p>
                </div>
            </footer>

        </div>
    )
}
