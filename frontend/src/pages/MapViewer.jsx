import React, { useEffect, useState, useMemo } from 'react';

// --- CONFIGURACIÓN DE ICONOS POR TIPO DE INCIDENTE ---
const TIPO_ICONOS = {
    1: { icon: 'fa-car', color: '#dc3545' },      // Accidente de Tránsito
    2: { icon: 'fa-hands-helping', color: '#198754' }, // Asistencia
    3: { icon: 'fa-building', color: '#6610f2' },     // Casos De Alcaldía
    4: { icon: 'fa-user-secret', color: '#fd7e14' }, // Delitos Comunes
    5: { icon: 'fa-venus-mars', color: '#d63384' },  // Delitos Mujer/Hombre
    6: { icon: 'fa-child', color: '#0dcaf0' },       // Delitos Niñez
    7: { icon: 'fa-house-damage', color: '#6f42c1' }, // Delitos Propiedad
    8: { icon: 'fa-skull', color: '#212529' },       // Delitos Vida
    9: { icon: 'fa-wind', color: '#0ea5e9' },        // Desastres Naturales
    10: { icon: 'fa-ambulance', color: '#ef4444' },   // Emergencia Médica
    11: { icon: 'fa-fire', color: '#f97316' },        // Incendio
    12: { icon: 'fa-search', color: '#64748b' },      // Investigación
    13: { icon: 'fa-cross', color: '#4b5563' },       // Otras Muertes
    14: { icon: 'fa-clipboard-list', color: '#a855f7' }, // Reportes
    15: { icon: 'fa-check-square', color: '#10b981' }, // Delitos Electorales
    16: { icon: 'fa-vote-yea', color: '#3b82f6' },    // Delitos Electorales
    17: { icon: 'fa-suitcase-rolling', color: '#f59e0b' }, // Migrante
};

