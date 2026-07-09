import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLOR = {
    blue:      [0,   46,  109],
    blueLight: [235, 242, 255],
    dark:      [17,  24,  39],
    mid:       [75,  85,  99],
    soft:      [156, 163, 175],
    white:     [255, 255, 255],
    red:       [220,  38,  38],
    amber:     [217, 119,   6],
    green:     [ 22, 163,  74],
    purple:    [109,  40, 217],
    purpleBg:  [245, 243, 255],
};

const PW  = 210;
const ML  = 14;
const MR  = 14;
const W   = PW - ML - MR;
const PH  = 297;
const BOT = PH - 16; // margen inferior (deja espacio al pie)

const formatFecha = (f) =>
    f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

// ── Utilidades de cursor ──────────────────────────────────────────────────────

/** Escribe texto con wrapping; devuelve el nuevo y. */
const writeText = (doc, texto, x, y, opts = {}) => {
    const { size = 9, bold = false, italic = false, color = COLOR.dark, maxW = W, leading = 5 } = opts;
    const style = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(texto || ''), maxW);
    lines.forEach(line => {
        if (y > BOT) { doc.addPage(); y = 20; }
        doc.text(line, x, y);
        y += leading;
    });
    return y;
};

/** Encabezado de sección azul; siempre en página fresca. */
const nuevaSeccion = (doc, titulo) => {
    doc.addPage();
    doc.setFillColor(...COLOR.blue);
    doc.rect(ML, 14, W, 9, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text(titulo, ML + 4, 20.5);
    return 30; // y inicial del contenido
};

// ── Pie de página ─────────────────────────────────────────────────────────────
const addPageNumbers = (doc) => {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setDrawColor(...COLOR.soft);
        doc.setLineWidth(0.2);
        doc.line(ML, PH - 12, PW - MR, PH - 12);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR.soft);
        doc.text('Enel Colombia S.A. E.S.P.  ·  Uso interno', ML, PH - 8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.blue);
        doc.text(`${i} / ${total}`, PW - MR, PH - 8, { align: 'right' });
    }
};

// ── 1. PORTADA ────────────────────────────────────────────────────────────────
const dibujarPortada = (doc, tutela) => {
    doc.setFillColor(...COLOR.blue);
    doc.rect(0, 0, PW, 42, 'F');

    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.white);
    doc.text('EXPEDIENTE DE DERECHO DE PETICIÓN', PW / 2, 20, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento generado automáticamente — Uso interno', PW / 2, 29, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(180, 200, 230);
    doc.text(`Generado: ${formatFecha(new Date())}`, PW / 2, 37, { align: 'center' });

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
        margin: { left: ML, right: MR },
    });
};

// ── 2. ANÁLISIS SEMÁNTICO ─────────────────────────────────────────────────────
const dibujarAnalisis = (doc, analisis) => {
    if (!analisis?.tema_central) return;

    let y = nuevaSeccion(doc, 'ANÁLISIS SEMÁNTICO DE LA PETICIÓN (IA)');

    const campo = (label, valor, isArray = false) => {
        if (!valor || (Array.isArray(valor) && !valor.length)) return;
        if (y > BOT - 15) { doc.addPage(); y = 20; }
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.purple);
        doc.text(label.toUpperCase(), ML, y);
        y += 5;
        const texto = isArray ? valor.map((v, i) => `${i + 1}. ${v}`).join('\n') : String(valor);
        y = writeText(doc, texto, ML + 3, y, { size: 9, leading: 5, maxW: W - 3 });
        y += 3;
    };

    campo('Tema central',       analisis.tema_central);
    campo('Peticiones',         analisis.peticiones,         true);
    campo('Derechos invocados', analisis.derechos_invocados, true);
    campo('Extracto clave',     analisis.extracto_clave);

    if (analisis.urgencia_declarada) {
        if (y > BOT - 12) { doc.addPage(); y = 20; }
        const urgColor = analisis.urgencia_declarada === 'alta'  ? COLOR.red   :
                         analisis.urgencia_declarada === 'media' ? COLOR.amber : COLOR.green;
        const urgBg    = analisis.urgencia_declarada === 'alta'  ? [254, 226, 226] :
                         analisis.urgencia_declarada === 'media' ? [254, 243, 199] : [220, 252, 231];
        const label = `Urgencia declarada: ${analisis.urgencia_declarada.toUpperCase()}`;
        const tw = doc.getTextWidth(label) + 10;
        doc.setFillColor(...urgBg);
        doc.setDrawColor(...urgColor);
        doc.setLineWidth(0.3);
        doc.roundedRect(ML, y, tw, 6.5, 1.5, 1.5, 'FD');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...urgColor);
        doc.text(label, ML + 5, y + 4.5);
    }
};

