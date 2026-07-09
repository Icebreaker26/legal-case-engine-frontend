import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import {
  ChevronLeft, FileText, AlertTriangle, CheckCircle, Clock,
  Zap, Archive, Copy, Check, Send, Loader, Download, Trash2,
  Shield, Calendar, Building2, Upload, ChevronRight, ChevronDown, Plus, Pencil, Scale,
  ExternalLink, Link as LinkIcon, Search, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SearchableSelect from '../components/SearchableSelect';

// ── Markdown → jsPDF renderer ────────────────────────────────────────────────
function pdfMarkdown(doc, text, { startY, M, CW, accent, textCol, mutedCol }) {
  let y = startY;
  const guard = (h = 7) => { if (y + h > 278) { doc.addPage(); y = 20; } };

  const parseInline = (str) => {
    const parts = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let li = 0, m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > li) parts.push({ t: str.slice(li, m.index), s: 'normal' });
      parts.push({ t: m[1] ?? m[2], s: m[1] ? 'bold' : 'italic' });
      li = m.index + m[0].length;
    }
    if (li < str.length) parts.push({ t: str.slice(li), s: 'normal' });
    return parts.length ? parts : [{ t: str, s: 'normal' }];
  };

  const renderInline = (str, x0, lineY, fs, col) => {
    let x = x0;
    parseInline(str).forEach(({ t, s }) => {
      doc.setFont('helvetica', s);
      doc.setFontSize(fs);
      doc.setTextColor(...col);
      t.split(' ').forEach((word, wi) => {
        const token = wi === 0 ? word : ' ' + word;
        const tw = doc.getTextWidth(token);
        if (x + tw > M + CW + 1 && x > x0) {
          lineY += fs * 0.52;
          if (lineY > 278) { doc.addPage(); lineY = 20; }
          x = x0;
          doc.text(word, x, lineY);
          x += doc.getTextWidth(word);
        } else {
          doc.text(token, x, lineY);
          x += tw;
        }
      });
    });
    return lineY;
  };

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) { y += 3; continue; }

    if (/^# /.test(line)) {
      guard(16);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...accent);
      doc.splitTextToSize(line.slice(2), CW).forEach(l => { doc.text(l, M, y); y += 7; });
      doc.setFillColor(...accent); doc.rect(M, y, CW, 0.4, 'F'); y += 5;
      continue;
    }
    if (/^## /.test(line)) {
      guard(12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...accent);
      doc.splitTextToSize(line.slice(3), CW).forEach(l => { doc.text(l, M, y); y += 6; });
      y += 2; continue;
    }
    if (/^### /.test(line)) {
      guard(9);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...textCol);
      doc.splitTextToSize(line.slice(4), CW).forEach(l => { doc.text(l, M, y); y += 5.5; });
      y += 2; continue;
    }
    if (/^-{3,}$/.test(line.trim())) {
      guard(6); doc.setFillColor(...mutedCol); doc.rect(M, y - 2, CW, 0.3, 'F'); y += 5; continue;
    }

    const bul = line.match(/^[\-\*] (.*)/);
    if (bul) {
      guard(7);
      doc.setFillColor(...accent); doc.circle(M + 2, y - 1.5, 1.2, 'F');
      y = renderInline(bul[1], M + 7, y, 9.5, textCol) + 6; continue;
    }
    const num = line.match(/^(\d+)\. (.*)/);
    if (num) {
      guard(7);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...accent);
      doc.text(`${num[1]}.`, M, y);
      y = renderInline(num[2], M + 9, y, 9.5, textCol) + 6; continue;
    }

    guard(7);
    y = renderInline(line, M, y, 9.5, textCol) + 6;
  }
  return y;
}

const CHARS_POR_PAGINA = 8000;

const estadoConfig = {
  'Pendiente':  { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock size={13} /> },
  'Analizado':  { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: <Zap size={13} /> },
  'Revisado':   { bg: 'bg-green-100',  text: 'text-green-700',  icon: <CheckCircle size={13} /> },
  'Archivado':  { bg: 'bg-gray-100',   text: 'text-gray-500',   icon: <Archive size={13} /> },
  'Cerrado':    { bg: 'bg-slate-100',  text: 'text-slate-600',  icon: <Shield size={13} /> },
};

const riesgoColor = {
  'Crítico': 'text-red-700 bg-red-50 border-red-200',
  'Alto':    'text-orange-700 bg-orange-50 border-orange-200',
  'Medio':   'text-yellow-700 bg-yellow-50 border-yellow-200',
  'Bajo':    'text-green-700 bg-green-50 border-green-200',
};

const prioridadDot = {
  'Alta':  'bg-red-400',
  'Media': 'bg-yellow-400',
  'Baja':  'bg-green-400',
};

const ESTADOS = ['Pendiente', 'Analizado', 'Revisado', 'Archivado', 'Cerrado'];

function generarInformePDF(expediente, analisis, hallazgos, normas, pagos = []) {
  const doc = new jsPDF();
  const verde = [22, 101, 52];
  const gris = [75, 85, 99];

  // Encabezado
  doc.setFillColor(...verde);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE ANÁLISIS AMBIENTAL', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ley 99 de 1993 · Decreto 1076 de 2015`, 14, 20);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 150, 20);

  let y = 36;

  // Datos del expediente
  doc.setTextColor(...gris);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL EXPEDIENTE', 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const meta = [
    ['Título', expediente.titulo],
    ['Tipo', expediente.tipo_instrumento],
    ['N° Expediente', expediente.numero_expediente || '—'],
    ['Entidad', expediente.entidad_nombre || '—'],
    ['Fecha documento', expediente.fecha_documento ? new Date(expediente.fecha_documento).toLocaleDateString('es-CO') : '—'],
    ['Estado', expediente.estado || 'Pendiente'],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${k}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v), 55, y);
    y += 5.5;
  });

  if (analisis) {
    y += 4;
    // Qué ordena / recurso / plazo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...verde);
    doc.text('LO QUE ORDENA', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gris);
    const queOrdena = doc.splitTextToSize(expediente.que_ordena || '—', 182);
    doc.text(queOrdena, 14, y);
    y += queOrdena.length * 5 + 4;

    // Recurso, plazo y pago
    autoTable(doc, {
      startY: y,
      head: [['¿Admite recurso?', 'Plazo de respuesta', 'Nivel de riesgo']],
      body: [[
        expediente.admite_recurso || '—',
        expediente.plazo_respuesta || '—',
        analisis.nivel_riesgo || '—',
      ]],
      headStyles: { fillColor: verde, fontSize: 8 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 },
    });
    y = doc.lastAutoTable.finalY + 4;

    if (pagos.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Descripción del pago', 'Valor', 'Plazo', 'Estado']],
        body: pagos.map(p => [p.descripcion || '—', p.valor, p.plazo || '—', p.estado]),
        headStyles: { fillColor: [220, 38, 38], fontSize: 8 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 1: { fontStyle: 'bold', textColor: [180, 30, 30] } },
        margin: { left: 14 },
      });
      y = doc.lastAutoTable.finalY + 4;
    }
    y += 4;

    // Resumen
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...verde);
    doc.text('RESUMEN EJECUTIVO', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gris);
    const resumen = doc.splitTextToSize(analisis.resumen || '—', 182);
    doc.text(resumen, 14, y);
    y = y + resumen.length * 5 + 6;

    // Hallazgos
    if (hallazgos.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...verde);
      doc.text('HALLAZGOS', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['#', 'Tipo', 'Descripción', 'Norma infringida', 'Recomendación', 'Prioridad']],
        body: hallazgos.map(h => [
          h.numero_hallazgo,
          h.tipo,
          h.descripcion,
          h.norma_infringida || '—',
          h.recomendacion || '—',
          h.prioridad,
        ]),
        headStyles: { fillColor: verde, fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        columnStyles: { 0: { cellWidth: 8 }, 5: { cellWidth: 18 } },
        margin: { left: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Normas citadas
    if (normas.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...verde);
      doc.text('NORMAS CITADAS', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Instrumento', 'Artículo', 'Descripción']],
        body: normas.map(n => [n.instrumento, n.articulo || '—', n.descripcion || '—']),
        headStyles: { fillColor: verde, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14 },
      });
    }
  }

  doc.save(`informe_ambiental_${expediente.numero_expediente || expediente.id.slice(0, 8)}.pdf`);
}

function escribirBloque(doc, titulo, texto, y, verde, gris) {
  if (!texto?.trim()) return y;
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...verde);
  doc.text(titulo, 14, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gris);
  const lines = doc.splitTextToSize(texto.trim(), 182);
  lines.forEach(l => {
    if (y > 278) { doc.addPage(); y = 20; }
    doc.text(l, 14, y);
    y += 5;
  });
  return y + 4;
}

function generarRecursoPDF(expediente, recurso) {
  const doc = new jsPDF();
  const verde = [22, 101, 52];
  const gris = [75, 85, 99];

  doc.setFillColor(...verde);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text((recurso.tipo_recurso || 'RECURSO').toUpperCase(), 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Expediente: ${expediente.numero_expediente || '—'}  ·  ${expediente.entidad_nombre || '—'}`, 14, 21);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 150, 21);

  let y = 36;

  autoTable(doc, {
    startY: y,
    head: [['Campo', 'Valor']],
    body: [
      ['Título', expediente.titulo],
      ['Tipo instrumento', expediente.tipo_instrumento || '—'],
      ['Admite recurso', expediente.admite_recurso || '—'],
      ['Plazo', expediente.plazo_respuesta || '—'],
    ],
    headStyles: { fillColor: verde, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 } },
    margin: { left: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = escribirBloque(doc, 'I. IDENTIFICACIÓN DEL ACTO RECURRIDO', recurso.identificacion_acto, y, verde, gris);
  y = escribirBloque(doc, 'II. FUNDAMENTOS DE HECHO', recurso.fundamentos_hecho, y, verde, gris);
  y = escribirBloque(doc, 'III. FUNDAMENTOS DE DERECHO', recurso.fundamentos_derecho, y, verde, gris);

  if (recurso.argumentos_por_cargo?.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...verde);
    doc.text('IV. ANÁLISIS CARGO POR CARGO', 14, y);
    y += 6;
    recurso.argumentos_por_cargo.forEach((item, i) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gris);
      const cargoLines = doc.splitTextToSize(`Cargo ${i + 1}: ${item.cargo}`, 182);
      doc.text(cargoLines, 14, y);
      y += cargoLines.length * 5 + 2;
      doc.setFont('helvetica', 'normal');
      const respLines = doc.splitTextToSize(item.respuesta || '', 182);
      respLines.forEach(l => {
        if (y > 278) { doc.addPage(); y = 20; }
        doc.text(l, 14, y);
        y += 5;
      });
      y += 3;
    });
    y += 2;
  }

  y = escribirBloque(doc, 'V. PRETENSIONES', recurso.pretensiones, y, verde, gris);
  y = escribirBloque(doc, 'VI. CONCLUSIÓN Y SOLICITUD', recurso.conclusion, y, verde, gris);

  doc.save(`recurso_ambiental_${expediente.numero_expediente || expediente.id.slice(0, 8)}.pdf`);
}

function construirPromptRecurso(expediente, analisis, hallazgosSeleccionados, argumentosUsuario) {
  const lineas = [
    'Actúa como experto en derecho ambiental colombiano con amplio conocimiento de la Ley 99 de 1993 y el Decreto 1076 de 2015.',
    '',
    'DATOS DEL EXPEDIENTE:',
    `- Título: ${expediente.titulo}`,
    expediente.numero_expediente ? `- Número de expediente: ${expediente.numero_expediente}` : null,
    expediente.entidad_nombre ? `- Entidad: ${expediente.entidad_nombre}` : null,
    expediente.tipo_instrumento ? `- Tipo de instrumento: ${expediente.tipo_instrumento}` : null,
    '',
    'LO QUE ORDENA EL INSTRUMENTO:',
    expediente.que_ordena || '(no especificado)',
    '',
    `ADMITE RECURSO: ${expediente.admite_recurso || 'No determinado'}`,
    expediente.plazo_respuesta ? `PLAZO DE RESPUESTA: ${expediente.plazo_respuesta}` : null,
    analisis?.nivel_riesgo ? `NIVEL DE RIESGO: ${analisis.nivel_riesgo}` : null,
  ].filter(l => l !== null);

  if (hallazgosSeleccionados.length > 0) {
    lineas.push('', 'HALLAZGOS DEL ANÁLISIS A FUNDAMENTAR EN EL RECURSO:');
    hallazgosSeleccionados.forEach((h, i) => {
      lineas.push(`${i + 1}. [${h.tipo} — Prioridad ${h.prioridad}] ${h.descripcion}`);
      if (h.norma_infringida) lineas.push(`   Norma: ${h.norma_infringida}`);
      if (h.recomendacion) lineas.push(`   Recomendación: ${h.recomendacion}`);
    });
  }

  if (argumentosUsuario?.trim()) {
    lineas.push('', 'ARGUMENTOS ADICIONALES DEL ABOGADO:', argumentosUsuario.trim());
  }

  lineas.push(
    '',
    'INSTRUCCIÓN:',
    'Redacta un recurso de reposición y en subsidio de apelación en formato jurídico formal colombiano.',
    'El recurso debe identificar el acto recurrido, exponer fundamentos de hecho y de derecho, rebatir los cargos usando los hallazgos y argumentos indicados, citar normas aplicables de la Ley 99/93 y el Decreto 1076/2015, y concluir con una solicitud clara.',
    '',
    'Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código. El JSON debe seguir exactamente esta estructura:',
    '',
    '{',
    '  "tipo_recurso": "Reposición y en subsidio de apelación",',
    '  "identificacion_acto": "Identificación precisa del acto administrativo recurrido: número, fecha, autoridad que lo expidió y lo que dispone.",',
    '  "fundamentos_hecho": "Narración de los hechos relevantes en orden cronológico.",',
    '  "fundamentos_derecho": "Normas y principios jurídicos aplicables (Ley 99/93, Decreto 1076/2015, Constitución, etc.) que sustentan el recurso.",',
    '  "argumentos_por_cargo": [',
    '    { "cargo": "Descripción del cargo o exigencia impuesta por el instrumento", "respuesta": "Argumento jurídico que rebate o controvierte este cargo específico" }',
    '  ],',
    '  "pretensiones": "Lista de pretensiones o solicitudes concretas al resolver el recurso.",',
    '  "conclusion": "Párrafo de cierre con la solicitud formal al funcionario o autoridad competente."',
    '}',
  );

  return lineas.join('\n');
}

function generarRespuestaPDF(expediente, evaluacion) {
  const doc = new jsPDF();
  const slate = [51, 65, 85];
  const gris  = [75, 85, 99];

  doc.setFillColor(...slate);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUACIÓN DE RESPUESTA DE ENTIDAD', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(expediente.titulo || '', 14, 18, { maxWidth: 160 });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 150, 24);

  let y = 36;

  const bloque = (titulo, contenido) => {
    if (!contenido) return;
    if (y > 260) { doc.addPage(); y = 14; }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slate);
    doc.text(titulo.toUpperCase(), 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gris);
    const lines = doc.splitTextToSize(String(contenido), 182);
    lines.forEach(l => {
      if (y > 275) { doc.addPage(); y = 14; }
      doc.text(l, 14, y);
      y += 5;
    });
    y += 3;
  };

  // Resumen ejecutivo
  const valoracion = evaluacion.valoracion || '—';
  const cumplimiento = evaluacion.cumplimiento || '—';
  const procedeRecurso = evaluacion.procede_recurso || '—';

  autoTable(doc, {
    startY: y,
    head: [['Valoración', 'Cumplimiento', 'Procede recurso']],
    body: [[valoracion, cumplimiento, procedeRecurso]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: slate, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  bloque('Resumen', evaluacion.resumen);

  if (evaluacion.tipo_recurso && evaluacion.tipo_recurso !== 'No aplica') {
    bloque('Tipo de recurso', evaluacion.tipo_recurso);
    bloque('Plazo para interponer recurso', evaluacion.plazo_recurso);
    bloque('Fundamentos legales', evaluacion.fundamentos_recurso);
  }

  if (evaluacion.recomendaciones?.length > 0) {
    if (y > 255) { doc.addPage(); y = 14; }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slate);
    doc.text('RECOMENDACIONES', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gris);
    evaluacion.recomendaciones.forEach((r, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${r}`, 178);
      lines.forEach(l => {
        if (y > 275) { doc.addPage(); y = 14; }
        doc.text(l, 14, y);
        y += 5;
      });
    });
    y += 3;
  }

  bloque('Observaciones adicionales', evaluacion.observaciones);

  doc.save(`evaluacion-respuesta-${expediente.numero_expediente || expediente.id}.pdf`);
}

