export default function SonarKPI({ label, value }) {
    return (
      <div className="flex items-center gap-4 border border-[#1A441A] p-4 bg-[#0A140A]">
        <div className="relative w-12 h-12 border border-[#1A441A] rounded-full flex items-center justify-center overflow-hidden bg-[#050A05]">
            <div className="absolute w-full h-0.5 bg-[#33FF33] origin-center animate-[spin_3s_linear_infinite] shadow-[0_0_5px_#33FF33]"></div>
        </div>
        <div>
            <div className="text-[10px] uppercase text-[#1A441A] tracking-widest">{label}</div>
            <div className="text-xl font-bold text-[#33FF33] tracking-tighter">{value}</div>
        </div>
      </div>
    );
  }
