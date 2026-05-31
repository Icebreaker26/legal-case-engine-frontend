import { motion } from 'framer-motion';

const TeletipoBackground = () => {
    // Generar tiras de código Morse aleatorias
    const generateStrip = () => {
        const chars = ".- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --..";
        const charArray = chars.split(' ');
        return Array.from({ length: 10 }, () => charArray[Math.floor(Math.random() * charArray.length)]).join(' ');
    };

    const strips = Array.from({ length: 8 }, () => ({
        id: Math.random(),
        text: generateStrip(),
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 10
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {strips.map((strip) => (
                <motion.div
                    key={strip.id}
                    className="absolute text-[#4ade80] font-mono text-[10px] select-none whitespace-nowrap"
                    initial={{ y: -100, x: `${strip.x}%`, opacity: 0 }}
                    animate={{ y: '100vh', opacity: [0, 0.5, 0] }}
                    transition={{ 
                        duration: strip.duration, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: strip.delay
                    }}
                >
                    {strip.text}
                </motion.div>
            ))}
        </div>
    );
};

export default TeletipoBackground;
