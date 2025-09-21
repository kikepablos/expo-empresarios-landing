interface MarqueeProps {
  words: string[];
}

export default function Marquee({ words }: MarqueeProps) {
  return (
    <>
      <style>{`
        @keyframes marquee {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="bg-foreground text-primary py-6 overflow-hidden" data-testid="marquee-container">
        <div className="animate-marquee whitespace-nowrap">
          <div className="inline-block">
            {words.map((word, index) => (
              <span
                key={index}
                className="font-serif text-2xl md:text-3xl mx-8"
                data-testid={`marquee-word-${index}`}
              >
                {word}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {words.map((word, index) => (
              <span
                key={`duplicate-${index}`}
                className="font-serif text-2xl md:text-3xl mx-8"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}