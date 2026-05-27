import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onRegisterSuccess, onToggleToLogin }) {
  const { register } = useAuth();

  // Field states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rfc, setRfc] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Client-side validations
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido.';
    }

    if (!email) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Ingrese un formato de correo válido.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido.';
    }

    if (!address.trim()) {
      newErrors.address = 'La dirección de envío es requerida.';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida.';
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      newErrors.password = 'La contraseña debe contener letras y al menos un número.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userData = {
        full_name: fullName,
        email,
        phone,
        shipping_address: address,
        rfc,
        password
      };
      
      const res = await register(userData);
      setSuccessMsg('¡Registro completado con éxito! Redirigiendo...');
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(res.user);
        } else if (onToggleToLogin) {
          onToggleToLogin();
        }
      }, 2500);
    } catch (err) {
      setApiError(err.message || 'Ocurrió un error en el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        {/* HEADER */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-emerald-200">
              P+
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Regístrate para comprar tus medicamentos y suplementos de forma segura.
          </p>
        </div>

        {apiError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-sm font-medium text-red-800">{apiError}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md">
            <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
          </div>
        )}

        {/* REGISTER FORM */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {/* FULL NAME */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.fullName ? 'border-red-400' : 'border-slate-200'
              } focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 bg-slate-50 text-slate-800`}
              placeholder="Juan Pérez"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.email ? 'border-red-400' : 'border-slate-200'
              } focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 bg-slate-50 text-slate-800`}
              placeholder="juan@ejemplo.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* PHONE */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Teléfono *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.phone ? 'border-red-400' : 'border-slate-200'
                } focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 bg-slate-50 text-slate-800`}
                placeholder="0999999999"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* RFC (OPTIONAL) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                RFC / RUC (Opcional)
              </label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 bg-slate-50 text-slate-800"
                placeholder="1790000000001"
              />
            </div>
          </div>

          {/* SHIPPING ADDRESS */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Dirección de Envío *
            </label>
            <textarea
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              rows="2"
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.address ? 'border-red-400' : 'border-slate-200'
              } focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 bg-slate-50 text-slate-800`}
              placeholder="Av. Amazonas y Colón, Edf. Torres Colón, Dpto 4B"
            />
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
          </div>

          {/* PASSWORD GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.password ? 'border-red-400' : 'border-slate-200'
                } focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 bg-slate-50 text-slate-800`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Confirmar *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.confirmPassword ? 'border-red-400' : 'border-slate-200'
                } focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 bg-slate-50 text-slate-800`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Procesando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onToggleToLogin}
            className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            ¿Ya tienes una cuenta? Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
}
