import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function Informes() {
  const [loading, setLoading] = useState(false);

  const exportar = async (formato) => {
    setLoading(true);
    try {
      const data = await tutelaService.listar();

      if (formato === 'csv') {
        const headers = ['Radicado', 'Accionante', 'Estado', 'Prioridad', 'Vencimiento'];
        const rows = data.map(t => [t.radicado, t.accionante, t.estado, t.prioridad, t.fecha_vencimiento]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        descargar(blob, 'reporte_tutelas.csv');
      } else {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Reporte de Tutelas - Enel", 14, 20);
        autoTable(doc, {
          startY: 30, // Margen superior para evitar sobreposición
          head: [['Radicado', 'Accionante', 'Estado', 'Prioridad', 'Vencimiento']],
          body: data.map(t => [t.radicado, t.accionante, t.estado, t.prioridad, new Date(t.fecha_vencimiento).toLocaleDateString()]),
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [0, 46, 109] } // Color corporativo
        });
        doc.save('reporte_tutelas.pdf');
      }
      toast.success('Informe generado con éxito');
    } catch (error) {
      console.error("Error al generar informe:", error);
      toast.error('Error al generar informe');
    } finally {
      setLoading(false);
    }
  };

  const descargar = (blob, nombre) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.click();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#002E6D] mb-6">Generador de Informes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => exportar('csv')} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-4 hover:border-blue-500 transition-colors">
          <FileSpreadsheet size={40} className="text-green-600" />
          <span className="font-bold text-gray-700">Exportar CSV</span>
        </button>
        <button onClick={() => exportar('pdf')} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-4 hover:border-red-500 transition-colors">
          <FileText size={40} className="text-red-600" />
          <span className="font-bold text-gray-700">Exportar PDF</span>
        </button>
      </div>
    </div>
  );
}
