import React, { useEffect } from 'react';

const TicketDetail = ({ ticket, onBack }) => {
    useEffect(() => {
        if (!window.L || !ticket || !ticket.lat || !ticket.lng) return;
        const L = window.L;

        // Inicializar mapa
        const map = L.map('detail-map-container', { zoomAnimation: false })
            .setView([ticket.lat, ticket.lng], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Icono personalizado basado en el tipo (opcional, usando uno genérico azul aquí para simplicidad o el mismo de MapViewer)
        const customIcon = L.divIcon({
            className: '',
            html: `
                <div style="
                    width: 32px; height: 32px;
                    background: #0d6efd;
                    color: white;
                    border: 2px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                ">
                    <i class="fa-solid fa-location-dot" style="transform: rotate(45deg); font-size: 14px;"></i>
                </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        L.marker([ticket.lat, ticket.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(`<b>${ticket.ticket_id}</b><br/>${ticket.barrio || 'Sin ubicación'}`)
            .openPopup();

        return () => {
            try { map.remove(); } catch (e) { }
        };
    }, [ticket]);

    if (!ticket) {
        return (
            <div className="text-center p-5">
                <i className="fa-solid fa-circle-exclamation fa-3x text-warning mb-3"></i>
                <p>No se ha seleccionado ningún ticket.</p>
                <button className="btn btn-primary rounded-pill" onClick={onBack}>Regresar</button>
            </div>
        );
    }

    return (
        <div className="page-transition container-fluid pb-5">
            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button className="btn btn-outline-secondary btn-sm rounded-pill mb-2" onClick={onBack}>
                        <i className="fa-solid fa-arrow-left me-1"></i> Regresar
                    </button>
                    <h3 className="text-dark fw-bold m-0">
                        Detalle del Ticket: <span className="text-primary">{ticket.ticket_id}</span>
                    </h3>
                </div>
                <span className={`badge rounded-pill px-3 py-2 ${ticket.tipo_incidente ? 'bg-primary' : 'bg-secondary'}`}>
                    {ticket.tipo_incidente || 'Sin tipo'}
                </span>
            </div>

            <div className="row g-4">
                {/* Columna de Información */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">Información General</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Fecha de Reporte</label>
                                    <p className="mb-0 fw-semibold"><i className="fa-solid fa-calendar text-primary me-2"></i>{ticket.fecha}</p>
                                </div>
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Fecha Registro Sistema</label>
                                    <p className="mb-0 fw-semibold"><i className="fa-solid fa-clock text-primary me-2"></i>{ticket.fecha_sistema}</p>
                                </div>
                                <div className="col-sm-12">
                                    <hr className="my-2 opacity-50" />
                                </div>
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Departamento</label>
                                    <p className="mb-0 fw-semibold">{ticket.departamento || 'N/A'}</p>
                                </div>
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Municipio</label>
                                    <p className="mb-0 fw-semibold">{ticket.municipio || 'N/A'}</p>
                                </div>
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Barrio/Colonia</label>
                                    <p className="mb-0 fw-semibold">{ticket.barrio || 'N/A'}</p>
                                </div>
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Despacho</label>
                                    <p className="mb-0 fw-semibold">{ticket.despacho || 'N/A'}</p>
                                </div>
                                <div className="col-sm-12">
                                    <hr className="my-2 opacity-50" />
                                </div>
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Tipo de Incidente</label>
                                    <p className="mb-0 fw-semibold">{ticket.tipo_incidente || 'N/A'}</p>
                                </div>
                                <div className="col-sm-6">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Subtipo</label>
                                    <p className="mb-0 fw-semibold">{ticket.subtipo_incidente || 'N/A'}</p>
                                </div>
                                <div className="col-sm-12">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Creado por</label>
                                    <p className="mb-0 fw-semibold"><i className="fa-solid fa-user text-primary me-2"></i>{ticket.creado_por}</p>
                                </div>
                                <div className="col-sm-12 mt-3">
                                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Descripción del Incidente</label>
                                    <div className="p-3 bg-light rounded-3 text-dark mt-2 border-start border-4 border-primary" style={{ whiteSpace: 'pre-wrap' }}>
                                        {ticket.descripcion || 'Sin descripción disponible.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna del Mapa */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0">Ubicación Geográfica</h5>
                            {ticket.lat && ticket.lng && (
                                <span className="small text-muted">{ticket.lat.toFixed(6)}, {ticket.lng.toFixed(6)}</span>
                            )}
                        </div>
                        <div className="card-body p-0 mt-3">
                            {ticket.lat && ticket.lng ? (
                                <div id="detail-map-container" style={{ height: '450px', width: '100%' }}></div>
                            ) : (
                                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-5 bg-light" style={{ minHeight: '400px' }}>
                                    <i className="fa-solid fa-map-location-dot fa-4x mb-3 opacity-25"></i>
                                    <p className="mb-0">Ubicación no disponible para este ticket.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
