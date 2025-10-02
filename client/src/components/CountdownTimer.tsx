import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface CountdownTimerProps {
  targetDate: string;
  title?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate, title = "Faltan para el gran día" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEventStarted, setIsEventStarted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
        setIsEventStarted(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsEventStarted(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { label: 'Días', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Minutos', value: timeLeft.minutes },
    { label: 'Segundos', value: timeLeft.seconds }
  ];

  return (
    <div className="py-12 bg-background border-t border-border" data-testid="countdown-timer">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8" data-testid="countdown-title">
          {isEventStarted ? '¡Comenzamos!' : title}
        </h2>
        
        {!isEventStarted && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {timeUnits.map((unit, index) => (
              <Card
                key={unit.label}
                className="p-6 bg-[#111111] border border-border text-foreground shadow-lg hover-elevate"
                data-testid={`countdown-unit-${index}`}
              >
                <div className="text-3xl md:text-4xl font-bold mb-2 text-primary" data-testid={`countdown-value-${index}`}>
                  {unit.value.toString().padStart(2, '0')}
                </div>
                <div className="text-sm md:text-base text-muted-foreground" data-testid={`countdown-label-${index}`}>
                  {unit.label}
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {isEventStarted && (
          <div className="text-xl text-primary font-semibold" data-testid="event-started">
            El evento ha comenzado
          </div>
        )}
      </div>
    </div>
  );
}