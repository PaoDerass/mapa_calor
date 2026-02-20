import React, { useState, useEffect } from 'react';
import { useModal } from '../components/Modal';

const AdminPanel = () => {
    const { showAlert } = useModal();
    const [activeSubTab, setActiveSubTab] = useState('usuarios');
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [regionales, setRegionales] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estado para el modal de usuario
    const [showUserModal, setShowUserModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newUser, setNewUser] = useState({
        nombre_usuario: '',
        email: '',
        password: '',
        rol_id: '',
        regional_id: '',
        es_admin: false
    });

    const fetchData = async (tab) => {
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/admin/${tab}`);
            const result = await res.json();
            if (res.ok) {
                setData(result);
                if (tab === 'roles') setRoles(result);
            }
        } catch (error) {
            console.error(`Error fetching ${tab}:`, error);
        } finally {
            setLoading(false);
        }
    };

    // Cargar catálogos para el modal
    const cargarCatalogos = async () => {
        try {
            const [resRoles, resReg] = await Promise.all([
                fetch('http://127.0.0.1:8000/api/admin/roles'),
                fetch('http://127.0.0.1:8000/api/admin/regionales')
            ]);
            if (resRoles.ok) setRoles(await resRoles.json());
            if (resReg.ok) setRegionales(await resReg.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData(activeSubTab);
        cargarCatalogos();
    }, [activeSubTab]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/admin/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newUser,
                    rol_id: newUser.rol_id ? parseInt(newUser.rol_id) : null,
                    regional_id: newUser.regional_id ? parseInt(newUser.regional_id) : null
                })
            });
            const result = await res.json();
            if (res.ok) {
                await showAlert('Usuario creado correctamente', 'success', 'Éxito');
                setShowUserModal(false);
                setNewUser({ nombre_usuario: '', email: '', password: '', rol_id: '', regional_id: '', es_admin: false });
                fetchData('usuarios');
            } else {
                await showAlert(result.detail || 'Error al crear usuario', 'error', 'Error');
            }
        } catch (error) {
            await showAlert('Error de conexión con el servidor', 'error', 'Error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-fluid pb-5">
            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <h3 className="text-dark fw-bold m-0">
                        <i className="fa-solid fa-lock-open me-2 text-primary"></i>Panel de Administración
                    </h3>
                    <p className="text-muted small m-0">Gestión de usuarios y niveles de acceso</p>
                </div>
                {activeSubTab === 'usuarios' && (
                    <button
                        className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold"
                        onClick={() => setShowUserModal(true)}
                    >
                        <i className="fa-solid fa-user-plus me-2"></i>Agregar Usuario
                    </button>
                )}
            </div>

            {/* Sub-Navegación del Panel Admin */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                <div className="card-body p-0">
                    <div className="d-flex bg-light p-1">
                        <button
                            className={`btn btn-sm flex-fill rounded-3 py-2 transition-all ${activeSubTab === 'usuarios' ? 'btn-white shadow-sm fw-bold border' : 'btn-link text-muted text-decoration-none'}`}
                            onClick={() => setActiveSubTab('usuarios')}
                        >
                            <i className="fa-solid fa-users me-2"></i>Gestión de Usuarios
                        </button>
                        <button
                            className={`btn btn-sm flex-fill rounded-3 py-2 transition-all ${activeSubTab === 'roles' ? 'btn-white shadow-sm fw-bold border' : 'btn-link text-muted text-decoration-none'}`}
                            onClick={() => setActiveSubTab('roles')}
                        >
                            <i className="fa-solid fa-user-shield me-2"></i>Roles y Permisos
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido Dinámico */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Cargando información...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            {activeSubTab === 'usuarios' && (
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4 border-0 text-muted small fw-bold">USUARIO</th>
                                            <th className="border-0 text-muted small fw-bold">EMAIL</th>
                                            <th className="border-0 text-muted small fw-bold">REGIONAL</th>
                                            <th className="border-0 text-muted small fw-bold">ROL</th>
                                            <th className="border-0 text-muted small fw-bold text-end pe-4">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map(u => (
                                            <tr key={u.id}>
                                                <td className="ps-4 fw-bold text-dark">{u.nombre_usuario}</td>
                                                <td className="text-secondary small">{u.email}</td>
                                                <td className="text-secondary small">{u.regional || '-'}</td>
                                                <td><span className="badge bg-primary-subtle text-primary rounded-pill px-3">{u.rol}</span></td>
                                                <td className="text-end pe-4">
                                                    <button className="btn btn-sm btn-light rounded-pill px-3 me-2" onClick={() => showAlert('Función de edición próximamente', 'info', 'Aviso')}>Editar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {activeSubTab === 'roles' && (
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4 border-0 text-muted small fw-bold">NOMBRE ROL</th>
                                            <th className="border-0 text-muted small fw-bold">PERMISOS</th>
                                            <th className="border-0 text-muted small fw-bold text-end pe-4">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center p-4 text-muted">No hay roles definidos</td></tr>
                                        ) : data.map(r => (
                                            <tr key={r.id}>
                                                <td className="ps-4 fw-bold">{r.nombre}</td>
                                                <td className="text-muted small">
                                                    {r.permisos ? r.permisos.map(p => <span key={p} className="badge bg-light text-dark border me-1">{p}</span>) : 'Acceso total'}
                                                </td>
                                                <td className="text-end pe-4">
                                                    <button className="btn btn-sm btn-light rounded-pill px-3" onClick={() => showAlert('Detalles del rol', 'info', r.nombre)}>Ver</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL PARA AGREGAR USUARIO */}
            {showUserModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0 pe-4 pt-4">
                                <h5 className="modal-title fw-bold">Crear Nuevo Usuario</h5>
                                <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
                            </div>
                            <form onSubmit={handleCreateUser}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Nombre de Usuario</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3 border bg-light-subtle shadow-none"
                                            required
                                            value={newUser.nombre_usuario}
                                            onChange={e => setNewUser({ ...newUser, nombre_usuario: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Email</label>
                                        <input
                                            type="email"
                                            className="form-control rounded-3 border bg-light-subtle shadow-none"
                                            required
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control rounded-3 border bg-light-subtle shadow-none"
                                            required
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold text-muted">Regional</label>
                                                <select
                                                    className="form-select rounded-3 border bg-light-subtle shadow-none"
                                                    value={newUser.regional_id}
                                                    onChange={e => setNewUser({ ...newUser, regional_id: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {regionales.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold text-muted">Rol Asignado</label>
                                                <select
                                                    className="form-select rounded-3 border bg-light-subtle shadow-none"
                                                    value={newUser.rol_id}
                                                    onChange={e => setNewUser({ ...newUser, rol_id: e.target.value })}
                                                >
                                                    <option value="">Sin Rol Específico</option>
                                                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-check form-switch pt-1 mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="checkAdmin"
                                            checked={newUser.es_admin}
                                            onChange={e => setNewUser({ ...newUser, es_admin: e.target.checked })}
                                        />
                                        <label className="form-check-label small fw-bold" htmlFor="checkAdmin">Es Administrador Global</label>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pb-4 pe-4">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowUserModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={saving}>
                                        {saving ? 'Guardando...' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
