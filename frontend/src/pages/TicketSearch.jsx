import React, { useState, useEffect } from 'react';
import { useModal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const TicketSearch = ({ setActiveTab, onTicketClick }) => {
    const { showAlert } = useModal();
    const { user } = useAuth();
    
    // Estados de datos
    const [tickets, setTickets] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [loading, setLoading] = useState(true);
    const [catalogos, setCatalogos] = useState({ departamentos: [], tipos_incidente: [] });

    // Estados para filtros
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [filtroDepartamentoId, setFiltroDepartamentoId] = useState('');
    const [filtroTipoId, setFiltroTipoId] = useState('');
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);

    // 1. Cargar datos iniciales (catálogos)
    const cargarCatalogos = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/tickets/catalogos', { 
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
            });
            if (res.ok) setCatalogos(await res.json());
        } catch (e) { console.error(e); }
    };

    // 2. Cargar incidentes (servidor)
    const obtenerIncidentes = async (resetPage = false) => {
        setLoading(true);
        const p = resetPage ? 1 : page;
        if (resetPage) setPage(1);

        const params = new URLSearchParams();
        params.append('page', p);
        params.append('page_size', pageSize);
        // Usamos 'despacho' como campo de búsqueda de texto en el backend por ahora
        if (filtroBusqueda)       params.append('despacho', filtroBusqueda);
        if (filtroDepartamentoId) params.append('departamento', filtroDepartamentoId);
        if (filtroTipoId)         params.append('tipo', filtroTipoId);
        if (filtroFechaDesde)     params.append('fecha_desde', filtroFechaDesde);
        if (filtro_hasta_plus) {
             params.append('fecha_hasta', filtroFechaHasta);
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/tickets/listar-recientes?${params.toString()}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTickets(data.items || []);
                setTotal(data.total || 0);
            } else {
                console.error("Error en la respuesta:", data.detail);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            await showAlert('No se pudo conectar con el servidor.', 'error', 'Error');
        } finally {
            setLoading(false);
        }
    };

    // Efectos
    useEffect(() => {
        cargarCatalogos();
    }, []);

    useEffect(() => {
        obtenerIncidentes();
    }, [page, pageSize]);

    const limpiarFiltros = () => {
        setFiltroBusqueda('');
        setFiltroDepartamentoId('');
        setFiltroTipoId('');
        setFiltroFechaDesde('');
        setFiltroFechaHasta('');
        setPage(1);
        obtenerIncidentes(true);
    };

    const hayFiltrosActivos = filtroBusqueda || filtroDepartamentoId || filtroTipoId || filtroFechaDesde || filtroFechaHasta;
    const totalPaginas = Math.ceil(total / pageSize);

    // Helper para fecha hasta (ajustar si es necesario)
    const filtro_hasta_plus = filtroFechaHasta;

    const exportarExcel = () => {
        const params = new URLSearchParams();
        if (filtroBusqueda)       params.append('despacho', filtroBusqueda);
        if (filtroDepartamentoId) params.append('departamento', filtroDepartamentoId);
        if (filtroTipoId)         params.append('tipo', filtroTipoId);
        if (filtroFechaDesde)     params.append('fecha_desde', filtroFechaDesde);
        if (filtroFechaHasta)     params.append('fecha_hasta', filtroFechaHasta);

        const url = `http://127.0.0.1:8000/api/tickets/exportar-excel?${params.toString()}`;
        
        // Abrir en nueva pestaña o usar un link temporal para la descarga
        const link = document.createElement('a');
        link.href = url;
        // Agregamos el token si es necesario, pero como es un GET de descarga, 
        // a veces es mejor pasarlo como param si el backend no lo pide en header para GETs de archivos
        // En este caso, el backend pide get_current_user y PermissionChecker que miran el token.
        // Como no podemos pasar headers fácilmente con window.open, 
        // una opción es pasar el token por query param o usar fetch + blob.
        // Vamos a usar fetch + blob para ser consistentes con la seguridad.
        
        descargarArchivo(url);
    };

    const descargarArchivo = async (url) => {
        try {
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error("Error al exportar");
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `reporte_incidentes_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } catch (e) {
            console.error(e);
            showAlert("No se pudo exportar el archivo.", "error", "Error");
        }
    };

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
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-success px-4 py-2 rounded-pill shadow-sm fw-bold"
                        disabled={!user.permissions?.includes('exportar_datos')}
                        onClick={exportarExcel}
                    >
                        <i className="fa-solid fa-file-excel me-2"></i>Exportar
                    </button>
                    {user.permissions?.includes('crear_ticket') && (
                        <button
                            onClick={() => setActiveTab('nuevo-ticket')}
                            className="btn btn-primary px-4 py-2 rounded-pill shadow-sm fw-bold"
                        >
                            <i className="fa-solid fa-plus me-2"></i>Nuevo Ticket
                        </button>
                    )}
                </div>
            </div>

            {/* Panel de Filtros */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-white border-0 py-3 d-flex align-items-center rounded-4 overflow-hidden">
                    <div className="d-flex align-items-center shadow-none">
                        <i className="fa-solid fa-filter text-primary me-2"></i>
                        <span className="fw-bold text-dark">Filtros de Búsqueda</span>
                        {!loading && (
                            <div className="d-flex align-items-center">
                                <span className="badge bg-primary-subtle text-primary rounded-pill ms-3 small">
                                    {total} registros
                                </span>
                                <div className="ms-3 d-flex align-items-center gap-2">
                                    <label className="small text-muted fw-semibold mb-0">Ver:</label>
                                    <select 
                                        className="form-select form-select-sm shadow-none rounded-3 border-0 bg-light"
                                        style={{ width: '70px', height: '28px', fontSize: '0.75rem' }}
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value="15">15</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="ms-auto d-flex gap-2">
                        {hayFiltrosActivos && (
                            <button className="btn btn-sm btn-link text-danger text-decoration-none small p-0 me-2" onClick={limpiarFiltros}>
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
                            <div className="col-md-4">
                                <label className="form-label small text-muted fw-semibold mb-1">Buscar (Texto)</label>
                                <input
                                    type="text"
                                    className="form-control shadow-none rounded-3 border"
                                    placeholder="Descripción o despacho..."
                                    value={filtroBusqueda}
                                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Departamento</label>
                                <select
                                    className="form-select shadow-none rounded-3 border"
                                    value={filtroDepartamentoId}
                                    onChange={(e) => setFiltroDepartamentoId(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {catalogos.departamentos?.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Tipo de Incidente</label>
                                <select
                                    className="form-select shadow-none rounded-3 border"
                                    value={filtroTipoId}
                                    onChange={(e) => setFiltroTipoId(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {catalogos.tipos_incidente?.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button className="btn btn-primary w-100 rounded-3 shadow-none" onClick={() => obtenerIncidentes(true)}>
                                    <i className="fa-solid fa-magnifying-glass me-1"></i> Buscar
                                </button>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Fecha Desde</label>
                                <input type="date" className="form-control shadow-none rounded-3 border" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small text-muted fw-semibold mb-1">Fecha Hasta</label>
                                <input type="date" className="form-control shadow-none rounded-3 border" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} />
                            </div>
                        </div>
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
                    ) : tickets.length === 0 ? (
                        <div className="text-center p-5">
                            <i className="fa-solid fa-inbox fa-3x text-light mb-3"></i>
                            <p className="text-muted">No se encontraron incidentes.</p>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 border-0 text-muted small fw-bold">ID TICKET</th>
                                    <th className="border-0 text-muted small fw-bold">FECHA</th>
                                    <th className="border-0 text-muted small fw-bold">DEPARTAMENTO</th>
                                    <th className="border-0 text-muted small fw-bold">TIPO</th>
                                    <th className="border-0 text-muted small fw-bold">DESCRIPCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket.id} onClick={() => onTicketClick && onTicketClick(ticket)} style={{ cursor: 'pointer' }}>
                                        <td className="ps-4">
                                            <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1">{ticket.ticket_id}</span>
                                        </td>
                                        <td className="text-secondary small">{ticket.fecha}</td>
                                        <td><span className="small text-dark fw-medium">{ticket.departamento || 'N/A'}</span></td>
                                        <td>
                                            <span className="badge rounded-pill bg-info-subtle text-info px-2 py-1 small fw-medium">
                                                {ticket.tipo_incidente || 'N/A'}
                                            </span>
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

                {/* Paginación */}
                {!loading && totalPaginas > 1 && (
                    <div className="card-footer bg-white border-0 py-3 d-flex justify-content-center align-items-center gap-3">
                        <button 
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-none fw-bold"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <i className="fa-solid fa-chevron-left me-1"></i>Anterior
                        </button>
                        <div className="text-muted small fw-bold">Página {page} de {totalPaginas}</div>
                        <button 
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-none fw-bold"
                            disabled={page === totalPaginas}
                            onClick={() => setPage(page + 1)}
                        >
                            Siguiente<i className="fa-solid fa-chevron-right ms-1"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketSearch;