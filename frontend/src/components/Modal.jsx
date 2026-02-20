import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Context ────────────────────────────────────────────────────────────────
const ModalContext = createContext(null);

const ICONS = {
    success: { icon: 'fa-circle-check', color: '#0d6efd', bg: '#e7f1ff' },
    error: { icon: 'fa-circle-xmark', color: '#0d6efd', bg: '#e7f1ff' },
    warning: { icon: 'fa-triangle-exclamation', color: '#0d6efd', bg: '#e7f1ff' },
    info: { icon: 'fa-circle-info', color: '#0d6efd', bg: '#e7f1ff' },
    confirm: { icon: 'fa-circle-question', color: '#0d6efd', bg: '#e7f1ff' },
};

// ─── Provider ────────────────────────────────────────────────────────────────
export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null);

    /**
     * Muestra un modal de alerta simple.
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} type
     * @param {string} title  (opcional)
     */
    const showAlert = useCallback((message, type = 'info', title = null) => {
        return new Promise((resolve) => {
            setModal({
                type,
                title: title || { success: '¡Éxito!', error: 'Error', warning: 'Advertencia', info: 'Información' }[type],
                message,
                mode: 'alert',
                onClose: () => { setModal(null); resolve(); },
            });
        });
    }, []);

    /**
     * Muestra un modal de confirmación (OK / Cancelar).
     * @returns {Promise<boolean>}
     */
    const showConfirm = useCallback((message, title = '¿Confirmar acción?') => {
        return new Promise((resolve) => {
            setModal({
                type: 'confirm',
                title,
                message,
                mode: 'confirm',
                onConfirm: () => { setModal(null); resolve(true); },
                onClose: () => { setModal(null); resolve(false); },
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {modal && <ModalUI modal={modal} />}
        </ModalContext.Provider>
    );
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useModal = () => {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error('useModal debe usarse dentro de <ModalProvider>');
    return ctx;
};

// ─── UI del Modal ─────────────────────────────────────────────────────────────
const ModalUI = ({ modal }) => {
    const { type, title, message, mode, onClose, onConfirm } = modal;
    const style = ICONS[type] || ICONS.info;

    return (
        // Backdrop
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn .18s ease',
            }}
        >
            {/* Card */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '2rem',
                    maxWidth: '420px',
                    width: '90%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    animation: 'popIn .22s cubic-bezier(.34,1.56,.64,1)',
                    textAlign: 'center',
                }}
            >
                {/* Ícono */}
                <div style={{
                    width: 72, height: 72,
                    borderRadius: '50%',
                    background: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem',
                }}>
                    <i className={`fa-solid ${style.icon}`} style={{ fontSize: 34, color: style.color }}></i>
                </div>

                {/* Título */}
                <h5 style={{ fontWeight: 700, marginBottom: '.5rem', color: '#212529' }}>{title}</h5>

                {/* Mensaje */}
                <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: 1.5 }}>{message}</p>

                {/* Botones */}
                {mode === 'alert' && (
                    <button
                        onClick={onClose}
                        style={{
                            background: style.color,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '10px 36px',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            boxShadow: `0 4px 14px ${style.color}55`,
                        }}
                    >
                        Aceptar
                    </button>
                )}
                {mode === 'confirm' && (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: '#f1f3f5', color: '#495057',
                                border: 'none', borderRadius: '50px',
                                padding: '10px 28px', fontWeight: 600,
                                fontSize: '14px', cursor: 'pointer',
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                background: style.color, color: '#fff',
                                border: 'none', borderRadius: '50px',
                                padding: '10px 28px', fontWeight: 700,
                                fontSize: '14px', cursor: 'pointer',
                                boxShadow: `0 4px 14px ${style.color}55`,
                            }}
                        >
                            Confirmar
                        </button>
                    </div>
                )}
            </div>

            {/* Animaciones CSS en línea */}
            <style>{`
                @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes popIn  { from { transform:scale(.8); opacity:0 } to { transform:scale(1); opacity:1 } }
            `}</style>
        </div>
    );
};
