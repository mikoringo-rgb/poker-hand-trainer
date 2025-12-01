import { useState } from 'react';
import Timer from '../Timer';
import { Button } from '@/components/ui/button';

export default function TimerExample() {
  const [isRunning, setIsRunning] = useState(false);
  
  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-green-800 to-green-900">
      <Timer isRunning={isRunning} onStop={(time) => console.log('Stopped at:', time)} />
      <Button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? 'Stop' : 'Start'}
      </Button>
    </div>
  );
}