const MapViewer = ({ onMapClick }) => {
    const [incidentes, setIncidentes] = useState([]);
    const [catalogos, setCatalogos] = useState({ departamentos: [], tipos_incidente: [], subtipos_incidente: [], municipios: [] });
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);
    const [filtros, setFiltros] = useState({
        departamento: '',
        municipio: '',
        tipo: '',
        subtipo: '',
        despacho: '',
        fechaDesde: '',
        fechaHasta: ''
    });

    const cargarDatos = async () => {
        try {
            const [resInc, resCat] = await Promise.all([
                fetch('http://127.0.0.1:8000/api/tickets/listar-recientes'),
                fetch('http://127.0.0.1:8000/api/tickets/catalogos')
            ]);
            const dataInc = await resInc.json();
            const dataCat = await resCat.json();

            if (resInc.ok) setIncidentes(dataInc);
            if (resCat.ok) setCatalogos(dataCat);
        } catch (error) {
            console.error("Error cargando datos para el mapa:", error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // ── Lógica de filtrado ──
    const incidentesFiltrados = useMemo(() => {
        return incidentes.filter(inc => {
            const deptoObj = (catalogos.departamentos || []).find(d => d.id === parseInt(filtros.departamento));
            const matchDepto = !filtros.departamento || inc.departamento === deptoObj?.nombre;

            const muniObj = (catalogos.municipios || []).find(m => m.id === parseInt(filtros.municipio));
            const matchMuni = !filtros.municipio || inc.municipio === muniObj?.nombre;

            const tipoObj = (catalogos.tipos_incidente || []).find(t => t.id === parseInt(filtros.tipo));
            const matchTipo = !filtros.tipo || inc.tipo_incidente === tipoObj?.nombre;

            const subObj = (catalogos.subtipos_incidente || []).find(s => s.id === parseInt(filtros.subtipo));
            const matchSubtipo = !filtros.subtipo || inc.subtipo_incidente === subObj?.nombre;

            const matchDespacho = !filtros.despacho || (inc.despacho || '').toLowerCase().includes(filtros.despacho.toLowerCase());

            let matchFecha = true;
            if (inc.fecha && inc.fecha !== "S/F") {
                const fechaInc = new Date(inc.fecha);
                if (filtros.fechaDesde) matchFecha = matchFecha && fechaInc >= new Date(filtros.fechaDesde);
                if (filtros.fechaHasta) matchFecha = matchFecha && fechaInc <= new Date(filtros.fechaHasta);
            } else if (filtros.fechaDesde || filtros.fechaHasta) {
                matchFecha = false;
            }

            return matchDepto && matchMuni && matchTipo && matchSubtipo && matchDespacho && matchFecha;
        });
    }, [incidentes, filtros, catalogos]);

    useEffect(() => {
        if (!window.L) return;
        const L = window.L;

        // Callback global
        window.__agregarFichaCallback = (lat, lng) => {
            if (onMapClick) onMapClick({ lat, lng });
        };

        // Inicializar mapa
        const map = L.map('map-container', { zoomAnimation: false })
            .setView([14.0818, -87.2068], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const group = new L.featureGroup();

        // ── Marcadores de incidentes filtrados con iconos personalizados ──
        incidentesFiltrados.forEach(inc => {
            if (inc.lat && inc.lng) {
                const tipoObj = (catalogos.tipos_incidente || []).find(t => t.nombre === inc.tipo_incidente);
                const config = TIPO_ICONOS[tipoObj?.id] || { icon: 'fa-location-dot', color: '#0d6efd' };

                const customIcon = L.divIcon({
                    className: '',
                    html: `
                        <div style="
                            width: 32px; height: 32px;
                            background: ${config.color};
                            color: white;
                            border: 2px solid white;
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            display: flex; align-items: center; justify-content: center;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        ">
                            <i class="fa-solid ${config.icon}" style="transform: rotate(45deg); font-size: 14px;"></i>
                        </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });

                const marker = L.marker([inc.lat, inc.lng], { icon: customIcon })
                    .bindPopup(`
                        <div style="font-family: sans-serif; min-width: 180px;">
                            <div style="background:${config.color}; color:white; padding:5px 10px; margin:-14px -14px 10px; border-radius:10px 10px 0 0;">
                                <strong style="font-size:13px;">${inc.ticket_id}</strong>
                            </div>
                            <div style="font-size:11px; margin-bottom:5px;">
                                <i class="fa-solid fa-calendar-days me-1 text-muted"></i> ${inc.fecha}<br/>
                                <i class="fa-solid fa-tag me-1 text-muted"></i> <b>${inc.tipo_incidente}</b>
                                ${inc.subtipo_incidente ? `<br/><i class="fa-solid fa-caret-right me-1 text-muted"></i> ${inc.subtipo_incidente}` : ''}
                            </div>
                            <p style="margin:5px 0; font-size:12px; color:#444; line-height:1.4;">
                                ${inc.descripcion ? (inc.descripcion.length > 100 ? inc.descripcion.substring(0, 100) + '...' : inc.descripcion) : 'Sin descripción'}
                            </p>
                            <div style="border-top: 1px solid #eee; padding-top:5px; font-size:10px; color:#666;">
                                <b>Ubicación:</b> ${inc.barrio || 'S/D'}<br/>
                                <b>Depto:</b> ${inc.departamento || '-'}<br/>
                                <b>Muni:</b> ${inc.municipio || '-'}<br/>
                                <b>Despacho:</b> ${inc.despacho || 'N/A'}
                            </div>
                        </div>
                    `);
                group.addLayer(marker);
            }
        });

        group.addTo(map);

        if (incidentesFiltrados.length > 0) {
            try {
                map.fitBounds(group.getBounds(), { padding: [50, 50], animate: false });
            } catch (e) { }
        }

        // Icono rojo para selección
        const iconoSeleccion = L.divIcon({
            className: '',
            html: `
                <div style="width:28px; height:28px; background:#dc3545; border:3px solid white; border-radius:50% 50% 50% 0; transform:rotate(-45deg); box-shadow:0 2px 8px rgba(0,0,0,0.45);">
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(45deg); width:7px; height:7px; background:white; border-radius:50%;"></div>
                </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
        });

        let marcadorTemporal = null;
        map.on('click', function (e) {
            const { lat, lng } = e.latlng;
            if (marcadorTemporal) map.removeLayer(marcadorTemporal);

            const popupHtml = `
                <div style="font-family:sans-serif; text-align:center;">
                    <div style="margin-bottom:5px;color:#dc3545;font-size:18px;"><i class="fa-solid fa-location-crosshairs"></i></div>
                    <div style="font-size:11px;color:#666;margin-bottom:8px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
                    <button onclick="window.__agregarFichaCallback(${lat}, ${lng})" style="background:#0d6efd;color:white;border:none;border-radius:20px;padding:6px 15px;font-size:12px;font-weight:600;cursor:pointer;width:100%;">+ Agregar Ficha</button>
                </div>
            `;

            marcadorTemporal = L.marker([lat, lng], { icon: iconoSeleccion })
                .addTo(map)
                .bindPopup(popupHtml)
                .openPopup();
        });

        return () => {
            delete window.__agregarFichaCallback;
            try { map.remove(); } catch (e) { }
        };
    }, [incidentesFiltrados, onMapClick, catalogos]);

    // Helpers
    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value, ...(name === 'departamento' ? { municipio: '' } : {}), ...(name === 'tipo' ? { subtipo: '' } : {}) }));
    };

    const limpiarFiltros = () => {
        setFiltros({ departamento: '', municipio: '', tipo: '', subtipo: '', despacho: '', fechaDesde: '', fechaHasta: '' });
    };

    const municipiosFiltrados = filtros.departamento
        ? (catalogos.municipios || []).filter(m => m.departamento_id === parseInt(filtros.departamento))
        : (catalogos.municipios || []);

    const subtiposFiltrados = filtros.tipo
        ? (catalogos.subtipos_incidente || []).filter(s => s.tipo_incidente_id === parseInt(filtros.tipo))
        : (catalogos.subtipos_incidente || []);

    const filtrosActivosCount = Object.values(filtros).filter(v => v !== '').length;

    return (
        <div className="page-transition">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0 text-dark">
                    <i className="fa-solid fa-earth-americas me-2 text-primary"></i>Visor de Incidentes
                </h4>
                <div className="d-flex align-items-center gap-2">
                    <button
                        className={`btn btn-sm rounded-pill px-3 shadow-sm transition-all ${filtrosVisibles ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                    >
                        <i className={`fa-solid ${filtrosVisibles ? 'fa-filter-circle-xmark' : 'fa-filter'} me-1`}></i>
                        {filtrosVisibles ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                        {filtrosActivosCount > 0 && <span className="badge bg-white text-primary ms-2 rounded-pill">{filtrosActivosCount}</span>}
                    </button>
                    <span className="badge bg-primary rounded-pill px-3 shadow-sm d-none d-md-inline-block">
                        {incidentesFiltrados.length} resultados
                    </span>
                    {filtrosActivosCount > 0 && (
                        <button className="btn btn-sm btn-outline-secondary rounded-pill shadow-sm" onClick={limpiarFiltros}>
                            <i className="fa-solid fa-eraser me-1"></i>Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* PANEL DE FILTROS COLAPSABLE */}
            <div className={`collapse ${filtrosVisibles ? 'show' : ''} mb-3`}>
                <div className="card border-0 shadow-sm rounded-4 bg-white border-primary-subtle border-start border-4">
                    <div className="card-body p-3">
                        <div className="row g-2">
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Departamento</label>
                                <select className="form-select form-select-sm border-0 bg-light shadow-none rounded-3" name="departamento" value={filtros.departamento} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {(catalogos.departamentos || []).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Municipio</label>
                                <select className="form-select form-select-sm border-0 bg-light shadow-none rounded-3" name="municipio" value={filtros.municipio} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {(municipiosFiltrados || []).map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Tipo de Incidente</label>
                                <select className="form-select form-select-sm border-0 bg-light shadow-none rounded-3" name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {(catalogos.tipos_incidente || []).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Subtipo</label>
                                <select className="form-select form-select-sm border-0 bg-light shadow-none rounded-3" name="subtipo" value={filtros.subtipo} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {(subtiposFiltrados || []).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Despacho</label>
                                <input type="text" className="form-control form-control-sm border-0 bg-light shadow-none rounded-3" placeholder="Buscar..." name="despacho" value={filtros.despacho} onChange={handleFiltroChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Desde</label>
                                <input type="date" className="form-control form-control-sm border-0 bg-light shadow-none rounded-3" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFiltroChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Hasta</label>
                                <input type="date" className="form-control form-control-sm border-0 bg-light shadow-none rounded-3" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFiltroChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                id="map-container"
                className="rounded-4 shadow-sm border overflow-hidden"
                style={{ height: '550px', width: '100%', backgroundColor: '#f8f9fa' }}
            ></div>

            {/* LEYENDA (Opcional pero útil) */}
            <div className="mt-3 p-2 d-flex flex-wrap gap-2 justify-content-center">
                {(catalogos.tipos_incidente || []).slice(0, 8).map(t => (
                    <div key={t.id} className="d-flex align-items-center gap-1 small text-muted">
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: TIPO_ICONOS[t.id]?.color || '#0d6efd' }}></span>
                        {t.nombre}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapViewer;
