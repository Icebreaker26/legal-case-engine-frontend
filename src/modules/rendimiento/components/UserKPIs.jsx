export default function UserKPIs({ objetivos }) {
  const totalObjetivos = objetivos.length;
  const completados = objetivos.filter(o => o.porcentaje_cumplimiento >= 100).length;
  const promedioCumplimiento = totalObjetivos > 0 
    ? Math.round(objetivos.reduce((acc, obj) => acc + (obj.porcentaje_cumplimiento || 0), 0) / totalObjetivos)
    : 0;
  const totalAcciones = objetivos.reduce((acc, obj) => acc + (obj.acciones_realizadas || 0), 0);

  const kpis = [
    { label: 'Obj. Asignados', value: totalObjetivos },
    { label: 'Obj. Completados', value: completados },
    { label: 'Promedio Cumplimiento', value: `${promedioCumplimiento}%` },
    { label: 'Total Acciones', value: totalAcciones },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div key={index} className="border-2 border-[#1A441A] bg-[#0A140A] p-4 text-center">
          <div className="text-[10px] uppercase text-[#1A441A] tracking-widest mb-1">{kpi.label}</div>
          <div className="text-2xl font-bold text-[#33FF33] font-mono">{kpi.value}</div>
        </div>
      ))}
    </div>
  );
}
