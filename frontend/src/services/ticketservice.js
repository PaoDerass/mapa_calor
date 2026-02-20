const API_URL = "http://127.0.0.1:8000/api/v1";

export const getTicketFromMySQL = async (ticketId) => {
    try {
        const response = await fetch(`${API_URL}/tickets/buscar/${ticketId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al buscar el ticket");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};