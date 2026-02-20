export const formatDate = (dateString) => {
  if (!dateString) return "Sin fecha";
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};