import { useState } from "react";
import {
  ChoiceTray,
  DropZone,
  ShapeGraphic,
  Toy,
  ToyCreation,
  type BoardProps,
} from "./AdventurePieces";
import type { Shape } from "../../../types/adventure.types";

export function ShapesAdventure(props: BoardProps) {
  const { step, mission, selected, hint, busy, onSelect, onAnswer } = props;
  const [rotation, setRotation] = useState(step.rotation ?? 0);
  if (step.kind === "choose")
    return (
      <>
        <ToyCreation mission={mission} playing />
        <ChoiceTray {...props} />
      </>
    );
  return (
    <>
      <div className="adventure-building">
        <ToyCreation mission={mission} progress={step.part ?? 0} />
        <DropZone
          disabled={busy}
          onClick={() => {
            if (selected) onAnswer(selected, rotation);
          }}
          label="חיבור צורה לצעצוע"
          className="adventure-shape-mould"
        >
          <ShapeGraphic shape={step.target as Shape} fill="#ffffff66" />
        </DropZone>
      </div>
      <div className="adventure-tray" role="group" aria-label="חלקי הצעצוע">
        {step.options.map((value) => (
          <Toy
            key={value}
            value={value}
            rotation={rotation}
            selected={selected === value}
            hint={hint && value === step.answer}
            disabled={busy}
            onSelect={onSelect}
            onDrop={(value) => onAnswer(value, rotation)}
          >
            <ShapeGraphic shape={value as Shape} />
          </Toy>
        ))}
      </div>
      {step.rotation !== 0 && step.rotation !== undefined && (
        <button
          type="button"
          className="adventure-rotate"
          disabled={busy}
          onClick={() => setRotation((r) => r + 90)}
          aria-label="סיבוב החלק ברבע סיבוב"
        >
          ↻ <span>מסובבים</span>
        </button>
      )}
    </>
  );
}
