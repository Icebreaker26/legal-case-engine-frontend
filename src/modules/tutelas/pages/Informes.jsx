import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, BarChart2, ChevronRight } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const INFORMES = [
  {
    id: 'pdf',
    titulo: 'Reporte general PDF',
    descripcion: 'Tabla completa de peticiones activas con estado, prioridad y fechas de vencimiento.',
    icono: FileText,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    formato: 'PDF',
  },
  {
    id: 'csv',
    titulo: 'Exportar a CSV',
    descripcion: 'Datos en formato plano para análisis en Excel u otras herramientas.',
    icono: FileSpreadsheet,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    formato: 'CSV',
  },
];

export default function Informes() {
  const [loading, setLoading] = useState(null);

  const descargar = (blob, nombre) => {
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = nombre;
    link.click();
  };

  const exportar = async (formato) => {
    setLoading(formato);
    try {
      const data = await tutelaService.listar();

      const fmt = (f) => f ? new Date(f).toLocaleDateString('es-CO') : '—';
      const resp = (t) => t.responsables_nombres?.filter(Boolean).join(', ') || '—';
      const hoy = new Date();
      const diasRestantes = (t) => {
        const d = Math.ceil((new Date(t.fecha_vencimiento) - hoy) / 86400000);
        return isNaN(d) ? '—' : d <= 0 ? 'Vencida' : `${d}d`;
      };

      if (formato === 'csv') {
        const headers = [
          'Radicado', 'Accionante', 'Juzgado', 'Derecho Vulnerado',
          'Estado', 'Prioridad', 'Días Restantes',
          'Fecha Recepción', 'Fecha Vencimiento',
          'Responsable', 'Área / Grupo',
          'Resultado Fallo', 'Observaciones'
        ];
        const escapeCsv = (v) => {
          const s = String(v ?? '').replace(/"/g, '""');
          return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
        };
        const rows = data.map(t => [
          t.radicado, t.accionante, t.juzgado || '', t.derecho_vulnerado || '',
          t.estado, t.prioridad, diasRestantes(t),
          fmt(t.fecha_recepcion), fmt(t.fecha_vencimiento),
          resp(t), t.grupo_nombre || '',
          t.resultado_fallo || '', t.observaciones || ''
        ].map(escapeCsv));
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        descargar(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), 'reporte_tutelas.csv');
      } else {
        const doc = new jsPDF({ orientation: 'landscape' });
        const W = doc.internal.pageSize.width;

        // Franja azul
        doc.setFillColor(0, 46, 109);
        doc.rect(0, 0, W, 28, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Reporte de Derechos de Petición', 14, 13);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generado el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} · Total: ${data.length} peticiones`, 14, 21);

        // KPIs rápidos
        const pendientes  = data.filter(t => t.estado === 'Pendiente').length;
        const enProceso   = data.filter(t => t.estado === 'En Proceso').length;
        const respondidas = data.filter(t => t.estado === 'Respondida').length;
        const urgentes    = data.filter(t => t.prioridad === 'Alta' && t.estado !== 'Respondida').length;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        const kpis = [`Pendientes: ${pendientes}`, `En Proceso: ${enProceso}`, `Respondidas: ${respondidas}`, `Urgentes: ${urgentes}`];
        kpis.forEach((k, i) => doc.text(k, W - 120 + i * 30, 21));

        autoTable(doc, {
          startY: 34,
          head: [[
            'Radicado', 'Accionante', 'Juzgado', 'Derecho Vulnerado',
            'Estado', 'Prioridad', 'Días rest.',
            'F. Recepción', 'F. Vencimiento',
            'Responsable', 'Área',
            'Fallo'
          ]],
          body: data.map(t => [
            t.radicado,
            t.accionante,
            t.juzgado || '—',
            t.derecho_vulnerado || '—',
            t.estado,
            t.prioridad,
            diasRestantes(t),
            fmt(t.fecha_recepcion),
            fmt(t.fecha_vencimiento),
            resp(t),
            t.grupo_nombre || '—',
            t.resultado_fallo || '—',
          ]),
          theme: 'grid',
          styles: { fontSize: 7.5, textColor: [30, 30, 30], cellPadding: 2.5 },
          headStyles: { fillColor: [0, 46, 109], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 28 },
            2: { cellWidth: 22 },
            3: { cellWidth: 28 },
            4: { cellWidth: 20 },
            5: { cellWidth: 16 },
            6: { cellWidth: 14 },
            7: { cellWidth: 20 },
            8: { cellWidth: 20 },
            9: { cellWidth: 28 },
            10: { cellWidth: 22 },
            11: { cellWidth: 18 },
          },
          didDrawCell: (hookData) => {
            // Colorear estado y prioridad
            if (hookData.section === 'body') {
              const col = hookData.column.index;
              const val = hookData.cell.raw;
              if (col === 4) {
                const c = val === 'Respondida' ? [220,252,231] : val === 'En Proceso' ? [219,234,254] : [254,249,195];
                doc.setFillColor(...c);
                doc.rect(hookData.cell.x, hookData.cell.y, hookData.cell.width, hookData.cell.height, 'F');
                doc.setTextColor(30, 30, 30);
                doc.setFontSize(7.5);
                doc.text(val, hookData.cell.x + 1.5, hookData.cell.y + hookData.cell.height / 2 + 2.5);
              }
              if (col === 5) {
                const c = val === 'Alta' ? [254,226,226] : val === 'Media' ? [254,243,199] : [219,234,254];
                doc.setFillColor(...c);
                doc.rect(hookData.cell.x, hookData.cell.y, hookData.cell.width, hookData.cell.height, 'F');
                doc.setTextColor(30, 30, 30);
                doc.setFontSize(7.5);
                doc.text(val, hookData.cell.x + 1.5, hookData.cell.y + hookData.cell.height / 2 + 2.5);
              }
            }
          },
          margin: { left: 8, right: 8 },
        });

        // Pie de página
        const total = doc.internal.getNumberOfPages();
        for (let i = 1; i <= total; i++) {
          doc.setPage(i);
          doc.setFontSize(7);
          doc.setTextColor(160, 160, 160);
          doc.text(`Página ${i} de ${total}`, W / 2, doc.internal.pageSize.height - 6, { align: 'center' });
        }

        doc.save(`reporte_tutelas_${new Date().toISOString().split('T')[0]}.pdf`);
      }
      toast.success('Informe generado correctamente');
    } catch {
      toast.error('Error al generar el informe');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        <div className="w-11 h-11 bg-[#002E6D] rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <BarChart2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Generador de informes</h1>
          <p className="text-sm text-gray-500 mt-1">Exporta el registro de tutelas activas en el formato que necesites.</p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {INFORMES.map(inf => {
          const Icon = inf.icono;
          const isLoading = loading === inf.id;
          return (
            <button
              key={inf.id}
              onClick={() => exportar(inf.id)}
              disabled={!!loading}
              className="w-full text-left bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-5 flex items-center gap-5 hover:border-gray-200 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <div className={`w-12 h-12 ${inf.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={22} className={inf.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#002E6D] transition-colors">{inf.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{inf.descripcion}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#002E6D] rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-xs font-semibold text-gray-400 border border-gray-200 px-2 py-0.5 rounded-md">{inf.formato}</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#002E6D] transition-colors" />
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Nota */}
      <div className="mt-8 flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed">
        <Download size={13} className="shrink-0 mt-0.5" />
        <p>Los informes incluyen todas las peticiones activas del sistema al momento de la exportación.</p>
      </div>

    </div>
  );
}
