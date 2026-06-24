import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLOR = {
    blue:      [0,   46,  109],  // #002E6D
    blueLight: [235, 242, 255],
    dark:      [17,  24,  39],
    mid:       [75,  85,  99],
    soft:      [156, 163, 175],
    border:    [229, 231, 235],
    white:     [255, 255, 255],
    red:       [220, 38,  38],
    amber:     [217, 119, 6],
    green:     [22,  163, 74],
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

const prioridadColor = (p) => {
    if (p === 'Alta')  return COLOR.red;
    if (p === 'Media') return COLOR.amber;
    return COLOR.blue;
};

// ── Portada ───────────────────────────────────────────────────────────────────
const dibujarPortada = (doc, tutela) => {
    const W = doc.internal.pageSize.width;

    // Franja superior
    doc.setFillColor(...COLOR.blue);
    doc.rect(0, 0, W, 42, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text('EXPEDIENTE DE ACCIÓN DE TUTELA', W / 2, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento generado automáticamente — Uso interno', W / 2, 30, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(...COLOR.soft);
    doc.text(
        `Generado el ${formatFecha(new Date())}`,
        W / 2, 38, { align: 'center' }
    );

    // Ficha de datos
    const meta = [
        ['Radicado',          tutela.radicado            || '—'],
        ['Accionante',        tutela.accionante           || '—'],
        ['Responsable',       tutela.responsables_nombres?.join(', ') || tutela.responsable_nombre || '—'],
        ['Derecho Vulnerado', tutela.derecho_vulnerado    || '—'],
        ['Área / Grupo',      tutela.grupo_nombre         || '—'],
        ['Prioridad',         tutela.prioridad            || '—'],
        ['Estado',            tutela.estado               || '—'],
        ['Fecha Vencimiento', formatFecha(tutela.fecha_vencimiento)],
        ['Días de Término',   tutela.dias_termino ? `${tutela.dias_termino} días` : '—'],
        ['Fecha de Ingreso',  formatFecha(tutela.created_at)],
    ];

    autoTable(doc, {
        startY: 55,
        head: [['Campo', 'Valor']],
        body: meta,
        theme: 'grid',
        headStyles: { fillColor: COLOR.blue, textColor: COLOR.white, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: COLOR.dark },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, fillColor: COLOR.blueLight },
            1: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
    });
};

// ── Sección genérica con encabezado ──────────────────────────────────────────
const seccion = (doc, titulo, y) => {
    const W = doc.internal.pageSize.width;
    if (y > doc.internal.pageSize.height - 40) {
        doc.addPage();
        y = 20;
    }
    doc.setFillColor(...COLOR.blue);
    doc.rect(14, y, W - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text(titulo, 18, y + 5.5);
    return y + 14;
};

// ── Historial de acciones ─────────────────────────────────────────────────────
const dibujarHistorial = (doc, historial) => {
    if (!historial?.length) return;

    const startY = (doc.lastAutoTable?.finalY || 55) + 14;
    const y = seccion(doc, 'HISTORIAL DE ACCIONES', startY);

    const rows = historial.map(h => [
        formatFecha(h.created_at),
        h.tipo_accion || '—',
        h.descripcion || '—',
        h.usuario_nombre || '—',
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Tipo', 'Descripción', 'Usuario']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: COLOR.blue, textColor: COLOR.white, fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: COLOR.dark },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 35 },
        },
        margin: { left: 14, right: 14 },
    });
};

// ── Requerimientos internos ───────────────────────────────────────────────────
const dibujarRequerimientos = (doc, requerimientos) => {
    if (!requerimientos?.length) return;

    const startY = (doc.lastAutoTable?.finalY || 55) + 14;
    const y = seccion(doc, 'REQUERIMIENTOS INTERNOS', startY);

    const rows = requerimientos.map(r => [
        r.area_nombre || r.grupo_nombre || '—',
        r.prioridad   || '—',
        r.estado      || '—',
        r.fecha_limite ? formatFecha(r.fecha_limite) : '—',
        r.descripcion || '—',
        r.respuesta_texto || 'Sin respuesta',
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Área', 'Prioridad', 'Estado', 'Límite', 'Solicitud', 'Respuesta']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: COLOR.blue, textColor: COLOR.white, fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: COLOR.dark },
        columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 18 },
            2: { cellWidth: 22 },
            3: { cellWidth: 22 },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
    });
};

// ── Argumentos legales ────────────────────────────────────────────────────────
const dibujarArgumentos = (doc, argumentos) => {
    if (!argumentos?.length) return;

    const startY = (doc.lastAutoTable?.finalY || 55) + 14;
    let y = seccion(doc, 'ARGUMENTOS LEGALES', startY);

    const W  = doc.internal.pageSize.width;
    const maxW = W - 28;

    argumentos.forEach((arg, i) => {
        if (y > doc.internal.pageSize.height - 40) { doc.addPage(); y = 20; }

        // Número y título del argumento
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.blue);
        const titulo = `${i + 1}. ${arg.titulo || 'Argumento sin título'}`;
        const tLines = doc.splitTextToSize(titulo, maxW);
        doc.text(tLines, 14, y);
        y += tLines.length * 5 + 2;

        // Contenido
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR.dark);
        doc.setFontSize(8.5);
        const cLines = doc.splitTextToSize(arg.contenido || '—', maxW);
        cLines.forEach(line => {
            if (y > doc.internal.pageSize.height - 20) { doc.addPage(); y = 20; }
            doc.text(line, 14, y);
            y += 5;
        });

        // Badge "En Memoria" si fue promovido
        if (arg.promovido_a_memoria) {
            doc.setFontSize(7);
            doc.setTextColor(...COLOR.green);
            doc.text('✓ Promovido a Memoria Legal', 14, y);
            y += 5;
        }

        y += 4;
    });
};

// ── Entry point ───────────────────────────────────────────────────────────────
export const generarExpedientePDF = ({ tutela, historial = [], requerimientos = [], argumentos = [] }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica');

    dibujarPortada(doc, tutela);
    dibujarHistorial(doc, historial);
    dibujarRequerimientos(doc, requerimientos);
    dibujarArgumentos(doc, argumentos);
    addPageNumbers(doc);

    const radicado = (tutela.radicado || 'expediente').replace(/\s+/g, '_').replace(/\//g, '-');
    const fecha    = new Date().toISOString().split('T')[0];
    doc.save(`Peticion_${radicado}_${fecha}.pdf`);
};
