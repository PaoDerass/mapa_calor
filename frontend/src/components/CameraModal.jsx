import React, { useState } from 'react';

const CameraModal = ({ lat, lng, onClose, onSave }) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('Fija');
    const [direccion, setDireccion] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/tickets/capas/camaras', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombre, tipo, lat, lng, direccion })
            });
            if (res.ok) {
                onSave();
                onClose();
            } else {
                const err = await res.json();
                alert(err.detail || 'Error al guardar la cámara');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header border-0 pb-0 pe-4 pt-4">
                        <h5 className="modal-title fw-bold">
                            <i className="fa-solid fa-video text-primary me-2"></i>Registrar Cámara
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted">Nombre de la Cámara</label>
                                <input
                                    type="text"
                                    className="form-control rounded-3 border bg-light-subtle shadow-none"
                                    placeholder="Ej: Cámara Intersección Principal"
                                    required
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                />
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Tipo</label>
                                        <select
                                            className="form-select rounded-3 border bg-light-subtle shadow-none"
                                            value={tipo}
                                            onChange={e => setTipo(e.target.value)}
                                        >
                                            <option value="Fija">Fija</option>
                                            <option value="PTZ">PTZ</option>
                                            <option value="Domo">Domo</option>
                                            <option value="LPR">LPR (Patentes)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Coordenadas</label>
                                        <div className="form-control-plaintext small text-secondary">
                                            {lat.toFixed(5)}, {lng.toFixed(5)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted">Dirección / Referencia</label>
                                <textarea
                                    className="form-control rounded-3 border bg-light-subtle shadow-none"
                                    rows="2"
                                    placeholder="Descripción de la ubicación..."
                                    value={direccion}
                                    onChange={e => setDireccion(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pb-4 pe-4">
                            <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" disabled={saving}>
                                {saving ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                                ) : (
                                    'Guardar Cámara'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
