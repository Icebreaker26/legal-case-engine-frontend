export default function SignalMeter() {
  const bars = [0.2, 0.5, 0.8, 0.4, 0.9, 0.3];
  return (
    <div className="flex items-end justify-center gap-1 w-24 h-24 border border-[#1A441A] p-2 bg-[#050A05]">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-3 bg-[#33FF33] animate-signal"
          style={{ 
            height: `${height * 100}%`,
            animationDelay: `${i * 0.3}s`
          }}
        ></div>
      ))}
    </div>
  );
}
