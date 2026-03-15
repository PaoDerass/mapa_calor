import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// --- CONFIGURACIÓN DE ICONOS POR TIPO DE INCIDENTE ---
const TIPO_ICONOS = {
    1: { icon: 'fa-car', color: '#dc3545' },
    2: { icon: 'fa-hands-helping', color: '#198754' },
    3: { icon: 'fa-building', color: '#6610f2' },
    4: { icon: 'fa-user-secret', color: '#fd7e14' },
    5: { icon: 'fa-venus-mars', color: '#d63384' },
    6: { icon: 'fa-child', color: '#0dcaf0' },
    7: { icon: 'fa-house-damage', color: '#6f42c1' },
    8: { icon: 'fa-skull', color: '#212529' },
    9: { icon: 'fa-wind', color: '#0ea5e9' },
    10: { icon: 'fa-ambulance', color: '#ef4444' },
    11: { icon: 'fa-fire', color: '#f97316' },
    12: { icon: 'fa-search', color: '#64748b' },
    13: { icon: 'fa-cross', color: '#4b5563' },
    14: { icon: 'fa-clipboard-list', color: '#a855f7' },
    15: { icon: 'fa-check-square', color: '#10b981' },
    16: { icon: 'fa-vote-yea', color: '#3b82f6' },
    17: { icon: 'fa-suitcase-rolling', color: '#f59e0b' },
};