function formatearValor(v) {
  if (!v) return v;
  // Si ya tiene símbolo de moneda o letras, devolver tal cual
  if (/[a-zA-Z$]/.test(v)) return v;
  const num = parseFloat(v.replace(/[.,]/g, m => m === ',' ? '.' : ''));
  if (!isNaN(num) && String(v).replace(/\D/g, '').length >= 4) {
    return `$${Math.round(num).toLocaleString('es-CO')}`;
  }
  return v;
}

function parsePrompt(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed; // [{num, total, prompt}]
  } catch { /* string simple */ }
  return [{ num: 1, total: 1, prompt: raw }];
}

function PromptVisor({ prompt, seccionPrompt, setSeccionPrompt, copiadoSeccion, setCopiadoSeccion, labelHeader, seccionesGuardadas = [] }) {
  const partes = parsePrompt(prompt);
  const idx = Math.min(seccionPrompt, partes.length - 1);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {labelHeader ? (
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {labelHeader}
            {partes.length > 1 && <span className="ml-2 text-amber-500 font-normal normal-case">· {partes.length} partes</span>}
          </span>
        ) : (
          <span className="text-[11px] text-gray-400">
            {partes.length > 1 ? `Parte ${idx + 1} de ${partes.length} · copia cada parte por separado` : 'Copia y pega en el LLM corporativo'}
          </span>
        )}
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(partes[idx].prompt);
            setCopiadoSeccion(p => ({ ...p, [idx]: true }));
            setTimeout(() => setCopiadoSeccion(p => ({ ...p, [idx]: false })), 2000);
          }}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${copiadoSeccion[idx] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}
        >
          {copiadoSeccion[idx] ? <Check size={13} /> : <Copy size={13} />}
          {copiadoSeccion[idx] ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {partes.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {partes.map((p, i) => {
            const guardada = seccionesGuardadas.includes(p.num);
            return (
              <button key={i} onClick={() => setSeccionPrompt(i)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  idx === i
                    ? guardada ? 'bg-green-700 text-white' : 'bg-amber-500 text-white'
                    : guardada ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-700'
                }`}>
                {guardada && <Check size={11} />}
                Parte {p.num}
              </button>
            );
          })}
        </div>
      )}
      <div className="bg-gray-900 text-green-300 text-xs font-mono p-4 rounded-xl max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed">
        {partes[idx].prompt}
      </div>
    </div>
  );
}

export default function DetalleExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expediente, setExpediente] = useState(null);
  const [analisis, setAnalisis] = useState(null);
  const [hallazgos, setHallazgos] = useState([]);
  const [normas, setNormas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [jsonLlm, setJsonLlm] = useState('');
  const [guardandoAnalisis, setGuardandoAnalisis] = useState(false);
  const [cambioEstado, setCambioEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);
  const [generandoPrompt, setGenerandoPrompt] = useState(false);
  const [tab, setTab] = useState('analisis');
  const [paginaTexto, setPaginaTexto] = useState(0);
  const [entidades, setEntidades] = useState([]);
  const [editandoEntidad, setEditandoEntidad] = useState(false);
  const [guardandoEntidad, setGuardandoEntidad] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState('');

  const [usuarios, setUsuarios] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [editandoResponsable, setEditandoResponsable] = useState(false);
  const [responsableSeleccionado, setResponsableSeleccionado] = useState('');
  const [guardandoResponsable, setGuardandoResponsable] = useState(false);
  const [editandoProyecto, setEditandoProyecto] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
  const [guardandoProyecto, setGuardandoProyecto] = useState(false);
  const fileRef = useRef(null);

  // Tab Recurso
  const [hallazgosSeleccionados, setHallazgosSeleccionados] = useState(new Set());
  const [argumentosRecurso, setArgumentosRecurso] = useState('');
  const [guardandoArgumentos, setGuardandoArgumentos] = useState(false);
  const [promptRecurso, setPromptRecurso] = useState('');
  const [copiadoRecurso, setCopiadoRecurso] = useState(false);
  const [jsonRecurso, setJsonRecurso] = useState('');
  const [recursoParseado, setRecursoParseado] = useState(null);
  const [errorParseRecurso, setErrorParseRecurso] = useState('');
  const [guardandoRecursoJson, setGuardandoRecursoJson] = useState(false);
  const [exportandoRecurso, setExportandoRecurso] = useState(false);

  // Tab Comunicaciones
  const [comunicaciones, setComunicaciones] = useState([]);
  const [loadingComs, setLoadingComs] = useState(false);
  const [similares, setSimilares] = useState([]);
  const [loadingSimilares, setLoadingSimilares] = useState(false);
  const [similaresError, setSimilaresError] = useState(null);
  const [similaresBuscados, setSimilaresBuscados] = useState(false);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [promptComparativo, setPromptComparativo] = useState('');
  const [resultadoComparativo, setResultadoComparativo] = useState('');
  const [generandoComparativo, setGenerandoComparativo] = useState(false);
  const [expandedCom, setExpandedCom] = useState(null);
  const [filtroCom, setFiltroCom] = useState('todas');
  const [formCom, setFormCom] = useState({ direccion: 'entrante', asunto: '', fecha: '', descripcion: '', enlace: '' });
  const [archivoCom, setArchivoCom] = useState(null);
  const [guardandoCom, setGuardandoCom] = useState(false);
  const [mostrarFormCom, setMostrarFormCom] = useState(false);
  const [comunicacionesInactivas, setComunicacionesInactivas] = useState([]);
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const [comAnalisis, setComAnalisis] = useState({});   // keyed by com.id
  const [comModalId, setComModalId] = useState(null);   // com.id abierto en modal

  // Tab Respuesta entidad
  const [procesandoRespuesta, setProcesandoRespuesta] = useState(false);
  const [promptRespuesta, setPromptRespuesta] = useState('');
  const [copiadoPromptRespuesta, setCopiadoPromptRespuesta] = useState(false);
  const [errorParseRespuesta, setErrorParseRespuesta] = useState('');
  const [cerrandoTramite, setCerrandoTramite] = useState(false);
  const fileRespuestaRef = useRef(null);
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [pagosInactivos, setPagosInactivos] = useState([]);
  const [copiadoPrompt, setCopiadoPrompt] = useState(false);
  const [mostrarConsolidar, setMostrarConsolidar] = useState(false);
  const [resumenConsolidado, setResumenConsolidado] = useState('');
  const [editandoResumen, setEditandoResumen] = useState(false);
  const [resumenEdit, setResumenEdit] = useState('');
  const [guardandoResumenEdit, setGuardandoResumenEdit] = useState(false);
  const [guardandoResumen, setGuardandoResumen] = useState(false);
  const [seccionPrompt, setSeccionPrompt] = useState(0);
  const [copiadoSeccion, setCopiadoSeccion] = useState({});

  const paginasTexto = useMemo(() => {
    const texto = expediente?.contenido_texto || '';
    if (!texto) return [];
    const paginas = [];
    for (let i = 0; i < texto.length; i += CHARS_POR_PAGINA) {
      paginas.push(texto.slice(i, i + CHARS_POR_PAGINA));
    }
    return paginas;
  }, [expediente?.contenido_texto]);

  const cargarDatos = async () => {
    try {
      const { data: exp } = await apiService.get(`/ambiental/expedientes/${id}`);
      setExpediente(exp);
      setCambioEstado(exp.estado || 'Pendiente');
      setArgumentosRecurso(exp.argumentos_recurso || '');
      setHallazgosSeleccionados(new Set(exp.hallazgos_recurso_ids || []));
      if (exp.recurso_llm_json) {
        setJsonRecurso(exp.recurso_llm_json);
        try { setRecursoParseado(JSON.parse(exp.recurso_llm_json)); } catch { /* json corrupto */ }
      }

      try {
        const { data: an } = await apiService.get(`/ambiental/expedientes/${id}/analisis`);
        setAnalisis(an);
        setHallazgos(an.hallazgos || []);
        setNormas(an.normas_citadas || []);
        setPagos(an.pagos || []);
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
        // 404 = sin análisis aún, es estado válido
      }
    } catch {
      toast.error('Error al cargar el expediente');
      navigate('/ambiental');
    } finally {
      setLoading(false);
    }
  };

  const cargarComunicaciones = async () => {
    setLoadingComs(true);
    try {
      const { data } = await apiService.get(`/ambiental/expedientes/${id}/comunicaciones`);
      setComunicaciones(data);
    } catch { /* silencioso */ }
    finally { setLoadingComs(false); }
  };

  const cargarSimilares = async () => {
    setLoadingSimilares(true);
    setSimilaresError(null);
    try {
      const { data } = await apiService.get(`/ambiental/expedientes/${id}/similares`);
      setSimilares(data);
      setSimilaresBuscados(true);
      setSeleccionados(new Set(data.slice(0, 3).map(s => s.id)));
    } catch (err) {
      if (err?.response?.status === 404) {
        setSimilaresError('sin-embedding');
      } else {
        setSimilaresError('error');
      }
    } finally {
      setLoadingSimilares(false);
    }
  };

  const generarEmbedding = async () => {
    setLoadingSimilares(true);
    setSimilaresError(null);
    setSimilaresBuscados(false);
    try {
      await apiService.post(`/ambiental/expedientes/${id}/generar-embedding`);
      await cargarSimilares();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error al generar embedding.';
      toast.error(msg);
      setLoadingSimilares(false);
    }
  };

  const generarPromptComparativo = async () => {
    const seleccionadosList = similares.filter(s => seleccionados.has(s.id));
    if (!seleccionadosList.length) return toast.error('Selecciona al menos un precedente.');
    setGenerandoComparativo(true);
    try {
      const { data } = await apiService.post(`/ambiental/expedientes/${id}/prompt-comparativo`, {
        precedentes_ids: seleccionadosList.map(s => s.id),
      });
      setPromptComparativo(data.prompt);
    } catch { toast.error('Error al generar el prompt comparativo.'); }
    finally { setGenerandoComparativo(false); }
  };

  const toggleSeleccionado = (sId) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(sId) ? next.delete(sId) : next.add(sId);
      return next;
    });
  };

  useEffect(() => {
    cargarDatos();
    cargarComunicaciones();
    apiService.get('/core/entidades')
      .then(r => setEntidades((r.data || []).map(e => ({ value: e.id, label: e.nombre }))))
      .catch(() => {});
    apiService.get('/core/usuarios-activos')
      .then(r => setUsuarios((r.data || []).map(u => ({ value: u.id, label: u.nombre }))))
      .catch(() => {});
    apiService.get('/core/proyectos')
      .then(r => setProyectos((r.data || []).map(p => ({ value: p.id, label: p.nombre }))))
      .catch(() => {});
  }, [id]);

  const handleGuardarAnalisis = async (modo = 'reemplazar', seccionIdx = undefined) => {
    if (!jsonLlm.trim()) return toast.error('Pega el JSON del LLM primero.');
    setGuardandoAnalisis(true);
    try {
      const body = { resultado_llm_json: jsonLlm, modo };
      if (seccionIdx !== undefined) body.seccion_index = seccionIdx;
      const { data } = await apiService.post(`/ambiental/expedientes/${id}/analisis`, body);
      toast.success(data.message);
      setJsonLlm('');
      await cargarDatos();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al guardar el análisis');
    } finally {
      setGuardandoAnalisis(false);
    }
  };

  const handleGuardarEntidad = async () => {
    if (!entidadSeleccionada) return;
    setGuardandoEntidad(true);
    try {
      await apiService.patch(`/ambiental/expedientes/${id}`, { entidad_id: Number(entidadSeleccionada) });
      const entidad = entidades.find(e => String(e.value) === String(entidadSeleccionada));
      setExpediente(prev => ({ ...prev, entidad_id: Number(entidadSeleccionada), entidad_nombre: entidad?.label }));
      setEditandoEntidad(false);
      toast.success('Entidad actualizada');
    } catch {
      toast.error('Error al guardar la entidad');
    } finally {
      setGuardandoEntidad(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (cambioEstado === expediente?.estado) return;
    setGuardandoEstado(true);
    try {
      await apiService.patch(`/ambiental/expedientes/${id}`, { estado: cambioEstado });
      toast.success('Estado actualizado');
      setExpediente(prev => ({ ...prev, estado: cambioEstado }));
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setGuardandoEstado(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar este expediente?')) return;
    try {
      await apiService.delete(`/ambiental/expedientes/${id}`);
      toast.success('Expediente eliminado');
      navigate('/ambiental');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const procesarYGuardar = async (fd, esArchivo = false) => {
    const { data } = await apiService.post('/ambiental/expedientes/procesar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const patch = { prompt_generado: data.prompt_generado };
    if (esArchivo) patch.contenido_texto = data.contenido_texto;
    await apiService.patch(`/ambiental/expedientes/${id}`, patch);
    toast.success('Prompt generado');
    await cargarDatos();
  };

  const handleProcesarArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProcesandoArchivo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (expediente.entidad_id) fd.append('entidad_id', expediente.entidad_id);
      if (expediente.fecha_documento) fd.append('fecha_documento', expediente.fecha_documento);
      await procesarYGuardar(fd, true);
    } catch {
      toast.error('Error al procesar el archivo');
    } finally {
      setProcesandoArchivo(false);
      e.target.value = '';
    }
  };

  const handleRegenerarPrompt = async () => {
    if (!expediente?.contenido_texto) return;
    setGenerandoPrompt(true);
    try {
      const fd = new FormData();
      fd.append('texto', expediente.contenido_texto);
      if (expediente.entidad_id) fd.append('entidad_id', expediente.entidad_id);
      if (expediente.fecha_documento) fd.append('fecha_documento', expediente.fecha_documento);
      await procesarYGuardar(fd, false);
    } catch {
      toast.error('Error al regenerar');
    } finally {
      setGenerandoPrompt(false);
    }
  };

  const handleCopiarPrompt = async () => {
    if (!expediente?.prompt_generado) return;
    await navigator.clipboard.writeText(expediente.prompt_generado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    toast.success('Prompt copiado');
  };

  const handleExportarPDF = async () => {
    try {
      const { data } = await apiService.get(`/ambiental/expedientes/${id}/informe`);
      generarInformePDF(data.expediente, data.analisis, data.hallazgos, data.normas_citadas, data.pagos || []);
    } catch {
      toast.error('Error al generar el informe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Cargando...</span>
      </div>
    );
  }

  if (!expediente) return null;

  const cfgEstado = estadoConfig[expediente.estado] || estadoConfig['Pendiente'];

  // Stepper: progreso del expediente
  const pasoDocumento = !!expediente.contenido_texto;
  const pasoAnalisis  = !!analisis;

  const pasos = [
    { key: 'documento',      num: 1, label: 'Documento',      desc: 'Subir y procesar el archivo',              done: pasoDocumento },
    { key: 'llm',            num: 2, label: 'Analizar',       desc: 'Generar prompt y guardar resultados',       done: pasoAnalisis },
    { key: 'analisis',       num: 3, label: 'Resultados',     desc: 'Ver análisis y hallazgos',                  done: pasoAnalisis },
    { key: 'recurso',        num: 4, label: 'Recurso',        desc: 'Opcional · solo si aplica',                 done: !!recursoParseado, optional: true },
    { key: 'comunicaciones', num: 5, label: 'Comunicaciones', desc: 'Historial de intercambios con la entidad',  done: comunicaciones.length > 0 },
    { key: 'precedentes',    num: 6, label: 'Precedentes',    desc: 'Expedientes similares en el sistema',       done: false },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Fila superior: back + título + acciones */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          <button onClick={() => navigate('/ambiental')} className="text-gray-300 hover:text-green-700 transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-gray-800 truncate">{expediente.titulo}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfgEstado.bg} ${cfgEstado.text}`}>
              {cfgEstado.icon} {expediente.estado || 'Pendiente'}
            </span>
            {analisis && (
              <button onClick={handleExportarPDF} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-green-700 text-white hover:bg-green-800 transition-colors">
                <Download size={13} /> PDF
              </button>
            )}
            <button onClick={handleEliminar} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Línea de metadata */}
        <div className="px-5 pb-2 flex flex-wrap items-center gap-2">
          {expediente.numero_expediente
            ? <span className="font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px]">{expediente.numero_expediente}</span>
            : <span className="px-2 py-0.5 rounded-md border border-dashed border-gray-200 text-gray-300 text-[11px]">Sin número</span>}
          <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[11px]">{expediente.tipo_instrumento}</span>
          {expediente.entidad_nombre
            ? <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px]">{expediente.entidad_nombre}</span>
            : <span className="px-2 py-0.5 rounded-md border border-dashed border-gray-200 text-gray-300 text-[11px]">Sin entidad</span>}
          {expediente.responsable_nombre
            ? <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px]">{expediente.responsable_nombre}</span>
            : <span className="px-2 py-0.5 rounded-md border border-dashed border-gray-200 text-gray-300 text-[11px]">Sin responsable</span>}
          {expediente.proyecto_nombre
            ? <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px]">{expediente.proyecto_nombre}</span>
            : <span className="px-2 py-0.5 rounded-md border border-dashed border-gray-200 text-gray-300 text-[11px]">Sin proyecto</span>}
          {analisis?.nivel_riesgo && (
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${analisis.nivel_riesgo === 'Crítico' || analisis.nivel_riesgo === 'Alto' ? 'bg-red-50 text-red-500' : analisis.nivel_riesgo === 'Medio' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'}`}>
              Riesgo {analisis.nivel_riesgo}
            </span>
          )}
          {expediente.enlace_pdf && (
            <a href={expediente.enlace_pdf} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[11px] font-bold hover:bg-green-100 transition-colors">
              <ExternalLink size={10} /> Ver PDF
            </a>
          )}
        </div>


        {/* Acordeón */}
        <button
          onClick={async () => {
            const next = !detallesAbiertos;
            setDetallesAbiertos(next);
            if (next) {
              try {
                const { data } = await apiService.get(`/ambiental/expedientes/${id}/pagos/inactivos`);
                setPagosInactivos(data);
              } catch { /* silencioso */ }
            }
          }}
          className="w-full flex items-center justify-between px-5 py-2 border-t border-gray-100 text-xs text-gray-400 hover:text-green-700 hover:bg-gray-50 transition-colors"
        >
          <span>Editar detalles</span>
          <ChevronDown size={13} className={`transition-transform ${detallesAbiertos ? 'rotate-180' : ''}`} />
        </button>

        {detallesAbiertos && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/40">
            {/* Estado */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 w-20 shrink-0">Estado</span>
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS.map(e => (
                  <button key={e} onClick={() => setCambioEstado(e)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${cambioEstado === e ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700'}`}>
                    {e}
                  </button>
                ))}
                {cambioEstado !== expediente.estado && (
                  <button onClick={handleCambiarEstado} disabled={guardandoEstado}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                    {guardandoEstado ? <Loader size={11} className="animate-spin" /> : <Check size={11} />} Guardar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Entidad */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Building2 size={10} /> Entidad
                  {!editandoEntidad && <button onClick={() => { setEntidadSeleccionada(expediente.entidad_id || ''); setEditandoEntidad(true); }} className="ml-1 text-green-600 hover:text-green-800"><Pencil size={10} /></button>}
                </p>
                {editandoEntidad ? (
                  <div className="space-y-2">
                    <SearchableSelect options={entidades} value={entidadSeleccionada} onChange={setEntidadSeleccionada} placeholder="Buscar entidad..." />
                    <div className="flex gap-2">
                      <button onClick={handleGuardarEntidad} disabled={guardandoEntidad || !entidadSeleccionada} className="flex-1 py-1.5 text-xs font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">{guardandoEntidad ? 'Guardando…' : 'Guardar'}</button>
                      <button onClick={() => setEditandoEntidad(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-white">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-700">{expediente.entidad_nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}</p>
                )}
              </div>

              {/* Responsable */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  Responsable
                  {!editandoResponsable && <button onClick={() => { setResponsableSeleccionado(expediente.responsable_uuid || ''); setEditandoResponsable(true); }} className="ml-1 text-green-600 hover:text-green-800"><Pencil size={10} /></button>}
                </p>
                {editandoResponsable ? (
                  <div className="space-y-2">
                    <SearchableSelect options={usuarios} value={responsableSeleccionado} onChange={setResponsableSeleccionado} placeholder="Buscar responsable..." />
                    <div className="flex gap-2">
                      <button onClick={async () => { setGuardandoResponsable(true); try { await apiService.patch(`/ambiental/expedientes/${id}`, { responsable_uuid: responsableSeleccionado || null }); const u = usuarios.find(u => u.value === responsableSeleccionado); setExpediente(prev => ({ ...prev, responsable_uuid: responsableSeleccionado || null, responsable_nombre: u?.label || null })); setEditandoResponsable(false); toast.success('Responsable actualizado'); } catch { toast.error('Error al guardar'); } finally { setGuardandoResponsable(false); } }} disabled={guardandoResponsable} className="flex-1 py-1.5 text-xs font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">{guardandoResponsable ? 'Guardando…' : 'Guardar'}</button>
                      <button onClick={() => setEditandoResponsable(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-white">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-700">{expediente.responsable_nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}</p>
                )}
              </div>

              {/* Proyecto */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  Proyecto
                  {!editandoProyecto && <button onClick={() => { setProyectoSeleccionado(expediente.proyecto_id || ''); setEditandoProyecto(true); }} className="ml-1 text-green-600 hover:text-green-800"><Pencil size={10} /></button>}
                </p>
                {editandoProyecto ? (
                  <div className="space-y-2">
                    <SearchableSelect options={proyectos} value={proyectoSeleccionado} onChange={setProyectoSeleccionado} placeholder="Buscar proyecto..." />
                    <div className="flex gap-2">
                      <button onClick={async () => { setGuardandoProyecto(true); try { await apiService.patch(`/ambiental/expedientes/${id}`, { proyecto_id: proyectoSeleccionado ? Number(proyectoSeleccionado) : null }); const p = proyectos.find(p => String(p.value) === String(proyectoSeleccionado)); setExpediente(prev => ({ ...prev, proyecto_id: proyectoSeleccionado ? Number(proyectoSeleccionado) : null, proyecto_nombre: p?.label || null })); setEditandoProyecto(false); toast.success('Proyecto actualizado'); } catch { toast.error('Error al guardar'); } finally { setGuardandoProyecto(false); } }} disabled={guardandoProyecto} className="flex-1 py-1.5 text-xs font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">{guardandoProyecto ? 'Guardando…' : 'Guardar'}</button>
                      <button onClick={() => setEditandoProyecto(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-white">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-700">{expediente.proyecto_nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}</p>
                )}
              </div>

              {/* Título */}
              <div className="col-span-2 md:col-span-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Título</p>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-green-600"
                  defaultValue={expediente.titulo || ''}
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    if (!val || val === expediente.titulo) return;
                    try { await apiService.patch(`/ambiental/expedientes/${id}`, { titulo: val }); setExpediente(prev => ({ ...prev, titulo: val })); toast.success('Título actualizado'); } catch { toast.error('Error al guardar'); }
                  }} />
              </div>

              {/* Número de expediente */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">N° Expediente</p>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-green-600 font-mono"
                  defaultValue={expediente.numero_expediente || ''}
                  placeholder="Ej. EXP-2024-001"
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    if (val === (expediente.numero_expediente || '')) return;
                    try { await apiService.patch(`/ambiental/expedientes/${id}`, { numero_expediente: val || null }); setExpediente(prev => ({ ...prev, numero_expediente: val || null })); toast.success('Número actualizado'); } catch { toast.error('Error al guardar'); }
                  }} />
              </div>

              {/* Fecha documento */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5"><Calendar size={10} className="inline mr-1" />Fecha documento</p>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-green-600"
                  defaultValue={expediente.fecha_documento?.split('T')[0] || ''}
                  onBlur={async (e) => {
                    const val = e.target.value;
                    if (val === (expediente.fecha_documento?.split('T')[0] || '')) return;
                    try { await apiService.patch(`/ambiental/expedientes/${id}`, { fecha_documento: val || null }); setExpediente(prev => ({ ...prev, fecha_documento: val || null })); toast.success('Fecha actualizada'); } catch { toast.error('Error al guardar'); }
                  }} />
              </div>

              {/* Fecha vencimiento */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5"><Calendar size={10} className="inline mr-1" />Fecha vencimiento</p>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-green-600"
                  defaultValue={expediente.fecha_vencimiento?.split('T')[0] || ''}
                  onBlur={async (e) => {
                    const val = e.target.value;
                    if (!val) return;
                    try { await apiService.patch(`/ambiental/expedientes/${id}`, { fecha_vencimiento: val }); await cargarDatos(); toast.success('Fecha actualizada'); } catch { toast.error('Error al guardar'); }
                  }} />
              </div>

              {/* Registrado */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Registrado</p>
                <p className="text-sm font-semibold text-gray-700">{new Date(expediente.created_at).toLocaleDateString('es-CO')}</p>
              </div>

              {/* Enlace al PDF original */}
              <div className="col-span-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5"><LinkIcon size={10} className="inline mr-1" />Enlace PDF original</p>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    defaultValue={expediente.enlace_pdf || ''}
                    placeholder="https://..."
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-green-600"
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      if (val === (expediente.enlace_pdf || '')) return;
                      try {
                        await apiService.patch(`/ambiental/expedientes/${id}`, { enlace_pdf: val || null });
                        setExpediente(prev => ({ ...prev, enlace_pdf: val || null }));
                        toast.success('Enlace guardado.');
                      } catch { toast.error('URL inválida o error al guardar.'); }
                    }}
                  />
                  {expediente.enlace_pdf && (
                    <a href={expediente.enlace_pdf} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors shrink-0">
                      <ExternalLink size={11} /> Abrir
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Pagos inactivos */}
            {pagosInactivos.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pagos desactivados</p>
                <div className="space-y-1.5">
                  {pagosInactivos.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 line-through flex-1">
                        <strong>{p.valor}</strong>{p.descripcion ? ` · ${p.descripcion}` : ''}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            const { data } = await apiService.patch(`/ambiental/expedientes/${id}/pagos/${p.id}/reactivar`);
                            setPagosInactivos(prev => prev.filter(x => x.id !== p.id));
                            setPagos(prev => [...prev, data]);
                            toast.success('Pago reactivado');
                          } catch { toast.error('Error al reactivar'); }
                        }}
                        className="text-[11px] text-green-600 hover:text-green-800 font-semibold shrink-0 transition-colors"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Obligaciones de pago */}
            {pagos.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Shield size={10} /> Obligaciones de pago
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${pagos.some(p => p.estado === 'Pendiente') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {pagos.filter(p => p.estado === 'Pagado').length}/{pagos.length} pagados
                  </span>
                </p>
                <div className="space-y-2">
                  {pagos.map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <button onClick={async () => { const nuevoEstado = p.estado === 'Pagado' ? 'Pendiente' : 'Pagado'; try { await apiService.patch(`/ambiental/expedientes/${id}/pagos/${p.id}`, { estado: nuevoEstado }); setPagos(prev => prev.map(x => x.id === p.id ? { ...x, estado: nuevoEstado } : x)); } catch { toast.error('Error al actualizar el pago'); } }}
                        className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${p.estado === 'Pagado' ? 'bg-green-500 border-green-500 text-white' : 'border-red-300 hover:border-red-500'}`}>
                        {p.estado === 'Pagado' && <Check size={9} />}
                      </button>
                      <span className={`text-xs flex-1 ${p.estado === 'Pagado' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        <strong>{formatearValor(p.valor)}</strong>{p.descripcion ? ` · ${p.descripcion}` : ''}{p.plazo ? ` · ${p.plazo}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Card recurso / vencimiento ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ¿Admite recurso? */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">¿Admite recurso?</p>
          {expediente.admite_recurso ? (
            <>
              <p className={`text-2xl font-black ${expediente.admite_recurso === 'Sí' ? 'text-green-600' : expediente.admite_recurso === 'No' ? 'text-red-500' : 'text-yellow-600'}`}>
                {expediente.admite_recurso}
              </p>
              {expediente.plazo_respuesta && (
                <p className="text-xs text-gray-400 mt-1">{expediente.plazo_respuesta}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-300 italic">Sin analizar</p>
          )}
        </div>

        {/* Vencimiento */}
        <div className={`rounded-2xl border shadow-sm px-5 py-4 ${
          expediente.fecha_vencimiento
            ? (() => {
                const dias = Math.ceil((new Date(expediente.fecha_vencimiento) - new Date()) / 86400000);
                return dias < 0 ? 'bg-red-50 border-red-200' : dias <= 7 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100';
              })()
            : 'bg-white border-gray-100'
        }`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vencimiento</p>
          {expediente.fecha_vencimiento ? (() => {
            const dias = Math.ceil((new Date(expediente.fecha_vencimiento) - new Date()) / 86400000);
            const vencido = dias < 0;
            return (
              <>
                <p className={`text-2xl font-black ${vencido ? 'text-red-600' : dias <= 7 ? 'text-orange-600' : 'text-gray-700'}`}>
                  {vencido ? `−${Math.abs(dias)}d` : `${dias}d`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(expediente.fecha_vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </>
            );
          })() : (
            <p className="text-sm text-gray-300 italic">Sin fecha</p>
          )}
        </div>
      </div>

      {/* ── Obligaciones de pago ─────────────────────────────────────────── */}
      {pagos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1.5 shrink-0">
              <Shield size={12} /> Pagos
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pagos.some(p => p.estado === 'Pendiente') ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
                {pagos.filter(p => p.estado === 'Pagado').length}/{pagos.length}
              </span>
            </span>
            <div className="w-px h-4 bg-gray-100 shrink-0" />
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {pagos.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 group">
                  <button
                    onClick={async () => {
                      const nuevoEstado = p.estado === 'Pagado' ? 'Pendiente' : 'Pagado';
                      try { await apiService.patch(`/ambiental/expedientes/${id}/pagos/${p.id}`, { estado: nuevoEstado }); setPagos(prev => prev.map(x => x.id === p.id ? { ...x, estado: nuevoEstado } : x)); }
                      catch { toast.error('Error al actualizar el pago'); }
                    }}
                    className={`flex items-center gap-1.5 text-xs transition-all ${p.estado === 'Pagado' ? 'text-gray-400 line-through' : 'text-gray-600 hover:text-green-700'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${p.estado === 'Pagado' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                      {p.estado === 'Pagado' && <Check size={8} />}
                    </span>
                    <span className="font-semibold">{formatearValor(p.valor)}</span>
                    {p.descripcion && <span className="text-gray-400 hidden sm:inline">· {p.descripcion}</span>}
                  </button>
                  <button
                    onClick={async () => {
                      try { await apiService.delete(`/ambiental/expedientes/${id}/pagos/${p.id}`); setPagos(prev => prev.filter(x => x.id !== p.id)); }
                      catch { toast.error('Error al desactivar el pago'); }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all ml-0.5"
                    title="No aplica"
                  >
                    <span className="text-[11px] leading-none">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stepper ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-4">
        {/* Mobile: scroll horizontal para que quepan todos los pasos */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex items-start min-w-max sm:min-w-0">
            {pasos.map((paso, i) => {
              const isActive = tab === paso.key;
              const isDone   = paso.done;
              const isLast   = i === pasos.length - 1;
              return (
                <div key={paso.key} className="flex items-start">
                  {/* Paso */}
                  <button
                    onClick={() => setTab(paso.key)}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    {/* Círculo */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all border-2 ${
                      isActive ? 'border-green-700 bg-green-700 text-white' :
                      isDone   ? 'border-green-600 bg-green-50 text-green-700' :
                                 'border-gray-200 bg-white text-gray-400'
                    }`}>
                      {isDone && !isActive ? <Check size={12} /> : paso.num}
                    </div>
                    {/* Label — oculto en móvil salvo el activo */}
                    <div className="text-center">
                      <p className={`text-xs font-bold leading-none whitespace-nowrap ${
                        isActive ? 'text-green-700' : isDone ? 'text-green-600' : 'text-gray-400'
                      } ${!isActive ? 'hidden sm:block' : ''}`}>
                        {paso.label}
                      </p>
                      {paso.optional && !isDone && (
                        <p className="text-[10px] text-gray-300 mt-0.5 hidden sm:block">opcional</p>
                      )}
                    </div>
                  </button>
                  {/* Línea conectora */}
                  {!isLast && (
                    <div className={`w-8 sm:w-12 h-px mt-3.5 mx-1 shrink-0 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB: Análisis LLM */}
      {tab === 'analisis' && analisis && (
        <div className="space-y-4">

          {/* Resumen ejecutivo */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={13} /> Resumen ejecutivo
              </h2>
              <div className="flex items-center gap-2">
                {analisis.resumen?.includes('[Sección adicional]') && !editandoResumen && (
                  <button
                    onClick={() => setMostrarConsolidar(v => !v)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    {mostrarConsolidar ? 'Cancelar' : 'Consolidar resumen'}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (editandoResumen) {
                      setEditandoResumen(false);
                    } else {
                      setResumenEdit(analisis.resumen || '');
                      setEditandoResumen(true);
                      setMostrarConsolidar(false);
                    }
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                  title={editandoResumen ? 'Cancelar edición' : 'Editar resumen'}
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>

            {editandoResumen ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={resumenEdit}
                  onChange={e => setResumenEdit(e.target.value)}
                  rows={6}
                  className="w-full text-sm text-gray-700 border border-green-300 rounded-xl p-3 resize-none focus:ring-2 focus:ring-green-500 focus:outline-none leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditandoResumen(false)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >Cancelar</button>
                  <button
                    disabled={guardandoResumenEdit || !resumenEdit.trim()}
                    onClick={async () => {
                      setGuardandoResumenEdit(true);
                      try {
                        await apiService.patch(`/ambiental/expedientes/${id}/analisis/resumen`, { resumen: resumenEdit.trim() });
                        setAnalisis(prev => ({ ...prev, resumen: resumenEdit.trim() }));
                        setEditandoResumen(false);
                        toast.success('Resumen actualizado.');
                      } catch { toast.error('Error al guardar.'); }
                      finally { setGuardandoResumenEdit(false); }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
                  >
                    {guardandoResumenEdit ? <Loader size={12} className="animate-spin" /> : null}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analisis.resumen}</p>
            )}

            {mostrarConsolidar && (
              <div className="border-t border-amber-100 pt-3 space-y-3">
                <p className="text-xs text-amber-700 font-semibold">
                  Copia este prompt, pégalo en tu herramienta de IA y pega el resultado abajo:
                </p>
                <div className="relative">
                  <div className="bg-gray-900 text-green-300 text-xs font-mono p-4 rounded-xl max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed pr-16">
                    {`Tengo los siguientes resúmenes parciales de un instrumento ambiental, generados sección por sección. Necesito que los consolides en UN ÚNICO resumen ejecutivo coherente, en 3-5 oraciones, eliminando repeticiones y contradicciones. Responde ÚNICAMENTE con el texto del resumen consolidado, sin prefijos ni explicaciones.\n\nRESÚMENES PARCIALES:\n${analisis.resumen}`}
                  </div>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(`Tengo los siguientes resúmenes parciales de un instrumento ambiental, generados sección por sección. Necesito que los consolides en UN ÚNICO resumen ejecutivo coherente, en 3-5 oraciones, eliminando repeticiones y contradicciones. Responde ÚNICAMENTE con el texto del resumen consolidado, sin prefijos ni explicaciones.\n\nRESÚMENES PARCIALES:\n${analisis.resumen}`);
                      toast.success('Prompt de consolidación copiado');
                    }}
                    className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                  >
                    <Copy size={11} /> Copiar
                  </button>
                </div>
                <textarea
                  className="w-full h-28 border border-amber-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  placeholder="Pega aquí el resumen consolidado que te dio el LLM..."
                  value={resumenConsolidado}
                  onChange={e => setResumenConsolidado(e.target.value)}
                />
                <button
                  onClick={async () => {
                    if (!resumenConsolidado.trim()) return toast.error('Pega el resumen primero.');
                    setGuardandoResumen(true);
                    try {
                      await apiService.patch(`/ambiental/expedientes/${id}/analisis/resumen`, { resumen: resumenConsolidado });
                      toast.success('Resumen consolidado guardado');
                      setMostrarConsolidar(false);
                      setResumenConsolidado('');
                      await cargarDatos();
                    } catch {
                      toast.error('Error al guardar el resumen');
                    } finally {
                      setGuardandoResumen(false);
                    }
                  }}
                  disabled={guardandoResumen || !resumenConsolidado.trim()}
                  className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {guardandoResumen ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                  Guardar resumen consolidado
                </button>
              </div>
            )}
          </div>

          {/* Hallazgos */}
          {hallazgos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={13} /> Hallazgos ({hallazgos.length})
              </h2>
              <div className="space-y-3">
                {hallazgos.map((h, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">#{h.numero_hallazgo}</span>
                        <span className="text-xs font-bold text-gray-600">{h.tipo}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${prioridadDot[h.prioridad] || 'bg-gray-300'}`} />
                        <span className="text-[10px] font-bold text-gray-400">{h.prioridad}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{h.descripcion}</p>
                    {h.norma_infringida && (
                      <p className="text-xs text-red-600 font-semibold mb-1">Norma: {h.norma_infringida}</p>
                    )}
                    {h.recomendacion && (
                      <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">Recomendación: {h.recomendacion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Normas citadas */}
          {normas.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={13} /> Normas citadas
              </h2>
              <div className="divide-y divide-gray-50">
                {normas.map((n, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">{n.instrumento}</span>
                      {n.articulo && <span className="text-xs font-semibold text-gray-500">{n.articulo}</span>}
                    </div>
                    {n.descripcion && <p className="text-xs text-gray-500">{n.descripcion}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Sin análisis aún */}
      {tab === 'analisis' && !analisis && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center gap-4">
          <Zap size={32} className="text-gray-200" />
          <div className="text-center">
            <p className="font-bold text-gray-400">Sin análisis todavía</p>
            <p className="text-xs text-gray-400 mt-1">Ve al paso <strong>Analizar</strong> para generar el prompt y guardar los resultados.</p>
          </div>
          <button onClick={() => setTab('llm')}
            className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-800 transition-colors text-sm">
            <Zap size={14} /> Ir a Analizar
          </button>
        </div>
      )}

      {/* TAB: Texto del documento */}
      {tab === 'documento' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Texto extraído</h2>
              {expediente.contenido_texto && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {(expediente.contenido_texto.length / 1000).toFixed(0)}k caracteres
                </p>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={procesandoArchivo}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 disabled:opacity-50 transition-all"
            >
              {procesandoArchivo ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
              {procesandoArchivo ? 'Procesando...' : 'Subir nuevo archivo'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleProcesarArchivo} />

          {!expediente.contenido_texto ? (
            <p className="text-xs text-gray-400 italic py-8 text-center">
              No hay texto extraído. Sube un archivo PDF, DOCX o TXT para extraer el contenido.
            </p>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-sm text-gray-800 leading-7 max-h-[500px] overflow-y-auto space-y-3">
              {expediente.contenido_texto.split(/\n\n+/).map((parrafo, i) =>
                parrafo.trim() ? <p key={i}>{parrafo.replace(/\n/g, ' ').trim()}</p> : null
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Análisis LLM iterativo */}
      {tab === 'llm' && (
      <div className="space-y-4">

        {/* Prompt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prompt de análisis</h2>
            <div className="flex gap-2">
              {expediente.contenido_texto && (
                <button onClick={handleRegenerarPrompt} disabled={generandoPrompt}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors">
                  {generandoPrompt ? <Loader size={13} className="animate-spin" /> : <Zap size={13} />}
                  {expediente.prompt_generado ? 'Regenerar' : 'Generar'}
                </button>
              )}
            </div>
          </div>

          {!expediente.contenido_texto ? (
            <div>
              <p className="text-xs text-gray-400 italic mb-3">No hay texto extraído. Sube un archivo primero.</p>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-800 transition-colors text-sm">
                <Upload size={14} /> Subir archivo
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleProcesarArchivo} />
            </div>
          ) : !expediente.prompt_generado ? (
            <p className="text-xs text-gray-400 italic">Haz clic en "Generar" para crear el prompt.</p>
          ) : <PromptVisor prompt={expediente.prompt_generado} seccionPrompt={seccionPrompt} setSeccionPrompt={setSeccionPrompt} copiadoSeccion={copiadoSeccion} setCopiadoSeccion={setCopiadoSeccion} labelInline seccionesGuardadas={expediente.secciones_analizadas || []} />}
        </div>

        {/* Pegar respuesta del LLM */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pegar respuesta del LLM</h2>
          <textarea
            className="w-full h-48 border border-gray-200 rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-green-600 resize-none"
            placeholder={'{\n  "que_ordena": "...",\n  "admite_recurso": "Sí",\n  "plazo_respuesta": "...",\n  "pagos": [\n    { "descripcion": "Multa", "valor": "$5.000.000 COP", "plazo": "30 días...", "estado": "Pendiente" }\n  ],\n  "nivel_riesgo": "Alto",\n  "resumen": "...",\n  "hallazgos": [...],\n  "normas_citadas": [...]\n}'}
            value={jsonLlm}
            onChange={e => setJsonLlm(e.target.value)}
          />

          <div className="flex gap-3 flex-wrap">
            {analisis && (
              <button
                onClick={() => handleGuardarAnalisis('acumular', seccionPrompt + 1)}
                disabled={guardandoAnalisis || !jsonLlm.trim()}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {guardandoAnalisis ? <Loader size={15} className="animate-spin" /> : <Plus size={15} />}
                Acumular hallazgos
              </button>
            )}
            <button
              onClick={() => handleGuardarAnalisis('reemplazar')}
              disabled={guardandoAnalisis || !jsonLlm.trim()}
              className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50 transition-colors ${
                analisis ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {guardandoAnalisis ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
              {analisis ? 'Reemplazar análisis' : 'Guardar análisis'}
            </button>
          </div>

          {analisis && (
            <p className="text-[11px] text-gray-400">
              <strong>Acumular</strong> agrega los hallazgos de esta respuesta a los {hallazgos.length} ya guardados. ·
              <strong> Reemplazar</strong> borra todo y comienza desde cero.
            </p>
          )}
        </div>
      </div>
      )}

      {/* TAB: Redactar recurso */}
      {tab === 'recurso' && analisis && (
        <div className="space-y-4">

          {/* Selección de hallazgos */}
          {hallazgos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={13} /> Seleccionar hallazgos para el recurso
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const todos = new Set(hallazgos.map(h => h.id));
                      setHallazgosSeleccionados(todos);
                      apiService.patch(`/ambiental/expedientes/${id}`, { hallazgos_recurso_ids: [...todos] })
                        .catch(() => toast.error('Error al guardar la selección'));
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => {
                      setHallazgosSeleccionados(new Set());
                      apiService.patch(`/ambiental/expedientes/${id}`, { hallazgos_recurso_ids: [] })
                        .catch(() => toast.error('Error al guardar la selección'));
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    Ninguno
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {hallazgos.map(h => (
                  <label
                    key={h.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      hallazgosSeleccionados.has(h.id)
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hallazgosSeleccionados.has(h.id)}
                      onChange={async () => {
                        setHallazgosSeleccionados(prev => {
                          const next = new Set(prev);
                          next.has(h.id) ? next.delete(h.id) : next.add(h.id);
                          apiService.patch(`/ambiental/expedientes/${id}`, {
                            hallazgos_recurso_ids: [...next],
                          }).catch(() => toast.error('Error al guardar la selección'));
                          return next;
                        });
                      }}
                      className="mt-0.5 accent-green-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{h.numero_hallazgo}</span>
                        <span className="text-xs font-bold text-gray-600">{h.tipo}</span>
                        <div className={`w-2 h-2 rounded-full ${prioridadDot[h.prioridad] || 'bg-gray-300'}`} />
                        <span className="text-[10px] text-gray-400">{h.prioridad}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{h.descripcion}</p>
                      {h.norma_infringida && (
                        <p className="text-[11px] text-red-600 font-semibold mt-0.5">Norma: {h.norma_infringida}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Argumentos del abogado */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Scale size={13} /> Argumentos del abogado
              </h2>
              {guardandoArgumentos && (
                <span className="text-[11px] text-green-600 flex items-center gap-1">
                  <Loader size={11} className="animate-spin" /> Guardando...
                </span>
              )}
            </div>
            <textarea
              className="w-full h-36 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-600 resize-none leading-relaxed"
              placeholder="Escribe aquí tus argumentos, contexto adicional o postura jurídica que debe reflejar el recurso. Se guardan automáticamente al salir del campo."
              value={argumentosRecurso}
              onChange={e => setArgumentosRecurso(e.target.value)}
              onBlur={async () => {
                const valor = argumentosRecurso;
                const anterior = expediente.argumentos_recurso || '';
                if (valor === anterior) return;
                setGuardandoArgumentos(true);
                try {
                  await apiService.patch(`/ambiental/expedientes/${id}`, { argumentos_recurso: valor });
                  setExpediente(prev => ({ ...prev, argumentos_recurso: valor }));
                } catch {
                  toast.error('Error al guardar los argumentos');
                } finally {
                  setGuardandoArgumentos(false);
                }
              }}
            />
            <p className="text-[11px] text-gray-400">Se guardan automáticamente al salir del campo.</p>
          </div>

          {/* Generar prompt */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={13} /> Prompt para el LLM
            </h2>

            <button
              onClick={() => {
                const seleccionados = hallazgos.filter(h => hallazgosSeleccionados.has(h.id));
                setPromptRecurso(construirPromptRecurso(expediente, analisis, seleccionados, argumentosRecurso));
              }}
              className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors text-sm"
            >
              <Zap size={15} /> Generar prompt
              {hallazgosSeleccionados.size > 0 && (
                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {hallazgosSeleccionados.size} hallazgo{hallazgosSeleccionados.size !== 1 ? 's' : ''}
                </span>
              )}
            </button>

            {promptRecurso && (
              <div className="space-y-2">
                <div className="relative">
                  <div className="bg-gray-900 text-green-300 text-xs font-mono p-4 rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed pr-16">
                    {promptRecurso}
                  </div>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(promptRecurso);
                      setCopiadoRecurso(true);
                      setTimeout(() => setCopiadoRecurso(false), 2000);
                      toast.success('Prompt copiado');
                    }}
                    className={`absolute top-2 right-2 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                      copiadoRecurso ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {copiadoRecurso ? <Check size={12} /> : <Copy size={12} />}
                    {copiadoRecurso ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pegar respuesta JSON y exportar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Send size={13} /> Pegar respuesta del LLM
            </h2>
            <textarea
              className={`w-full h-48 border rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 resize-none leading-relaxed ${
                errorParseRecurso ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-green-600'
              }`}
              placeholder={'{\n  "tipo_recurso": "Reposición y en subsidio de apelación",\n  "identificacion_acto": "...",\n  "fundamentos_hecho": "...",\n  "fundamentos_derecho": "...",\n  "argumentos_por_cargo": [{ "cargo": "...", "respuesta": "..." }],\n  "pretensiones": "...",\n  "conclusion": "..."\n}'}
              value={jsonRecurso}
              onChange={e => {
                setJsonRecurso(e.target.value);
                setRecursoParseado(null);
                setErrorParseRecurso('');
              }}
            />

            {errorParseRecurso && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                <AlertTriangle size={13} /> {errorParseRecurso}
              </p>
            )}

            <button
              onClick={async () => {
                if (!jsonRecurso.trim()) return toast.error('Pega el JSON del recurso primero.');
                let parsed;
                try {
                  parsed = JSON.parse(jsonRecurso);
                } catch {
                  setErrorParseRecurso('El JSON no es válido. Verifica que el LLM respondió en el formato correcto.');
                  setRecursoParseado(null);
                  return;
                }
                setRecursoParseado(parsed);
                setErrorParseRecurso('');
                setGuardandoRecursoJson(true);
                try {
                  await apiService.patch(`/ambiental/expedientes/${id}`, { recurso_llm_json: jsonRecurso });
                  toast.success('Recurso cargado y guardado');
                } catch {
                  toast.error('Recurso cargado pero no se pudo guardar en el servidor');
                } finally {
                  setGuardandoRecursoJson(false);
                }
              }}
              disabled={!jsonRecurso.trim() || guardandoRecursoJson}
              className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 transition-colors text-sm"
            >
              {guardandoRecursoJson ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {guardandoRecursoJson ? 'Guardando...' : 'Cargar recurso'}
            </button>

            {/* Preview del recurso parseado */}
            {recursoParseado && (
              <div className="border border-green-200 rounded-xl overflow-hidden">
                <div className="bg-green-50 border-b border-green-200 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-green-800 flex items-center gap-2">
                    <Scale size={13} /> {recursoParseado.tipo_recurso || 'Recurso'}
                  </span>
                  <button
                    onClick={() => {
                      setExportandoRecurso(true);
                      try {
                        generarRecursoPDF(expediente, recursoParseado);
                      } catch {
                        toast.error('Error al generar el PDF');
                      } finally {
                        setExportandoRecurso(false);
                      }
                    }}
                    disabled={exportandoRecurso}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
                  >
                    {exportandoRecurso ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
                    Exportar PDF
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    ['Identificación del acto', recursoParseado.identificacion_acto],
                    ['Fundamentos de hecho', recursoParseado.fundamentos_hecho],
                    ['Fundamentos de derecho', recursoParseado.fundamentos_derecho],
                    ['Pretensiones', recursoParseado.pretensiones],
                    ['Conclusión y solicitud', recursoParseado.conclusion],
                  ].filter(([, v]) => v != null && v !== '').map(([titulo, texto]) => (
                    <div key={titulo} className="px-4 py-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{titulo}</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {Array.isArray(texto) ? texto.join('\n') : String(texto)}
                      </p>
                    </div>
                  ))}
                  {recursoParseado.argumentos_por_cargo?.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Análisis cargo por cargo</p>
                      <div className="space-y-3">
                        {recursoParseado.argumentos_por_cargo.map((item, i) => (
                          <div key={i} className="border border-gray-100 rounded-lg p-3">
                            <p className="text-xs font-bold text-red-600 mb-1">Cargo {i + 1}: {item.cargo}</p>
                            <p className="text-xs text-gray-700 leading-relaxed">{item.respuesta}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB: Respuesta eliminada — datos migrados a Comunicaciones */}
      {false && (
        <div className="space-y-6 hidden">

          {/* Texto ya guardado */}
          {expediente?.respuesta_entidad_texto && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Texto de la respuesta registrada</h3>
                {expediente.fecha_respuesta && (
                  <span className="text-xs text-gray-400">
                    Recibida: {new Date(expediente.fecha_respuesta).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              <textarea
                readOnly
                value={expediente.respuesta_entidad_texto}
                rows={8}
                className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none font-mono leading-relaxed"
              />
              <button
                onClick={() => {
                  const doc = new jsPDF();
                  const verde = [22, 101, 52];
                  doc.setFillColor(...verde);
                  doc.rect(0, 0, 210, 28, 'F');
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(14);
                  doc.setFont('helvetica', 'bold');
                  doc.text('RESPUESTA DE LA ENTIDAD', 14, 12);
                  doc.setFontSize(9);
                  doc.setFont('helvetica', 'normal');
                  doc.text(expediente.titulo || '', 14, 20);
                  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 150, 20);
                  let y = 36;
                  doc.setTextColor(75, 85, 99);
                  doc.setFontSize(9);
                  const lines = doc.splitTextToSize(expediente.respuesta_entidad_texto, 182);
                  lines.forEach(line => {
                    if (y > 275) { doc.addPage(); y = 14; }
                    doc.text(line, 14, y);
                    y += 5;
                  });
                  doc.save(`respuesta-entidad-${expediente.numero_expediente || expediente.id}.pdf`);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
              >
                <Download size={13} /> Exportar texto como PDF
              </button>
            </div>
          )}

          {/* Subir nueva respuesta */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-700">
              {expediente?.respuesta_entidad_texto ? 'Reemplazar documento de respuesta' : 'Registrar respuesta de la entidad'}
            </h3>
            <p className="text-xs text-gray-500">
              Sube el PDF o DOCX de la respuesta. El sistema extrae el texto, lo guarda y genera un prompt para que el LLM evalúe si la respuesta es favorable y si procede recurso.
            </p>

            <input type="hidden" ref={fileRespuestaRef} />
            <input
              type="file"
              id="file-respuesta"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setProcesandoRespuesta(true);
                setPromptRespuesta('');
                setJsonRespuesta('');
                setRespuestaParseada(null);
                setErrorParseRespuesta('');
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  const { data } = await apiService.post(`/ambiental/expedientes/${expediente.id}/respuesta`, fd);
                  setExpediente(prev => ({
                    ...prev,
                    respuesta_entidad_texto: data.respuesta_entidad_texto,
                    fecha_respuesta: data.fecha_respuesta,
                  }));
                  setPromptRespuesta(data.prompt_respuesta);
                  toast.success('Respuesta registrada correctamente');
                } catch {
                  toast.error('Error al procesar el archivo');
                } finally {
                  setProcesandoRespuesta(false);
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={() => document.getElementById('file-respuesta').click()}
              disabled={procesandoRespuesta}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-xl text-sm font-bold hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {procesandoRespuesta ? <Loader size={15} className="animate-spin" /> : <Upload size={15} />}
              {procesandoRespuesta ? 'Procesando...' : 'Subir documento de respuesta'}
            </button>
          </div>

          {/* Prompt generado */}
          {(promptRespuesta || expediente?.respuesta_entidad_texto) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Prompt para el LLM</h3>
                <div className="flex items-center gap-2">
                  {!promptRespuesta && (
                    <button
                      onClick={async () => {
                        setProcesandoRespuesta(true);
                        try {
                          const fd = new FormData();
                          fd.append('texto', expediente.respuesta_entidad_texto);
                          const { data } = await apiService.post(`/ambiental/expedientes/${expediente.id}/respuesta`, fd);
                          setPromptRespuesta(data.prompt_respuesta);
                        } catch {
                          toast.error('Error al regenerar el prompt');
                        } finally {
                          setProcesandoRespuesta(false);
                        }
                      }}
                      disabled={procesandoRespuesta}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      {procesandoRespuesta ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
                      Regenerar prompt
                    </button>
                  )}
                  {promptRespuesta && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(promptRespuesta); setCopiadoPromptRespuesta(true); setTimeout(() => setCopiadoPromptRespuesta(false), 2000); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copiadoPromptRespuesta ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {copiadoPromptRespuesta ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar prompt</>}
                    </button>
                  )}
                </div>
              </div>
              {promptRespuesta && (
                <textarea
                  readOnly
                  value={promptRespuesta}
                  rows={6}
                  className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none font-mono leading-relaxed"
                />
              )}
              {!promptRespuesta && (
                <p className="text-xs text-gray-400 italic">Haz clic en "Regenerar prompt" para volver a generar el prompt de análisis.</p>
              )}
            </div>
          )}

          {/* Pegar respuesta del LLM */}
          {(promptRespuesta || expediente?.respuesta_entidad_texto) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Respuesta del LLM (JSON)</h3>
              <p className="text-xs text-gray-400">Pega aquí el JSON que devolvió el LLM tras analizar la respuesta de la entidad.</p>
              <textarea
                value={jsonRespuesta}
                onChange={e => { setJsonRespuesta(e.target.value); setRespuestaParseada(null); setErrorParseRespuesta(''); }}
                rows={6}
                placeholder='{ "valoracion": "Favorable", ... }'
                className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none font-mono leading-relaxed focus:ring-2 focus:ring-green-600 outline-none"
              />
              <button
                onClick={async () => {
                  try {
                    const p = JSON.parse(jsonRespuesta);
                    setRespuestaParseada(p);
                    setErrorParseRespuesta('');
                    await apiService.patch(`/ambiental/expedientes/${expediente.id}`, { respuesta_llm_json: jsonRespuesta });
                    setExpediente(prev => ({ ...prev, respuesta_llm_json: jsonRespuesta }));
                    toast.success('Evaluación guardada');
                  } catch (err) {
                    if (err.message?.includes('JSON')) {
                      setErrorParseRespuesta('JSON inválido. Verifica el formato.');
                      setRespuestaParseada(null);
                    } else {
                      toast.error('Error al guardar la evaluación');
                    }
                  }
                }}
                disabled={!jsonRespuesta.trim()}
                className="px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition-colors disabled:opacity-40"
              >
                Parsear y guardar
              </button>
              {errorParseRespuesta && <p className="text-xs text-red-600">{errorParseRespuesta}</p>}
            </div>
          )}

          {/* Preview del resultado */}
          {respuestaParseada && (() => {
            const valoracionColor = {
              'Favorable':   'bg-green-100 text-green-700',
              'Desfavorable':'bg-red-100 text-red-700',
              'Parcial':     'bg-yellow-100 text-yellow-700',
            };
            const procedeColor = {
              'Sí':      'bg-red-100 text-red-700',
              'No':      'bg-green-100 text-green-700',
              'Evaluar': 'bg-yellow-100 text-yellow-700',
            };
            return (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-gray-700">Evaluación de la respuesta</h3>
                  <div className="flex items-center gap-2">
                    {respuestaParseada.valoracion && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${valoracionColor[respuestaParseada.valoracion] || 'bg-gray-100 text-gray-600'}`}>
                        {respuestaParseada.valoracion}
                      </span>
                    )}
                    {respuestaParseada.procede_recurso && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${procedeColor[respuestaParseada.procede_recurso] || 'bg-gray-100 text-gray-600'}`}>
                        Recurso: {respuestaParseada.procede_recurso}
                      </span>
                    )}
                    <button
                      onClick={() => generarRespuestaPDF(expediente, respuestaParseada)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                    >
                      <Download size={12} /> Exportar PDF
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {respuestaParseada.resumen && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resumen</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{respuestaParseada.resumen}</p>
                    </div>
                  )}
                  {respuestaParseada.cumplimiento && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cumplimiento</p>
                      <p className="text-sm text-gray-700">{respuestaParseada.cumplimiento}</p>
                    </div>
                  )}
                  {respuestaParseada.tipo_recurso && respuestaParseada.tipo_recurso !== 'No aplica' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-amber-800">Tipo de recurso: {respuestaParseada.tipo_recurso}</p>
                      {respuestaParseada.plazo_recurso && <p className="text-xs text-amber-700">⏳ {respuestaParseada.plazo_recurso}</p>}
                      {respuestaParseada.fundamentos_recurso && (
                        <p className="text-xs text-amber-700 leading-relaxed">{respuestaParseada.fundamentos_recurso}</p>
                      )}
                    </div>
                  )}
                  {respuestaParseada.recomendaciones?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Recomendaciones</p>
                      <ul className="space-y-1.5">
                        {respuestaParseada.recomendaciones.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                            <span className="mt-0.5 w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0 text-[10px]">{i + 1}</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {respuestaParseada.observaciones && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observaciones</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{respuestaParseada.observaciones}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Cerrar trámite */}
          {expediente?.respuesta_entidad_texto && expediente?.estado !== 'Cerrado' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">Cerrar trámite</p>
                <p className="text-xs text-slate-500 mt-0.5">Marca este expediente como cerrado. El historial y los documentos se conservan.</p>
              </div>
              <button
                disabled={cerrandoTramite}
                onClick={async () => {
                  setCerrandoTramite(true);
                  try {
                    await apiService.patch(`/ambiental/expedientes/${expediente.id}`, { estado: 'Cerrado' });
                    setExpediente(prev => ({ ...prev, estado: 'Cerrado' }));
                    toast.success('Trámite cerrado');
                  } catch {
                    toast.error('Error al cerrar el trámite');
                  } finally {
                    setCerrandoTramite(false);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
              >
                {cerrandoTramite ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
                Cerrar trámite
              </button>
            </div>
          )}

          {expediente?.estado === 'Cerrado' && (
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-center gap-3">
              <Shield size={18} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-600">Trámite cerrado</p>
                <p className="text-xs text-slate-400">Este expediente fue cerrado. Puedes reabrirlo cambiando el estado desde los detalles.</p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB: Comunicaciones */}
      {tab === 'comunicaciones' && (
        <div className="space-y-5">

          {/* Cabecera + filtros + botón nueva */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              {['todas', 'entrante', 'saliente'].map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroCom(f)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                    filtroCom === f
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                  }`}
                >{f === 'todas' ? 'Todas' : f === 'entrante' ? '← Entrantes' : 'Salientes →'}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const next = !mostrarInactivas;
                  setMostrarInactivas(next);
                  if (next && comunicacionesInactivas.length === 0) {
                    try {
                      const { data } = await apiService.get(`/ambiental/expedientes/${id}/comunicaciones/inactivas`);
                      setComunicacionesInactivas(data);
                    } catch { toast.error('Error al cargar eliminadas.'); }
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} /> {mostrarInactivas ? 'Ocultar eliminadas' : 'Ver eliminadas'}
              </button>
              <button
                onClick={() => setMostrarFormCom(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
              >
                <Plus size={13} /> Nueva comunicación
              </button>
            </div>
          </div>

          {/* Formulario colapsable */}
          {mostrarFormCom && (
            <div className="bg-white border border-green-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-800">Registrar comunicación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección *</label>
                  <select
                    value={formCom.direccion}
                    onChange={e => setFormCom(p => ({ ...p, direccion: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="entrante">← Entrante (de la entidad)</option>
                    <option value="saliente">Saliente → (de Enel)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha del documento *</label>
                  <input
                    type="date"
                    value={formCom.fecha}
                    onChange={e => setFormCom(p => ({ ...p, fecha: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Asunto *</label>
                <input
                  type="text"
                  value={formCom.asunto}
                  onChange={e => setFormCom(p => ({ ...p, asunto: e.target.value }))}
                  placeholder="Ej: Requerimiento de información adicional"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  value={formCom.descripcion}
                  onChange={e => setFormCom(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Nota breve sobre el contenido"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Enlace al original (opcional)</label>
                <input
                  type="url"
                  value={formCom.enlace}
                  onChange={e => setFormCom(p => ({ ...p, enlace: e.target.value }))}
                  placeholder="https://..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Archivo PDF / Word (opcional)</label>
                <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl px-4 py-3 transition-colors">
                  <Upload size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-500 truncate">
                    {archivoCom ? archivoCom.name : 'Seleccionar archivo'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={e => setArchivoCom(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setMostrarFormCom(false); setFormCom({ direccion: 'entrante', asunto: '', fecha: '', descripcion: '', enlace: '' }); setArchivoCom(null); }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >Cancelar</button>
                <button
                  disabled={guardandoCom || !formCom.asunto.trim() || !formCom.fecha}
                  onClick={async () => {
                    setGuardandoCom(true);
                    try {
                      const fd = new FormData();
                      fd.append('direccion', formCom.direccion);
                      fd.append('asunto', formCom.asunto);
                      fd.append('fecha', formCom.fecha);
                      if (formCom.descripcion) fd.append('descripcion', formCom.descripcion);
                      if (formCom.enlace) fd.append('enlace', formCom.enlace);
                      if (archivoCom) fd.append('file', archivoCom);
                      const { data } = await apiService.post(`/ambiental/expedientes/${id}/comunicaciones`, fd);
                      setComunicaciones(prev => [...prev, data].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
                      setMostrarFormCom(false);
                      setFormCom({ direccion: 'entrante', asunto: '', fecha: '', descripcion: '', enlace: '' });
                      setArchivoCom(null);
                      toast.success('Comunicación registrada.');
                    } catch { toast.error('Error al guardar.'); }
                    finally { setGuardandoCom(false); }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
                >
                  {guardandoCom ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Panel de eliminadas */}
          {mostrarInactivas && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Comunicaciones eliminadas</p>
              {comunicacionesInactivas.length === 0 ? (
                <p className="text-sm text-gray-400">No hay comunicaciones eliminadas.</p>
              ) : (
                <div className="space-y-2">
                  {comunicacionesInactivas.map(com => (
                    <div key={com.id} className="flex items-center justify-between bg-white border border-red-100 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{com.asunto}</p>
                        <p className="text-[10px] text-gray-400">
                          {com.direccion === 'saliente' ? 'Saliente →' : '← Entrante'} · {new Date(com.fecha).toLocaleDateString('es-CO')}
                          {com.nombre_archivo && ` · ${com.nombre_archivo}`}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await apiService.patch(`/ambiental/expedientes/${id}/comunicaciones/${com.id}/reactivar`);
                            setComunicacionesInactivas(prev => prev.filter(c => c.id !== com.id));
                            const { data } = await apiService.get(`/ambiental/expedientes/${id}/comunicaciones`);
                            setComunicaciones(data);
                            toast.success('Comunicación restaurada.');
                          } catch { toast.error('Error al restaurar.'); }
                        }}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shrink-0"
                      >
                        ↩ Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {loadingComs ? (
            <div className="flex justify-center py-10"><Loader size={20} className="animate-spin text-green-600" /></div>
          ) : (
            (() => {
              const filtradas = comunicaciones.filter(c => filtroCom === 'todas' || c.direccion === filtroCom);
              if (!filtradas.length) return (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No hay comunicaciones registradas{filtroCom !== 'todas' ? ` (${filtroCom}s)` : ''}.
                </div>
              );
              return (
                <div className="relative">
                  {/* Línea vertical central */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />
                  <div className="space-y-6">
                    {filtradas.map(com => {
                      const esEnel = com.direccion === 'saliente';
                      const expanded = expandedCom === com.id;
                      return (
                        <div key={com.id} className={`flex ${esEnel ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
                          {/* Burbuja */}
                          <div className={`w-[85%] sm:w-[46%] ${esEnel ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div
                              className={`w-full rounded-2xl border p-4 cursor-pointer transition-shadow hover:shadow-md ${
                                esEnel
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-emerald-50 border-emerald-200'
                              }`}
                              onClick={() => setExpandedCom(expanded ? null : com.id)}
                            >
                              {/* Meta */}
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  esEnel ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {esEnel ? 'Enel →' : '← Entidad'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(com.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-gray-800 leading-snug">{com.asunto}</p>
                              {com.descripcion && <p className="text-xs text-gray-500 mt-1">{com.descripcion}</p>}
                              {com.nombre_archivo && (
                                <div className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  esEnel ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                  <FileText size={10} /> {com.nombre_archivo}
                                </div>
                              )}
                              {com.enlace && (
                                <a
                                  href={com.enlace}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full underline-offset-2 hover:underline ${esEnel ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
                                >
                                  <ExternalLink size={10} /> Ver original
                                </a>
                              )}
                              {com.texto_extraido && (
                                <p className="text-[10px] text-gray-400 mt-1">{expanded ? '▲ Ocultar texto' : '▼ Ver texto extraído'}</p>
                              )}
                            </div>

                            {/* Texto expandido */}
                            {expanded && com.texto_extraido && (
                              <div className="w-full mt-2 bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const doc = new jsPDF();
                                      const W = 210, M = 14, CW = W - M * 2;
                                      const azul   = [37, 99, 235];
                                      const verde  = [5, 150, 105];
                                      const color  = esEnel ? azul : verde;
                                      const colorO = esEnel ? [219, 234, 254] : [209, 250, 229];
                                      const gris   = [71, 85, 105];
                                      const negro  = [15, 23, 42];

                                      // ── Cabecera ──────────────────────────────
                                      doc.setFillColor(...color);
                                      doc.rect(0, 0, W, 38, 'F');
                                      doc.setFillColor(255, 255, 255);
                                      doc.setGState(doc.GState({ opacity: 0.08 }));
                                      doc.rect(0, 0, 4, 38, 'F');
                                      doc.setGState(doc.GState({ opacity: 1 }));

                                      doc.setTextColor(255, 255, 255);
                                      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                                      doc.text('ENEL COLOMBIA — ÁREA AMBIENTAL', M, 10);

                                      const dirLabel = esEnel ? 'COMUNICACIÓN SALIENTE' : 'COMUNICACIÓN ENTRANTE';
                                      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
                                      doc.text(dirLabel, M, 20);

                                      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                                      const fechaStr = new Date(com.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
                                      doc.text(`${esEnel ? 'Enel → Entidad' : 'Entidad → Enel'}  ·  ${fechaStr}`, M, 29);
                                      doc.setFontSize(7);
                                      doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, W - M, 29, { align: 'right' });

                                      // ── Asunto ────────────────────────────────
                                      doc.setFillColor(248, 250, 252);
                                      doc.rect(0, 38, W, 16, 'F');
                                      doc.setTextColor(...gris);
                                      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                                      doc.text('ASUNTO', M, 44);
                                      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
                                      doc.setTextColor(...negro);
                                      const asuntoLines = doc.splitTextToSize(com.asunto, CW);
                                      doc.text(asuntoLines[0], M, 50);

                                      // ── Metadatos (chips) ─────────────────────
                                      let y = 62;
                                      const chips = [
                                        com.nombre_archivo ? `Archivo: ${com.nombre_archivo}` : null,
                                        com.enlace ? `Enlace: ${com.enlace}` : null,
                                        com.descripcion ? `Nota: ${com.descripcion}` : null,
                                      ].filter(Boolean);

                                      if (chips.length) {
                                        chips.forEach(chip => {
                                          const lines = doc.splitTextToSize(chip, CW - 8);
                                          const h = lines.length * 5 + 6;
                                          doc.setFillColor(...colorO);
                                          doc.roundedRect(M, y, CW, h, 2, 2, 'F');
                                          doc.setTextColor(...color);
                                          doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                                          lines.forEach((l, i) => doc.text(l, M + 4, y + 5 + i * 5));
                                          y += h + 3;
                                        });
                                        y += 2;
                                      }

                                      // ── Separador ─────────────────────────────
                                      doc.setFillColor(...color);
                                      doc.rect(M, y, CW, 0.5, 'F');
                                      y += 6;

                                      // ── Título sección texto ──────────────────
                                      doc.setFillColor(...color);
                                      doc.rect(M, y, 3, 9, 'F');
                                      doc.setTextColor(...color);
                                      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                                      doc.text('CONTENIDO DEL DOCUMENTO', M + 6, y + 6.5);
                                      y += 13;

                                      // ── Cuerpo del texto (con markdown) ───────
                                      y = pdfMarkdown(doc, com.texto_extraido, {
                                        startY: y, M, CW,
                                        accent: color, textCol: negro, mutedCol: gris,
                                      });

                                      // ── Pie de página ─────────────────────────
                                      const pages = doc.getNumberOfPages();
                                      for (let p = 1; p <= pages; p++) {
                                        doc.setPage(p);
                                        doc.setFillColor(248, 250, 252);
                                        doc.rect(0, 285, W, 12, 'F');
                                        doc.setTextColor(...gris);
                                        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
                                        doc.text('Enel Colombia — Gestión Ambiental', M, 291);
                                        doc.text(`Página ${p} de ${pages}`, W - M, 291, { align: 'right' });
                                      }

                                      doc.save(`comunicacion-${com.id.slice(0, 8)}.pdf`);
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
                                  ><Download size={10} /> Exportar PDF</button>
                                </div>
                                <textarea
                                  readOnly
                                  value={com.texto_extraido}
                                  rows={8}
                                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2 resize-none font-mono leading-relaxed"
                                />

                                {/* Botón abrir modal de análisis */}
                                {com.texto_extraido && (
                                  <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                                    {com.resultado_llm && (
                                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><Check size={10} /> Análisis guardado</span>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setComModalId(com.id); }}
                                      className={`ml-auto flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${com.resultado_llm ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}
                                    >
                                      <Zap size={10} /> {com.resultado_llm ? 'Ver / actualizar análisis' : 'Analizar con LLM'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Enlace editable */}
                            {expanded && (() => {
                              const ca2 = comAnalisis[com.id] || {};
                              const editandoEnlace = ca2.editandoEnlace;
                              return (
                                <div className="mt-2">
                                  {editandoEnlace ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="url"
                                        defaultValue={com.enlace || ''}
                                        id={`enlace-${com.id}`}
                                        placeholder="https://..."
                                        className="flex-1 text-[10px] border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none"
                                      />
                                      <button
                                        onClick={async () => {
                                          const val = document.getElementById(`enlace-${com.id}`).value.trim();
                                          try {
                                            await apiService.patch(`/ambiental/expedientes/${id}/comunicaciones/${com.id}/enlace`, { enlace: val });
                                            setComunicaciones(prev => prev.map(c => c.id === com.id ? { ...c, enlace: val || null } : c));
                                            toast.success('Enlace guardado');
                                          } catch { toast.error('Error al guardar enlace'); }
                                          setComAnalisis(p => ({ ...p, [com.id]: { ...p[com.id], editandoEnlace: false } }));
                                        }}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                                      ><Check size={10} /></button>
                                      <button
                                        onClick={() => setComAnalisis(p => ({ ...p, [com.id]: { ...p[com.id], editandoEnlace: false } }))}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      ><X size={10} /></button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setComAnalisis(p => ({ ...p, [com.id]: { ...p[com.id], editandoEnlace: true } }))}
                                      className="text-[10px] text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                                    >
                                      <LinkIcon size={10} /> {com.enlace ? 'Editar enlace' : 'Añadir enlace'}
                                    </button>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Eliminar */}
                            <button
                              onClick={async () => {
                                if (!window.confirm('¿Eliminar esta comunicación?')) return;
                                try {
                                  await apiService.delete(`/ambiental/expedientes/${id}/comunicaciones/${com.id}`);
                                  setComunicaciones(prev => prev.filter(c => c.id !== com.id));
                                  toast.success('Comunicación eliminada.');
                                } catch { toast.error('Error al eliminar.'); }
                              }}
                              className="mt-1 text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                            ><Trash2 size={10} /> Eliminar</button>
                          </div>

                          {/* Punto central en la línea */}
                          <div className="relative flex items-start justify-center w-8 shrink-0 pt-4">
                            <div className={`w-3 h-3 rounded-full border-2 border-white ${esEnel ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                          </div>

                          {/* Espacio opuesto */}
                          <div className="w-[46%]" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ── MODAL ANÁLISIS COMUNICACIÓN ─────────────────────────── */}
      {comModalId && (() => {
        const com = comunicaciones.find(c => c.id === comModalId);
        if (!com) return null;
        const ca = comAnalisis[comModalId] || {};
        const savedResult = com.resultado_llm;
        let parsed = null;
        try { if (savedResult) parsed = JSON.parse(savedResult); } catch {}
        const valoracionColor = { Favorable: 'bg-green-100 text-green-700', Desfavorable: 'bg-red-100 text-red-700', Parcial: 'bg-yellow-100 text-yellow-700' };
        const procedeColor    = { 'Sí': 'bg-red-100 text-red-700', 'No': 'bg-green-100 text-green-700', Evaluar: 'bg-yellow-100 text-yellow-700' };

        const exportarPDF = () => {
          const doc = new jsPDF();
          const W = 210, M = 14, CW = W - M * 2;
          const verde  = [5, 150, 105];
          const verdeO = [209, 250, 229];
          const gris   = [71, 85, 105];
          const negro  = [15, 23, 42];
          const ambar  = [251, 191, 36];
          const ambarO = [255, 251, 235];

          const addPage = () => { doc.addPage(); return 20; };
          const checkY = (y, h = 10) => y + h > 278 ? addPage() : y;

          // ── Cabecera ──────────────────────────────────────────────
          doc.setFillColor(...verde);
          doc.rect(0, 0, W, 36, 'F');
          // Acento lateral
          doc.setFillColor(255, 255, 255, 0.15);
          doc.rect(0, 0, 4, 36, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7); doc.setFont('helvetica', 'bold');
          doc.text('ENEL COLOMBIA — ÁREA AMBIENTAL', M, 10);

          doc.setFontSize(14); doc.setFont('helvetica', 'bold');
          doc.text('ANÁLISIS DE COMUNICACIÓN', M, 20);

          doc.setFontSize(8); doc.setFont('helvetica', 'normal');
          const dir = com.direccion === 'saliente' ? 'Saliente (Enel → Entidad)' : 'Entrante (Entidad → Enel)';
          doc.text(`${dir}  ·  ${new Date(com.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, M, 28);

          // Fecha generación (esquina derecha)
          doc.setFontSize(7);
          doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, W - M, 28, { align: 'right' });

          // ── Asunto ────────────────────────────────────────────────
          doc.setFillColor(248, 250, 252);
          doc.rect(0, 36, W, 14, 'F');
          doc.setTextColor(...gris);
          doc.setFontSize(7); doc.setFont('helvetica', 'bold');
          doc.text('ASUNTO', M, 42);
          doc.setFontSize(10); doc.setFont('helvetica', 'bold');
          doc.setTextColor(...negro);
          const asuntoLines = doc.splitTextToSize(com.asunto, CW);
          doc.text(asuntoLines[0], M, 47);

          let y = 58;

          if (parsed) {
            // ── Indicadores ───────────────────────────────────────
            const indicadores = [
              parsed.valoracion    ? { label: 'VALORACIÓN',     value: parsed.valoracion }    : null,
              parsed.cumplimiento  ? { label: 'CUMPLIMIENTO',   value: parsed.cumplimiento }  : null,
              parsed.procede_recurso ? { label: 'RECURSO',      value: parsed.procede_recurso } : null,
            ].filter(Boolean);

            if (indicadores.length) {
              y = checkY(y, 20);
              const boxW = (CW - (indicadores.length - 1) * 4) / indicadores.length;
              indicadores.forEach((ind, i) => {
                const bx = M + i * (boxW + 4);
                doc.setFillColor(...verdeO);
                doc.roundedRect(bx, y, boxW, 16, 2, 2, 'F');
                doc.setTextColor(...verde);
                doc.setFontSize(6); doc.setFont('helvetica', 'bold');
                doc.text(ind.label, bx + boxW / 2, y + 5.5, { align: 'center' });
                doc.setFontSize(9); doc.setFont('helvetica', 'bold');
                doc.text(ind.value, bx + boxW / 2, y + 12, { align: 'center' });
              });
              y += 22;
            }

            // ── Sección helper (con markdown en el contenido) ─────
            const seccion = (titulo, contenido) => {
              if (!contenido) return;
              y = checkY(y, 16);
              doc.setFillColor(...verde);
              doc.rect(M, y, 3, 10, 'F');
              doc.setTextColor(...verde);
              doc.setFontSize(7); doc.setFont('helvetica', 'bold');
              doc.text(titulo, M + 6, y + 7);
              y += 13;
              y = pdfMarkdown(doc, contenido, { startY: y, M, CW, accent: verde, textCol: negro, mutedCol: gris });
              y += 2;
            };

            // ── Resumen ───────────────────────────────────────────
            seccion('RESUMEN', parsed.resumen);

            // ── Recurso (bloque destacado) ────────────────────────
            if (parsed.procede_recurso !== 'No' && parsed.tipo_recurso && parsed.tipo_recurso !== 'No aplica') {
              y = checkY(y, 16);
              doc.setFillColor(...ambarO);
              doc.roundedRect(M, y, CW, 12, 2, 2, 'F');
              doc.setFillColor(...ambar);
              doc.rect(M, y, 3, 12, 'F');
              doc.setTextColor(146, 64, 14);
              doc.setFontSize(7); doc.setFont('helvetica', 'bold');
              doc.text('RECURSO LEGAL', M + 6, y + 5);
              doc.setFontSize(9); doc.setFont('helvetica', 'normal');
              doc.text(`${parsed.tipo_recurso}${parsed.plazo_recurso ? '  ·  ' + parsed.plazo_recurso : ''}`, M + 6, y + 10);
              y += 15;
              if (parsed.fundamentos_recurso) {
                y = pdfMarkdown(doc, parsed.fundamentos_recurso, { startY: y, M: M + 4, CW: CW - 4, accent: [146, 64, 14], textCol: [146, 64, 14], mutedCol: gris });
              }
              y += 4;
            }

            // ── Recomendaciones ───────────────────────────────────
            if (parsed.recomendaciones?.length) {
              y = checkY(y, 14);
              doc.setFillColor(...verde);
              doc.rect(M, y, 3, 10, 'F');
              doc.setTextColor(...verde);
              doc.setFontSize(7); doc.setFont('helvetica', 'bold');
              doc.text('RECOMENDACIONES', M + 6, y + 7);
              y += 13;
              parsed.recomendaciones.forEach((r, i) => {
                y = checkY(y, 10);
                doc.setFillColor(...verdeO);
                doc.circle(M + 3, y + 2.5, 3, 'F');
                doc.setTextColor(...verde);
                doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                doc.text(`${i + 1}`, M + 3, y + 3.5, { align: 'center' });
                y = pdfMarkdown(doc, r, { startY: y, M: M + 10, CW: CW - 10, accent: verde, textCol: negro, mutedCol: gris });
                y += 2;
              });
              y += 4;
            }

            // ── Observaciones ─────────────────────────────────────
            seccion('OBSERVACIONES', parsed.observaciones);

          } else {
            // Fallback: texto plano con markdown
            y = pdfMarkdown(doc, savedResult || '', { startY: y, M, CW, accent: verde, textCol: negro, mutedCol: gris });
          }

          // ── Pie de página ─────────────────────────────────────────
          const pages = doc.getNumberOfPages();
          for (let p = 1; p <= pages; p++) {
            doc.setPage(p);
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 285, W, 12, 'F');
            doc.setTextColor(...gris);
            doc.setFontSize(7); doc.setFont('helvetica', 'normal');
            doc.text('Enel Colombia — Gestión Ambiental', M, 291);
            doc.text(`Página ${p} de ${pages}`, W - M, 291, { align: 'right' });
          }

          doc.save(`analisis-comunicacion-${com.id.slice(0, 8)}.pdf`);
        };

        const cerrar = () => setComModalId(null);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={cerrar}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                    {com.direccion === 'saliente' ? 'Saliente — Enel →' : '← Entrante — Entidad'}
                    {' · '}{new Date(com.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="text-base font-bold text-gray-800">{com.asunto}</h3>
                </div>
                <button onClick={cerrar} className="text-gray-400 hover:text-gray-600 ml-4 shrink-0"><X size={18} /></button>
              </div>

              {/* Body scrollable */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                {/* — Sin resultado aún: generar prompt — */}
                {!savedResult && !ca.prompt && (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-sm text-gray-500">No hay análisis para esta comunicación.</p>
                    <button
                      disabled={ca.generando}
                      onClick={async () => {
                        setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], generando: true } }));
                        try {
                          const { data } = await apiService.post(`/ambiental/expedientes/${id}/comunicaciones/${comModalId}/prompt-analisis`);
                          setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], generando: false, prompt: data.prompt } }));
                        } catch {
                          toast.error('Error al generar el prompt');
                          setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], generando: false } }));
                        }
                      }}
                      className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                    >
                      {ca.generando ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
                      {ca.generando ? 'Generando prompt...' : 'Generar prompt de análisis'}
                    </button>
                  </div>
                )}

                {/* — Prompt generado, esperando resultado — */}
                {ca.prompt && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prompt para el LLM</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(ca.prompt); setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], copiado: true } })); setTimeout(() => setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], copiado: false } })), 2000); }}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${ca.copiado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {ca.copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                        </button>
                      </div>
                      <textarea readOnly value={ca.prompt} rows={7} className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none font-mono leading-relaxed" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resultado del LLM</p>
                      <textarea
                        value={ca.resultado || ''}
                        onChange={e => setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], resultado: e.target.value } }))}
                        rows={6}
                        placeholder='Pega aquí el JSON que devolvió el LLM...'
                        className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-xl p-3 resize-none font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <button
                        disabled={!ca.resultado?.trim() || ca.guardando}
                        onClick={async () => {
                          setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], guardando: true } }));
                          try {
                            await apiService.patch(`/ambiental/expedientes/${id}/comunicaciones/${comModalId}/resultado-llm`, { resultado_llm: ca.resultado });
                            setComunicaciones(prev => prev.map(c => c.id === comModalId ? { ...c, resultado_llm: ca.resultado } : c));
                            toast.success('Análisis guardado');
                            setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], guardando: false, prompt: null } }));
                          } catch {
                            toast.error('Error al guardar');
                            setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], guardando: false } }));
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-sm font-bold hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                      >
                        {ca.guardando ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                        Guardar análisis
                      </button>
                    </div>
                  </div>
                )}

                {/* — Resultado guardado — */}
                {savedResult && !ca.prompt && (
                  <div className="space-y-4">
                    {/* Badges */}
                    {parsed && (
                      <div className="flex flex-wrap gap-2">
                        {parsed.valoracion    && <span className={`text-xs font-bold px-3 py-1 rounded-full ${valoracionColor[parsed.valoracion] || 'bg-gray-100 text-gray-600'}`}>{parsed.valoracion}</span>}
                        {parsed.cumplimiento  && <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">{parsed.cumplimiento}</span>}
                        {parsed.procede_recurso && <span className={`text-xs font-bold px-3 py-1 rounded-full ${procedeColor[parsed.procede_recurso] || 'bg-gray-100 text-gray-600'}`}>Recurso: {parsed.procede_recurso}</span>}
                      </div>
                    )}

                    {parsed ? (
                      <div className="space-y-4">
                        {parsed.resumen && (
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resumen</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{parsed.resumen}</p>
                          </div>
                        )}
                        {parsed.procede_recurso !== 'No' && parsed.tipo_recurso && parsed.tipo_recurso !== 'No aplica' && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-bold text-amber-800">Recurso: {parsed.tipo_recurso}</p>
                            {parsed.plazo_recurso && <p className="text-xs text-amber-700">⏳ {parsed.plazo_recurso}</p>}
                            {parsed.fundamentos_recurso && <p className="text-xs text-amber-700 leading-relaxed">{parsed.fundamentos_recurso}</p>}
                          </div>
                        )}
                        {parsed.recomendaciones?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Recomendaciones</p>
                            <ul className="space-y-2">
                              {parsed.recomendaciones.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-[10px]">{i+1}</span>{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {parsed.observaciones && (
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observaciones</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{parsed.observaciones}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap leading-relaxed overflow-auto">{savedResult}</pre>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex gap-2">
                  {savedResult && (
                    <>
                      <button onClick={exportarPDF} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-800 transition-colors">
                        <Download size={13} /> Exportar PDF
                      </button>
                      <button
                        onClick={async () => {
                          setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], generando: true } }));
                          try {
                            const { data } = await apiService.post(`/ambiental/expedientes/${id}/comunicaciones/${comModalId}/prompt-analisis`);
                            setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], generando: false, prompt: data.prompt } }));
                          } catch {
                            toast.error('Error al generar el prompt');
                            setComAnalisis(p => ({ ...p, [comModalId]: { ...p[comModalId], generando: false } }));
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        <Zap size={13} /> Reanálizar
                      </button>
                    </>
                  )}
                </div>
                <button onClick={cerrar} className="text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TAB PRECEDENTES ─────────────────────────────────────── */}
      {tab === 'precedentes' && (
        <div className="space-y-5">
          {!similaresBuscados && !loadingSimilares && !similaresError && (
            <div className="text-center py-10">
              <button
                onClick={cargarSimilares}
                className="flex items-center gap-2 mx-auto bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors"
              >
                <Search size={16} /> Buscar precedentes similares
              </button>
              <p className="text-xs text-gray-400 mt-2">Busca expedientes con análisis similar en el sistema</p>
            </div>
          )}

          {similaresBuscados && similares.length === 0 && !loadingSimilares && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Search size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold text-gray-400">Sin precedentes similares</p>
              <p className="text-xs text-gray-400 mt-1">No se encontraron expedientes con similitud suficiente (mínimo 65%)</p>
              <button onClick={cargarSimilares} className="mt-3 text-xs text-green-700 hover:underline">Buscar de nuevo</button>
            </div>
          )}

          {loadingSimilares && (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Buscando precedentes...</span>
            </div>
          )}

          {similaresError === 'sin-embedding' && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <FileText size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold text-gray-400">Este expediente aún no tiene índice semántico</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Genera el índice para poder buscar precedentes similares</p>
              <button
                onClick={generarEmbedding}
                className="flex items-center gap-2 mx-auto bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors text-sm"
              >
                <Zap size={15} /> Generar índice semántico
              </button>
            </div>
          )}

          {similaresError === 'error' && (
            <div className="text-center py-8 text-red-400 text-sm">Error al buscar precedentes.</div>
          )}

          {similares.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">{similares.length} expediente{similares.length !== 1 ? 's' : ''} similar{similares.length !== 1 ? 'es' : ''} encontrado{similares.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-400">{seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''} para comparar</p>
              </div>

              <div className="space-y-3">
                {similares.map(s => {
                  const sel = seleccionados.has(s.id);
                  const pct = Math.round(s.similitud * 100);
                  const color = pct >= 85 ? 'text-green-700 bg-green-50' : pct >= 70 ? 'text-amber-700 bg-amber-50' : 'text-gray-500 bg-gray-100';
                  const riesgoCfg = { 'Crítico': 'text-red-700 bg-red-50', 'Alto': 'text-orange-700 bg-orange-50', 'Medio': 'text-yellow-700 bg-yellow-50', 'Bajo': 'text-green-700 bg-green-50' };
                  return (
                    <div
                      key={s.id}
                      className={`rounded-2xl border p-4 transition-all cursor-pointer ${sel ? 'border-green-500 bg-green-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      onClick={() => toggleSeleccionado(s.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${sel ? 'bg-green-700 border-green-700' : 'border-gray-300'}`}>
                          {sel && <Check size={11} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${color}`}>{pct}% similitud</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{s.tipo_instrumento}</span>
                            {s.nivel_riesgo && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${riesgoCfg[s.nivel_riesgo] || 'text-gray-500 bg-gray-100'}`}>Riesgo {s.nivel_riesgo}</span>}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.estado}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 truncate">{s.titulo}</p>
                          {s.entidad_nombre && <p className="text-xs text-gray-500">{s.entidad_nombre}</p>}
                          {s.resumen && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.resumen.slice(0, 180)}{s.resumen.length > 180 ? '…' : ''}</p>
                          )}
                        </div>
                        <a
                          href={`/ambiental/expediente/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                          title="Abrir expediente"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={generarPromptComparativo}
                disabled={generandoComparativo || seleccionados.size === 0}
                className="w-full flex items-center justify-center gap-2 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generandoComparativo
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
                  : <><Zap size={16} /> Generar prompt comparativo ({seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''})</>
                }
              </button>
            </>
          )}

          {promptComparativo && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Prompt comparativo</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(promptComparativo); toast.success('Copiado al portapapeles'); }}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
                  >
                    <Copy size={12} /> Copiar
                  </button>
                </div>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{promptComparativo}</pre>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Resultado del análisis comparativo</p>
                {(() => {
                  let parsed = null;
                  try { parsed = JSON.parse(resultadoComparativo); } catch {}
                  if (parsed) {
                    const riesgoColor = { Bajo: 'bg-green-900 text-green-300', Medio: 'bg-yellow-900 text-yellow-300', Alto: 'bg-orange-900 text-orange-300', Crítico: 'bg-red-900 text-red-300' };
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          {parsed.riesgo_sugerido && (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${riesgoColor[parsed.riesgo_sugerido] || 'bg-gray-800 text-gray-300'}`}>
                              Riesgo sugerido: {parsed.riesgo_sugerido}
                            </span>
                          )}
                          {parsed.precedente_mas_relevante && (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-900 text-blue-300">
                              Ref: {parsed.precedente_mas_relevante}
                            </span>
                          )}
                        </div>
                        {[
                          { key: 'patrones', label: 'Patrones identificados' },
                          { key: 'comparacion_riesgo', label: 'Comparación de riesgo' },
                          { key: 'argumentos_efectivos', label: 'Argumentos que han funcionado' },
                          { key: 'diferencias_clave', label: 'Diferencias clave' },
                        ].filter(s => parsed[s.key]).map(s => (
                          <div key={s.key} className="bg-gray-900 rounded-xl p-4 border-l-[3px] border-green-600">
                            <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">{s.label}</p>
                            <p className="text-sm text-gray-300 leading-relaxed">{parsed[s.key]}</p>
                          </div>
                        ))}
                        {parsed.recomendaciones?.length > 0 && (
                          <div className="bg-gray-900 rounded-xl p-4 border-l-[3px] border-emerald-500">
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Recomendaciones estratégicas</p>
                            <ol className="space-y-2">
                              {parsed.recomendaciones.map((r, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-300">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-800 text-emerald-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const doc = new jsPDF();
                              const W = 210, M = 14, CW = W - M * 2;
                              const verde = [5, 150, 105];
                              const verdeO = [209, 250, 229];
                              const gris  = [71, 85, 105];
                              const negro = [15, 23, 42];

                              const checkY = (y, h = 10) => { if (y + h > 278) { doc.addPage(); return 20; } return y; };

                              // ── Cabecera ──────────────────────────────────────────
                              doc.setFillColor(...verde);
                              doc.rect(0, 0, W, 36, 'F');
                              doc.setTextColor(255, 255, 255);
                              doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                              doc.text('ENEL COLOMBIA — ÁREA AMBIENTAL', M, 10);
                              doc.setFontSize(14); doc.setFont('helvetica', 'bold');
                              doc.text('ANÁLISIS COMPARATIVO DE PRECEDENTES', M, 20);
                              doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                              doc.text(expediente?.titulo || '', M, 28);
                              doc.setFontSize(7);
                              doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, W - M, 28, { align: 'right' });

                              // ── Badges riesgo / precedente ────────────────────────
                              doc.setFillColor(248, 250, 252);
                              doc.rect(0, 36, W, 14, 'F');
                              let bx = M;
                              if (parsed.riesgo_sugerido) {
                                doc.setFillColor(...verdeO);
                                doc.roundedRect(bx, 38, 52, 10, 2, 2, 'F');
                                doc.setTextColor(...verde);
                                doc.setFontSize(6); doc.setFont('helvetica', 'bold');
                                doc.text('RIESGO SUGERIDO', bx + 26, 42, { align: 'center' });
                                doc.setFontSize(8);
                                doc.text(parsed.riesgo_sugerido, bx + 26, 47, { align: 'center' });
                                bx += 56;
                              }
                              if (parsed.precedente_mas_relevante) {
                                doc.setFillColor(219, 234, 254);
                                doc.roundedRect(bx, 38, CW - (bx - M), 10, 2, 2, 'F');
                                doc.setTextColor(29, 78, 216);
                                doc.setFontSize(6); doc.setFont('helvetica', 'bold');
                                doc.text('PRECEDENTE MÁS RELEVANTE', bx + 4, 42);
                                doc.setFontSize(8);
                                const refLines = doc.splitTextToSize(parsed.precedente_mas_relevante, CW - (bx - M) - 8);
                                doc.text(refLines[0], bx + 4, 47);
                              }

                              let y = 58;

                              const seccion = (titulo, contenido) => {
                                if (!contenido) return;
                                y = checkY(y, 16);
                                doc.setFillColor(...verde);
                                doc.rect(M, y, 3, 10, 'F');
                                doc.setTextColor(...verde);
                                doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                                doc.text(titulo, M + 6, y + 7);
                                y += 13;
                                y = pdfMarkdown(doc, contenido, { startY: y, M, CW, accent: verde, textCol: negro, mutedCol: gris });
                                y += 2;
                              };

                              seccion('PATRONES IDENTIFICADOS', parsed.patrones);
                              seccion('COMPARACIÓN DE RIESGO', parsed.comparacion_riesgo);
                              seccion('ARGUMENTOS QUE HAN FUNCIONADO', parsed.argumentos_efectivos);
                              seccion('DIFERENCIAS CLAVE', parsed.diferencias_clave);

                              if (parsed.recomendaciones?.length) {
                                y = checkY(y, 16);
                                doc.setFillColor(16, 185, 129);
                                doc.rect(M, y, 3, 10, 'F');
                                doc.setTextColor(16, 185, 129);
                                doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                                doc.text('RECOMENDACIONES ESTRATÉGICAS', M + 6, y + 7);
                                y += 14;
                                parsed.recomendaciones.forEach((r, i) => {
                                  y = checkY(y, 10);
                                  doc.setFillColor(209, 250, 229);
                                  doc.circle(M + 3, y + 3, 3, 'F');
                                  doc.setTextColor(...verde);
                                  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                                  doc.text(String(i + 1), M + 3, y + 4.5, { align: 'center' });
                                  doc.setTextColor(...negro);
                                  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
                                  const lines = doc.splitTextToSize(r, CW - 10);
                                  doc.text(lines, M + 9, y + 4);
                                  y += lines.length * 5 + 4;
                                });
                              }

                              // ── Footer en todas las páginas ───────────────────────
                              const totalPages = doc.getNumberOfPages();
                              for (let p = 1; p <= totalPages; p++) {
                                doc.setPage(p);
                                doc.setFillColor(248, 250, 252);
                                doc.rect(0, 285, W, 12, 'F');
                                doc.setTextColor(...gris);
                                doc.setFontSize(6); doc.setFont('helvetica', 'normal');
                                doc.text('Enel Colombia — Área Ambiental — Documento de uso interno', M, 291);
                                doc.text(`Pág. ${p} / ${totalPages}`, W - M, 291, { align: 'right' });
                              }

                              doc.save(`comparativo_${(expediente?.titulo || 'expediente').replace(/\s+/g, '_').slice(0, 40)}.pdf`);
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
                          >
                            <Download size={12} /> Exportar PDF
                          </button>
                          <button
                            onClick={() => setResultadoComparativo('')}
                            className="text-xs text-gray-500 hover:text-gray-300 underline"
                          >
                            Reanálizar (limpiar resultado)
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <textarea
                      value={resultadoComparativo}
                      onChange={e => setResultadoComparativo(e.target.value)}
                      placeholder="Pega aquí la respuesta de Copilot (JSON)..."
                      rows={12}
                      className="w-full border border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-900 text-gray-300 outline-none focus:ring-2 focus:ring-green-600 resize-none font-mono"
                    />
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
