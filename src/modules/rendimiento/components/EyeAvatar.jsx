import { useState, useEffect } from 'react';

export default function EyeAvatar() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    // Frames: 0=Open, 1=Half, 2=Closed, 3=Half
    const frames = [0, 1, 2, 1];
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 400); // Speed of blink
    return () => clearInterval(interval);
  }, []);

  const eyes = [
    `
      .-------.
     /  _____  \\
    |  |  O  |  |
    |  |  O  |  |
    |  |_____|  |
     \\  _____  /
      '-------'
    `,
    `
      .-------.
     /  _____  \\
    |  |  -  |  |
    |  |  -  |  |
    |  |_____|  |
     \\  _____  /
      '-------'
    `,
    `
      .-------.
     /  _____  \\
    |  |     |  |
    |  |     |  |
    |  |_____|  |
     \\  _____  /
      '-------'
    `
  ];

  // Mapping frame index to the correct art
  const art = frame === 0 ? eyes[0] : (frame === 2 ? eyes[2] : eyes[1]);

  return (
    <pre className="text-[#33FF33] text-[6px] leading-tight border border-[#1A441A] p-2 bg-[#050A05] min-w-[100px] text-center">
      {art}
    </pre>
  );
}
