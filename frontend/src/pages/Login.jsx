import React, { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../lib/notifications';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // SANEAMIENTO: Limpiamos espacios antes de enviar al servidor
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // VALIDACIÓN: Evitamos enviar campos vacíos tras el trim
    if (!cleanUsername || !cleanPassword) {
      notifyError('Por favor, rellena todos los campos.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Guardamos la respuesta del GET para atrapar el token
      const csrfResponse = await api.get('/api/auth/csrf');
      
      // 2. Extraemos el token de la cabecera expuesta
      const csrfToken = csrfResponse.headers['x-xsrf-token'];
      
      // 3. Enviamos los datos inyectando la cabecera explícitamente
      const res = await api.post('/api/auth/login', 
        { 
          username: cleanUsername, 
          password: cleanPassword 
        },
        {
          headers: {
            'X-XSRF-TOKEN': csrfToken
          }
        }
      );
      
      localStorage.setItem('user', JSON.stringify(res.data));
      notifySuccess('¡Bienvenido! Redirigiendo...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        notifyError(err.response.data);
      } else {
        notifyError(err.response?.data || 'Credenciales inválidas o error de conexión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-view">
      <section className="login-splash" aria-hidden="true">
        <h2>Bienvenido a tu galería privada</h2>
        <p>
          Ingresa para gestionar imágenes, revisar contenido protegido y mantener tus archivos bajo control.
        </p>

        <div className="login-splash__stats">
          <div><strong>+50MB</strong><span>carga segura</span></div>
          <div><strong>JWT</strong><span>sesión protegida</span></div>
          <div><strong>RBAC</strong><span>roles por usuario</span></div>
        </div>
      </section>

      <section className="login-card" aria-label="Formulario de inicio de sesión">
        <div className="login-card__header">
          <span className="login-card__eyebrow">Multimedia Gallery</span>
          <h1>Iniciar sesión</h1>
          <p>Ingresa tus credenciales para continuar.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="field">
            <span>Usuario</span>
            <div className="field__control">
              <span className="field__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                </svg>
              </span>
              <input
                value={username}
                placeholder="Ej: jmrciallo"
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Contraseña</span>
            <div className="field__control">
              <span className="field__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 8.73V18a1 1 0 0 0 2 0v-1.27a2 2 0 1 0-2 0ZM10 8V6a2 2 0 0 1 4 0v2Z" />
                </svg>
              </span>
              <input
                value={password}
                type="password"
                placeholder="Escribe tu contraseña"
                autoComplete="current-password"
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner /> Verificando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-card__footer">
          <span>¿No tienes cuenta?</span>
          <a href="/register">Crear cuenta</a>
        </div>
      </section>
    </div>
  );
}