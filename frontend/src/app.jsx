import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
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
  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'dashboard');
  const [tempCoords, setTempCoords] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(() => {
    const saved = localStorage.getItem('selectedTicket');
    return saved ? JSON.parse(saved) : null;
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  React.useEffect(() => {
    // Role-based route protection
    if (user && activeTab) {
      if (!user.permissions?.includes('ver_dashboard') && activeTab === 'dashboard') {
        setActiveTab('buscar');
      } else if (!user.permissions?.includes('ver_mapa_basico') && activeTab === 'mapa') {
        setActiveTab('buscar');
      } else if (!user.permissions?.includes('gestionar_usuarios') && activeTab === 'admin') {
        setActiveTab('buscar');
      } else if (!user.permissions?.includes('ver_auditoria') && activeTab === 'logs') {
        setActiveTab('buscar');
      } else if (!user.permissions?.includes('crear_ticket') && activeTab === 'nuevo-ticket') {
        setActiveTab('buscar');
      }
    }
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab, user]);

  React.useEffect(() => {
    if (selectedTicket) {
      localStorage.setItem('selectedTicket', JSON.stringify(selectedTicket));
    } else {
      localStorage.removeItem('selectedTicket');
    }
  }, [selectedTicket]);

  if (!token) {
    return <Login />;
  }

  const handleMapClick = (coords) => {
    setTempCoords(coords);
    setActiveTab('nuevo-ticket');
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('ticket-detalle');
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
          onLogout={logout}
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