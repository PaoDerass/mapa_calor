import React, { useState, useEffect } from 'react';
import { useModal } from '../components/Modal';

const TicketSearch = ({ setActiveTab, onTicketClick }) => {
    const { showAlert } = useModal();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para filtros
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [filtroDepartamento, setFiltroDepartamento] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);

    // 1. Cargar incidentes desde PostgreSQL
    const obtenerIncidentes = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/tickets/listar-recientes');
            const data = await res.json();
            if (res.ok) {
                console.log("Datos recibidos de la API:", data);
                setTickets(data);
            } else {
                console.error("Error en la respuesta:", data.detail);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            await showAlert('No se pudo conectar con el servidor para cargar los datos.', 'error', 'Error de conexión');

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        obtenerIncidentes();
    }, []);

    // Listas únicas para los selectores de filtro
    const departamentos = [...new Set(tickets.map(t => t.departamento).filter(Boolean))].sort();
    const tiposIncidente = [...new Set(tickets.map(t => t.tipo_incidente).filter(Boolean))].sort();

    // 2. Filtrado multi-campo
    const ticketsFiltrados = tickets.filter(t => {
        const textoBusqueda = filtroBusqueda.toLowerCase();
        const coincideTexto = !filtroBusqueda ||
            t.ticket_id?.toLowerCase().includes(textoBusqueda) ||
            t.descripcion?.toLowerCase().includes(textoBusqueda);

        const coincideDepartamento = !filtroDepartamento || t.departamento === filtroDepartamento;
        const coincideTipo = !filtroTipo || t.tipo_incidente === filtroTipo;

        // Filtro por rango de fechas
        let coincideFecha = true;
        if (filtroFechaDesde || filtroFechaHasta) {
            const fechaTicket = t.fecha ? new Date(t.fecha) : null;
            if (fechaTicket) {
                if (filtroFechaDesde) {
                    coincideFecha = coincideFecha && fechaTicket >= new Date(filtroFechaDesde);
                }
                if (filtroFechaHasta) {
                    const hasta = new Date(filtroFechaHasta);
                    hasta.setHours(23, 59, 59);
                    coincideFecha = coincideFecha && fechaTicket <= hasta;
                }
            }
        }

        return coincideTexto && coincideDepartamento && coincideTipo && coincideFecha;
    });

    const limpiarFiltros = () => {
        setFiltroBusqueda('');
        setFiltroDepartamento('');
        setFiltroTipo('');
        setFiltroFechaDesde('');
        setFiltroFechaHasta('');
    };

    const hayFiltrosActivos = filtroBusqueda || filtroDepartamento || filtroTipo || filtroFechaDesde || filtroFechaHasta;

    return (
        <div className="page-transition container-fluid pb-5">
            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="text-dark fw-bold m-0">
                        <i className="fa-solid fa-magnifying-glass me-2 text-primary"></i>Consulta de Incidentes
                    </h3>
                    <p className="text-muted small m-0">Registros almacenados en PostgreSQL</p>
                </div>
                <button
                    onClick={() => setActiveTab('nuevo-ticket')}
                    className="btn btn-primary px-4 py-2 rounded-pill shadow-sm fw-bold"
                >
                    <i className="fa-solid fa-plus me-2"></i>Nuevo Ticket
                </button>
            </div>

            {/* Panel de Filtros Colapsable */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-white border-0 py-3 d-flex align-items-center rounded-4 overflow-hidden">
                    <div className="d-flex align-items-center shadow-none">
                        <i className="fa-solid fa-filter text-primary me-2"></i>
                        <span className="fw-bold text-dark">Filtros Avanzados</span>
                        {!loading && (
                            <span className="badge bg-primary-subtle text-primary rounded-pill ms-3 small">
                                {ticketsFiltrados.length} resultados
                            </span>
                        )}
                        {hayFiltrosActivos && (
                            <span className="badge bg-warning-subtle text-warning dark ms-2 rounded-pill small">
                                <i className="fa-solid fa-circle-check me-1 small"></i>Filtros Activos
                            </span>
                        )}
                    </div>

                    <div className="ms-auto d-flex gap-2">
                        {hayFiltrosActivos && (
                            <button
                                className="btn btn-sm btn-link text-danger text-decoration-none small p-0 me-2"
                                onClick={limpiarFiltros}
                            >
                                <i className="fa-solid fa-xmark me-1"></i>Limpiar
                            </button>
                        )}
                        <button
                            className={`btn btn-sm rounded-pill px-3 shadow-sm transition-all ${filtrosVisibles ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                        >
                            <i className={`fa-solid ${filtrosVisibles ? 'fa-chevron-up' : 'fa-chevron-down'} me-1`}></i>
                            {filtrosVisibles ? 'Ocultar' : 'Filtrar'}
                        </button>
                    </div>
                </div>

                <div className={`collapse ${filtrosVisibles ? 'show' : ''}`}>
                    <div className="card-body pt-0 px-3 pb-3">
                        <div className="row g-3">
                            {/* Búsqueda por texto */}
                            <div className="col-md-4">
                                <label className="form-label small text-muted fw-semibold mb-1">Buscar</label>
                                <div className="input-group border rounded-3 overflow-hidden shadow-none">
                                    <span className="input-group-text bg-white border-0">
                                        <i className="fa-solid fa-search text-muted small"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-0 py-2 shadow-none"
                                        placeholder="ID ticket o descripción..."
                                        value={filtroBusqueda}
                                        onChange={(e) => setFiltroBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filtro por Departamento */}
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Departamento</label>
                                <select
                                    className="form-select shadow-none rounded-3 border bg-light-subtle"
                                    value={filtroDepartamento}
                                    onChange={(e) => setFiltroDepartamento(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {departamentos.map(dep => (
                                        <option key={dep} value={dep}>{dep}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Tipo de Incidente */}
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Tipo de Incidente</label>
                                <select
                                    className="form-select shadow-none rounded-3 border bg-light-subtle"
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {tiposIncidente.map(tipo => (
                                        <option key={tipo} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Botón actualizar */}
                            <div className="col-md-2 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary w-100 rounded-3"
                                    onClick={obtenerIncidentes}
                                >
                                    <i className="fa-solid fa-rotate me-1"></i> Actualizar
                                </button>
                            </div>

                            {/* Rango de fechas */}
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Desde</label>
                                <input
                                    type="date"
                                    className="form-control shadow-none rounded-3 border bg-light-subtle"
                                    value={filtroFechaDesde}
                                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Hasta</label>
                                <input
                                    type="date"
                                    className="form-control shadow-none rounded-3 border bg-light-subtle"
                                    value={filtroFechaHasta}
                                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Indicador de resultados resumido */}
                        {!loading && (
                            <div className="mt-3 pt-2 border-top">
                                <span className="small text-muted">
                                    Mostrando <strong>{ticketsFiltrados.length}</strong> de <strong>{tickets.length}</strong> incidentes en total.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Consultando base de datos...</p>
                        </div>
                    ) : ticketsFiltrados.length === 0 ? (
                        <div className="text-center p-5">
                            <i className="fa-solid fa-inbox fa-3x text-light mb-3"></i>
                            <p className="text-muted">No se encontraron incidentes con los filtros aplicados.</p>
                            {hayFiltrosActivos && (
                                <button className="btn btn-sm btn-outline-primary rounded-pill px-4" onClick={limpiarFiltros}>
                                    Quitar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 border-0 text-muted small fw-bold">ID TICKET</th>
                                    <th className="border-0 text-muted small fw-bold">FECHA INCIDENTE</th>
                                    <th className="border-0 text-muted small fw-bold">DEPARTAMENTO</th>
                                    <th className="border-0 text-muted small fw-bold">TIPO INCIDENTE</th>
                                    <th className="border-0 text-muted small fw-bold">DESCRIPCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticketsFiltrados.map((ticket) => (
                                    <tr
                                        key={ticket.ticket_id || ticket.id}
                                        onClick={() => onTicketClick && onTicketClick(ticket)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click para ver detalle"
                                    >
                                        <td className="ps-4">
                                            <span className="badge bg-primary-subtle text-primary fw-bold">{ticket.ticket_id}</span>
                                        </td>
                                        <td className="text-secondary small">
                                            {ticket.fecha}
                                        </td>
                                        <td>
                                            <span className="small text-dark">{ticket.departamento || 'No especificado'}</span>
                                        </td>
                                        <td>
                                            {ticket.tipo_incidente ? (
                                                <span className="badge rounded-pill bg-info-subtle text-info small">
                                                    {ticket.tipo_incidente}
                                                </span>
                                            ) : (
                                                <span className="text-muted small">No especificado</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="text-truncate text-muted small" style={{ maxWidth: '300px' }}>
                                                {ticket.descripcion}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketSearch;