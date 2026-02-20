import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TicketSearch from './pages/TicketSearch';
import MapViewer from './pages/MapViewer';
import TicketForm from './pages/TicketForm';
import Dashboard from './pages/dashboard';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import SystemLogs from './pages/SystemLogs';
import TicketDetail from './pages/TicketDetail';
import { ModalProvider } from './components/Modal';
import ChangePasswordModal from './components/ChangePasswordModal';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'dashboard');
  const [tempCoords, setTempCoords] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(() => {
    const saved = localStorage.getItem('selectedTicket');
    return saved ? JSON.parse(saved) : null;
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  React.useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    if (selectedTicket) {
      localStorage.setItem('selectedTicket', JSON.stringify(selectedTicket));
    } else {
      localStorage.removeItem('selectedTicket');
    }
  }, [selectedTicket]);

  // CIERRE DE SESIÓN POR INACTIVIDAD (1 HORA)
  React.useEffect(() => {
    if (!token) return;

    let timeoutId;
    const INACTIVITY_TIME = 3600000; // 1 hora en milisegundos

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Sesión cerrada por inactividad");
        handleLogout();
      }, INACTIVITY_TIME);
    };

    const activityEvents = [
      'mousedown', 'mousemove', 'keydown',
      'scroll', 'touchstart', 'click'
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // Iniciar el temporizador al cargar

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [token]);

  if (!token) {
    return <Login setToken={setToken} />;
  }

  const handleMapClick = (coords) => {
    setTempCoords(coords);
    setActiveTab('nuevo-ticket');
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('ticket-detalle');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // ESTILO PARA EL CONTENEDOR PRINCIPAL
  const mainStyle = {
    paddingTop: '80px', // Ajusta estos píxeles según la altura de tu Navbar
    minHeight: '100vh',
    paddingLeft: '15px',
    paddingRight: '15px'
  };

  return (
    <ModalProvider>
      <div className="container-fluid">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onChangePassword={() => setShowPasswordModal(true)}
        />
        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
        <main className="page-transition" style={mainStyle}>
          {activeTab === 'dashboard' && (
            <Dashboard onTicketClick={handleTicketClick} />
          )}
          {activeTab === 'buscar' && (
            <TicketSearch
              setActiveTab={setActiveTab}
              onTicketClick={handleTicketClick}
            />
          )}
          {activeTab === 'ticket-detalle' && (
            <TicketDetail
              ticket={selectedTicket}
              onBack={() => setActiveTab('buscar')}
            />
          )}
          {activeTab === 'mapa' && (
            <MapViewer onMapClick={handleMapClick} />
          )}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'logs' && <SystemLogs />}
          {activeTab === 'nuevo-ticket' && (
            <TicketForm
              coords={tempCoords}
              onCancel={() => {
                setActiveTab('buscar');
                setTempCoords(null);
              }}
            />
          )}
        </main>
      </div>
    </ModalProvider>
  );
}

export default App;