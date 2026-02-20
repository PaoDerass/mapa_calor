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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tempCoords, setTempCoords] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

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
        />
        <main className="page-transition" style={mainStyle}>
          {activeTab === 'dashboard' && <Dashboard />}
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