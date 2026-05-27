import { Button } from './Button';

interface AudioButtonProps {
  text: string;
  onSpeak: (text: string) => void;
  disabled?: boolean;
}

export function AudioButton({ text, onSpeak, disabled = false }: AudioButtonProps) {
  return (
    <Button type="button" variant="secondary" onClick={() => onSpeak(text)} disabled={disabled || !text.trim()}>
      🔊 השמעה
    </Button>
  );
}
