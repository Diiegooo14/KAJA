import { useRef, useState } from 'react'
import {
  Camera, Building2, User, ShoppingCart,
  Package, BarChart3, ArrowLeft, CheckCircle,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL
const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const campoVacio = () => ({
  empresaNif: '', razonSocial: '', nombreComercial: '',
  direccion: '', telefono: '', empresaEmail: '',
  adminNif: '', adminNombre: '', adminPassword: '', adminPasswordConfirm: '',
})

// Subcomponentes 

function AvatarUpload({ preview, onSeleccionar, error, label }) {
  const inputRef = useRef(null)

  return (
    <div className="flex items-center gap-4 mb-5">
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        aria-label={preview ? `Cambiar ${label}` : `Subir ${label}`}
        className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 group transition
          ${error ? 'ring-2 ring-rose-400' : 'ring-2 ring-gray-200 hover:ring-kaja-orange'}`}
      >
        {preview
          ? <img src={preview} alt={label} width="80" height="80" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-kaja-light flex items-center justify-center">
            <Camera className="w-6 h-6 text-gray-400" />
          </div>
        }
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </button>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={onSeleccionar}
          className="hidden"
        />
        <p className="text-sm font-medium text-kaja-blueText mb-0.5">{label}</p>
        <p className="text-xs text-gray-400">Opcional · JPG, PNG, GIF, WEBP · Máx. 5MB</p>
        {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
      </div>
    </div>
  )
}

function Campo({ label, name, value, onChange, placeholder, error, type = 'text', autoComplete, maxLength, inputMode, pattern }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 text-gray-900 placeholder-gray-400
          focus:outline-none focus:bg-white focus:ring-2 transition
          ${error
            ? 'border-rose-400 focus:ring-rose-100 focus:border-rose-400'
            : 'border-gray-200 focus:ring-kaja-orange/20 focus:border-kaja-orange/50'
          }`}
      />
      {maxLength && value.length === maxLength && (
        <p className="text-xs text-amber-500">Límite de {maxLength} caracteres alcanzado</p>
      )}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

function SeccionHeader({ icon: Icon, label, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-kaja-orange/10 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-kaja-orange" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-kaja-orange">{label}</p>
        <h3 className="text-sm font-bold text-kaja-blueText leading-tight">{title}</h3>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white/70" />
      </div>
      <span className="text-sm text-white/60">{text}</span>
    </div>
  )
}

// Pantalla de éxito 

function PantallaExito({ onVolver }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-kaja-sidebar flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="relative z-10">
          <img src="/img/kaja-transparente.webp" alt="KAJA" width="200" height="40" className="h-10 brightness-0 invert object-contain" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-3">¡Todo listo!</h2>
          <p className="text-white/50 text-sm leading-relaxed">Tu empresa ya está registrada en el sistema KAJA. Ahora puedes empezar a gestionar tus ventas.</p>
        </div>
        <p className="relative z-10 text-white/25 text-xs">© 2026 Sistema KAJA</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-kaja-blueText mb-2">¡Alta completada!</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Tu empresa ha sido registrada correctamente en el sistema KAJA.
            Ya puedes iniciar sesión con las credenciales del administrador.
          </p>
          <button
            onClick={onVolver}
            className="w-full py-3 bg-kaja-orange text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}

// Formulario principal 

export default function Register({ onVolver }) {
  const [form, setForm] = useState(campoVacio)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [loading, setLoading] = useState(false)

  const [logoEmpresa, setLogoEmpresa] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [errorLogo, setErrorLogo] = useState('')
  const [fotoAdmin, setFotoAdmin] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [errorFoto, setErrorFoto] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    const finalValue = name === 'telefono' ? value.replace(/\D/g, '').slice(0, 9) : value
    setForm(prev => ({ ...prev, [name]: finalValue }))
    setErrores(prev => ({ ...prev, [name]: '' }))
  }

  function seleccionar(setter, setPreview, setErr) {
    return (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (!TIPOS_VALIDOS.includes(file.type)) { setErr('Solo JPG, PNG, GIF o WEBP'); e.target.value = ''; return }
      if (file.size > 5 * 1024 * 1024) { setErr('Máximo 5MB'); e.target.value = ''; return }
      setErr('')
      setter(file)
      setPreview(URL.createObjectURL(file))
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (logoEmpresa) fd.append('logoEmpresa', logoEmpresa)
      if (fotoAdmin) fd.append('fotoAdmin', fotoAdmin)

      const res = await fetch(`${API_URL}/registro`, { method: 'POST', body: fd })
      const data = await res.json()

      if (res.status === 422) { setErrores(data.errores ?? {}); return }
      if (!res.ok) { setError(data.error ?? 'Error al registrar la empresa'); return }

      setExito(true)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  if (exito) return <PantallaExito onVolver={onVolver} />

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-[38%] bg-kaja-sidebar flex-col gap-10 p-12 relative overflow-hidden shrink-0">

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-8 w-48 h-48 rounded-full bg-kaja-orange/8" />

        <div className="relative z-10 flex flex-col gap-6">
          <img src="/img/kaja-transparente.webp" alt="KAJA" width="200" height="40" className="h-10 brightness-0 invert object-contain" />
          <button
            onClick={onVolver}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </button>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-s font-bold uppercase tracking-widest text-kaja-orange mb-3">Nuevo registro</p>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Empieza a gestionar<br />
              <span className="text-kaja-orange">tu negocio hoy</span>
            </h1>
            <p className="text-white/50 text-m leading-relaxed max-w-xs">
              Crea tu cuenta empresarial y accede a todas las herramientas del sistema KAJA en minutos.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-2">
            <Feature icon={ShoppingCart} text="Punto de venta rápido e intuitivo" />
            <Feature icon={Package} text="Control de inventario en tiempo real" />
            <Feature icon={BarChart3} text="Análisis financiero detallado" />
          </div>
        </div>

        <p className="relative z-10 mt-auto text-white/25 text-xs">© 2026 Sistema KAJA. Todos los derechos reservados.</p>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 bg-kaja-light overflow-y-auto lg:overflow-hidden">
        <div className="h-full flex flex-col justify-center px-8 py-6">
          <div className="w-full max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-kaja-blueText mb-1">Alta en el sistema KAJA</h2>
              <p className="text-sm text-gray-400">Introduce los datos de tu empresa y del administrador principal.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Sección empresa */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5">
                <SeccionHeader icon={Building2} label="Paso 1" title="Datos de la empresa" />

                <AvatarUpload
                  preview={logoPreview}
                  onSeleccionar={seleccionar(setLogoEmpresa, setLogoPreview, setErrorLogo)}
                  error={errorLogo}
                  label="Logo de la empresa"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Campo label="NIF de la empresa *" name="empresaNif" value={form.empresaNif} onChange={handleChange} placeholder="B12345678" error={errores.empresaNif} maxLength={9} />
                  <Campo label="Razón Social *" name="razonSocial" value={form.razonSocial} onChange={handleChange} placeholder="Empresa S.L." error={errores.razonSocial} maxLength={30} />
                  <Campo label="Nombre Comercial *" name="nombreComercial" value={form.nombreComercial} onChange={handleChange} placeholder="Mi Tienda" error={errores.nombreComercial} maxLength={30} />
                  <Campo label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle Mayor 1" error={errores.direccion} maxLength={40} />
                  <Campo label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="600000000" error={errores.telefono} maxLength={9} inputMode="numeric" pattern="[0-9]*" />
                  <Campo label="Email de la empresa" name="empresaEmail" value={form.empresaEmail} onChange={handleChange} placeholder="contacto@empresa.es" error={errores.empresaEmail} type="email" maxLength={30} />
                </div>
              </div>

              {/* Sección administrador  */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5">
                <SeccionHeader icon={User} label="Paso 2" title="Datos del administrador" />

                <AvatarUpload
                  preview={fotoPreview}
                  onSeleccionar={seleccionar(setFotoAdmin, setFotoPreview, setErrorFoto)}
                  error={errorFoto}
                  label="Foto de perfil"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Campo label="NIF del administrador *" name="adminNif" value={form.adminNif} onChange={handleChange} placeholder="12345678A" error={errores.adminNif} maxLength={9} />
                  <Campo label="Nombre completo *" name="adminNombre" value={form.adminNombre} onChange={handleChange} placeholder="Ana García" error={errores.adminNombre} maxLength={30} />
                  <Campo label="Contraseña *" name="adminPassword" value={form.adminPassword} onChange={handleChange} placeholder="Mínimo 8 caracteres" error={errores.adminPassword} type="password" autoComplete="new-password" maxLength={15} />
                  <Campo label="Confirmar contraseña *" name="adminPasswordConfirm" value={form.adminPasswordConfirm} onChange={handleChange} placeholder="Repite la contraseña" error={errores.adminPasswordConfirm} type="password" autoComplete="new-password" maxLength={15} />
                </div>
              </div>

              {/*  Acciones */}
              <div className="flex flex-col gap-3 lg:col-span-2">
                {error && (
                  <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-kaja-orange text-white font-bold rounded-xl
                    hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2 text-sm"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registrando empresa...</>
                    : 'Crear cuenta'
                  }
                </button>

                <button
                  type="button"
                  onClick={onVolver}
                  className="w-full py-3 border border-gray-200 bg-white text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 active:scale-[0.98] transition lg:hidden"
                >
                  Volver al inicio de sesión
                </button>
              </div>

            </form>

            <p className="text-center text-xs text-gray-400 mt-4">© 2026 Sistema KAJA</p>

          </div>
        </div>
      </div>

    </div>
  )
}
