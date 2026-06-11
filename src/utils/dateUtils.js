export const calcularTiempoTranscurrido = (fechaSolicitud, estado, fechaFinalizacion = null) => {
    const inicio = new Date(fechaSolicitud);
    const fin = estado === 'CONFORMADO' ? (fechaFinalizacion ? new Date(fechaFinalizacion) : new Date()) : new Date();
    
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const prefijo = estado === 'CONFORMADO' ? 'Finalizado en' : '';
    const sufijo = estado === 'CONFORMADO' ? '' : 'desde solicitud';
    
    return `${prefijo} ${diffDays} día${diffDays !== 1 ? 's' : ''} ${sufijo}`;
};
