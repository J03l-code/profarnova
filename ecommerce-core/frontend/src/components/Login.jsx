import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onLoginSuccess, forceAdminLayout = false }) {
  const { login, recoverPassword } = useAuth();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Feedback states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState('');

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Ingrese un formato de correo válido (ej: usuario@correo.com).';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida.';
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const user = await login(email, password, rememberMe);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setApiError(err.message || 'Error de conexión. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setRecoveryStatus('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recoveryEmail || !emailRegex.test(recoveryEmail)) {
      alert('Por favor ingrese un correo electrónico válido.');
      return;
    }

    try {
      const msg = await recoverPassword(recoveryEmail);
      setRecoveryStatus(msg);
      setTimeout(() => {
        setShowRecovery(false);
        setRecoveryStatus('');
      }, 5000);
    } catch (err) {
      alert(err.message || 'Error al procesar recuperación.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        {/* LOGO & HEADER */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/profarnova-logo.png" alt="PROFARNOVA" className="h-12 w-auto" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {forceAdminLayout ? 'Acceso Administrativo' : 'Iniciar Sesión'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {forceAdminLayout 
              ? 'Panel de gestión eCommerce PROFARNOVA' 
              : 'Bienvenido de vuelta. Ingresa a tu cuenta de salud.'}
          </p>
        </div>

        {apiError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {!showRecovery ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              {/* EMAIL */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.email ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-emerald-200'
                    } focus:outline-none focus:ring-4 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50`}
                    placeholder="ejemplo@profarnova.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-emerald-200'
                  } focus:outline-none focus:ring-4 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            {/* REMEMBER ME & FORGOT PASSWORD */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                  Recordarme
                </label>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Ingresar'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* RECOVERY FORM */
          <form className="mt-8 space-y-6" onSubmit={handleRecoverySubmit}>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600">
              Ingresa el correo electrónico asociado a tu cuenta de PROFARNOVA y te enviaremos las instrucciones de restablecimiento.
            </div>

            <div>
              <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                id="recovery-email"
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-emerald-200 focus:outline-none focus:ring-4 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50"
                placeholder="ejemplo@profarnova.com"
              />
            </div>

            {recoveryStatus && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md">
                <p className="text-xs font-semibold text-emerald-800">{recoveryStatus}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                className="w-1/2 flex justify-center py-3 px-4 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Volver
              </button>
              
              <button
                type="submit"
                className="w-1/2 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                Enviar enlace
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
