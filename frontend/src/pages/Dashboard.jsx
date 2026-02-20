import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const Dashboard = ({ onTicketClick }) => {
  const [data, setData] = useState({
    total: 0,
    tickets24h: 0,
    tendencia: [],
    porTipo: [],
    topUbicaciones: [],
    recientes: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/tickets/dashboard-stats');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const json = await response.json();

        setData({
          total: json.total || 0,
          tickets24h: json.tickets_24h || 0,
          tendencia: json.tendencia || [],
          porTipo: json.por_tipo || [],
          topUbicaciones: json.top_ubicaciones || [],
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

  if (data.loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-grow text-primary" role="status"></div>
    </div>
  );

  const COLORS = ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'];

  return (
    <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

      {/* HEADER */}
      <div className="mb-4">
        <h3 className="fw-bold text-dark m-0">Dashboard de Inteligencia</h3>
        <p className="text-muted small">Panel de monitoreo y análisis de incidentes en tiempo real</p>
      </div>

      {/* METRIC CARDS */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', color: 'white' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="small fw-bold text-uppercase opacity-75">Total Histórico</div>
                <div className="h2 fw-bold m-0">{data.total}</div>
              </div>
              <i className="fa-solid fa-database fs-1 opacity-25"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="small fw-bold text-uppercase text-muted">Últimas 24 Horas</div>
                <div className="h2 fw-bold m-0 text-primary">{data.tickets24h}</div>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                <i className="fa-solid fa-bolt text-primary fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="small fw-bold text-uppercase text-muted">Zonas Activas</div>
                <div className="h2 fw-bold m-0 text-dark">{data.topUbicaciones.length}</div>
              </div>
              <div className="bg-dark bg-opacity-10 p-3 rounded-circle">
                <i className="fa-solid fa-map-location-dot text-dark fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* TENDENCIA SEMANAL */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h6 className="fw-bold mb-4 text-muted text-uppercase small">Tendencia de Incidentes (Últimos 7 Días)</h6>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data.tendencia}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#999' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#0d6efd"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#0d6efd', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* DISTRIBUCIÓN POR TIPO */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h6 className="fw-bold mb-4 text-muted text-uppercase small">Distribución por Tipo</h6>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.porTipo}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="label"
                  >
                    {data.porTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 overflow-auto" style={{ maxHeight: '100px' }}>
              {data.porTipo.map((t, i) => (
                <div key={i} className="d-flex align-items-center mb-1">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], marginRight: 8 }}></div>
                  <span className="small text-muted">{t.label}: <b>{t.value}</b></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* TOP UBICACIONES */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h6 className="fw-bold mb-4 text-muted text-uppercase small">Sectores con Mayor Actividad</h6>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={data.topUbicaciones} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    fontSize={11}
                  />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#0d6efd" radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h6 className="fw-bold mb-4 text-muted text-uppercase small">Últimos Reportes</h6>
            <div className="list-group list-group-flush">
              {data.recientes.map((ticket, idx) => (
                <div
                  key={idx}
                  className="list-group-item border-0 px-0 py-3 d-flex align-items-center transition-all bg-light bg-opacity-50 rounded-4 px-3 mb-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onTicketClick(ticket)}
                >
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                    {ticket.hora}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold text-dark small">{ticket.ticket_id}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      <i className="fa-solid fa-location-dot me-1 text-danger"></i>
                      {ticket.barrio_colonia}
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-muted opacity-25"></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
