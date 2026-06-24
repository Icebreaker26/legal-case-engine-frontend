import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Paleta por módulo ─────────────────────────────────────────────────────────
const MODULO_META = {
  pagos:          { label: 'Pagos (PDP)',         r: 14,  g: 165, b: 233 },
  comunicaciones: { label: 'Comunicaciones',      r: 99,  g: 102, b: 241 },
  conformidades:  { label: 'Conformidades',       r: 234, g: 179, b: 8   },
  tutelas:        { label: 'Derechos de Petición',r: 59,  g: 130, b: 246 },
  ambiental:      { label: 'Derecho Ambiental',   r: 34,  g: 197, b: 94  },
  contratos:      { label: 'Contratos',           r: 236, g: 72,  b: 153 },
};

const DARK   = [2,   6,  23];
const WHITE  = [255, 255, 255];
const GRAY50 = [249, 250, 251];
const GRAY200= [229, 231, 235];
const GRAY400= [156, 163, 175];
const GRAY700= [55,  65,  81 ];

const fmt      = v => (v == null || v === '') ? '—' : String(v);
const fmtFecha = v => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtMonto = v => {
  if (v == null) return '—';
  return Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

// ── Helpers de dibujo ─────────────────────────────────────────────────────────
const setFill   = (doc, [r,g,b]) => doc.setFillColor(r,g,b);
const setStroke = (doc, [r,g,b]) => doc.setDrawColor(r,g,b);
const setColor  = (doc, [r,g,b]) => doc.setTextColor(r,g,b);

const W  = 297; // A4 landscape width
const H  = 210; // A4 landscape height
const ML = 18;  // margin left
const MR = 18;  // margin right
const CW = W - ML - MR; // content width

function pageNum(doc) {
  return doc.internal.getCurrentPageInfo().pageNumber;
}

function addPageNumber(doc, total) {
  const n = pageNum(doc);
  setColor(doc, GRAY400);
  doc.setFontSize(8);
  doc.text(`${n} / ${total}`, W - MR, H - 8, { align: 'right' });
}

function headerBand(doc, title, [r,g,b], y = 0) {
  setFill(doc, [r,g,b]);
  doc.rect(0, y, W, 10, 'F');
  setColor(doc, WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), ML, y + 6.5);
}

