import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLOR = {
    blue:      [0,   46,  109],
    blueLight: [235, 242, 255],
    dark:      [17,  24,  39],
    mid:       [75,  85,  99],
    soft:      [156, 163, 175],
    white:     [255, 255, 255],
};

const addPageNumbers = (doc) => {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...COLOR.soft);
        doc.text(
            `Página ${i} de ${total}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
};

const formatFecha = (f) =>
    f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export const generarBorradorPDF = ({ tutela, contenido, radicadoLlm }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W   = doc.internal.pageSize.width;
    doc.setFont('helvetica');

    // ── Franja de encabezado ──────────────────────────────────────────────────
    doc.setFillColor(...COLOR.blue);
    doc.rect(0, 0, W, 42, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text('BORRADOR DE CONTESTACIÓN', W / 2, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento preliminar — Sujeto a revisión jurídica antes de radicar', W / 2, 28, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(...COLOR.soft);
    doc.text(
        `Generado el ${formatFecha(new Date())}`,
        W / 2, 36, { align: 'center' }
    );

    // ── Ficha de identificación ───────────────────────────────────────────────
    autoTable(doc, {
        startY: 52,
        head: [['Campo', 'Valor']],
        body: [
            ['Radicado',          radicadoLlm || tutela.radicado || '—'],
            ['Accionante',        tutela.accionante     || '—'],
            ['Responsable',       tutela.responsables_nombres?.join(', ') || tutela.responsable_nombre || '—'],
            ['Categoría Petición', tutela.derecho_vulnerado || '—'],
            ['Área / Grupo',      tutela.grupo_nombre   || '—'],
            ['Fecha Vencimiento', formatFecha(tutela.fecha_vencimiento)],
        ],
        theme: 'grid',
        headStyles: { fillColor: COLOR.blue, textColor: COLOR.white, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: COLOR.dark },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, fillColor: COLOR.blueLight },
            1: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
    });

    // ── Encabezado de sección borrador ────────────────────────────────────────
    const secY = doc.lastAutoTable.finalY + 12;
    doc.setFillColor(...COLOR.blue);
    doc.rect(14, secY, W - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text('TEXTO DEL BORRADOR', 18, secY + 5.5);

    // ── Contenido del borrador ────────────────────────────────────────────────
    let y      = secY + 18;
    const maxW = W - 28;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR.dark);

    const lineas = (contenido || '').split('\n');

    for (const linea of lineas) {
        if (y > doc.internal.pageSize.height - 20) {
            doc.addPage();
            y = 20;
        }

        const l = linea.trimEnd();

        if (!l) { y += 4; continue; }

        // Encabezados Markdown
        if (/^#{1,3} /.test(l)) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...COLOR.blue);
            const texto = l.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            const lines = doc.splitTextToSize(texto, maxW);
            lines.forEach(line => {
                if (y > doc.internal.pageSize.height - 20) { doc.addPage(); y = 20; }
                doc.text(line, 14, y);
                y += 6;
            });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(...COLOR.dark);
            continue;
        }

        // Texto normal (elimina negritas Markdown inline)
        const textoLimpio = l.replace(/\*\*(.*?)\*\*/g, '$1');
        const lines = doc.splitTextToSize(textoLimpio, maxW);
        lines.forEach(line => {
            if (y > doc.internal.pageSize.height - 20) { doc.addPage(); y = 20; }
            doc.text(line, 14, y);
            y += 5.5;
        });
    }

    // ── Pie de firma ──────────────────────────────────────────────────────────
    const lastPage = doc.internal.getNumberOfPages();
    doc.setPage(lastPage);
    const pageH = doc.internal.pageSize.height;

    if (y < pageH - 50) {
        y += 20;
        doc.setDrawColor(...COLOR.soft);
        doc.line(14, y, 90, y);
        doc.setFontSize(8);
        doc.setTextColor(...COLOR.mid);
        doc.text('Firma del Responsable', 14, y + 5);

        doc.line(W - 90, y, W - 14, y);
        doc.text('Fecha de Radicación', W - 90, y + 5);
    }

    addPageNumbers(doc);

    const radicado = (tutela.radicado || 'borrador').replace(/\s+/g, '_').replace(/\//g, '-');
    const fecha    = new Date().toISOString().split('T')[0];
    doc.save(`Borrador_Contestacion_${radicado}_${fecha}.pdf`);
};
