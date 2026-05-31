import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiService from '../../../services/apiService';

const MorseStream = () => {
    const [sequences, setSequences] = useState([
        { text: ". -. . .-..   . -. . .-..   . -. . .-..", type: 'Morse' },
        { text: ">> SISTEMA ACTIVO // ESPERANDO COMUNICACIONES", type: 'Texto' }
    ]);
    const [index, setIndex] = useState(0);

    const fetchAlerts = async () => {
        try {
            const { data } = await apiService.get('/comunicaciones/stats');
            const dynamicSequences = [
                { text: ". -. . .-..   . -. . .-..   . -. . .-..", type: 'Morse' }
            ];
            
            if (data.kpis.vencidas > 0) {
                dynamicSequences.push({ text: `>> ALERTA: ${data.kpis.vencidas} COMUNICACIONES VENCIDAS`, type: 'Texto' });
            }
            if (data.kpis.pendientes > 0) {
                dynamicSequences.push({ text: `>> ATENCIÓN: ${data.kpis.pendientes} PENDIENTES DE RESPUESTA`, type: 'Texto' });
            }
            dynamicSequences.push({ text: ">> SISTEMA ACTIVO // ESPERANDO COMUNICACIONES", type: 'Texto' });
            
            setSequences(dynamicSequences);
        } catch (error) { console.error('Error fetching alerts', error); }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // Actualizar cada 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % sequences.length);
        }, 5000); // Ciclo más rápido
        return () => clearInterval(interval);
    }, [sequences]);

    const variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 }
    };

    return (
        <div className="bg-black text-[#4ade80] h-6 overflow-hidden flex items-center justify-center relative border-b-2 border-[#2d4a3e]">
            <motion.div
                key={index}
                className="font-mono text-[10px] uppercase tracking-widest"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.5 }}
            >
                <span>{sequences[index].text}</span>
            </motion.div>
        </div>
    );
};

export default MorseStream;
