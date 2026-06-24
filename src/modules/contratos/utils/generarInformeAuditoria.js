import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Paleta ──────────────────────────────────────────────────────────────────
const COLOR = {
    pink:       [219, 39, 119],   // pink-600
    pinkLight:  [253, 242, 248],  // pink-50
    dark:       [17,  24,  39],   // gray-900
    mid:        [75,  85,  99],   // gray-600
    soft:       [156, 163, 175],  // gray-400
    border:     [229, 231, 235],  // gray-200
    white:      [255, 255, 255],
    greenBg:    [240, 253, 244],
    orangeBg:   [255, 247, 237],
    redBg:      [254, 242, 242],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const hex = (rgb) => `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;

const addPageNumber = (doc) => {
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

const wrapText = (doc, text, x, y, maxWidth, lineHeight = 5) => {
    const lines = doc.splitTextToSize(text || '—', maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
};

// ── Portada ──────────────────────────────────────────────────────────────────
const dibujarPortada = (doc, auditoria) => {
    const W = doc.internal.pageSize.width;

    // Franja superior
    doc.setFillColor(...COLOR.pink);
    doc.rect(0, 0, W, 42, 'F');

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text('INFORME DE AUDITORÍA CONTRACTUAL', W / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Análisis de Riesgo sobre Contrato de Tercero', W / 2, 30, { align: 'center' });

    // Fecha generación
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.soft);
    doc.text(
        `Generado el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        W / 2, 38, { align: 'center' }
    );

    // Ficha de metadatos
    const metaY = 55;
    const metaItems = [
        ['Tercero / Contratante',  auditoria.tercero_nombre   || '—'],
        ['Minuta Estándar',        auditoria.minuta_titulo    || '—'],
        ['Estado de Seguimiento',  auditoria.estado_seguimiento || 'Pendiente'],
        ['Fecha de Seguimiento',   auditoria.fecha_seguimiento
            ? new Date(auditoria.fecha_seguimiento).toLocaleDateString('es-CO')
            : '—'],
        ['Creado por',             auditoria.creado_por_nombre || '—'],
        ['Fecha de Registro',      auditoria.created_at
            ? new Date(auditoria.created_at).toLocaleDateString('es-CO')
            : '—'],
    ];

    autoTable(doc, {
        startY: metaY,
        head: [['Campo', 'Valor']],
        body: metaItems,
        theme: 'grid',
        headStyles: {
            fillColor: COLOR.pink,
            textColor: COLOR.white,
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: { fontSize: 9, textColor: COLOR.dark },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, fillColor: COLOR.pinkLight },
            1: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
    });
};

// ── Sección de análisis JSON ──────────────────────────────────────────────────
const dibujarResultadoJson = (doc, json) => {
    const W = doc.internal.pageSize.width;
    const startY = (doc.lastAutoTable?.finalY || 55) + 14;

    // Encabezado nivel de riesgo
    doc.setFillColor(...COLOR.pink);
    doc.rect(14, startY, W - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text('ANÁLISIS DEL SISTEMA DE IA', 18, startY + 5.5);

    const riesgoColor = {
        'Alto':  [220, 38,  38],
        'Medio': [217, 119, 6],
        'Bajo':  [22,  163, 74],
    };
    const rColor = riesgoColor[json.nivel_riesgo] || COLOR.mid;

    let y = startY + 18;

    // Badge nivel de riesgo
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.dark);
    doc.text('Nivel de riesgo general:', 14, y);
    doc.setTextColor(...rColor);
    doc.text(json.nivel_riesgo || '—', 60, y);
    y += 6;

    // Justificación
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.mid);
    const justLines = doc.splitTextToSize(json.justificacion_riesgo || '', W - 28);
    doc.text(justLines, 14, y);
    y += justLines.length * 5 + 10;

    // Tabla de cambios
    if (json.cambios?.length) {
        const recomColor = { 'Aceptar': [22, 163, 74], 'Rechazar': [220, 38, 38], 'Negociar': [217, 119, 6] };

        autoTable(doc, {
            startY: y,
            head: [['#', 'Cláusula / Sección', 'Tipo', 'Impacto y Riesgo Legal', 'Recomendación']],
            body: json.cambios.map(c => [
                c.numero,
                c.clausula || '—',
                c.tipo || '—',
                c.impacto || '—',
                c.recomendacion || '—',
            ]),
            theme: 'striped',
            headStyles: { fillColor: COLOR.pink, textColor: COLOR.white, fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 7.5, textColor: COLOR.dark },
            columnStyles: {
                0: { cellWidth: 8,  halign: 'center' },
                1: { cellWidth: 38 },
                2: { cellWidth: 22 },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 22 },
            },
            didParseCell(data) {
                if (data.column.index === 4 && data.section === 'body') {
                    const val = data.cell.raw;
                    data.cell.styles.textColor = recomColor[val] || COLOR.dark;
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            margin: { left: 14, right: 14 },
        });
    }
};

