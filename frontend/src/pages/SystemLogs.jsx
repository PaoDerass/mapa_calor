import React, { useState, useEffect } from 'react';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/admin/logs');
            const result = await res.json();
            if (res.ok) setLogs(result);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="container-fluid pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="text-dark fw-bold m-0">
                        <i className="fa-solid fa-list-check me-2 text-primary"></i>Logs del Sistema
                    </h3>
                    <p className="text-muted small m-0">Auditoría de acciones realizadas en la plataforma</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={fetchLogs}>
                    <i className="fa-solid fa-rotate me-1"></i> Actualizar
                </button>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Cargando logs...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4 border-0 text-muted small fw-bold">USUARIO</th>
                                        <th className="border-0 text-muted small fw-bold">ACCIÓN</th>
                                        <th className="border-0 text-muted small fw-bold">DETALLES</th>
                                        <th className="border-0 text-muted small fw-bold">FECHA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center p-4 text-muted">No se encontraron registros de auditoría</td></tr>
                                    ) : logs.map(l => (
                                        <tr key={l.id}>
                                            <td className="ps-4 small fw-bold">{l.usuario}</td>
                                            <td><span className="badge bg-secondary-subtle text-secondary rounded-pill">{l.accion}</span></td>
                                            <td className="text-muted small" title={l.detalles}>
                                                {l.detalles ? (l.detalles.length > 80 ? l.detalles.substring(0, 80) + '...' : l.detalles) : '-'}
                                            </td>
                                            <td className="text-muted small">{l.fecha}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemLogs;
