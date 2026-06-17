import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

export const useLock = (tutelaId) => {
    const [lockInfo, setLockInfo] = useState(null);
    const [isLockedByMe, setIsLockedByMe] = useState(false);

    const fetchLockStatus = useCallback(async () => {
        try {
            const { data } = await apiService.get(`/tutelas/${tutelaId}/lock-status`);
            setLockInfo(data);
            
            // Verifica si está bloqueado y no expirado
            const isLocked = data.lock_owner_id && new Date(data.lock_expires_at) > new Date();
            const user = JSON.parse(localStorage.getItem('user'));
            setIsLockedByMe(isLocked && data.lock_owner_id === user?.id);
        } catch (e) { console.error('Error fetching lock status:', e); }
    }, [tutelaId]);

    const lock = async () => {
        try {
            await apiService.post(`/tutelas/${tutelaId}/lock`);
            await fetchLockStatus();
            return true;
        } catch (e) {
            toast.error(e.response?.data?.error || 'No se pudo bloquear.');
            return false;
        }
    };

    const unlock = async () => {
        try {
            await apiService.post(`/tutelas/${tutelaId}/unlock`);
            await fetchLockStatus();
        } catch (e) {
            console.error('Error unlocking:', e);
        }
    };

    useEffect(() => {
        if (!tutelaId) return;
        fetchLockStatus();
        const interval = setInterval(fetchLockStatus, 30000);
        return () => clearInterval(interval);
    }, [tutelaId, fetchLockStatus]);

    return { lockInfo, isLockedByMe, lock, unlock };
};