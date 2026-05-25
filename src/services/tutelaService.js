import apiService from './apiService';

const ENDPOINT = '/tutelas';

export const tutelaService = {
  listar: async () => {
    const { data } = await apiService.get(ENDPOINT);
    return data;
  },

  procesar: async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('documento', file);

    if (metadata.responsable_id) formData.append('responsable_id', metadata.responsable_id);
    if (metadata.prioridad) formData.append('prioridad', metadata.prioridad);
    if (metadata.area_responsable) formData.append('area_responsable', metadata.area_responsable);
    if (metadata.dias_termino) formData.append('dias_termino', metadata.dias_termino);

    const { data } = await apiService.post(`${ENDPOINT}/procesar`, formData);
    return data;
  },

  actualizar: async (id, data) => {
    const response = await apiService.patch(`${ENDPOINT}/${id}`, data);
    return response.data;
  },

  descargarWord: async (id) => {
    const response = await apiService.get(`${ENDPOINT}/${id}/descargar`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Contestacion_Tutela_${id.substring(0,8)}.docx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  },

  entrenarLocal: async (formData) => {
    const { data } = await apiService.post(`${ENDPOINT}/entrenar-local`, formData);
    return data;
  },

  obtenerSugerencias: async (id) => {
    const { data } = await apiService.get(`${ENDPOINT}/${id}/sugerencias`);
    return data;
  },

  obtenerHistorial: async (id) => {
    const { data } = await apiService.get(`${ENDPOINT}/${id}/historial`);
    return data;
  },

  agregarAccion: async (id, data) => {
    const { data: responseData } = await apiService.post(`${ENDPOINT}/${id}/historial`, data);
    return responseData;
  },

  obtenerDocumentoReferencia: async (documentoId) => {
    const { data } = await apiService.get(`${ENDPOINT}/documento-referencia/${documentoId}`);
    return data;
  },

  actualizarDatos: async (id, data) => {
    const response = await apiService.patch(`${ENDPOINT}/${id}/datos`, data);
    return response.data;
  },

  eliminar: async (id) => {
    const { data } = await apiService.delete(`${ENDPOINT}/${id}`);
    return data;
  }
};