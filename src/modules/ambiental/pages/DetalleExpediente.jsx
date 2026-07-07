import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import {
  ChevronLeft, FileText, AlertTriangle, CheckCircle, Clock,
  Zap, Archive, Copy, Check, Send, Loader, Download, Trash2,
  Shield, Calendar, Building2, Upload, ChevronRight, ChevronLeft as ChevronLeftIcon, Plus, Pencil, Scale
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SearchableSelect from '../components/SearchableSelect';

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
  const [seccionLlm, setSeccionLlm] = useState(0);
  const [promptLlm, setPromptLlm] = useState('');
  const [copiadoLlm, setCopiadoLlm] = useState(false);
  const [mostrarConsolidar, setMostrarConsolidar] = useState(false);
  const [resumenConsolidado, setResumenConsolidado] = useState('');
  const [guardandoResumen, setGuardandoResumen] = useState(false);
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

  // Tab Respuesta entidad
  const [procesandoRespuesta, setProcesandoRespuesta] = useState(false);
  const [promptRespuesta, setPromptRespuesta] = useState('');
  const [copiadoPromptRespuesta, setCopiadoPromptRespuesta] = useState(false);
  const [jsonRespuesta, setJsonRespuesta] = useState('');
  const [respuestaParseada, setRespuestaParseada] = useState(null);
  const [errorParseRespuesta, setErrorParseRespuesta] = useState('');
  const [cerrandoTramite, setCerrandoTramite] = useState(false);
  const fileRespuestaRef = useRef(null);

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
      } catch {
        // sin análisis aún
      }
    } catch {
      toast.error('Error al cargar el expediente');
      navigate('/ambiental');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
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

  const handleGuardarAnalisis = async (modo = 'reemplazar') => {
    if (!jsonLlm.trim()) return toast.error('Pega el JSON del LLM primero.');
    setGuardandoAnalisis(true);
    try {
      const { data } = await apiService.post(`/ambiental/expedientes/${id}/analisis`, {
        resultado_llm_json: jsonLlm,
        modo,
        seccion_index: seccionLlm,
      });
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

  const handleProcesarArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProcesandoArchivo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (expediente.entidad_id) fd.append('entidad_id', expediente.entidad_id);
      if (expediente.fecha_documento) fd.append('fecha_documento', expediente.fecha_documento);
      const { data } = await apiService.post('/ambiental/expedientes/procesar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Persiste el prompt en el expediente
      await apiService.patch(`/ambiental/expedientes/${id}`, {
        contenido_texto: data.contenido_texto,
        prompt_generado: data.prompt_generado,
      });
      if (data.meta?.truncado) {
        toast.success(`Documento extenso (${(data.meta.caracteres_totales / 1000).toFixed(0)}k caracteres). El prompt incluye inicio y final.`);
      } else {
        toast.success('Archivo procesado y prompt actualizado');
      }
      await cargarDatos();
    } catch {
      toast.error('Error al procesar el archivo');
    } finally {
      setProcesandoArchivo(false);
      e.target.value = '';
    }
  };

  const handleGenerarPromptDesdeTab = async (indice) => {
    if (!paginasTexto[indice]) return;
    setGenerandoPrompt(true);
    try {
      const fd = new FormData();
      fd.append('texto', paginasTexto[indice]);
      if (expediente.entidad_id) fd.append('entidad_id', expediente.entidad_id);
      if (expediente.fecha_documento) fd.append('fecha_documento', expediente.fecha_documento);
      const { data } = await apiService.post('/ambiental/expedientes/procesar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Guarda el prompt activo en BD y en estado local
      await apiService.patch(`/ambiental/expedientes/${id}`, { prompt_generado: data.prompt_generado });
      setPromptLlm(data.prompt_generado);
      setSeccionLlm(indice);
      toast.success(`Prompt listo para la sección ${indice + 1}`);
    } catch {
      toast.error('Error al generar el prompt');
    } finally {
      setGenerandoPrompt(false);
    }
  };

  const handleGenerarPromptSeccion = async (seccion) => {
    setGenerandoPrompt(true);
    try {
      const fd = new FormData();
      fd.append('texto', seccion);
      if (expediente.entidad_id) fd.append('entidad_id', expediente.entidad_id);
      if (expediente.fecha_documento) fd.append('fecha_documento', expediente.fecha_documento);
      const { data } = await apiService.post('/ambiental/expedientes/procesar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Guarda el nuevo prompt en el expediente y recarga
      await apiService.patch(`/ambiental/expedientes/${id}`, { prompt_generado: data.prompt_generado });
      await cargarDatos();
      setTab('llm');
      toast.success('Prompt generado para esta sección — ahora cópialo');
    } catch {
      toast.error('Error al generar el prompt');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/ambiental')} className="mt-1 text-gray-400 hover:text-green-700 transition-colors shrink-0">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-lg capitalize">
              {expediente.tipo_instrumento}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfgEstado.bg} ${cfgEstado.text}`}>
              {cfgEstado.icon} {expediente.estado || 'Pendiente'}
            </span>
            {analisis?.nivel_riesgo && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${riesgoColor[analisis.nivel_riesgo] || ''}`}>
                Riesgo: {analisis.nivel_riesgo}
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-gray-800">{expediente.titulo}</h1>
          {expediente.numero_expediente && (
            <p className="text-sm text-gray-500">Exp. {expediente.numero_expediente}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {analisis && (
            <button
              onClick={handleExportarPDF}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-green-700 text-white hover:bg-green-800 transition-colors"
            >
              <Download size={14} /> PDF
            </button>
          )}
          <button
            onClick={handleEliminar}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Obligaciones de pago */}
      {pagos.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
            <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
              <Shield size={13} /> Obligaciones de pago ({pagos.length})
            </h2>
            <span className="text-xs text-red-400">
              {pagos.filter(p => p.estado === 'Pagado').length} de {pagos.length} pagados
            </span>
          </div>
          <div className="divide-y divide-red-50">
            {pagos.map(p => (
              <div key={p.id} className={`flex items-start gap-4 px-5 py-4 transition-colors ${p.estado === 'Pagado' ? 'bg-green-50/50' : ''}`}>
                <button
                  onClick={async () => {
                    const nuevoEstado = p.estado === 'Pagado' ? 'Pendiente' : 'Pagado';
                    try {
                      await apiService.patch(`/ambiental/expedientes/${id}/pagos/${p.id}`, { estado: nuevoEstado });
                      setPagos(prev => prev.map(x => x.id === p.id ? { ...x, estado: nuevoEstado } : x));
                    } catch {
                      toast.error('Error al actualizar el estado del pago');
                    }
                  }}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    p.estado === 'Pagado'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-red-300 hover:border-red-500'
                  }`}
                >
                  {p.estado === 'Pagado' && <Check size={11} />}
                </button>
                <div className="flex-1 min-w-0">
                  {p.descripcion && <p className="text-xs text-gray-500 mb-0.5">{p.descripcion}</p>}
                  <p className={`text-base font-black ${p.estado === 'Pagado' ? 'text-green-700 line-through' : 'text-red-700'}`}>
                    {p.valor}
                  </p>
                  {p.plazo && (
                    <p className={`text-xs mt-0.5 ${p.estado === 'Pagado' ? 'text-gray-400' : 'text-red-500 font-semibold'}`}>
                      {p.plazo}
                    </p>
                  )}
                  {p.nota && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-1.5 leading-relaxed">
                      {p.nota}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.estado === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info principal — qué ordena / recurso / plazo */}
      {(expediente.que_ordena || expediente.admite_recurso || expediente.plazo_respuesta) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Shield size={12} /> Admite recurso
            </p>
            <p className={`text-xl font-black ${
              expediente.admite_recurso === 'Sí' ? 'text-green-700' :
              expediente.admite_recurso === 'No' ? 'text-red-600' : 'text-yellow-600'
            }`}>{expediente.admite_recurso || '—'}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Clock size={12} /> Plazo de respuesta
            </p>
            <p className="text-base font-bold text-amber-800">{expediente.plazo_respuesta || '—'}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Fecha de vencimiento
            </p>
            {expediente.fecha_vencimiento ? (
              <p className="text-base font-bold text-gray-800">
                {new Date(expediente.fecha_vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic mb-2">Sin calcular — se llena al guardar el análisis LLM</p>
            )}
            <input
              type="date"
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-green-600"
              defaultValue={expediente.fecha_vencimiento?.split('T')[0] || ''}
              onBlur={async (e) => {
                const val = e.target.value;
                if (!val) return;
                try {
                  await apiService.patch(`/ambiental/expedientes/${id}`, { fecha_vencimiento: val });
                  await cargarDatos();
                  toast.success('Fecha de vencimiento actualizada');
                } catch {
                  toast.error('Error al guardar la fecha');
                }
              }}
            />
          </div>
        </div>
      )}

      {expediente.que_ordena && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Qué ordena</p>
          <p className="text-sm text-gray-700 leading-relaxed">{expediente.que_ordena}</p>
        </div>
      )}

      {/* Cambiar estado */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Estado:</p>
        {ESTADOS.map(e => (
          <button
            key={e}
            onClick={() => setCambioEstado(e)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              cambioEstado === e
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            {e}
          </button>
        ))}
        {cambioEstado !== expediente.estado && (
          <button
            onClick={handleCambiarEstado}
            disabled={guardandoEstado}
            className="ml-auto flex items-center gap-1.5 bg-green-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {guardandoEstado ? <Loader size={12} className="animate-spin" /> : null}
            Guardar estado
          </button>
        )}
      </div>

      {/* Metadatos adicionales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Detalles del expediente</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              <Building2 size={11} /> Entidad
              {!editandoEntidad && (
                <button
                  onClick={() => { setEntidadSeleccionada(expediente.entidad_id || ''); setEditandoEntidad(true); }}
                  className="ml-1 text-green-600 hover:text-green-800 transition-colors"
                  title="Editar entidad"
                >
                  <Pencil size={11} />
                </button>
              )}
            </p>
            {editandoEntidad ? (
              <div className="flex flex-col gap-2">
                <SearchableSelect
                  options={entidades}
                  value={entidadSeleccionada}
                  onChange={setEntidadSeleccionada}
                  placeholder="Buscar entidad..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleGuardarEntidad}
                    disabled={guardandoEntidad || !entidadSeleccionada}
                    className="flex-1 py-1.5 text-xs font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                  >
                    {guardandoEntidad ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditandoEntidad(false)}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-semibold text-gray-700">{expediente.entidad_nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}</p>
            )}
          </div>
          {/* Responsable */}
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              Responsable
              {!editandoResponsable && (
                <button
                  onClick={() => { setResponsableSeleccionado(expediente.responsable_uuid || ''); setEditandoResponsable(true); }}
                  className="ml-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  <Pencil size={11} />
                </button>
              )}
            </p>
            {editandoResponsable ? (
              <div className="flex flex-col gap-2">
                <SearchableSelect
                  options={usuarios}
                  value={responsableSeleccionado}
                  onChange={setResponsableSeleccionado}
                  placeholder="Buscar responsable..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setGuardandoResponsable(true);
                      try {
                        await apiService.patch(`/ambiental/expedientes/${id}`, { responsable_uuid: responsableSeleccionado || null });
                        const u = usuarios.find(u => u.value === responsableSeleccionado);
                        setExpediente(prev => ({ ...prev, responsable_uuid: responsableSeleccionado || null, responsable_nombre: u?.label || null }));
                        setEditandoResponsable(false);
                        toast.success('Responsable actualizado');
                      } catch {
                        toast.error('Error al guardar el responsable');
                      } finally {
                        setGuardandoResponsable(false);
                      }
                    }}
                    disabled={guardandoResponsable}
                    className="flex-1 py-1.5 text-xs font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                  >
                    {guardandoResponsable ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditandoResponsable(false)}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-semibold text-gray-700 text-sm">
                {expediente.responsable_nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}
              </p>
            )}
          </div>

          {/* Proyecto */}
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              Proyecto
              {!editandoProyecto && (
                <button
                  onClick={() => { setProyectoSeleccionado(expediente.proyecto_id || ''); setEditandoProyecto(true); }}
                  className="ml-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  <Pencil size={11} />
                </button>
              )}
            </p>
            {editandoProyecto ? (
              <div className="flex flex-col gap-2">
                <SearchableSelect
                  options={proyectos}
                  value={proyectoSeleccionado}
                  onChange={setProyectoSeleccionado}
                  placeholder="Buscar proyecto..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setGuardandoProyecto(true);
                      try {
                        await apiService.patch(`/ambiental/expedientes/${id}`, { proyecto_id: proyectoSeleccionado ? Number(proyectoSeleccionado) : null });
                        const p = proyectos.find(p => String(p.value) === String(proyectoSeleccionado));
                        setExpediente(prev => ({ ...prev, proyecto_id: proyectoSeleccionado ? Number(proyectoSeleccionado) : null, proyecto_nombre: p?.label || null }));
                        setEditandoProyecto(false);
                        toast.success('Proyecto actualizado');
                      } catch {
                        toast.error('Error al guardar el proyecto');
                      } finally {
                        setGuardandoProyecto(false);
                      }
                    }}
                    disabled={guardandoProyecto}
                    className="flex-1 py-1.5 text-xs font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                  >
                    {guardandoProyecto ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditandoProyecto(false)}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-semibold text-gray-700 text-sm">
                {expediente.proyecto_nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Calendar size={11} /> Fecha documento</p>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-green-600"
              defaultValue={expediente.fecha_documento?.split('T')[0] || ''}
              onBlur={async (e) => {
                const val = e.target.value;
                const anterior = expediente.fecha_documento?.split('T')[0] || '';
                if (val === anterior) return;
                try {
                  await apiService.patch(`/ambiental/expedientes/${id}`, { fecha_documento: val || null });
                  setExpediente(prev => ({ ...prev, fecha_documento: val || null }));
                  toast.success('Fecha del documento actualizada');
                } catch {
                  toast.error('Error al guardar la fecha');
                }
              }}
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Calendar size={11} /> Registrado</p>
            <p className="font-semibold text-gray-700">
              {new Date(expediente.created_at).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'analisis', label: 'Análisis' },
          { key: 'documento', label: 'Texto del documento' },
          { key: 'llm', label: analisis ? 'Actualizar análisis' : 'Pegar respuesta LLM' },
          ...(analisis ? [{ key: 'recurso', label: 'Redactar recurso' }] : []),
          { key: 'respuesta', label: 'Respuesta entidad' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t.key
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
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
              {(expediente.secciones_analizadas?.length > 1 || analisis.resumen?.includes('[Sección adicional]')) && (
                <button
                  onClick={() => setMostrarConsolidar(v => !v)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  {mostrarConsolidar ? 'Cancelar' : 'Consolidar resumen'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analisis.resumen}</p>

            {mostrarConsolidar && (() => {
              const promptConsolidar = `Tengo los siguientes resúmenes parciales de un instrumento ambiental, generados sección por sección. Necesito que los consolides en UN ÚNICO resumen ejecutivo coherente, en 3-5 oraciones, eliminando repeticiones y contradicciones. Responde ÚNICAMENTE con el texto del resumen consolidado, sin prefijos ni explicaciones.\n\nRESÚMENES PARCIALES:\n${analisis.resumen}`;
              return (
                <div className="border-t border-amber-100 pt-3 space-y-3">
                  <p className="text-xs text-amber-700 font-semibold">
                    Copia este prompt, pégalo en tu herramienta de IA y pega el resultado abajo:
                  </p>
                  <div className="relative">
                    <div className="bg-gray-900 text-green-300 text-xs font-mono p-4 rounded-xl max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed pr-16">
                      {promptConsolidar}
                    </div>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(promptConsolidar);
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
              );
            })()}
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
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <Zap size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-400">Sin análisis todavía</p>
          <p className="text-xs text-gray-400 mt-1">Sube un documento, copia el prompt y pega la respuesta en la pestaña <strong>Pegar respuesta LLM</strong>.</p>
        </div>
      )}

      {/* TAB: Texto del documento */}
      {tab === 'documento' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Texto extraído del documento
              {paginasTexto.length > 1 && (
                <span className="ml-2 font-normal text-gray-400 normal-case tracking-normal">
                  — {paginasTexto.length} secciones · {(expediente.contenido_texto.length / 1000).toFixed(0)}k caracteres
                </span>
              )}
            </h2>
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

          {paginasTexto.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-8 text-center">
              No hay texto extraído. Sube un archivo PDF, DOCX o TXT para extraer el contenido.
            </p>
          ) : (
            <>
              {/* Navegación entre secciones */}
              {paginasTexto.length > 1 && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <button
                    onClick={() => setPaginaTexto(p => Math.max(0, p - 1))}
                    disabled={paginaTexto === 0}
                    className="flex items-center gap-1 text-xs font-bold text-green-700 disabled:opacity-30 hover:text-green-900 transition-colors"
                  >
                    <ChevronLeftIcon size={14} /> Anterior
                  </button>
                  <div className="text-center">
                    <span className="text-xs font-bold text-green-800">
                      Sección {paginaTexto + 1} de {paginasTexto.length}
                    </span>
                    <span className="block text-[10px] text-green-600">
                      caracteres {(paginaTexto * CHARS_POR_PAGINA + 1).toLocaleString()} – {Math.min((paginaTexto + 1) * CHARS_POR_PAGINA, expediente.contenido_texto.length).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setPaginaTexto(p => Math.min(paginasTexto.length - 1, p + 1))}
                    disabled={paginaTexto === paginasTexto.length - 1}
                    className="flex items-center gap-1 text-xs font-bold text-green-700 disabled:opacity-30 hover:text-green-900 transition-colors"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Texto de la sección actual */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-sm text-gray-800 leading-7 max-h-[500px] overflow-y-auto space-y-3">
                {(paginasTexto[paginaTexto] || '').split(/\n\n+/).map((parrafo, i) =>
                  parrafo.trim()
                    ? <p key={i}>{parrafo.replace(/\n/g, ' ').trim()}</p>
                    : null
                )}
              </div>

              {/* Botón generar prompt para esta sección */}
              <button
                onClick={() => handleGenerarPromptSeccion(paginasTexto[paginaTexto])}
                disabled={generandoPrompt}
                className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {generandoPrompt ? <Loader size={15} className="animate-spin" /> : <Zap size={15} />}
                {generandoPrompt
                  ? 'Generando prompt...'
                  : paginasTexto.length > 1
                    ? `Generar prompt para la sección ${paginaTexto + 1} de ${paginasTexto.length}`
                    : 'Generar prompt para este documento'}
              </button>
            </>
          )}
        </div>
      )}

      {/* TAB: Análisis LLM iterativo */}
      {tab === 'llm' && (
      <div className="space-y-4">

        {/* Selector de secciones */}
        {paginasTexto.length > 0 && (() => {
          const analizadas = new Set(expediente.secciones_analizadas || []);
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {paginasTexto.length === 1 ? 'Documento' : `Secciones del documento — ${analizadas.size} de ${paginasTexto.length} analizadas`}
                </h2>
                {analisis && hallazgos.length > 0 && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                    {hallazgos.length} hallazgo{hallazgos.length !== 1 ? 's' : ''} acumulados
                  </span>
                )}
              </div>

              {paginasTexto.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {paginasTexto.map((_, i) => {
                    const analizada = analizadas.has(i);
                    const activa = seccionLlm === i && promptLlm;
                    return (
                      <button
                        key={i}
                        onClick={() => handleGenerarPromptDesdeTab(i)}
                        disabled={generandoPrompt}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${
                          activa
                            ? 'bg-green-700 text-white border-green-700'
                            : analizada
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {analizada && !activa && <CheckCircle size={11} />}
                        {activa && <Zap size={11} />}
                        Sección {i + 1}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Prompt de la sección seleccionada */}
              {promptLlm ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Prompt de la sección {seccionLlm + 1}
                      {paginasTexto.length > 1 && ` de ${paginasTexto.length}`}
                      {(expediente.secciones_analizadas || []).includes(seccionLlm) && (
                        <span className="ml-2 text-green-600 font-bold">· ya analizada</span>
                      )}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(promptLlm);
                        setCopiadoLlm(true);
                        setTimeout(() => setCopiadoLlm(false), 2000);
                      }}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        copiadoLlm ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {copiadoLlm ? <Check size={13} /> : <Copy size={13} />}
                      {copiadoLlm ? 'Copiado' : 'Copiar prompt'}
                    </button>
                  </div>
                  <div className="bg-gray-900 text-green-300 text-xs font-mono p-4 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {promptLlm}
                  </div>
                </div>
              ) : paginasTexto.length === 1 ? (
                <button
                  onClick={() => handleGenerarPromptDesdeTab(0)}
                  disabled={generandoPrompt}
                  className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 transition-colors text-sm"
                >
                  {generandoPrompt ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
                  {generandoPrompt ? 'Generando prompt...' : 'Generar prompt'}
                </button>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Haz clic en cualquier sección para generar su prompt y copiarlo al LLM.
                </p>
              )}
            </div>
          );
        })()}

        {/* Sin documento: mostrar botón para subir */}
        {paginasTexto.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 italic mb-3">
              No hay texto extraído. Sube un archivo para generar el prompt.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={procesandoArchivo}
              className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 transition-colors text-sm"
            >
              {procesandoArchivo ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
              Subir archivo
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleProcesarArchivo} />
          </div>
        )}

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
                onClick={() => handleGuardarAnalisis('acumular')}
                disabled={guardandoAnalisis || !jsonLlm.trim()}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {guardandoAnalisis ? <Loader size={15} className="animate-spin" /> : <Plus size={15} />}
                Acumular hallazgos
                {paginasTexto.length > 1 && promptLlm && (
                  <span className="text-blue-200 font-normal">sección {seccionLlm + 1}</span>
                )}
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
                  ].filter(([, v]) => v?.trim()).map(([titulo, texto]) => (
                    <div key={titulo} className="px-4 py-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{titulo}</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{texto}</p>
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

      {/* TAB: Respuesta de la entidad */}
      {tab === 'respuesta' && (
        <div className="space-y-6">

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
          {promptRespuesta && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Prompt para el LLM</h3>
                <button
                  onClick={() => { navigator.clipboard.writeText(promptRespuesta); setCopiadoPromptRespuesta(true); setTimeout(() => setCopiadoPromptRespuesta(false), 2000); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copiadoPromptRespuesta ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {copiadoPromptRespuesta ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar prompt</>}
                </button>
              </div>
              <textarea
                readOnly
                value={promptRespuesta}
                rows={6}
                className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none font-mono leading-relaxed"
              />
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
                onClick={() => {
                  try {
                    const p = JSON.parse(jsonRespuesta);
                    setRespuestaParseada(p);
                    setErrorParseRespuesta('');
                  } catch {
                    setErrorParseRespuesta('JSON inválido. Verifica el formato.');
                    setRespuestaParseada(null);
                  }
                }}
                disabled={!jsonRespuesta.trim()}
                className="px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition-colors disabled:opacity-40"
              >
                Parsear y previsualizar
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
                  <div className="flex gap-2">
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

    </div>
  );
}
