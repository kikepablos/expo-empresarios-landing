import CountdownTimer from '../CountdownTimer';

export default function CountdownTimerExample() {
  // Set target date to November 14, 2025 at 10:00 AM PST
  const targetDate = '2025-11-14T10:00:00-07:00';

  return (
    <CountdownTimer
      targetDate={targetDate}
      title="Faltan para el gran día"
    />
  );
}