// ── 3. CONTESTACIÓN IA ────────────────────────────────────────────────────────
const dibujarContestacion = (doc, respuesta) => {
    if (!respuesta?.items?.length) return;

    let y = nuevaSeccion(doc, 'CONTESTACIÓN GENERADA POR IA');
    const maxW = W;

    // Encabezado de la comunicación
    const enc = respuesta.encabezado || {};
    const metaEnc = [
        enc.radicado_peticion && ['Radicado petición', enc.radicado_peticion],
        enc.para              && ['Para',               enc.para],
        enc.ciudad_fecha      && ['Fecha',              enc.ciudad_fecha],
        enc.asunto            && ['Asunto',             enc.asunto],
    ].filter(Boolean);

    if (metaEnc.length) {
        autoTable(doc, {
            startY: y,
            body: metaEnc,
            theme: 'grid',
            bodyStyles: { fontSize: 8.5, textColor: COLOR.dark },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 45, fillColor: COLOR.blueLight },
                1: { cellWidth: 'auto' },
            },
            margin: { left: ML, right: MR },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    if (respuesta.introduccion) {
        if (y > BOT - 20) { doc.addPage(); y = 20; }
        y = writeText(doc, respuesta.introduccion, ML, y, { italic: true, color: COLOR.mid, leading: 5 });
        y += 6;
    }

    respuesta.items.forEach((item, idx) => {
        // Reservar espacio mínimo para la tarjeta; si no cabe, nueva página
        if (y > BOT - 35) { doc.addPage(); y = 20; }

        // Caja de solicitud
        const solLines = doc.splitTextToSize(`${item.numero}. ${item.solicitud || ''}`, maxW - 8);
        const cajaH = solLines.length * 5 + 4;
        doc.setFillColor(...COLOR.blueLight);
        doc.setDrawColor(...COLOR.blue);
        doc.setLineWidth(0.3);
        doc.roundedRect(ML, y, maxW, cajaH, 1.5, 1.5, 'FD');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.blue);
        solLines.forEach((line, li) => {
            doc.text(line, ML + 4, y + 5 + li * 5);
        });
        y += cajaH + 4;

        // Respuesta
        y = writeText(doc, item.respuesta || '', ML, y, { size: 9, leading: 5 });

        // Normas
        if (item.normas_citadas?.length) {
            if (y > BOT - 8) { doc.addPage(); y = 20; }
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLOR.soft);
            doc.text(`Normas: ${item.normas_citadas.join(' · ')}`, ML, y);
            y += 5;
        }

        // Separador entre items
        if (idx < respuesta.items.length - 1) {
            if (y > BOT - 8) { doc.addPage(); y = 20; }
            doc.setDrawColor(220, 230, 240);
            doc.setLineWidth(0.2);
            doc.line(ML, y + 2, PW - MR, y + 2);
            y += 8;
        } else {
            y += 4;
        }
    });

    // Prescripción
    const presc = respuesta.prescripcion;
    if (presc?.aplica && presc?.fundamento) {
        if (y > BOT - 25) { doc.addPage(); y = 20; }
        y += 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.amber);
        doc.text('⚖  Prescripción extintiva aplicable', ML, y);
        y += 6;
        y = writeText(doc, presc.fundamento, ML, y, { size: 9, leading: 5 });
        if (presc.norma) {
            y = writeText(doc, `Base: ${presc.norma}`, ML, y, { size: 7.5, color: COLOR.soft });
        }
        y += 4;
    }

    // Cierre
    if (respuesta.cierre) {
        if (y > BOT - 20) { doc.addPage(); y = 20; }
        y += 4;
        y = writeText(doc, respuesta.cierre, ML, y, { size: 9, italic: true, color: COLOR.mid, leading: 5 });
    }
};

