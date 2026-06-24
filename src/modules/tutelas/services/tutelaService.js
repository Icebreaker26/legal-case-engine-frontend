import apiService from '../../../services/apiService';

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

  registrarFeedback: async (documento_id, util) => {
    const { data } = await apiService.post(`${ENDPOINT}/memoria/${documento_id}/feedback`, { util });
    return data;
  },

  promoverArgumento: async (tutelaId, argId) => {
    const { data } = await apiService.post(`${ENDPOINT}/${tutelaId}/argumentos/${argId}/promover`);
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

  obtenerDocumentoReferencia: async (documentoId, chunkMatch = '') => {
    const params = chunkMatch ? `?chunk_match=${encodeURIComponent(chunkMatch.substring(0, 80))}` : '';
    const { data } = await apiService.get(`${ENDPOINT}/documento-referencia/${documentoId}${params}`);
    return data;
  },

  actualizarDatos: async (id, data) => {
    const response = await apiService.patch(`${ENDPOINT}/${id}/datos`, data);
    return response.data;
  },

  eliminar: async (id) => {
    const { data } = await apiService.delete(`${ENDPOINT}/${id}`);
    return data;
  },

  obtenerSugerenciasBorrador: async (id) => {
    const { data } = await apiService.post(`${ENDPOINT}/${id}/generar-borrador`);
    return data;
  },

  guardarBorrador: async (id, borrador) => {
    const { data } = await apiService.post(`${ENDPOINT}/${id}/guardar-borrador`, { borrador });
    return data;
  },

  obtenerConfiguracion: async () => {
    const { data } = await apiService.get('/tutelas/config');
    return data;
  },

  listarRequerimientos: async (id) => {
    const { data } = await apiService.get(`${ENDPOINT}/${id}/requerimientos`);
    return data;
  },

  crearRequerimiento: async (id, payload) => {
    const { data } = await apiService.post(`${ENDPOINT}/${id}/requerimientos`, payload);
    return data;
  },

  gestionarResponsables: async (id, abogados_ids) => {
    const { data } = await apiService.patch(`${ENDPOINT}/${id}/responsables`, { abogados_ids });
    return data;
  },

  actualizarEstadoRequerimiento: async (reqId, estado, respuesta_texto) => {
    const { data } = await apiService.patch(`${ENDPOINT}/requerimientos/${reqId}`, { estado, respuesta_texto });
    return data;
  },

  listarAreas: async () => {
    const { data } = await apiService.get('/core/grupos');
    return data;
  }
};