import React, { useState } from 'react';
import { useModal } from './Modal';

const ChangePasswordModal = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showAlert } = useModal();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showAlert('Las contraseñas nuevas no coinciden', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        setLoading(true);
        try {
            const userId = localStorage.getItem('user_id');
            const response = await fetch('http://127.0.0.1:8000/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    current_password: currentPassword,
                    new_password: newPassword
                }),
            });

            if (response.ok) {
                showAlert('Contraseña actualizada exitosamente', 'success');
                onClose();
            } else {
                const data = await response.json();
                showAlert(data.detail || 'Error al actualizar la contraseña', 'error');
            }
        } catch (err) {
            showAlert('No se pudo conectar con el servidor', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div className="modal-content bg-white p-4 rounded-4 shadow-lg"
                style={{ maxWidth: '400px', width: '90%' }}
                onClick={e => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold m-0 text-dark">Cambiar Contraseña</h5>
                    <button className="btn-close shadow-none" onClick={onClose}></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-muted text-uppercase">Contraseña Actual</label>
                        <input
                            type="password"
                            className="form-control rounded-pill px-3 py-2 border shadow-sm"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-muted text-uppercase">Nueva Contraseña</label>
                        <input
                            type="password"
                            className="form-control rounded-pill px-3 py-2 border shadow-sm"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            className="form-control rounded-pill px-3 py-2 border shadow-sm"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'ACTUALIZAR CONTRASEÑA'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
