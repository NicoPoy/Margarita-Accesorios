import React, { useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../utils/authErrors';

const emptyAuthForm = {
  nombre: '',
  whatsapp: '',
  dni: '',
  email: '',
  password: ''
};

function AuthModal({ mode, onClose, onModeChange, onProfileChange }) {
  const [form, setForm] = useState(emptyAuthForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!hasSupabaseConfig) {
      setStatus({
        type: 'error',
        message: 'Falta configurar Supabase en .env.local para usar el acceso.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              nombre: form.nombre,
              whatsapp: form.whatsapp,
              dni: form.dni
            }
          }
        });

        if (error) throw error;

        if (!data.user?.identities?.length) {
          setStatus({
            type: 'error',
            message: 'Ese email ya esta registrado. Inicia sesion o usa otro correo.'
          });
          return;
        }

        const userId = data.user?.id;

        if (userId && data.session) {
          const profile = {
            id: userId,
            nombre: form.nombre,
            whatsapp: form.whatsapp,
            dni: form.dni,
            activo: true
          };

          const { error: profileError } = await supabase
            .from('usuarios')
            .upsert(profile);

          if (profileError) throw profileError;

          onProfileChange(profile);
        }

        setStatus({
          type: 'success',
          message: 'Registro creado. Revisa tu email y confirma la cuenta antes de iniciar sesion.'
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (error) throw error;

      if (data.user?.id) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('id, nombre, whatsapp, dni, activo')
          .eq('id', data.user.id)
          .maybeSingle();

        onProfileChange(profile);
      }

      onClose();
    } catch (error) {
      setStatus({
        type: 'error',
        message: getAuthErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label="Cerrar">
          x
        </button>

        <div className="auth-heading">
          <span>{isRegister ? 'Crear cuenta' : 'Acceso'}</span>
          <h2 id="auth-title">{isRegister ? 'Registrarse' : 'Iniciar sesion'}</h2>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            className={!isRegister ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('login')}
          >
            Iniciar sesion
          </button>
          <button
            className={isRegister ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('register')}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label>
                <span>Nombre</span>
                <input
                  value={form.nombre}
                  onChange={(event) => updateField('nombre', event.target.value)}
                  required
                />
              </label>
              <label>
                <span>WhatsApp</span>
                <input
                  value={form.whatsapp}
                  onChange={(event) => updateField('whatsapp', event.target.value)}
                  placeholder="+54 9 ..."
                />
              </label>
              <label>
                <span>DNI</span>
                <input
                  value={form.dni}
                  onChange={(event) => updateField('dni', event.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
            />
          </label>

          <label>
            <span>Contrasena</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              minLength={6}
              required
            />
          </label>

          {status.message && (
            <p className={`auth-message ${status.type}`}>{status.message}</p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AuthModal;
