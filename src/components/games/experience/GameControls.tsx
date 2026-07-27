import type { GameCommand } from '../../../types';

interface GameControlsProps {
  onDirectionStart: (command: Exclude<GameCommand, 'action'>) => void;
  onDirectionEnd: (command: Exclude<GameCommand, 'action'>) => void;
  onAction: () => void;
  disabled?: boolean;
}

const controls: Array<{ command: GameCommand; label: string; symbol: string; className: string }> = [
  { command: 'up', label: 'למעלה', symbol: '↑', className: 'experience-controls__up' },
  { command: 'left', label: 'שמאלה', symbol: '←', className: 'experience-controls__left' },
  { command: 'action', label: 'פעולה', symbol: '●', className: 'experience-controls__action' },
  { command: 'right', label: 'ימינה', symbol: '→', className: 'experience-controls__right' },
  { command: 'down', label: 'למטה', symbol: '↓', className: 'experience-controls__down' }
];

function isDirection(command: GameCommand): command is Exclude<GameCommand, 'action'> {
  return command !== 'action';
}

export function GameControls({ onDirectionStart, onDirectionEnd, onAction, disabled = false }: GameControlsProps) {
  return (
    <div className="experience-controls" aria-label="שלט משחק" dir="ltr">
      {controls.map((control) => (
        <button
          key={control.command}
          type="button"
          className={`experience-controls__button ${control.className}`}
          aria-label={control.label}
          disabled={disabled}
          onClick={control.command === 'action' ? onAction : undefined}
          onPointerDown={!isDirection(control.command) ? undefined : (event) => {
            event.preventDefault();
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // Synthetic and assistive pointer events may not own an active pointer.
            }
            onDirectionStart(control.command as Exclude<GameCommand, 'action'>);
          }}
          onPointerUp={!isDirection(control.command) ? undefined : (event) => {
            try {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            } catch {
              // Direction state is still released below.
            }
            onDirectionEnd(control.command as Exclude<GameCommand, 'action'>);
          }}
          onPointerCancel={!isDirection(control.command) ? undefined : () => onDirectionEnd(control.command as Exclude<GameCommand, 'action'>)}
          onLostPointerCapture={!isDirection(control.command) ? undefined : () => onDirectionEnd(control.command as Exclude<GameCommand, 'action'>)}
          data-command={control.command}
        >
          <span aria-hidden="true">{control.symbol}</span>
          {control.command === 'action' ? <small>פעולה</small> : null}
        </button>
      ))}
    </div>
  );
}
