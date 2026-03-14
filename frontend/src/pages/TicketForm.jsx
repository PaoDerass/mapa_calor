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
    const [ticketId, setTicketId] = useState('');
    const [datos, setDatos] = useState({});
    const [loading, setLoading] = useState(false);
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [notaRespaldo, setNotaRespaldo] = useState('');
    const [unidad, setUnidad] = useState('');
    const [mando, setMando] = useState('');
    const [catalogos, setCatalogos] = useState({ departamentos: [], tipos_incidente: [], municipios: [], subtipos_incidente: [] });

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

    // Cargar catálogos
    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/tickets/catalogos')
            .then(r => r.json())
            .then(data => setCatalogos(data))
            .catch(err => console.error("Error cargando catálogos:", err));
    }, []);

    // Municipios filtrados según el departamento seleccionado
    const municipiosSeguros = catalogos.municipios || [];
    const municipiosFiltrados = datos.departamento_id
        ? municipiosSeguros.filter(m => m.departamento_id === parseInt(datos.departamento_id))
        : municipiosSeguros;

    // Subtipos filtrados según el tipo seleccionado
    const subtiposSeguros = catalogos.subtipos_incidente || [];
    const subtiposFiltrados = datos.tipo_incidente_id
        ? subtiposSeguros.filter(s => s.tipo_incidente_id === parseInt(datos.tipo_incidente_id))
        : subtiposSeguros;

    // ── Búsqueda de Ticket: jala datos y los pone en los inputs editables ──
    const buscarTicket = async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/tickets/buscar-externo/${ticketId}`);
            if (res.ok) {
                const data = await res.json();
                // Intentar emparejar catálogos por NOMBRE para asegurar compatibilidad Postgres (ignorando tildes)
                const clean = (str) => (str || '').toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                const foundDepto = catalogos.departamentos.find(d => clean(d.nombre) === clean(data.departamento_nombre));
                const foundMuni = catalogos.municipios.find(m => clean(m.nombre) === clean(data.municipio_nombre));
                const foundTipo = catalogos.tipos_incidente.find(t => clean(t.nombre) === clean(data.tipologia));
                const foundSub = catalogos.subtipos_incidente.find(s => clean(s.nombre) === clean(data.subtipologia));

                setDatos(prev => ({
                    ...prev,
                    ...data,
                    tipo_incidente_id: foundTipo ? foundTipo.id : (data.tipo_incidente_id || null),
                    subtipo_incidente_id: foundSub ? foundSub.id : (data.subtipo_incidente_id || null),
                    departamento_id: foundDepto ? foundDepto.id : (data.departamento_id || null),
                    municipio_id: foundMuni ? foundMuni.id : (data.municipio_id || null),
                    ubicacion_origen: data.coordenada ? 'original' : 'pendiente',
                    barrio_colonia: data.registro || data.barrio_colonia || ''
                }));
                await showAlert('Ticket cargado. Puede revisar y editar los datos antes de guardar.', 'success', 'Ticket encontrado');
            } else {
                await showAlert(`No se encontró el ticket "${ticketId}". Puede ingresar los datos manualmente.`, 'info', 'Ticket no encontrado');
                setDatos(prev => ({ ...prev, ubicacion_origen: coords ? 'manual' : 'pendiente' }));
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

    // ── Guardar ficha (único modo editable) ──
    const guardarFicha = async (e) => {
        e.preventDefault();
        const idFinal = ticketId;
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
            barrio_colonia: datos.barrio_colonia || datos.registro,
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

    // Helpers de campo (Diseño Limpio, Espacioso, sin cajas extra)
    const inputManual = (label, campo, tipo = "text", placeholder = '', requerido = false) => (
        <div className="mb-4">
            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                {label}{requerido && <span className="text-danger ms-1">*</span>}
            </label>
            <input
                type={tipo}
                className="form-control form-control-lg bg-light border-0 shadow-none rounded-3"
                style={{ fontSize: '0.95rem' }}
                placeholder={placeholder}
                value={datos[campo] || ''}
                onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
                required={requerido}
            />
        </div>
    );

    const selectManual = (label, campo, opciones, requerido = false) => (
        <div className="mb-4">
            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                {label}{requerido && <span className="text-danger ms-1">*</span>}
            </label>
            <select
                className="form-select form-select-lg bg-light border-0 shadow-none rounded-3"
                style={{ fontSize: '0.95rem' }}
                value={datos[campo] || ''}
                onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
                required={requerido}
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

            <form className="card border-0 rounded-4 shadow-sm p-3 p-md-5" onSubmit={guardarFicha}>
                {/* ── Encabezado Limpio ── */}
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-5 pb-3 border-bottom">
                    <div>
                        <h3 className="fw-bold text-dark m-0">Registro de Incidente</h3>
                        <p className="text-muted small m-0 mt-1">Complete todos los datos obligatorios para crear la ficha operativa.</p>
                    </div>
                </div>

                {/* Buscador de Ticket Principal (Minimalista) */}
                <div className="row mb-5 justify-content-center">
                    <div className="col-12">
                        <label className="form-label fw-bold text-primary small mb-2 d-flex justify-content-between">
                            <span><i className="fa-solid fa-magnifying-glass me-2"></i>BUSCAR TICKET EXISTENTE</span>
                            <span className="text-muted fw-normal">(Opcional)</span>
                        </label>
                        <div className="input-group">
                            <input type="text" className="form-control form-control-lg bg-light border-0 text-uppercase rounded-start-3 focus-ring-primary"
                                style={{ fontSize: '1rem' }}
                                value={ticketId} onChange={(e) => setTicketId(e.target.value)}
                                placeholder="NÚMERO TICKET (Ej: TIC-0000)" 
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarTicket())}
                            />
                            <button className="btn btn-primary px-4 fw-bold rounded-end-3" type="button" onClick={buscarTicket} disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'IMPORTAR DATOS'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 1: UBICACIÓN */}
                <h5 className="fw-bold text-dark mb-4 border-start border-3 border-primary ps-3 pb-1">Ubicación Geográfica</h5>
                <div className="row mb-5">
                    <div className="col-md-4">
                        {selectManual('DEPARTAMENTO', 'departamento_id', catalogos.departamentos, true)}
                    </div>
                    <div className="col-md-4">
                        {selectManual('MUNICIPIO', 'municipio_id', municipiosFiltrados, true)}
                    </div>
                    <div className="col-md-4">
                        {inputManual('BARRIO O COLONIA', 'barrio_colonia', 'text', 'Ej: Barrio El Centro')}
                    </div>
                    <div className="col-md-12">
                        <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                            PUNTO EXACTO EN EL MAPA <span className="text-danger">*</span>
                        </label>
                        <div className="d-flex align-items-center bg-light p-2 rounded-3">
                            <i className="fa-solid fa-map-location-dot text-muted fs-4 ms-3 me-3"></i>
                            <div className="flex-grow-1">
                                <span className={`fw-bold ${datos.coordenada ? 'text-dark' : 'text-muted'}`}>
                                    {datos.coordenada || 'Coordenadas no establecidas'}
                                </span>
                            </div>
                            <button className={`btn ${datos.ubicacion_origen === 'manual' ? 'btn-outline-primary' : 'btn-danger'} rounded-3 px-4 fw-bold`}
                                type="button" onClick={handleAbrirMapa}>
                                <i className="fa-solid fa-pencil me-2"></i>
                                {datos.coordenada ? 'MODIFICAR PUNTO' : 'SELECCIONAR PUNTO'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: TIPOLOGÍA Y TIEMPOS */}
                <h5 className="fw-bold text-dark mb-4 border-start border-3 border-danger ps-3 pb-1">Tipo de Incidente y Tiempos</h5>
                <div className="row mb-5">
                    <div className="col-md-6">
                        {selectManual('TIPO DE INCIDENTE', 'tipo_incidente_id', catalogos.tipos_incidente, true)}
                    </div>
                    <div className="col-md-6">
                        {selectManual('SUBTIPO DE INCIDENTE', 'subtipo_incidente_id', subtiposFiltrados, true)}
                    </div>
                    <div className="col-md-6">
                        <div className="mb-4">
                            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                                FECHA DEL REPORTE <span className="text-danger">*</span>
                            </label>
                            <input type="date" className="form-control form-control-lg bg-light border-0 shadow-none rounded-3"
                                style={{ fontSize: '0.95rem' }} value={datos.fecha || ''}
                                onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} required />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="mb-4">
                            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                                HORA DEL INCIDENTE
                            </label>
                            <input type="time" className="form-control form-control-lg bg-light border-0 shadow-none rounded-3"
                                style={{ fontSize: '0.95rem' }} value={datos.hora || ''}
                                onChange={(e) => setDatos({ ...datos, hora: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 3: ASIGNACIÓN Y NARRACIÓN */}
                <h5 className="fw-bold text-dark mb-4 border-start border-3 border-success ps-3 pb-1">Asignación Operativa y Detalles</h5>
                <div className="row mb-5">
                    <div className="col-md-4">
                        {inputManual('DESPACHO ASIGNADO', 'despacho', 'text', 'Ej: Sala 1')}
                    </div>
                    <div className="col-md-4">
                        {inputManual('UNIDAD MOVIL', 'unidad', 'text', 'Identificador de la unidad')}
                    </div>
                    <div className="col-md-4">
                        {inputManual('OFICIAL A CARGO', 'mando', 'text', 'Nombre completo')}
                    </div>
                    
                    <div className="col-12 mt-2">
                        <div className="mb-4">
                            <label className="form-label fw-semibold text-secondary d-flex justify-content-between" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                                <span>DESCRIPCIÓN DEL HECHO <span className="text-danger">*</span></span>
                            </label>
                            <textarea className="form-control bg-light border-0 shadow-none rounded-3 p-3" rows="4"
                                style={{ fontSize: '0.95rem' }}
                                placeholder="Redacte todos los hechos pertinentes, daños, involucrados..."
                                value={datos.descripcion || ''}
                                onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
                                required
                            ></textarea>
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="mb-4">
                            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                                OBSERVACIONES ADICIONALES
                            </label>
                            <textarea className="form-control bg-light border-0 shadow-none rounded-3 p-3" rows="2"
                                style={{ fontSize: '0.95rem' }}
                                placeholder="Anotaciones extra para respaldo..."
                                value={notaRespaldo} onChange={(e) => setNotaRespaldo(e.target.value)}></textarea>
                        </div>
                    </div>
                </div>

                {/* BOTONES FINALES */}
                <div className="d-flex justify-content-end gap-3 pt-3">
                    <button type="button" className="btn btn-light px-5 fw-bold text-secondary" onClick={onCancel} style={{ letterSpacing: '1px' }}>CANCELAR</button>
                    <button type="submit" className="btn btn-dark px-5 fw-bold text-white shadow-sm" disabled={loading} style={{ letterSpacing: '1px' }}>
                        <i className="fa-solid fa-check me-2"></i>
                        {loading ? 'PROCESANDO...' : 'REGISTRAR FICHA'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TicketForm;