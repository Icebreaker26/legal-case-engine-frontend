import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLock } from '../../../hooks/useLock';
import { tutelaService } from '../services/tutelaService';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';

export function useDetalleTutela() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lockInfo, isLockedByMe, lock, unlock } = useLock(id);

  const [tutela, setTutela] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [areasDinamicas, setAreasDinamicas] = useState([]);
  const [allAbogados, setAllAbogados] = useState([]);
  const [argumentos, setArgumentos] = useState([]);
  const [aiConfig, setAiConfig] = useState({});
  const [aiDraftContent, setAiDraftContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingSugerencias, setLoadingSugerencias] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchArgumentos = useCallback(async () => {
    try {
        const { data } = await apiService.get(`/tutelas/${id}/argumentos`);
        setArgumentos(data);
    } catch (error) { toast.error('Error al cargar argumentos'); }
  }, [id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const allTutelas = await tutelaService.listar();
      const found = allTutelas.find(t => t.id === id);
      
      if (!found) {
        toast.error('Tutela no encontrada');
        navigate('/');
        return;
      }
      
      setTutela(found);
      setAiDraftContent(found.contestacion_generada || '');
      
      const [sugs, logs, config, reqs, areas, abogados] = await Promise.all([
        tutelaService.obtenerSugerencias(id).catch(() => []),
        tutelaService.obtenerHistorial(id).catch(() => []),
        tutelaService.obtenerConfiguracion().catch(() => ({})),
        tutelaService.listarRequerimientos(id).catch(() => []),
        tutelaService.listarAreas().catch(() => []),
        apiService.get('/core/usuarios-activos').catch(() => ({ data: [] }))
      ]);

      setSugerencias(sugs);
      setHistorial(logs);
      setAiConfig(config);
      setRequerimientos(reqs);
      setAreasDinamicas(areas);
      setAllAbogados(abogados.data || []);
      
      await fetchArgumentos();

    } catch (error) {
      toast.error('Error al cargar la información');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingSugerencias(false);
    }
  }, [id, navigate, fetchArgumentos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateTutelaState = (updates) => {
    setTutela(prev => ({ ...prev, ...updates }));
  };

  const addHistorialLog = (log) => {
    setHistorial(prev => [log, ...prev]);
  };

  const handleUpdateStatus = async (nuevoEstado, responsableNombre, actionMessage, extraFields = {}) => {
    setUpdating(true);
    try {
      await tutelaService.actualizar(id, { estado: nuevoEstado, ...extraFields });

      updateTutelaState({ estado: nuevoEstado });
      const logs = await tutelaService.obtenerHistorial(id).catch(() => null);
      if (logs) setHistorial(logs);
      toast.success(`Estado actualizado a ${nuevoEstado}`);
      return true;
    } catch (error) {
      toast.error('Error al actualizar estado');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      await tutelaService.eliminar(id);
      toast.success('Tutela eliminada correctamente');
      navigate('/');
      return true;
    } catch (error) {
      toast.error('Error al eliminar la tutela');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    id,
    navigate,
    lockInfo,
    isLockedByMe,
    lock,
    unlock,
    
    // Data
    tutela,
    sugerencias,
    historial,
    requerimientos,
    areasDinamicas,
    allAbogados,
    argumentos,
    aiConfig,
    aiDraftContent,
    
    // Setters for controlled updates
    setTutela: updateTutelaState,
    setRequerimientos,
    setArgumentos,
    setAiDraftContent,
    addHistorialLog,
    fetchData,
    
    // Loading states
    loading,
    loadingSugerencias,
    updating,
    setUpdating,

    // Handlers
    handleUpdateStatus,
    handleDelete
  };
}