// ── Sección de Resultado LLM (texto libre legacy) ────────────────────────────
const dibujarResultadoTexto = (doc, resultado) => {
    if (!resultado?.trim()) return;

    const W  = doc.internal.pageSize.width;
    const startY = (doc.lastAutoTable?.finalY || 55) + 14;

    doc.setFillColor(...COLOR.pink);
    doc.rect(14, startY, W - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text('ANÁLISIS DEL SISTEMA DE IA', 18, startY + 5.5);

    let y = startY + 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.dark);
    const maxW = W - 28;

    for (const linea of resultado.split('\n')) {
        if (y > doc.internal.pageSize.height - 20) { doc.addPage(); y = 20; }
        const l = linea.trimEnd();
        if (!l) { y += 3; continue; }
        if (/^\|[-| :]+\|$/.test(l)) continue;
        if (l.startsWith('|') && l.endsWith('|')) {
            autoTable(doc, {
                startY: y,
                body: [l.split('|').slice(1, -1).map(c => c.trim())],
                theme: 'grid',
                bodyStyles: { fontSize: 7.5, textColor: COLOR.dark, cellPadding: 2 },
                margin: { left: 14, right: 14 },
            });
            y = doc.lastAutoTable.finalY + 2;
            continue;
        }
        if (/^#{1,3} /.test(l)) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...COLOR.pink);
            const lines = doc.splitTextToSize(l.replace(/^#+\s*/, '').replace(/\*\*/g, ''), maxW);
            doc.text(lines, 14, y);
            y += lines.length * 5 + 2;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...COLOR.dark);
            continue;
        }
        const lines = doc.splitTextToSize(l.replace(/\*\*(.*?)\*\*/g, '$1'), maxW);
        doc.text(lines, 14, y);
        y += lines.length * 5;
    }
};

// ── Entry point ───────────────────────────────────────────────────────────────
export const generarInformeAuditoria = (auditoria) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Fuente base
    doc.setFont('helvetica');

    // 1. Portada + metadatos
    dibujarPortada(doc, auditoria);

    // 2. Resultado del análisis IA (JSON preferido, texto como fallback)
    if (auditoria.resultado_llm_json) {
        dibujarResultadoJson(doc, auditoria.resultado_llm_json);
    } else if (auditoria.resultado_llm_texto) {
        dibujarResultadoTexto(doc, auditoria.resultado_llm_texto);
    } else {
        const W = doc.internal.pageSize.width;
        const y = (doc.lastAutoTable?.finalY || 55) + 20;
        doc.setFontSize(9);
        doc.setTextColor(...COLOR.soft);
        doc.text('El análisis de IA aún no ha sido registrado para esta auditoría.', W / 2, y, { align: 'center' });
    }

    // 3. Numeración de páginas
    addPageNumber(doc);

    // 4. Descarga
    const tercero = (auditoria.tercero_nombre || 'tercero').replace(/\s+/g, '_');
    const fecha   = new Date().toISOString().split('T')[0];
    doc.save(`Informe_Auditoria_${tercero}_${fecha}.pdf`);
};