// Carga leaflet.heat dinámicamente si no está disponible aún
function loadHeatPlugin() {
    return new Promise((resolve) => {
        if (window.L && window.L.heatLayer) { resolve(); return; }
        // Verificar si el script ya fue insertado antes
        if (document.getElementById('leaflet-heat-script')) {
            // Esperar a que cargue
            const check = setInterval(() => {
                if (window.L && window.L.heatLayer) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
            return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-heat-script';
        script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        script.onload = () => resolve();
        script.onerror = () => resolve(); // continuar incluso si falla
        document.head.appendChild(script);
    });
}

const MapViewer = ({ onMapClick }) => {
    const { user } = useAuth();
    const [incidentes, setIncidentes] = useState([]);
    const [catalogos, setCatalogos] = useState({ departamentos: [], tipos_incidente: [], subtipos_incidente: [], municipios: [] });
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);
    const [isHeatmapLayer, setIsHeatmapLayer] = useState(false);
    const [filtros, setFiltros] = useState({
        departamento: '', municipio: '', tipo: '', subtipo: '',
        despacho: '', fechaDesde: '', fechaHasta: ''
    });

    // ── Cargar datos del backend con filtros ──
    const cargarDatos = async (filtrosActuales) => {
        try {
            const f = filtrosActuales || filtros;
            const params = new URLSearchParams();
            if (f.departamento) params.append('departamento', f.departamento);
            if (f.municipio)    params.append('municipio', f.municipio);
            if (f.tipo)         params.append('tipo', f.tipo);
            if (f.subtipo)      params.append('subtipo', f.subtipo);
            if (f.despacho)     params.append('despacho', f.despacho);
            if (f.fechaDesde)   params.append('fecha_desde', f.fechaDesde);
            if (f.fechaHasta)   params.append('fecha_hasta', f.fechaHasta);

            const [resInc, resCat] = await Promise.all([
                fetch(`http://127.0.0.1:8000/api/tickets/listar-recientes?${params.toString()}`),
                fetch('http://127.0.0.1:8000/api/tickets/catalogos')
            ]);

            if (resInc.ok) setIncidentes(await resInc.json());
            if (resCat.ok) setCatalogos(await resCat.json());
        } catch (error) {
            console.error('Error cargando datos del mapa:', error);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    // ── Renderizar mapa cada vez que cambian los datos o el modo ──
    useEffect(() => {
        if (!window.L) return;
        const L = window.L;

        let map = null;
        let stopped = false; // flag de cancelación

        const renderMap = async () => {
            // Si heatmap solicitado, cargar plugin primero
            if (isHeatmapLayer) await loadHeatPlugin();

            // Si el componente fue desmontado durante la carga, salir
            if (stopped) return;

            const container = document.getElementById('map-container');
            if (!container) return;

            map = L.map('map-container', { zoomAnimation: false })
                .setView([14.0818, -87.2068], 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            // ── MODO HEATMAP ──
            if (isHeatmapLayer && L.heatLayer) {
                const heatData = incidentes
                    .filter(inc => inc.lat && inc.lng)
                    .map(inc => [inc.lat, inc.lng, 1.0]);

                if (heatData.length > 0) {
                    L.heatLayer(heatData, {
                        radius: 25,
                        blur: 15,
                        maxZoom: 17,
                        gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
                    }).addTo(map);
                    try {
                        map.fitBounds(L.latLngBounds(heatData.map(p => [p[0], p[1]])), { padding: [50, 50], animate: false });
                    } catch (e) { /* ignorar */ }
                }
            } else {
                // ── MODO MARCADORES ──
                const group = L.featureGroup();

                incidentes.forEach(inc => {
                    if (!inc.lat || !inc.lng) return;
                    const tipoObj = (catalogos.tipos_incidente || []).find(t => t.nombre === inc.tipo_incidente);
                    const cfg = TIPO_ICONOS[tipoObj?.id] || { icon: 'fa-location-dot', color: '#0d6efd' };

                    const icon = L.divIcon({
                        className: '',
                        html: `<div style="width:32px;height:32px;background:${cfg.color};color:white;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3)"><i class="fa-solid ${cfg.icon}" style="transform:rotate(45deg);font-size:14px"></i></div>`,
                        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
                    });

                    const popup = `
                        <div style="font-family:sans-serif;min-width:180px">
                            <div style="background:${cfg.color};color:white;padding:5px 10px;margin:-14px -14px 10px;border-radius:10px 10px 0 0">
                                <strong style="font-size:13px">${inc.ticket_id}</strong>
                            </div>
                            <div style="font-size:11px;margin-bottom:5px">
                                <i class="fa-solid fa-calendar-days me-1 text-muted"></i>${inc.fecha}<br/>
                                <i class="fa-solid fa-tag me-1 text-muted"></i><b>${inc.tipo_incidente}</b>
                                ${inc.subtipo_incidente ? `<br/><i class="fa-solid fa-caret-right me-1 text-muted"></i>${inc.subtipo_incidente}` : ''}
                            </div>
                            <p style="margin:5px 0;font-size:12px;color:#444;line-height:1.4">
                                ${inc.descripcion ? (inc.descripcion.length > 100 ? inc.descripcion.substring(0,100)+'...' : inc.descripcion) : 'Sin descripción'}
                            </p>
                            <div style="border-top:1px solid #eee;padding-top:5px;font-size:10px;color:#666">
                                <b>Ubicación:</b> ${inc.barrio || 'S/D'}<br/>
                                <b>Depto:</b> ${inc.departamento || '-'}&nbsp;&nbsp;<b>Muni:</b> ${inc.municipio || '-'}<br/>
                                <b>Despacho:</b> ${inc.despacho || 'N/A'}
                            </div>
                        </div>`;

                    L.marker([inc.lat, inc.lng], { icon }).bindPopup(popup).addTo(group);
                });

                group.addTo(map);
                if (incidentes.filter(i => i.lat && i.lng).length > 0) {
                    try { map.fitBounds(group.getBounds(), { padding: [50, 50], animate: false }); }
                    catch (e) { /* ignorar */ }
                }
            }

            // ── CLICK en mapa para agregar ficha ──
            const redIcon = L.divIcon({
                className: '',
                html: `<div style="width:28px;height:28px;background:#dc3545;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.45)"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:7px;height:7px;background:white;border-radius:50%"></div></div>`,
                iconSize: [28, 28], iconAnchor: [14, 28]
            });

            window.__agregarFichaCallback = (lat, lng) => { if (onMapClick) onMapClick({ lat, lng }); };

            let temp = null;
            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                if (temp) map.removeLayer(temp);

                const btnFicha = user.permissions?.includes('crear_ticket')
                    ? `<button onclick="window.__agregarFichaCallback(${lat},${lng})" style="background:#0d6efd;color:white;border:none;border-radius:20px;padding:6px 15px;font-size:12px;font-weight:600;cursor:pointer;width:100%">+ Agregar Ficha</button>`
                    : '';

                temp = L.marker([lat, lng], { icon: redIcon })
                    .addTo(map)
                    .bindPopup(`<div style="font-family:sans-serif;text-align:center"><div style="margin-bottom:5px;color:#dc3545;font-size:18px"><i class="fa-solid fa-location-crosshairs"></i></div><div style="font-size:11px;color:#666;margin-bottom:8px">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>${btnFicha}</div>`)
                    .openPopup();
            });
        };

        renderMap();

        return () => {
            stopped = true;
            delete window.__agregarFichaCallback;
            try { if (map) map.remove(); } catch (e) { /* ignorar */ }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incidentes, isHeatmapLayer, onMapClick, catalogos]);

    // Helpers
    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev, [name]: value,
            ...(name === 'departamento' ? { municipio: '' } : {}),
            ...(name === 'tipo' ? { subtipo: '' } : {})
        }));
    };

    const limpiarFiltros = () => {
        const empty = { departamento: '', municipio: '', tipo: '', subtipo: '', despacho: '', fechaDesde: '', fechaHasta: '' };
        setFiltros(empty);
        cargarDatos(empty);
    };

    const municipiosFiltrados = filtros.departamento
        ? (catalogos.municipios || []).filter(m => m.departamento_id === parseInt(filtros.departamento))
        : (catalogos.municipios || []);

    const subtiposFiltrados = filtros.tipo
        ? (catalogos.subtipos_incidente || []).filter(s => s.tipo_incidente_id === parseInt(filtros.tipo))
        : (catalogos.subtipos_incidente || []);

    const filtrosActivosCount = Object.values(filtros).filter(v => v !== '').length;

    // Infografía: conteo por tipología
    const porTipologia = incidentes.reduce((acc, inc) => {
        const t = inc.tipo_incidente || 'Desconocido';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="page-transition">
            {/* Encabezado con toggle de filtros */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0 text-dark">
                    <i className="fa-solid fa-earth-americas me-2 text-primary"></i>Visor de Incidentes
                </h4>
                <div className="d-flex align-items-center gap-2">
                    {user.permissions?.includes('ver_mapa_calor') && (
                        <button
                            className={`btn btn-sm rounded-pill px-3 shadow-sm ${filtrosVisibles ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                        >
                            <i className={`fa-solid ${filtrosVisibles ? 'fa-filter-circle-xmark' : 'fa-filter'} me-1`}></i>
                            {filtrosVisibles ? 'Ocultar Filtros' : 'Filtros Dinámicos'}
                            {filtrosActivosCount > 0 && <span className="badge bg-white text-primary ms-2 rounded-pill">{filtrosActivosCount}</span>}
                        </button>
                    )}
                    <span className="badge bg-primary rounded-pill px-3 shadow-sm d-none d-md-inline-block">
                        {incidentes.length} resultados
                    </span>
                </div>
            </div>

            {/* Panel de filtros colapsable */}
            <div className={`collapse ${filtrosVisibles ? 'show' : ''} mb-3`}>
                <div className="card border-0 shadow-sm rounded-4 bg-white border-start border-primary border-4">
                    <div className="card-body p-3">
                        <div className="row g-2">
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Departamento</label>
                                <select className="form-select form-select-sm border-0 bg-light rounded-3" name="departamento" value={filtros.departamento} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {(catalogos.departamentos || []).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Municipio</label>
                                <select className="form-select form-select-sm border-0 bg-light rounded-3" name="municipio" value={filtros.municipio} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {municipiosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Tipo</label>
                                <select className="form-select form-select-sm border-0 bg-light rounded-3" name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {(catalogos.tipos_incidente || []).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Sub Tipo</label>
                                <select className="form-select form-select-sm border-0 bg-light rounded-3" name="subtipo" value={filtros.subtipo} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {subtiposFiltrados.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Despacho</label>
                                <input type="text" className="form-control form-control-sm border-0 bg-light rounded-3" placeholder="Buscar..." name="despacho" value={filtros.despacho} onChange={handleFiltroChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Desde</label>
                                <input type="date" className="form-control form-control-sm border-0 bg-light rounded-3" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFiltroChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Hasta</label>
                                <input type="date" className="form-control form-control-sm border-0 bg-light rounded-3" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFiltroChange} />
                            </div>
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn btn-sm btn-outline-secondary rounded-pill px-4" onClick={limpiarFiltros}>
                                <i className="fa-solid fa-eraser me-1"></i>Limpiar
                            </button>
                            <button className="btn btn-sm btn-primary rounded-pill px-4 fw-bold" onClick={() => cargarDatos()}>
                                <i className="fa-solid fa-search me-1"></i>Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Heatmap */}
            <div className="d-flex align-items-center gap-3 mb-2">
                <div className="form-check form-switch fs-5 ms-1">
                    <input
                        className="form-check-input shadow-sm"
                        type="checkbox"
                        role="switch"
                        id="heatmapSwitch"
                        checked={isHeatmapLayer}
                        onChange={() => setIsHeatmapLayer(prev => !prev)}
                        style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label ms-2 fs-6 fw-bold text-dark" htmlFor="heatmapSwitch" style={{ cursor: 'pointer' }}>
                        <i className={`fa-solid ${isHeatmapLayer ? 'fa-fire text-danger' : 'fa-location-dot text-primary'} me-2`}></i>
                        {isHeatmapLayer ? 'Mapa de Calor Activo' : 'Vista de Marcadores'}
                    </label>
                </div>
            </div>

            {/* Mapa + Panel flotante */}
            <div className="position-relative">
                <div
                    id="map-container"
                    className="rounded-4 shadow-sm border overflow-hidden"
                    style={{ height: '560px', width: '100%', backgroundColor: '#f8f9fa' }}
                ></div>

                {/* PANEL FLOTANTE DE INFOGRAFÍA */}
                <div className="position-absolute bg-white rounded-3 shadow border p-3" style={{ top: 16, right: 16, zIndex: 1000, width: 250, opacity: 0.96, maxHeight: 400, overflowY: 'auto' }}>
                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-2">
                        <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Resumen
                    </h6>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="small text-muted fw-semibold">Total visibles:</span>
                        <span className="badge bg-primary rounded-pill px-3" style={{ fontSize: '0.9rem' }}>{incidentes.length}</span>
                    </div>
                    <div className="small fw-semibold text-muted mb-1 text-uppercase" style={{ fontSize: '0.7rem' }}>Por Tipología</div>
                    {Object.entries(porTipologia).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => (
                        <div key={tipo} className="d-flex justify-content-between align-items-center border-bottom border-light py-1">
                            <span className="small text-truncate me-2" style={{ maxWidth: 170 }} title={tipo}>{tipo}</span>
                            <span className="badge bg-light text-dark border fw-bold">{count}</span>
                        </div>
                    ))}
                    {Object.keys(porTipologia).length === 0 && (
                        <div className="text-muted small text-center py-2">Sin datos</div>
                    )}
                </div>
            </div>

            {/* Leyenda de colores */}
            <div className="mt-3 p-2 d-flex flex-wrap gap-2 justify-content-center">
                {(catalogos.tipos_incidente || []).slice(0, 10).map(t => (
                    <div key={t.id} className="d-flex align-items-center gap-1 small text-muted">
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: TIPO_ICONOS[t.id]?.color || '#0d6efd', display: 'inline-block' }}></span>
                        {t.nombre}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapViewer;
