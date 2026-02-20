import React, { useState, useEffect } from 'react';
import { useModal } from '../components/Modal';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- CONFIGURACIÓN DE ICONOS PARA LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- COMPONENTES AUXILIARES DEL MAPA ---
function Recenter({ pos }) {
    const map = useMap();
    useEffect(() => { map.setView(pos); }, [pos]);
    return null;
}

function MapEvents({ setPos }) {
    useMapEvents({
        click(e) { setPos([e.latlng.lat, e.latlng.lng]); },
    });
    return null;
}

// --- SELECTOR DE UBICACIÓN (modal con mapa) ---
const SelectorUbicacion = ({ inicial, onGuardar, onCerrar }) => {
    const [posicion, setPosicion] = useState(inicial || [14.0818, -87.2068]);
    const [tempBusqueda, setTempBusqueda] = useState('');

    const buscarLugar = async (e) => {
        e.preventDefault();
        if (!tempBusqueda) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${tempBusqueda}`);
            const data = await res.json();
            if (data[0]) setPosicion([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } catch (err) { console.error("Error en búsqueda:", err); }
    };

    return (
        <div className="modal d-block" style={{ zIndex: 1060, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header bg-dark text-white border-0">
                        <h5 className="modal-title fw-bold"><i className="bi bi-geo-alt me-2"></i>LOCALIZADOR GPS</h5>
                        <button type="button" className="btn-close btn-close-white shadow-none" onClick={onCerrar}></button>
                    </div>
                    <div className="modal-body p-0 position-relative">
                        <div className="position-absolute top-0 start-50 translate-middle-x mt-3 w-75" style={{ zIndex: 1000 }}>
                            <form onSubmit={buscarLugar} className="input-group shadow border rounded-pill overflow-hidden bg-white">
                                <input type="text" className="form-control border-0 ps-4 shadow-none"
                                    placeholder="Buscar dirección, colonia o punto..."
                                    value={tempBusqueda} onChange={(e) => setTempBusqueda(e.target.value)} />
                                <button type="submit" className="btn btn-warning px-4 fw-bold border-0">BUSCAR</button>
                            </form>
                        </div>
                        <div style={{ height: '450px', width: '100%' }}>
                            <MapContainer center={posicion} zoom={15} style={{ height: '100%', cursor: 'crosshair' }} zoomControl={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={posicion} />
                                <MapEvents setPos={setPosicion} />
                                <Recenter pos={posicion} />
                            </MapContainer>
                        </div>
                        <div className="p-3 bg-light border-top">
                            <div className="row g-2">
                                <div className="col-6">
                                    <label className="small fw-bold text-muted text-uppercase">Latitud</label>
                                    <input type="number" className="form-control fw-bold border-0 bg-white" value={posicion[0]} step="any"
                                        onChange={(e) => setPosicion([parseFloat(e.target.value) || 0, posicion[1]])} />
                                </div>
                                <div className="col-6">
                                    <label className="small fw-bold text-muted text-uppercase">Longitud</label>
                                    <input type="number" className="form-control fw-bold border-0 bg-white" value={posicion[1]} step="any"
                                        onChange={(e) => setPosicion([posicion[0], parseFloat(e.target.value) || 0])} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer bg-white border-0">
                        <button className="btn btn-outline-secondary px-4" onClick={onCerrar}>CANCELAR</button>
                        <button className="btn btn-dark px-5 fw-bold" onClick={() => onGuardar(posicion)}>CONFIRMAR UBICACIÓN</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
const TicketForm = ({ onCancel, coords }) => {
    const { showAlert, showConfirm } = useModal();
    const [modoManual, setModoManual] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [datos, setDatos] = useState({});
    const [loading, setLoading] = useState(false);
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [notaRespaldo, setNotaRespaldo] = useState('');
    const [unidad, setUnidad] = useState('');
    const [mando, setMando] = useState('');
    const [catalogos, setCatalogos] = useState({ departamentos: [], tipos_incidente: [], municipios: [] });

    // Prellenar coordenadas si venimos del MapViewer
    useEffect(() => {
        if (coords && coords.lat && coords.lng) {
            setDatos(prev => ({
                ...prev,
                latitud: coords.lat,
                longitud: coords.lng,
                coordenada: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
                ubicacion_origen: 'manual'
            }));
        }
    }, [coords]);

    // Cargar catálogos para el modo manual
    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/tickets/catalogos')
            .then(r => r.json())
            .then(data => setCatalogos(data))
            .catch(err => console.error("Error cargando catálogos:", err));
    }, []);

    // Municipios filtrados según el departamento seleccionado
    const municipiosFiltrados = datos.departamento_id
        ? catalogos.municipios.filter(m => m.departamento_id === parseInt(datos.departamento_id))
        : catalogos.municipios;

    // Subtipos filtrados según el tipo seleccionado
    const subtiposFiltrados = datos.tipo_incidente_id
        ? catalogos.subtipos_incidente.filter(s => s.tipo_incidente_id === parseInt(datos.tipo_incidente_id))
        : catalogos.subtipos_incidente;

    // ── Modo Automático: jalar de MySQL ──
    const buscarTicket = async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/tickets/buscar-externo/${ticketId}`);
            const data = await res.json();
            if (res.ok) {
                // Intentar emparejar catálogos por NOMBRE para asegurar compatibilidad Postgres
                const clean = (str) => (str || '').toString().trim().toLowerCase();

                const foundDepto = catalogos.departamentos.find(d => clean(d.nombre) === clean(data.departamento_nombre));
                const foundMuni = catalogos.municipios.find(m => clean(m.nombre) === clean(data.municipio_nombre));
                const foundTipo = catalogos.tipos_incidente.find(t => clean(t.nombre) === clean(data.tipologia));
                const foundSub = catalogos.subtipos_incidente.find(s => clean(s.nombre) === clean(data.subtipologia));

                setDatos({
                    ...data,
                    tipo_incidente_id: foundTipo ? foundTipo.id : null,
                    subtipo_incidente_id: foundSub ? foundSub.id : null,
                    departamento_id: foundDepto ? foundDepto.id : (data.departamento_id || null),
                    municipio_id: foundMuni ? foundMuni.id : (data.municipio_id || null),
                    ubicacion_origen: data.coordenada ? 'original' : 'pendiente'
                });
            } else {
                // Si no existe en MySQL, ofrecer pasar a modo manual
                const irManual = await showConfirm(
                    `No se encontró el ticket "${ticketId}" en la base de datos. ¿Deseas registrarlo manualmente?`,
                    'Ticket no encontrado'
                );
                if (irManual) {
                    setModoManual(true);
                    setDatos({ ticket_manual: ticketId, ubicacion_origen: coords ? 'manual' : 'pendiente' });
                }
            }
        } catch (e) {
            await showAlert('Error de conexión con el servidor.', 'error', 'Error de conexión');
        }
        finally { setLoading(false); }
    };

    const confirmarUbicacion = (coordsArr) => {
        setDatos({
            ...datos,
            coordenada: `${coordsArr[0]}, ${coordsArr[1]}`,
            latitud: coordsArr[0],
            longitud: coordsArr[1],
            ubicacion_origen: 'manual'
        });
        setMostrarMapa(false);
    };

    const handleAbrirMapa = () => setMostrarMapa(true);

    // ── Guardar ficha (ambos modos) ──
    const guardarFicha = async (e) => {
        e.preventDefault();
        const idFinal = modoManual ? datos.ticket_manual : datos.ticket;
        if (!idFinal) {
            await showAlert('El número de ticket es obligatorio.', 'warning', 'Campo requerido');
            return;
        }
        setLoading(true);

        const payload = {
            ticket_id: idFinal,
            descripcion_original: datos.descripcion,
            nota_respaldo: notaRespaldo,
            latitud: datos.latitud || (datos.coordenada ? parseFloat(datos.coordenada.split(',')[0]) : null),
            longitud: datos.longitud || (datos.coordenada ? parseFloat(datos.coordenada.split(',')[1]) : null),
            barrio_colonia: datos.registro || datos.barrio_manual,
            fecha_reporte: datos.fecha ? `${datos.fecha} ${datos.hora || '00:00'}` : null,
            unidad: unidad,
            mando: mando,
            tipo_incidente_id: datos.tipo_incidente_id ? parseInt(datos.tipo_incidente_id) : null,
            subtipo_incidente_id: datos.subtipo_incidente_id ? parseInt(datos.subtipo_incidente_id) : null,
            departamento_id: datos.departamento_id ? parseInt(datos.departamento_id) : null,
            municipio_id: datos.municipio_id ? parseInt(datos.municipio_id) : null,
            despacho: datos.despacho || '',
            usuario_id: localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')) : null
        };

        try {
            const res = await fetch('http://127.0.0.1:8000/api/tickets/guardar-ficha-completa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resData = await res.json();
            if (res.ok) {
                await showAlert('Ficha registrada exitosamente.', 'success', '¡Registro exitoso!');
                onCancel();
            } else {
                await showAlert(`Error del servidor: ${resData.detail}`, 'error', 'Error al guardar');
            }
        } catch (error) {
            await showAlert('Ocurrió un error crítico al guardar la ficha.', 'error', 'Error crítico');
        }
        finally { setLoading(false); }
    };

    // Helpers de campo: en modo automático son readOnly, en modo manual son editables
    const inputAuto = (label, campo, tipo = "text", placeholder = '') => (
        <div>
            <label className="form-label small fw-bold text-muted text-uppercase">{label}</label>
            <input type={tipo} className="form-control bg-light" readOnly value={datos[campo] || ''} placeholder={placeholder} />
        </div>
    );

    const inputManual = (label, campo, tipo = "text", placeholder = '', requerido = false) => (
        <div>
            <label className="form-label small fw-bold text-uppercase" style={{ color: requerido ? '#0d6efd' : '#6c757d' }}>
                {label}{requerido && <span className="text-danger ms-1">*</span>}
            </label>
            <input
                type={tipo}
                className="form-control shadow-sm"
                placeholder={placeholder}
                value={datos[campo] || ''}
                onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
                required={requerido}
            />
        </div>
    );

    const selectManual = (label, campo, opciones, requerido = false) => (
        <div>
            <label className="form-label small fw-bold text-uppercase" style={{ color: requerido ? '#0d6efd' : '#6c757d' }}>
                {label}{requerido && <span className="text-danger ms-1">*</span>}
            </label>
            <select
                className="form-select shadow-sm"
                value={datos[campo] || ''}
                onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
            >
                <option value="">— Seleccionar —</option>
                {opciones.map(op => <option key={op.id} value={op.id}>{op.nombre}</option>)}
            </select>
        </div>
    );

    return (
        <div className="container mt-4 pb-5">
            {mostrarMapa && (
                <SelectorUbicacion
                    inicial={datos.coordenada ? datos.coordenada.split(',').map(Number) : (coords ? [coords.lat, coords.lng] : [14.0818, -87.2068])}
                    onGuardar={confirmarUbicacion}
                    onCerrar={() => setMostrarMapa(false)}
                />
            )}

            <form className="card shadow border-0 rounded-4 p-4" onSubmit={guardarFicha}>
                {/* ── Encabezado con toggle de modo ── */}
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                    <h3 className="fw-bold m-0 text-primary">
                        <i className={`fa-solid ${modoManual ? 'fa-pencil' : 'fa-bolt'} me-2`}></i>
                        {modoManual ? 'Registro Manual de Incidente' : 'Nueva Ficha de Incidente'}
                    </h3>
                    <div className="d-flex align-items-center gap-3">
                        {modoManual && (
                            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">
                                <i className="fa-solid fa-pencil me-1"></i> Modo Manual
                            </span>
                        )}
                        <div className="form-check form-switch m-0">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="toggleModo"
                                checked={modoManual}
                                onChange={() => {
                                    setModoManual(!modoManual);
                                    setDatos({
                                        ...(coords ? {
                                            latitud: coords.lat,
                                            longitud: coords.lng,
                                            coordenada: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
                                            ubicacion_origen: 'manual'
                                        } : {})
                                    });
                                }}
                                style={{ width: '3em', height: '1.5em' }}
                            />
                            <label className="form-check-label small fw-semibold ms-2" htmlFor="toggleModo">
                                {modoManual ? 'Automático' : 'Manual'}
                            </label>
                        </div>
                    </div>
                </div>

                {/* ───────────── MODO AUTOMÁTICO ───────────── */}
                {!modoManual && (
                    <div className="row g-3">
                        {/* Buscador de ticket */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold small">NÚMERO DE TICKET</label>
                            <div className="input-group shadow-sm">
                                <input type="text" className="form-control text-uppercase"
                                    value={ticketId} onChange={(e) => setTicketId(e.target.value)}
                                    placeholder="TIC-0000"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarTicket())}
                                />
                                <button className="btn btn-primary" type="button" onClick={buscarTicket} disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm"></span> : 'JALAR'}
                                </button>
                            </div>
                        </div>
                        <div className="col-md-4">{inputAuto('Departamento', 'departamento_nombre')}</div>
                        <div className="col-md-4">{inputAuto('Municipio', 'municipio_nombre')}</div>

                        {/* Ubicación */}
                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-danger text-uppercase">Ubicación Geográfica</label>
                            <div className="input-group shadow-sm">
                                <input type="text" className="form-control bg-light fw-bold" readOnly
                                    value={datos.coordenada || 'PENDIENTE'} />
                                <button className={`btn ${datos.ubicacion_origen === 'manual' ? 'btn-warning' : 'btn-danger'}`}
                                    type="button" onClick={handleAbrirMapa}>
                                    <i className="bi bi-geo-alt-fill me-1"></i>
                                    {datos.ubicacion_origen === 'manual' ? 'Editar' : 'Ubicar'}
                                </button>
                            </div>
                        </div>
                        <div className="col-md-4">{inputAuto('Tipología', 'tipologia')}</div>
                        <div className="col-md-4">{inputAuto('Subtipología', 'subtipologia')}</div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Fecha</label>
                            <input type="date" className="form-control bg-light" readOnly value={datos.fecha || ''} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-primary text-uppercase">Hora de Intervención</label>
                            <input type="time" className="form-control shadow-sm" value={datos.hora || ''}
                                onChange={(e) => setDatos({ ...datos, hora: e.target.value })} />
                        </div>
                        <div className="col-md-3">{inputAuto('Despacho', 'despacho')}</div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-primary text-uppercase">Unidad / Patrulla</label>
                            <input type="text" className="form-control shadow-sm" placeholder="Ej: PN-102"
                                value={unidad} onChange={(e) => setUnidad(e.target.value)} />
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-bold text-muted text-uppercase">Descripción de la llamada</label>
                            <textarea className="form-control bg-light" readOnly rows="2" value={datos.descripcion || ''}></textarea>
                        </div>
                        <div className="col-12">
                            <label className="form-label small fw-bold text-primary text-uppercase">Nota de Respaldo Operativa</label>
                            <textarea className="form-control shadow-sm" rows="2"
                                placeholder="Detalles del procedimiento..."
                                value={notaRespaldo} onChange={(e) => setNotaRespaldo(e.target.value)}></textarea>
                        </div>

                        <div className="col-md-4">{inputAuto('Sector / Colonia', 'registro')}</div>
                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-primary text-uppercase">Oficial al Mando</label>
                            <input type="text" className="form-control shadow-sm" placeholder="Nombre del responsable"
                                value={mando} onChange={(e) => setMando(e.target.value)} />
                        </div>
                        <div className="col-md-4 d-flex align-items-end justify-content-end gap-2">
                            <button type="button" className="btn btn-secondary px-4" onClick={onCancel}>CANCELAR</button>
                            <button type="submit" className="btn btn-success fw-bold px-4 shadow" disabled={loading}>
                                {loading ? 'PROCESANDO...' : 'GUARDAR FICHA'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ───────────── MODO MANUAL ───────────── */}
                {modoManual && (
                    <div className="row g-3">
                        <div className="col-12">
                            <div className="alert alert-warning border-0 rounded-3 py-2 px-3 d-flex align-items-center gap-2 mb-0">
                                <i className="fa-solid fa-circle-info"></i>
                                <small>En modo manual puedes registrar un incidente sin que exista en MySQL. Los campos marcados con <span className="text-danger fw-bold">*</span> son obligatorios.</small>
                            </div>
                        </div>

                        {/* ID del ticket manual */}
                        <div className="col-md-4">
                            {inputManual('Número de Ticket', 'ticket_manual', 'text', 'Ej: TIC-0000', true)}
                        </div>

                        {/* Departamento y municipio con selects */}
                        <div className="col-md-4">
                            {selectManual('Departamento', 'departamento_id', catalogos.departamentos)}
                        </div>
                        <div className="col-md-4">
                            {selectManual('Municipio', 'municipio_id', municipiosFiltrados)}
                        </div>

                        {/* Ubicación */}
                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-danger text-uppercase">Ubicación Geográfica</label>
                            <div className="input-group shadow-sm">
                                <input type="text" className="form-control bg-light fw-bold" readOnly
                                    value={datos.coordenada || 'Sin coordenadas'} />
                                <button className={`btn ${datos.ubicacion_origen === 'manual' ? 'btn-warning' : 'btn-danger'}`}
                                    type="button" onClick={handleAbrirMapa}>
                                    <i className="bi bi-geo-alt-fill me-1"></i>
                                    {datos.ubicacion_origen === 'manual' ? 'Editar' : 'Ubicar'}
                                </button>
                            </div>
                        </div>

                        {/* Tipo de incidente */}
                        <div className="col-md-4">
                            {selectManual('Tipo de Incidente', 'tipo_incidente_id', catalogos.tipos_incidente)}
                        </div>

                        {/* Colonia/barrio manual */}
                        <div className="col-md-4">
                            {inputManual('Sector / Colonia', 'barrio_manual', 'text', 'Ej: Col. Kennedy')}
                        </div>

                        {/* Subtipo de incidente */}
                        <div className="col-md-4">
                            {selectManual('Subtipo de Incidente', 'subtipo_incidente_id', subtiposFiltrados)}
                        </div>

                        {/* Despacho manual */}
                        <div className="col-md-4">
                            {inputManual('Despacho', 'despacho', 'text', 'Ej: Despacho 1')}
                        </div>

                        {/* Fecha y hora */}
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-primary text-uppercase">Fecha del Incidente<span className="text-danger ms-1">*</span></label>
                            <input type="date" className="form-control shadow-sm"
                                value={datos.fecha || ''}
                                onChange={(e) => setDatos({ ...datos, fecha: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-primary text-uppercase">Hora</label>
                            <input type="time" className="form-control shadow-sm"
                                value={datos.hora || ''}
                                onChange={(e) => setDatos({ ...datos, hora: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-primary text-uppercase">Unidad / Patrulla</label>
                            <input type="text" className="form-control shadow-sm" placeholder="Ej: PN-102"
                                value={unidad} onChange={(e) => setUnidad(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-primary text-uppercase">Oficial al Mando</label>
                            <input type="text" className="form-control shadow-sm" placeholder="Nombre del responsable"
                                value={mando} onChange={(e) => setMando(e.target.value)} />
                        </div>

                        {/* Descripción editable en modo manual */}
                        <div className="col-12">
                            <label className="form-label small fw-bold text-primary text-uppercase">
                                Descripción del Incidente<span className="text-danger ms-1">*</span>
                            </label>
                            <textarea className="form-control shadow-sm" rows="3"
                                placeholder="Describe brevemente lo ocurrido..."
                                value={datos.descripcion || ''}
                                onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div className="col-12">
                            <label className="form-label small fw-bold text-muted text-uppercase">Nota de Respaldo Operativa</label>
                            <textarea className="form-control shadow-sm" rows="2"
                                placeholder="Detalles adicionales del procedimiento..."
                                value={notaRespaldo} onChange={(e) => setNotaRespaldo(e.target.value)}></textarea>
                        </div>

                        <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                            <button type="button" className="btn btn-secondary px-4" onClick={onCancel}>CANCELAR</button>
                            <button type="submit" className="btn btn-warning fw-bold px-4 shadow text-dark" disabled={loading}>
                                <i className="fa-solid fa-floppy-disk me-2"></i>
                                {loading ? 'GUARDANDO...' : 'GUARDAR FICHA MANUAL'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default TicketForm;