// ── Portada ───────────────────────────────────────────────────────────────────
function dibujarPortada(doc, resultado, filtros, catalogos) {
  // Fondo oscuro superior
  setFill(doc, DARK);
  doc.rect(0, 0, W, 60, 'F');

  // Título
  setColor(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('REPORTE CROSS-MÓDULO', ML, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setColor(doc, [100, 116, 139]);
  doc.text('Sistema de Gestión Legal — Enel Colombia', ML, 36);

  // Fecha
  doc.setFontSize(9);
  const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Generado el ${fechaHoy}`, W - MR, 36, { align: 'right' });

  // ── Resumen de filtros aplicados ──────────────────────────────────────────
  const resolveCat = (arr, id) => arr?.find(x => String(x.value) === String(id))?.label || String(id);

  const filasData = [];
  if (filtros.modulos?.length) {
    filasData.push(['Módulos consultados', filtros.modulos.map(m => MODULO_META[m]?.label || m).join(', ')]);
  }
  if (filtros.entidad_id)       filasData.push(['Entidad',      resolveCat(catalogos.entidades,  filtros.entidad_id)]);
  if (filtros.proyecto_id)      filasData.push(['Proyecto',     resolveCat(catalogos.proyectos,  filtros.proyecto_id)]);
  if (filtros.contrato_id)      filasData.push(['Contrato',     resolveCat(catalogos.contratos,  filtros.contrato_id)]);
  if (filtros.grupo_id)         filasData.push(['Grupo / Área', resolveCat(catalogos.grupos,     filtros.grupo_id)]);
  if (filtros.acreedor_id)      filasData.push(['Acreedor',     resolveCat(catalogos.acreedores, filtros.acreedor_id)]);
  if (filtros.responsable_uuid) filasData.push(['Responsable',  resolveCat(catalogos.usuarios,   filtros.responsable_uuid)]);
  if (filtros.fecha_desde)      filasData.push(['Desde',        fmtFecha(filtros.fecha_desde)]);
  if (filtros.fecha_hasta)      filasData.push(['Hasta',        fmtFecha(filtros.fecha_hasta)]);
  if (filtros.estado)           filasData.push(['Estado',       filtros.estado]);
  if (!filasData.length)        filasData.push(['Alcance', 'Todos los registros sin filtros adicionales']);

  // Dividir en dos columnas de pares [label, value]
  const mid = Math.ceil(filasData.length / 2);
  const col1 = filasData.slice(0, mid);
  const col2 = filasData.slice(mid);
  const tableRows = col1.map((row, i) => [
    row[0], row[1],
    col2[i]?.[0] ?? '', col2[i]?.[1] ?? '',
  ]);

  let filtersEndY = 68;
  autoTable(doc, {
    startY: 68,
    head: [['Filtro', 'Valor', 'Filtro', 'Valor']],
    body: tableRows,
    styles: { fontSize: 7.5, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 }, overflow: 'linebreak' },
    headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold', textColor: GRAY400 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, fontStyle: 'bold', textColor: GRAY400 },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: GRAY50 },
    margin: { left: ML, right: MR },
    tableWidth: CW,
    didParseCell: (data) => {
      // Celdas vacías de la segunda columna sin fondo especial
      if (data.row.index >= col2.length && data.column.index >= 2) {
        data.cell.styles.fillColor = WHITE;
      }
    },
    didDrawTable: (data) => { filtersEndY = data.cursor.y; },
  });

  // Si no caben las tarjetas en la misma página, nueva página
  let cy = filtersEndY + 8;
  const CARD_BLOCK_H = 58; // título + separador + tarjetas + banda total
  if (cy + CARD_BLOCK_H > H - 14) {
    doc.addPage();
    cy = 16;
  }

  // ── Tarjetas de totales por módulo ────────────────────────────────────────
  const modulos = Object.entries(resultado.totales).filter(([, n]) => n > 0);
  if (!modulos.length) return cy;

  setStroke(doc, GRAY200);
  doc.line(ML, cy, W - MR, cy);
  cy += 7;

  const cardW  = Math.min(44, CW / modulos.length - 3);
  const cardGap = (CW - cardW * modulos.length) / (modulos.length - 1 || 1);
  const totalAll = resultado.timeline.length;

  modulos.forEach(([modulo, count], i) => {
    const meta = MODULO_META[modulo] || { label: modulo, r: 100, g: 100, b: 100 };
    const x = ML + i * (cardW + cardGap);

    // Borde superior coloreado
    setFill(doc, [meta.r, meta.g, meta.b]);
    doc.rect(x, cy, cardW, 3, 'F');

    // Fondo tarjeta
    setFill(doc, GRAY50);
    doc.rect(x, cy + 3, cardW, 30, 'F');
    setStroke(doc, GRAY200);
    doc.setLineWidth(0.2);
    doc.rect(x, cy, cardW, 33, 'S');

    // Número grande
    setColor(doc, [meta.r, meta.g, meta.b]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(String(count), x + cardW / 2, cy + 19, { align: 'center' });

    // Label
    setColor(doc, GRAY400);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const labelLines = doc.splitTextToSize(meta.label, cardW - 4);
    doc.text(labelLines[0], x + cardW / 2, cy + 26, { align: 'center' });

    // % del total
    const pct = totalAll ? Math.round((count / totalAll) * 100) : 0;
    doc.setFontSize(6.5);
    setColor(doc, GRAY400);
    doc.text(`${pct}% del total`, x + cardW / 2, cy + 31, { align: 'center' });
  });

  cy += 40;

  // Total general
  setFill(doc, DARK);
  doc.rect(ML, cy, CW, 12, 'F');
  setColor(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL: ${totalAll} REGISTROS`, ML + 6, cy + 8);

  return cy + 20;
}

// ── Gráfica de barras (página 2) ──────────────────────────────────────────────
function dibujarGraficaBarras(doc, resultado) {
  doc.addPage();

  headerBand(doc, 'Distribución visual de resultados', DARK, 0);

  const modulos = Object.entries(resultado.totales).filter(([, n]) => n > 0);
  if (!modulos.length) return;

  const maxVal = Math.max(...modulos.map(([, n]) => n));
  const chartTop = 20;
  const chartH   = 90;
  const chartLeft = ML + 30;
  const chartW    = CW - 30;
  const barW      = Math.min(28, (chartW / modulos.length) - 6);
  const gap       = (chartW - barW * modulos.length) / (modulos.length + 1);

  // Ejes
  setStroke(doc, GRAY200);
  doc.setLineWidth(0.3);
  doc.line(chartLeft, chartTop, chartLeft, chartTop + chartH);
  doc.line(chartLeft, chartTop + chartH, chartLeft + chartW, chartTop + chartH);

  // Líneas guía horizontales
  [25, 50, 75, 100].forEach(pct => {
    const y = chartTop + chartH - (chartH * pct / 100);
    const val = Math.round(maxVal * pct / 100);
    setStroke(doc, [220, 220, 220]);
    doc.setLineDashPattern([1, 2], 0);
    doc.line(chartLeft, y, chartLeft + chartW, y);
    doc.setLineDashPattern([], 0);
    setColor(doc, GRAY400);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(String(val), chartLeft - 3, y + 1.5, { align: 'right' });
  });

  // Barras
  modulos.forEach(([modulo, count], i) => {
    const meta = MODULO_META[modulo] || { r: 100, g: 100, b: 100, label: modulo };
    const barH  = maxVal ? (chartH * count / maxVal) : 0;
    const x     = chartLeft + gap + i * (barW + gap);
    const y     = chartTop + chartH - barH;

    // Sombra suave
    setFill(doc, [meta.r + 40 > 255 ? 255 : meta.r + 40,
                  meta.g + 40 > 255 ? 255 : meta.g + 40,
                  meta.b + 40 > 255 ? 255 : meta.b + 40]);
    doc.rect(x + 1.5, y + 1.5, barW, barH, 'F');

    // Barra principal
    setFill(doc, [meta.r, meta.g, meta.b]);
    doc.rect(x, y, barW, barH, 'F');

    // Valor encima
    setColor(doc, GRAY700);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(String(count), x + barW / 2, y - 2, { align: 'center' });

    // Label debajo
    setColor(doc, GRAY400);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const label = doc.splitTextToSize(meta.label, barW + 6);
    label.slice(0, 2).forEach((line, li) => {
      doc.text(line, x + barW / 2, chartTop + chartH + 5 + li * 5, { align: 'center' });
    });
  });

  // ── Distribución de estados (tabla lateral) ───────────────────────────────
  const rightX  = ML + CW * 0.62;
  const rightW  = CW - (rightX - ML) - 2;
  let   ry      = chartTop;

  setColor(doc, GRAY700);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DISTRIBUCIÓN POR ESTADO', rightX, ry);
  ry += 6;

  const estadoCounts = {};
  for (const item of resultado.timeline) {
    const e = item.estado || 'Sin estado';
    estadoCounts[e] = (estadoCounts[e] || 0) + 1;
  }
  const estados = Object.entries(estadoCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  const maxE = estados[0]?.[1] || 1;
  const ESTADO_COLORS_RGB = [
    [99,102,241],[34,197,94],[14,165,233],[234,179,8],[236,72,153],
    [249,115,22],[100,116,139],[168,85,247],[239,68,68],[20,184,166],
  ];

  estados.forEach(([estado, n], i) => {
    const [r,g,b] = ESTADO_COLORS_RGB[i % ESTADO_COLORS_RGB.length];
    const barLen  = (rightW - 30) * (n / maxE);
    const rowH    = 8;

    setColor(doc, GRAY700);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const estadoLabel = doc.splitTextToSize(estado, rightW - 32);
    doc.text(estadoLabel[0], rightX, ry + rowH / 2 + 1);

    setFill(doc, [r,g,b]);
    doc.rect(rightX + 28, ry + 1.5, barLen, rowH - 3, 'F');

    setColor(doc, GRAY400);
    doc.setFontSize(6.5);
    doc.text(String(n), rightX + 30 + barLen + 1, ry + rowH / 2 + 1);

    ry += rowH + 1;
  });

  // ── Tendencia temporal ────────────────────────────────────────────────────
  const byMonth = {};
  for (const item of resultado.timeline) {
    if (!item.fecha) continue;
    const mes = String(item.fecha).slice(0, 7);
    byMonth[mes] = (byMonth[mes] || 0) + 1;
  }
  const meses = Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b));

  if (meses.length > 1) {
    const tY    = chartTop + chartH + 28;
    const tH    = 35;
    const tMaxV = Math.max(...meses.map(([,v]) => v));
    const tW    = CW;
    const pW    = tW / (meses.length - 1);

    setColor(doc, GRAY700);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TENDENCIA TEMPORAL (registros por mes)', ML, tY - 4);

    // Eje
    setStroke(doc, GRAY200);
    doc.setLineWidth(0.3);
    doc.line(ML, tY + tH, ML + tW, tY + tH);

    // Área rellena
    const pts = meses.map(([,v], i) => ({
      x: ML + i * pW,
      y: tY + tH - (tH * v / tMaxV),
    }));

    // Relleno
    setFill(doc, [99, 102, 241]);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    const pathPts = [
      { x: pts[0].x, y: tY + tH },
      ...pts,
      { x: pts[pts.length-1].x, y: tY + tH },
    ];
    // Dibuja polígono manual
    doc.moveTo(pathPts[0].x, pathPts[0].y);
    for (let i = 1; i < pathPts.length; i++) doc.lineTo(pathPts[i].x, pathPts[i].y);
    doc.setFillColor(99, 102, 241);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    // Usamos rect por franja (más compatible) — una barra por mes
    meses.forEach(([, v], i) => {
      const barH2 = tH * v / tMaxV;
      const bx    = ML + i * pW - (pW / 2 < 5 ? pW / 2 : 5);
      const bw    = pW < 10 ? pW * 0.8 : 10;
      setFill(doc, [99, 102, 241]);
      doc.setGState(doc.GState({ opacity: 0.2 }));
      doc.rect(bx, tY + tH - barH2, bw, barH2, 'F');
    });
    doc.setGState(doc.GState({ opacity: 1 }));

    // Línea
    setStroke(doc, [99, 102, 241]);
    doc.setLineWidth(1.2);
    for (let i = 0; i < pts.length - 1; i++) {
      doc.line(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    }

    // Puntos y etiquetas
    pts.forEach(({ x, y }, i) => {
      setFill(doc, [99, 102, 241]);
      doc.circle(x, y, 1.5, 'F');
      setFill(doc, WHITE);
      doc.circle(x, y, 0.7, 'F');

      setColor(doc, GRAY400);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(meses[i][0].slice(5), x, tY + tH + 5, { align: 'center' });

      setColor(doc, [99, 102, 241]);
      doc.setFontSize(6.5);
      doc.text(String(meses[i][1]), x, y - 3, { align: 'center' });
    });
    doc.setLineWidth(0.3);
  }
}

// ── Sección por módulo ────────────────────────────────────────────────────────
function dibujarSeccionModulo(doc, modulo, filas) {
  if (!filas?.length) return;
  const meta = MODULO_META[modulo] || { label: modulo, r: 100, g: 100, b: 100 };

  doc.addPage();

  // Encabezado de sección
  setFill(doc, [meta.r, meta.g, meta.b]);
  doc.rect(0, 0, W, 14, 'F');
  setColor(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(meta.label.toUpperCase(), ML, 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${filas.length} registro${filas.length !== 1 ? 's' : ''}`, W - MR, 9.5, { align: 'right' });

  // Estadísticas rápidas de este módulo
  const estadosMod = {};
  let totalMonto = 0;
  let conMonto = 0;
  for (const f of filas) {
    const e = f.estado || 'Sin estado';
    estadosMod[e] = (estadosMod[e] || 0) + 1;
    if (f.monto != null) { totalMonto += Number(f.monto); conMonto++; }
  }
  const topEstados = Object.entries(estadosMod).sort((a,b) => b[1]-a[1]).slice(0, 5);

  // Mini pills de estados
  let px = ML;
  const pillY = 20;
  topEstados.forEach(([estado, n]) => {
    const pct = Math.round((n / filas.length) * 100);
    const label = `${estado}: ${n} (${pct}%)`;
    const tw = doc.getTextWidth(label) + 6;
    setFill(doc, [meta.r, meta.g, meta.b]);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.rect(px, pillY - 3.5, tw, 7, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    setColor(doc, [meta.r, meta.g, meta.b]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(label, px + 3, pillY + 1);
    px += tw + 4;
  });

  // Monto total si aplica
  if (conMonto > 0) {
    const montoStr = `Monto total: ${totalMonto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`;
    setColor(doc, GRAY400);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(montoStr, W - MR, pillY + 1, { align: 'right' });
  }

  // Tabla de registros
  const hasMonto = filas.some(f => f.monto != null);

  const head = [['#', 'Título / Concepto', 'Estado', 'Fecha', 'Entidad / Área', 'Responsable', ...(hasMonto ? ['Monto'] : [])]];
  const body = filas.map((f, i) => [
    String(i + 1),
    fmt(f.titulo),
    fmt(f.estado),
    fmtFecha(f.fecha),
    fmt(f.entidad || f.proyecto),
    fmt(f.responsable),
    ...(hasMonto ? [fmtMonto(f.monto)] : []),
  ]);

  autoTable(doc, {
    startY: 30,
    head,
    body,
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: GRAY200,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [meta.r, meta.g, meta.b],
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [
        Math.min(meta.r + 230, 255),
        Math.min(meta.g + 230, 255),
        Math.min(meta.b + 230, 255),
      ],
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 36 },
      5: { cellWidth: 36 },
      ...(hasMonto ? { 6: { cellWidth: 30, halign: 'right' } } : {}),
    },
    margin: { left: ML, right: MR },
    tableWidth: CW,
    didDrawPage: (data) => {
      // Raya de color en cada página de esta sección
      setFill(doc, [meta.r, meta.g, meta.b]);
      doc.rect(0, 0, 3, H, 'F');
    },
  });
}

// ── Pie de páginas ────────────────────────────────────────────────────────────
function addFooters(doc, totalPages) {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setColor(doc, GRAY400);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('REPORTE CROSS-MÓDULO — USO INTERNO', ML, H - 6);
    doc.text(`Página ${i} de ${totalPages}`, W - MR, H - 6, { align: 'right' });
    // Línea inferior
    setStroke(doc, GRAY200);
    doc.setLineWidth(0.2);
    doc.line(ML, H - 10, W - MR, H - 10);
  }
}

// ── Función principal exportada ───────────────────────────────────────────────
export function generarReportePDF(resultado, filtros, catalogos) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');

  const modulosConDatos = Object.keys(resultado.por_modulo).filter(
    m => resultado.por_modulo[m]?.length > 0
  );

  // Página 1 — Portada
  dibujarPortada(doc, resultado, filtros, catalogos);

  // Página 2 — Gráficas
  dibujarGraficaBarras(doc, resultado);

  // Páginas 3..N — Una por módulo
  for (const modulo of modulosConDatos) {
    dibujarSeccionModulo(doc, modulo, resultado.por_modulo[modulo]);
  }

  // Pies de página
  const totalPages = doc.internal.getNumberOfPages();
  addFooters(doc, totalPages);

  // Nombre del archivo con fecha
  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`reporte-cross-modulo-${fecha}.pdf`);
}
