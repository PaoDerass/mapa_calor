import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [data, setData] = useState({
    total: 0,
    porTipo: [],
    recientes: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/tickets/dashboard-stats');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const json = await response.json();
        
        setData({
          total: json.total || 0,
          porTipo: json.por_tipo || [],
          recientes: json.recientes || [],
          loading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({ ...prev, loading: false, error: "Error de conexión" }));
      }
    };
    fetchDashboardData();
  }, []);

  // Filtramos para mostrar primero las que tienen datos y ocultar el ruido
  const categoriasActivas = data.porTipo.filter(t => t.value > 0);
  const categoriasVacias = data.porTipo.filter(t => t.value === 0);

  if (data.loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-grow text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* HEADER ESTILO MODERNO */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark m-0">Resumen Operativo</h3>
          <p className="text-muted small">Estado actual de la plataforma en tiempo real</p>
        </div>
        <div className="bg-white p-3 rounded-4 shadow-sm border d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
            <i className="bi bi-ticket-perforated-fill text-primary fs-4"></i>
          </div>
          <div>
            <div className="small text-muted fw-bold text-uppercase">Total Global</div>
            <div className="h4 fw-bold m-0 text-primary">{data.total}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* COLUMNA IZQUIERDA: CATEGORÍAS (ESTILO TABLA LIMPIA) */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white border-0 py-3 px-4">
              <h5 className="fw-bold m-0">Distribución por Tipo</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 border-0 text-muted small">CATEGORÍA</th>
                      <th className="border-0 text-muted small text-center">VOLUMEN</th>
                      <th className="border-0 text-muted small text-end pe-4">PORCENTAJE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriasActivas.length > 0 ? (
                      categoriasActivas.map((tipo, idx) => (
                        <tr key={idx}>
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-light p-2 rounded-3 me-3">
                                <i className="bi bi-circle-fill text-primary" style={{ fontSize: '0.5rem' }}></i>
                              </div>
                              <span className="fw-medium text-dark">{tipo.label}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">
                              {tipo.value} tickets
                            </span>
                          </td>
                          <td className="pe-4 text-end">
                            <div className="d-flex align-items-center justify-content-end">
                              <div className="progress w-50 me-2" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar bg-primary rounded-pill" 
                                  style={{ width: `${(tipo.value / data.total) * 100}%` }}
                                ></div>
                              </div>
                              <small className="fw-bold text-muted">
                                {Math.round((tipo.value / data.total) * 100)}%
                              </small>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-5 text-muted">No hay incidentes activos hoy</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {categoriasVacias.length > 0 && (
              <div className="card-footer bg-white border-0 py-3 px-4">
                <p className="small text-muted m-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Otras {categoriasVacias.length} categorías no registran actividad hoy.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: REPORTES (ESTILO TIMELINE REFINADO) */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div className="card-header bg-white border-0 py-3 px-4">
              <h5 className="fw-bold m-0">Actividad Reciente</h5>
            </div>
            <div className="card-body px-4">
              <div className="list-group list-group-flush">
                {data.recientes.map((ticket, idx) => (
                  <div key={idx} className="list-group-item border-0 px-0 py-3 mb-2 bg-light rounded-4 px-3">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="fw-bold text-primary small">{ticket.ticket_id}</span>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-clock me-1"></i>{ticket.hora}
                      </span>
                    </div>
                    <div className="small text-dark mb-1 fw-medium">
                      <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                      {ticket.barrio_colonia || "No especificado"}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-light w-100 rounded-pill fw-bold text-primary mt-3 border">
                VER HISTORIAL COMPLETO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;