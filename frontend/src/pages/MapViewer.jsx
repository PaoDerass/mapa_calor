import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// --- ÍCONOS POR TIPO DE INCIDENTE ---
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

function loadHeatPlugin() {
    return new Promise((resolve) => {
        if (window.L && window.L.heatLayer) { resolve(); return; }
        if (document.getElementById('leaflet-heat-script')) {
            const check = setInterval(() => {
                if (window.L && window.L.heatLayer) { clearInterval(check); resolve(); }
            }, 50);
            return;
        }
        const s = document.createElement('script');
        s.id = 'leaflet-heat-script';
        s.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
    });
}

const TOKEN_KEY = 'token';

const MapViewer = ({ onMapClick }) => {
    const { user } = useAuth();
    const [incidentes, setIncidentes] = useState([]);
    const [catalogos, setCatalogos] = useState({ departamentos: [], tipos_incidente: [], subtipos_incidente: [], municipios: [] });
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);
    const [isHeatmapLayer, setIsHeatmapLayer] = useState(false);
    const [mostrarIncidentes, setMostrarIncidentes] = useState(true); // on por defecto
    const [filtros, setFiltros] = useState({
        departamento: '', municipio: '', tipo: '', subtipo: '',
        despacho: '', fechaDesde: '', fechaHasta: ''
    });

    // ── Cámaras ──
    const [mostrarCamaras, setMostrarCamaras] = useState(false);
    const [camaras, setCamaras] = useState([]);

    // ── Time-lapse ──
    const [playing, setPlaying] = useState(false);
    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const [velocidad, setVelocidad] = useState(800);
    const intervalRef = useRef(null);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

    // ── Cargar incidentes con filtros ──
    const cargarDatos = async (filtrosActuales) => {
        const f = filtrosActuales || filtros;
        const p = new URLSearchParams();
        if (f.departamento) p.append('departamento', f.departamento);
        if (f.municipio)    p.append('municipio', f.municipio);
        if (f.tipo)         p.append('tipo', f.tipo);
        if (f.subtipo)      p.append('subtipo', f.subtipo);
        if (f.despacho)     p.append('despacho', f.despacho);
        if (f.fechaDesde)   p.append('fecha_desde', f.fechaDesde);
        if (f.fechaHasta)   p.append('fecha_hasta', f.fechaHasta);
        try {
            const [rI, rC] = await Promise.all([
                fetch(`http://127.0.0.1:8000/api/tickets/listar-recientes?${p}`, { headers: authHeader() }),
                fetch('http://127.0.0.1:8000/api/tickets/catalogos', { headers: authHeader() })
            ]);
            if (rI.ok) setIncidentes(await rI.json());
            if (rC.ok) setCatalogos(await rC.json());
        } catch (e) { console.error('Error cargando mapa:', e); }
    };

    useEffect(() => { cargarDatos(); }, []);

    // ── Cargar cámaras al activar ──
    useEffect(() => {
        if (!mostrarCamaras || camaras.length > 0) return;
        fetch('http://127.0.0.1:8000/api/tickets/capas/camaras', { headers: authHeader() })
            .then(r => r.ok ? r.json() : [])
            .then(data => setCamaras(data))
            .catch(() => {});
    }, [mostrarCamaras]);

    // ── Time-lapse: fechas únicas ordenadas ──
    const fechasUnicas = useMemo(() => {
        const set = new Set();
        incidentes.forEach(inc => {
            if (inc.fecha && inc.fecha !== 'S/F') {
                const day = inc.fecha.substring(0, 10);
                set.add(day);
            }
        });
        return Array.from(set).sort();
    }, [incidentes]);

    // ── Play/Pause logic ──
    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                setCurrentDateIndex(prev => {
                    if (prev >= fechasUnicas.length - 1) {
                        setPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, velocidad);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [playing, velocidad, fechasUnicas.length]);

    // ── Incidentes visibles según time-lapse ──
    const incidentesVisibles = useMemo(() => {
        if (fechasUnicas.length === 0 || playing || currentDateIndex === 0) return incidentes;
        const fechaActual = fechasUnicas[currentDateIndex];
        return incidentes.filter(inc => inc.fecha && inc.fecha.startsWith(fechaActual));
    }, [incidentes, fechasUnicas, currentDateIndex, playing]);

    // ── Renderizar mapa ──
    useEffect(() => {
        if (!window.L) return;
        let map = null;
        let stopped = false;

        const renderMap = async () => {
            if (isHeatmapLayer) await loadHeatPlugin();
            if (stopped) return;

            const L = window.L;
            map = L.map('map-container', { zoomAnimation: false }).setView([14.0818, -87.2068], 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            // ── CAPAS DE INCIDENTES ──
            if (mostrarIncidentes) {
              if (isHeatmapLayer && L.heatLayer) {
                const heatData = incidentesVisibles.filter(i => i.lat && i.lng).map(i => [i.lat, i.lng, 1.0]);
                if (heatData.length > 0) {
                    L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 17,
                        gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
                    }).addTo(map);
                    try { map.fitBounds(L.latLngBounds(heatData.map(p => [p[0], p[1]])), { padding: [50,50], animate: false }); } catch(e){}
                }
            } else {
                const group = L.featureGroup();
                incidentesVisibles.forEach(inc => {
                    if (!inc.lat || !inc.lng) return;
                    const tipoObj = (catalogos.tipos_incidente || []).find(t => t.nombre === inc.tipo_incidente);
                    const cfg = TIPO_ICONOS[tipoObj?.id] || { icon: 'fa-location-dot', color: '#0d6efd' };
                    const icon = L.divIcon({
                        className: '',
                        html: `<div style="width:32px;height:32px;background:${cfg.color};color:white;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3)"><i class="fa-solid ${cfg.icon}" style="transform:rotate(45deg);font-size:14px"></i></div>`,
                        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
                    });
                    const popup = `<div style="font-family:sans-serif;min-width:180px">
                        <div style="background:${cfg.color};color:white;padding:5px 10px;margin:-14px -14px 10px;border-radius:10px 10px 0 0"><strong>${inc.ticket_id}</strong></div>
                        <div style="font-size:11px"><i class="fa-solid fa-calendar-days me-1"></i>${inc.fecha}<br/><i class="fa-solid fa-tag me-1"></i><b>${inc.tipo_incidente}</b></div>
                        <p style="font-size:12px;color:#444">${(inc.descripcion || 'Sin descripción').substring(0,100)}</p>
                        <div style="font-size:10px;color:#666;border-top:1px solid #eee;padding-top:4px"><b>Depto:</b> ${inc.departamento||'-'} &nbsp;<b>Muni:</b> ${inc.municipio||'-'}<br/><b>Despacho:</b> ${inc.despacho||'N/A'}</div>
                    </div>`;
                    L.marker([inc.lat, inc.lng], { icon }).bindPopup(popup).addTo(group);
                });
                group.addTo(map);
                if (incidentesVisibles.filter(i=>i.lat&&i.lng).length > 0) {
                    try { map.fitBounds(group.getBounds(), { padding: [50,50], animate: false }); } catch(e){}
                }
              } // end else (markers)
            } // end if(mostrarIncidentes)

            // ── CAPA DE CÁMARAS ──
            if (mostrarCamaras && camaras.length > 0) {
                camaras.forEach(cam => {
                    if (!cam.lat || !cam.lng) return;
                    const camIcon = L.divIcon({
                        className: '',
                        html: `<div style="width:30px;height:30px;background:#0d6efd;color:white;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35)"><i class="fa-solid fa-video" style="font-size:13px"></i></div>`,
                        iconSize: [30, 30], iconAnchor: [15, 15]
                    });
                    L.marker([cam.lat, cam.lng], { icon: camIcon, zIndexOffset: 500 })
                        .bindPopup(`<div style="font-family:sans-serif;min-width:160px">
                            <div style="background:#0d6efd;color:white;padding:5px 10px;margin:-14px -14px 8px;border-radius:10px 10px 0 0"><strong><i class="fa-solid fa-video me-1"></i>${cam.nombre}</strong></div>
                            <div style="font-size:11px"><b>Tipo:</b> ${cam.tipo}<br/><b>Dirección:</b> ${cam.direccion||'N/A'}</div>
                        </div>`)
                        .addTo(map);
                });
            }

            // ── CLICK para agregar ficha ──
            const redIcon = L.divIcon({
                className: '',
                html: `<div style="width:28px;height:28px;background:#dc3545;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.45)"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:7px;height:7px;background:white;border-radius:50%"></div></div>`,
                iconSize: [28, 28], iconAnchor: [14, 28]
            });
            window.__agregarFichaCallback = (lat, lng) => { if (onMapClick) onMapClick({ lat, lng }); };
            let temp = null;
            map.on('click', e => {
                const { lat, lng } = e.latlng;
                if (temp) map.removeLayer(temp);
                const btn = user.permissions?.includes('crear_ticket')
                    ? `<button onclick="window.__agregarFichaCallback(${lat},${lng})" style="background:#0d6efd;color:white;border:none;border-radius:20px;padding:6px 15px;font-size:12px;font-weight:600;cursor:pointer;width:100%">+ Agregar Ficha</button>`
                    : '';
                temp = L.marker([lat, lng], { icon: redIcon })
                    .addTo(map)
                    .bindPopup(`<div style="font-family:sans-serif;text-align:center"><div style="color:#dc3545;font-size:18px;margin-bottom:5px"><i class="fa-solid fa-location-crosshairs"></i></div><div style="font-size:11px;color:#666;margin-bottom:8px">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>${btn}</div>`)
                    .openPopup();
            });
        };

        renderMap();
        return () => {
            stopped = true;
            delete window.__agregarFichaCallback;
            try { if (map) map.remove(); } catch(e){}
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incidentesVisibles, isHeatmapLayer, mostrarIncidentes, onMapClick, catalogos, mostrarCamaras, camaras]);

    // Helpers filtros
    const handleFiltroChange = e => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value,
            ...(name === 'departamento' ? { municipio: '' } : {}),
            ...(name === 'tipo' ? { subtipo: '' } : {})
        }));
    };
    const limpiarFiltros = () => {
        const empty = { departamento:'', municipio:'', tipo:'', subtipo:'', despacho:'', fechaDesde:'', fechaHasta:'' };
        setFiltros(empty); cargarDatos(empty); setCurrentDateIndex(0); setPlaying(false);
    };
    const municipiosFiltrados = filtros.departamento
        ? (catalogos.municipios||[]).filter(m => m.departamento_id === parseInt(filtros.departamento))
        : (catalogos.municipios||[]);
    const subtiposFiltrados = filtros.tipo
        ? (catalogos.subtipos_incidente||[]).filter(s => s.tipo_incidente_id === parseInt(filtros.tipo))
        : (catalogos.subtipos_incidente||[]);
    const filtrosActivosCount = Object.values(filtros).filter(v => v !== '').length;

    const porTipologia = incidentesVisibles.reduce((acc, inc) => {
        const t = inc.tipo_incidente || 'Desconocido';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="page-transition">
            {/* ── Encabezado ── */}
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
                    <span className="badge bg-primary rounded-pill px-3 shadow-sm">
                        {incidentesVisibles.length} resultados
                    </span>
                </div>
            </div>

            {/* ── Panel Filtros ── */}
            <div className={`collapse ${filtrosVisibles ? 'show' : ''} mb-3`}>
                <div className="card border-0 shadow-sm rounded-4 bg-white border-start border-primary border-4">
                    <div className="card-body p-3">
                        <div className="row g-2">
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted text-uppercase mb-1">Departamento</label>
                                <select className="form-select form-select-sm border-0 bg-light rounded-3" name="departamento" value={filtros.departamento} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {(catalogos.departamentos||[]).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
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
                                    {(catalogos.tipos_incidente||[]).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
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
                                <input type="text" className="form-control form-control-sm border-0 bg-light rounded-3" name="despacho" placeholder="Buscar..." value={filtros.despacho} onChange={handleFiltroChange} />
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

            {/* ── Controles de modo ── */}
            <div className="d-flex align-items-center gap-4 mb-2 flex-wrap">
                {/* Incidentes toggle */}
                <div className="form-check form-switch fs-5">
                    <input className="form-check-input" type="checkbox" role="switch" id="incidentesSwitch"
                        checked={mostrarIncidentes} onChange={() => setMostrarIncidentes(p => !p)} style={{cursor:'pointer'}} />
                    <label className="form-check-label ms-2 fs-6 fw-bold text-dark" htmlFor="incidentesSwitch" style={{cursor:'pointer'}}>
                        <i className={`fa-solid fa-triangle-exclamation me-1 ${mostrarIncidentes ? 'text-warning' : 'text-secondary'}`}></i>
                        Incidentes
                    </label>
                </div>

                {/* Heatmap toggle — solo si incidentes está activo */}
                {mostrarIncidentes && (
                    <div className="form-check form-switch fs-5">
                        <input className="form-check-input" type="checkbox" role="switch" id="heatmapSwitch"
                            checked={isHeatmapLayer} onChange={() => setIsHeatmapLayer(p => !p)} style={{cursor:'pointer'}} />
                        <label className="form-check-label ms-2 fs-6 fw-bold text-dark" htmlFor="heatmapSwitch" style={{cursor:'pointer'}}>
                            <i className={`fa-solid ${isHeatmapLayer ? 'fa-fire text-danger' : 'fa-map-pin text-primary'} me-1`}></i>
                            {isHeatmapLayer ? 'Mapa de Calor' : 'Marcadores'}
                        </label>
                    </div>
                )}

                {/* Cámaras toggle */}
                <div className="form-check form-switch fs-5">
                    <input className="form-check-input" type="checkbox" role="switch" id="camarasSwitch"
                        checked={mostrarCamaras} onChange={() => setMostrarCamaras(p => !p)} style={{cursor:'pointer'}} />
                    <label className="form-check-label ms-2 fs-6 fw-bold text-dark" htmlFor="camarasSwitch" style={{cursor:'pointer'}}>
                        <i className={`fa-solid fa-video me-1 ${mostrarCamaras ? 'text-primary' : 'text-secondary'}`}></i>
                        Cámaras {mostrarCamaras && camaras.length > 0 && <span className="badge bg-primary rounded-pill ms-1">{camaras.length}</span>}
                    </label>
                </div>
            </div>

            {/* ── Mapa + Panel flotante ── */}
            <div className="position-relative">
                <div id="map-container" className="rounded-4 shadow-sm border overflow-hidden"
                    style={{ height: '560px', width: '100%', backgroundColor: '#f8f9fa' }}></div>

                {/* PANEL INFOGRAFÍA */}
                <div className="position-absolute bg-white rounded-3 shadow border p-3"
                    style={{ top: 16, right: 16, zIndex: 1000, width: 240, opacity: 0.96, maxHeight: 380, overflowY: 'auto' }}>
                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-2">
                        <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Resumen
                        {fechasUnicas.length > 0 && currentDateIndex > 0 && (
                            <span className="badge bg-warning text-dark ms-2 rounded-pill" style={{fontSize:'0.65rem'}}>
                                {fechasUnicas[currentDateIndex]}
                            </span>
                        )}
                    </h6>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-muted fw-semibold">Total:</span>
                        <span className="badge bg-primary rounded-pill px-3" style={{fontSize:'0.85rem'}}>{incidentesVisibles.length}</span>
                    </div>
                    {mostrarCamaras && camaras.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small text-muted fw-semibold"><i className="fa-solid fa-video text-primary me-1"></i>Cámaras:</span>
                            <span className="badge bg-primary rounded-pill px-3">{camaras.length}</span>
                        </div>
                    )}
                    <div className="small fw-semibold text-muted mb-1 text-uppercase" style={{fontSize:'0.68rem'}}>Por Tipología</div>
                    {Object.entries(porTipologia).sort((a,b) => b[1]-a[1]).map(([tipo, count]) => (
                        <div key={tipo} className="d-flex justify-content-between align-items-center border-bottom border-light py-1">
                            <span className="small text-truncate me-2" style={{maxWidth:165}} title={tipo}>{tipo}</span>
                            <span className="badge bg-light text-dark border fw-bold">{count}</span>
                        </div>
                    ))}
                    {Object.keys(porTipologia).length === 0 && <div className="text-muted small text-center py-2">Sin datos</div>}
                </div>
            </div>

            {/* ── PANEL TIME-LAPSE ── */}
            {fechasUnicas.length > 1 && (
                <div className="card border-0 shadow-sm rounded-4 mt-3 bg-white">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <i className="fa-solid fa-film text-primary fs-5"></i>
                            <span className="fw-bold text-dark">Línea de Tiempo</span>
                            <span className="badge bg-light text-dark border ms-auto">
                                {fechasUnicas[currentDateIndex] || 'Todas las fechas'}
                            </span>
                        </div>

                        <input
                            type="range"
                            className="form-range"
                            min={0}
                            max={fechasUnicas.length - 1}
                            value={currentDateIndex}
                            onChange={e => { setPlaying(false); setCurrentDateIndex(parseInt(e.target.value)); }}
                        />

                        <div className="d-flex justify-content-between align-items-center mt-2 gap-2">
                            <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-outline-secondary rounded-pill"
                                    onClick={() => { setPlaying(false); setCurrentDateIndex(0); }}>
                                    <i className="fa-solid fa-backward-step"></i>
                                </button>
                                <button
                                    className={`btn btn-sm rounded-pill px-3 fw-bold ${playing ? 'btn-danger' : 'btn-primary'}`}
                                    onClick={() => setPlaying(p => !p)}
                                    disabled={fechasUnicas.length < 2}
                                >
                                    <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'} me-1`}></i>
                                    {playing ? 'Pausar' : 'Reproducir'}
                                </button>
                                <button className="btn btn-sm btn-outline-secondary rounded-pill"
                                    onClick={() => { setPlaying(false); setCurrentDateIndex(fechasUnicas.length - 1); }}>
                                    <i className="fa-solid fa-forward-step"></i>
                                </button>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <label className="small text-muted" style={{whiteSpace:'nowrap'}}>Vel.:</label>
                                <select className="form-select form-select-sm border-0 bg-light rounded-3" style={{width:'auto'}}
                                    value={velocidad} onChange={e => setVelocidad(parseInt(e.target.value))}>
                                    <option value={300}>Rápido</option>
                                    <option value={800}>Normal</option>
                                    <option value={1500}>Lento</option>
                                    <option value={3000}>Muy lento</option>
                                </select>
                                <span className="small text-muted" style={{whiteSpace:'nowrap'}}>
                                    {currentDateIndex + 1} / {fechasUnicas.length} días
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leyenda de tipologías */}
            <div className="mt-3 p-2 d-flex flex-wrap gap-2 justify-content-center">
                {(catalogos.tipos_incidente||[]).slice(0, 10).map(t => (
                    <div key={t.id} className="d-flex align-items-center gap-1 small text-muted">
                        <span style={{width:10,height:10,borderRadius:'50%',backgroundColor:TIPO_ICONOS[t.id]?.color||'#0d6efd',display:'inline-block'}}></span>
                        {t.nombre}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapViewer;
