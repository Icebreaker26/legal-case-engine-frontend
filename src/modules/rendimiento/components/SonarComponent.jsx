export default function SonarComponent() {
  return (
    <div className="relative w-20 h-20 border border-[#1A441A] rounded-full flex items-center justify-center overflow-hidden bg-[#050A05]">
      {/* Grid */}
      <div className="absolute inset-0 border border-[#1A441A]"></div>
      <div className="absolute inset-2 border border-[#1A441A] rounded-full"></div>
      
      {/* Scanning line */}
      <div className="absolute w-full h-0.5 bg-[#33FF33] origin-center animate-[spin_3s_linear_infinite] shadow-[0_0_5px_#33FF33]"></div>
      
      {/* Fixed crosshair */}
      <div className="absolute w-full h-0.5 bg-[#1A441A]"></div>
      <div className="absolute w-0.5 h-full bg-[#1A441A]"></div>
    </div>
  );
}
