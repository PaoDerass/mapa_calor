export const setupInterceptor = () => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        let [resource, config] = args;

        // Ensure config is an object
        config = config || {};
        
        // Append Authorization header if token exists and request is to our API
        const token = localStorage.getItem('token');
        if (token && typeof resource === 'string' && resource.startsWith('http')) {
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token}`
            };
        }

        try {
            const response = await originalFetch(resource, config);

            // Handle 401 (Unauthorized) and 403 (Forbidden)
            if (response.status === 401) {
                console.warn('401 Unauthorized - token expirado o inválido');
                // Eliminar credenciales y recargar para forzar login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                window.location.reload();
            } else if (response.status === 403) {
                console.warn('403 Forbidden - acceso denegado a recurso');
                // Podríamos disparar un evento global o simplemente alertar al usuario
                // En la UI ideal, quizás mostremos un toast
                alert('Acceso Denegado: No tienes permisos para realizar esta acción.');
            }

            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    };
};
