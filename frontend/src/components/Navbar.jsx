import React, { useState } from 'react';

const Navbar = ({ activeTab, setActiveTab, onLogout }) => {
  const [showSettings, setShowSettings] = useState(false);
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-house' },
    { id: 'buscar', label: 'Tickets', icon: 'fa-solid fa-magnifying-glass' },
    { id: 'mapa', label: 'Mapa', icon: 'fa-solid fa-location-dot' }
  ];

  return (
    <nav className="fixed-top mx-auto mt-3" style={{ maxWidth: '900px', zIndex: 1050 }}>
      <div className="container-fluid bg-white border shadow-sm rounded-pill px-4 py-2 d-flex align-items-center justify-content-between"
        style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>

        {/* Logo minimalista */}
        <div className="d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <i className="fa-solid fa-circle-nodes text-primary me-2"></i>
          <span className="fw-bold tracking-tight text-dark" style={{ fontSize: '0.9rem' }}>Mapa de Calor</span>
        </div>

        {/* Links tipo botón pequeño */}
        <div className="d-flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm rounded-pill px-3 transition-all ${activeTab === tab.id
                ? 'btn-dark'
                : 'btn-link text-secondary text-decoration-none'
                }`}
              style={{ fontSize: '0.8rem', fontWeight: '500' }}
            >
              <i className={`${tab.icon} me-1`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ajustes + Perfil + Botón de Salir */}
        <div className="d-flex align-items-center gap-2 border-start ps-3">

          {/* Menú de Ajustes (Dropdown) */}
          <div className="dropdown">
            <button
              className="btn btn-link text-secondary p-0 me-2"
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              style={{ width: '32px', height: '32px' }}
              title="Configuración y Ajustes"
            >
              <i className="fa-solid fa-gear" style={{ fontSize: '1rem' }}></i>
            </button>
            <ul className={`dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 ${showSettings ? 'show' : ''}`}
              style={{ fontSize: '0.85rem', display: showSettings ? 'block' : 'none', right: 0 }}>
              <li><h6 className="dropdown-header text-uppercase small fw-bold text-muted">Ajustes del Sistema</h6></li>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center" onClick={() => { setActiveTab('admin'); setShowSettings(false); }}>
                  <i className="fa-solid fa-users me-2 text-primary" style={{ width: '20px' }}></i>Gestionar Usuarios
                </button>
              </li>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center" onClick={() => { setActiveTab('admin'); setShowSettings(false); }}>
                  <i className="fa-solid fa-user-shield me-2 text-primary" style={{ width: '20px' }}></i>Permisos y Roles
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center" onClick={() => { setActiveTab('logs'); setShowSettings(false); }}>
                  <i className="fa-solid fa-list-check me-2 text-primary" style={{ width: '20px' }}></i>Logs del Sistema
                </button>
              </li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2 me-2">
            <span className="small text-muted d-none d-sm-block" style={{ fontSize: '0.75rem' }}>Admin</span>
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
              style={{ width: '28px', height: '28px', fontSize: '0.7rem', fontWeight: 'bold' }}>
              A
            </div>
          </div>

          {/* Botón de Logout Sutil */}
          <button
            onClick={onLogout}
            className="btn btn-outline-danger border-0 rounded-circle d-flex align-items-center justify-content-center p-0"
            title="Cerrar Sesión"
            style={{ width: '32px', height: '32px', transition: 'all 0.3s' }}
          >
            <i className="fa-solid fa-power-off" style={{ fontSize: '0.85rem' }}></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;