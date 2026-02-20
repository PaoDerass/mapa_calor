import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- CONFIGURACIÓN DE ICONOS ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- SUBSISTEMA DEL MAPA ---
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

const SelectorUbicacion = ({ inicial, onGuardar, onCerrar }) => {
    const [posicion, setPosicion] = useState(inicial || [14.0818, -87.2068]);
    const [tempBusqueda, setTempBusqueda] = useState('');
    const [buscando, setBuscando] = useState(false);

    const buscar = async (e) => {
        e.preventDefault();
        if (!tempBusqueda) return;
        setBuscando(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${tempBusqueda}`);
            const data = await res.json();
            if (data[0]) setPosicion([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } catch (err) {
            console.error(err);
        } finally {
            setBuscando(false);
        }
    };

    return (
        <div className="modal d-block animate__animated animate__fadeIn" style={{ zIndex: 1060, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
                    
                    {/* Header Estilizado */}
                    <div className="modal-header bg-white border-bottom px-4 py-3 d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
                            <i className="bi bi-geo-fill text-primary fs-5"></i>
                        </div>
                        <div className="flex-grow-1">
                            <h5 className="modal-title fw-bold text-dark mb-0">Localizador Geográfico</h5>
                            <small className="text-muted">Ajuste la posición haciendo clic en el mapa</small>
                        </div>
                        <button type="button" className="btn-close shadow-none" onClick={onCerrar}></button>
                    </div>

                    <div className="modal-body p-0 position-relative">
                        
                        {/* Barra de Búsqueda Flotante "Pro" */}
                        <div className="position-absolute top-0 start-50 translate-middle-x mt-3 w-75" style={{ zIndex: 1000 }}>
                            <form onSubmit={buscar} className="input-group shadow-lg border-0">
                                <span className="input-group-text bg-white border-0 ps-3">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control border-0 py-2 shadow-none" 
                                    placeholder="Buscar por colonia, ciudad o dirección..."
                                    value={tempBusqueda}
                                    onChange={(e) => setTempBusqueda(e.target.value)}
                                />
                                <button type="submit" className="btn btn-dark px-4 fw-bold border-0" disabled={buscando}>
                                    {buscando ? <span className="spinner-border spinner-border-sm"></span> : 'LOCALIZAR'}
                                </button>
                            </form>
                        </div>

                        {/* Contenedor del Mapa */}
                        <div style={{ height: '450px', width: '100%' }}>
                            <MapContainer center={posicion} zoom={15} style={{ height: '100%', cursor: 'crosshair' }} zoomControl={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={posicion} />
                                <MapEvents setPos={setPosicion} />
                                <Recenter pos={posicion} />
                            </MapContainer>
                        </div>

                        {/* Panel de Coordenadas Inferior */}
                        <div className="bg-white px-4 py-3 border-top">
                            <div className="row g-3 align-items-center">
                                <div className="col-md-5">
                                    <div className="form-floating">
                                        <input 
                                            type="number" 
                                            className="form-control border-0 bg-light fw-bold" 
                                            id="latInput"
                                            value={posicion[0]} 
                                            step="any"
                                            onChange={(e) => setPosicion([parseFloat(e.target.value) || 0, posicion[1]])}
                                        />
                                        <label htmlFor="latInput" className="text-primary fw-bold small">LATITUD</label>
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="form-floating">
                                        <input 
                                            type="number" 
                                            className="form-control border-0 bg-light fw-bold" 
                                            id="lngInput"
                                            value={posicion[1]} 
                                            step="any"
                                            onChange={(e) => setPosicion([posicion[0], parseFloat(e.target.value) || 0])}
                                        />
                                        <label htmlFor="lngInput" className="text-primary fw-bold small">LONGITUD</label>
                                    </div>
                                </div>
                                <div className="col-md-2 text-center text-muted">
                                    <i className="bi bi-crosshair fs-3 border p-2 rounded-circle bg-light"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer de Acción */}
                    <div className="modal-footer bg-light border-0 px-4 py-3">
                        <button className="btn btn-link text-muted text-decoration-none fw-bold me-auto" onClick={onCerrar}>
                            DESCARTAR
                        </button>
                        <button className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => onGuardar(posicion)}>
                            CONFIRMAR UBICACIÓN
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default SelectorUbicacion;