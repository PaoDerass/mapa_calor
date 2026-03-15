import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
      } else {
        setError('Credenciales incorrectas. Verifique e intente de nuevo.');
      }
    } catch (err) {
      setError('No se pudo establecer conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition d-flex align-items-center justify-content-center vh-100"
      style={{ backgroundColor: '#f8f9fa' }}>

      <div className="card border-0 shadow-sm rounded-4 p-2" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">

          {/* Encabezado Estilo Sistema */}
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3"
              style={{ width: '60px', height: '60px' }}>
              <i className="fa-solid fa-map-location-dot text-primary fs-3"></i>
            </div>
            <h3 className="text-dark fw-bold m-0">Mapa de Calor</h3>
            <p className="text-muted small">Acceso al Sistema de Incidentes</p>
          </div>

          {error && (
            <div className="alert alert-danger border-0 small py-2 rounded-3 mb-4 shadow-sm">
              <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Input Usuario */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase">Usuario</label>
              <div className="input-group shadow-sm rounded-pill overflow-hidden border">
                <span className="input-group-text bg-white border-0 ps-3">
                  <i className="fa-solid fa-user text-muted small"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 py-2 shadow-none"
                  placeholder="Usuario institucional"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Contraseña</label>
              <div className="input-group shadow-sm rounded-pill overflow-hidden border">
                <span className="input-group-text bg-white border-0 ps-3">
                  <i className="fa-solid fa-lock text-muted small"></i>
                </span>
                <input
                  type="password"
                  className="form-control border-0 py-2 shadow-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 rounded-pill shadow-sm fw-bold transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <><i className="fa-solid fa-right-to-bracket me-2"></i>INGRESAR</>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted" style={{ fontSize: '0.7rem' }}>
              <i className="fa-solid fa-shield-halved me-1"></i>
              Uso exclusivo para personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;