// ── 4. TEXTO ORIGINAL ─────────────────────────────────────────────────────────
const dibujarTextoOriginal = (doc, contenido) => {
    if (!contenido?.trim()) return;

    let y = nuevaSeccion(doc, 'TEXTO ORIGINAL DE LA PETICIÓN');

    const lines = doc.splitTextToSize(contenido, W);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.dark);
    lines.forEach(line => {
        if (y > BOT) { doc.addPage(); y = 20; }
        doc.text(line, ML, y);
        y += 5;
    });
};

// ── 5. HISTORIAL ──────────────────────────────────────────────────────────────
const dibujarHistorial = (doc, historial) => {
    if (!historial?.length) return;

    const y = nuevaSeccion(doc, 'HISTORIAL DE ACCIONES');

    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Tipo', 'Descripción', 'Usuario']],
        body: historial.map(h => [
            formatFecha(h.created_at),
            h.tipo_accion    || '—',
            h.descripcion    || '—',
            h.usuario_nombre || '—',
        ]),
        theme: 'striped',
        headStyles: { fillColor: COLOR.blue, textColor: COLOR.white, fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: COLOR.dark },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 35 },
        },
        margin: { left: ML, right: MR },
    });
};

// ── 6. REQUERIMIENTOS ────────────────────────────────────────────────────────
const dibujarRequerimientos = (doc, requerimientos) => {
    if (!requerimientos?.length) return;

    const y = nuevaSeccion(doc, 'REQUERIMIENTOS INTERNOS');

    autoTable(doc, {
        startY: y,
        head: [['Área', 'Prioridad', 'Estado', 'Límite', 'Solicitud', 'Respuesta']],
        body: requerimientos.map(r => [
            r.area_nombre || r.grupo_nombre || '—',
            r.prioridad   || '—',
            r.estado      || '—',
            r.fecha_limite ? formatFecha(r.fecha_limite) : '—',
            r.descripcion || '—',
            r.respuesta_texto || 'Sin respuesta',
        ]),
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
        margin: { left: ML, right: MR },
    });
};

// ── 7. ARGUMENTOS LEGALES ────────────────────────────────────────────────────
const dibujarArgumentos = (doc, argumentos) => {
    if (!argumentos?.length) return;

    let y = nuevaSeccion(doc, 'ARGUMENTOS LEGALES');

    argumentos.forEach((arg, i) => {
        if (y > BOT - 30) { doc.addPage(); y = 20; }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.blue);
        const titulo = `${i + 1}. ${arg.titulo || 'Argumento sin título'}`;
        y = writeText(doc, titulo, ML, y, { size: 9, bold: true, color: COLOR.blue });
        y += 1;

        y = writeText(doc, arg.contenido || '—', ML, y, { size: 8.5, leading: 5 });

        if (arg.promovido_a_memoria) {
            if (y > BOT - 8) { doc.addPage(); y = 20; }
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLOR.green);
            doc.text('✓ Promovido a Memoria Legal', ML, y);
            y += 5;
        }

        y += 5;
    });
};

// ── Entry point ───────────────────────────────────────────────────────────────
export const generarExpedientePDF = ({ tutela, historial = [], requerimientos = [], argumentos = [], respuestaAcumulada = null }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica');

    dibujarPortada(doc, tutela);

    if (tutela.analisis_comprension)       dibujarAnalisis(doc, tutela.analisis_comprension);
    if (respuestaAcumulada?.items?.length) dibujarContestacion(doc, respuestaAcumulada);
    if (tutela.contenido_original)         dibujarTextoOriginal(doc, tutela.contenido_original);

    dibujarHistorial(doc, historial);
    dibujarRequerimientos(doc, requerimientos);
    dibujarArgumentos(doc, argumentos);

    addPageNumbers(doc);

    const radicado = (tutela.radicado || 'expediente').replace(/\s+/g, '_').replace(/\//g, '-');
    const fecha    = new Date().toISOString().split('T')[0];
    doc.save(`Expediente_${radicado}_${fecha}.pdf`);
};
