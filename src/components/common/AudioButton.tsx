import { Button } from './Button';
import { SpeakOptions } from '../../services/speechService';

interface AudioButtonProps {
  text: string;
  onSpeak: (text: string, options?: SpeakOptions) => void;
  disabled?: boolean;
}

export function AudioButton({ text, onSpeak, disabled = false }: AudioButtonProps) {
  return (
    <Button type="button" variant="secondary" onClick={() => onSpeak(text, { mode: 'manual' })} disabled={disabled || !text.trim()}>
      🔊 השמעה
    </Button>
  );
}
