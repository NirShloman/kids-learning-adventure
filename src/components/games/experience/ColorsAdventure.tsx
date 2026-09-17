import { useEffect, useRef, useState } from "react";
import {
  colorHex,
  colorNames,
  mixRecipes,
} from "../../../content/adventureMissions";
import type { PaintColor } from "../../../types/adventure.types";
import {
  ChoiceTray,
  DropZone,
  Swatch,
  Toy,
  type BoardProps,
} from "./AdventurePieces";
import {
  GardenArtwork,
  gardenKind,
  gardenPaths,
  type GardenKind,
} from "./GardenArtwork";

export function PaintCanvas({
  color,
  onComplete,
  kind,
}: {
  color: PaintColor;
  onComplete: () => void;
  kind: GardenKind;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Array<{ x: number; y: number }>>([]);
  const pointer = useRef<number | null>(null);
  const finished = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const filled = useRef(false);
  const coverage = useRef(new Set<string>());
  const [enough, setEnough] = useState(false);
  const draw = () => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 300;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    const path = new Path2D(gardenPaths[kind]);
    ctx.fillStyle = filled.current ? colorHex[color] : "#e3ded0";
    ctx.fill(path);
    ctx.clip(path);
    ctx.fillStyle = colorHex[color];
    for (const p of strokes.current) {
      ctx.beginPath();
      ctx.arc(p.x * size, p.y * size, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  useEffect(() => {
    draw();
  }, [color, kind]);
  useEffect(() => {
    const cancel = () => {
      pointer.current = null;
    };
    window.addEventListener("resize", cancel);
    return () => {
      window.removeEventListener("resize", cancel);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const add = (x: number, y: number) => {
    strokes.current.push({ x, y });
    if (Math.hypot(x - 0.5, y - 0.5) < 0.3)
      coverage.current.add(`${Math.floor(x * 10)}:${Math.floor(y * 10)}`);
    const ctx = ref.current?.getContext("2d");
    if (ctx) {
      ctx.save();
      ctx.clip(new Path2D(gardenPaths[kind]));
      ctx.fillStyle = colorHex[color];
      ctx.beginPath();
      ctx.arc(x * 300, y * 300, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (coverage.current.size >= 12) setEnough(true);
  };
  return (
    <div className="adventure-painting">
      <canvas
        ref={ref}
        className="adventure-paint-canvas"
        aria-label={`משטח צביעה בצבע ${colorNames[color]}`}
        role="img"
        onPointerDown={(e) => {
          if (pointer.current !== null || !e.isPrimary) return;
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          const box = e.currentTarget.getBoundingClientRect();
          add(
            (e.clientX - box.x) / box.width,
            (e.clientY - box.y) / box.height,
          );
        }}
        onPointerMove={(e) => {
          if (pointer.current !== e.pointerId) return;
          const box = e.currentTarget.getBoundingClientRect();
          add(
            (e.clientX - box.x) / box.width,
            (e.clientY - box.y) / box.height,
          );
        }}
        onPointerUp={(e) => {
          if (pointer.current === e.pointerId) pointer.current = null;
        }}
        onPointerCancel={(e) => {
          if (pointer.current === e.pointerId) pointer.current = null;
        }}
        onLostPointerCapture={(e) => {
          if (pointer.current === e.pointerId) pointer.current = null;
        }}
      />
      <button
        type="button"
        className="adventure-primary"
        onClick={() => {
          if (finished.current) return;
          finished.current = true;
          filled.current = true;
          draw();
          timer.current = setTimeout(onComplete, 450);
        }}
      >
        {enough ? "סיימתי לצבוע" : "צביעה בנגיעה"}
      </button>
    </div>
  );
}

export function ColorsAdventure(props: BoardProps) {
  const { step, mission, selected, hint, busy, onSelect, onAnswer } = props;
  const [mixed, setMixed] = useState<string[]>([]);
  const [paint, setPaint] = useState<PaintColor | null>(null);
  const [painted, setPainted] = useState(false);
  if (step.kind === "choose")
    return (
      <>
        <div className="adventure-color-discovery">
          <Swatch color={step.target as PaintColor} />
          <span>צבע חדש נולד!</span>
        </div>
        <ChoiceTray {...props} />
      </>
    );
  if (step.kind === "mix") {
    const add = (value: string) => {
      if (busy) return;
      setMixed((previous) =>
        previous.length < 2 ? [...previous, value] : previous,
      );
    };
    return (
      <>
        <div className="adventure-mix-request">
          <span>נכין</span>
          <Swatch color={step.target as PaintColor} />
          <strong>{colorNames[step.target as PaintColor]}</strong>
        </div>
        <DropZone
          disabled={busy || mixed.length >= 2}
          label="הוספת צבע לקערת הערבוב"
          onClick={() => {
            if (selected) add(selected);
          }}
          className="adventure-mixing-bowl"
        >
          <span
            className="adventure-paint-liquid"
            style={{
              background: mixed.length
                ? `linear-gradient(105deg,${mixed.map((c) => colorHex[c as PaintColor]).join(",")}${mixed.length === 1 ? `,${colorHex[mixed[0] as PaintColor]}` : ""})`
                : "#f8f0df",
            }}
          />
          {!mixed.length && <span>שני צבעים, הפתעה אחת</span>}
        </DropZone>
        <div className="adventure-tray">
          {step.options.map((value) => (
            <Toy
              key={value}
              value={value}
              selected={selected === value}
              hint={
                hint &&
                (mixRecipes[step.target as PaintColor] ?? []).includes(
                  value as PaintColor,
                )
              }
              disabled={busy || mixed.length >= 2}
              onSelect={onSelect}
              onDrop={add}
            >
              <Swatch color={value as PaintColor} />
            </Toy>
          ))}
        </div>
        <div className="adventure-mix-actions">
          <button
            type="button"
            className="adventure-small-button"
            aria-label="ריקון קערת הצבע"
            disabled={busy || !mixed.length}
            onClick={() => setMixed([])}
          >
            ↺
          </button>
          <button
            type="button"
            className="adventure-primary"
            disabled={busy || mixed.length !== 2}
            onClick={() => {
              onAnswer([...mixed].sort().join("+"));
              setMixed([]);
            }}
          >
            מערבבים!
          </button>
        </div>
      </>
    );
  }
  if (paint)
    return (
      <PaintCanvas
        color={paint}
        kind={gardenKind(mission)}
        onComplete={() => {
          setPainted(true);
          onAnswer(paint);
        }}
      />
    );
  const apply = (value: string) => {
    if (step.kind === "paint" && value === step.answer) {
      setPaint(value as PaintColor);
      return;
    }
    setPainted(value === step.answer);
    onAnswer(value);
  };
  return (
    <>
      <DropZone
        label="צביעת הפריט בצבע שנבחר"
        disabled={busy}
        onClick={() => {
          if (selected) apply(selected);
        }}
        className={`adventure-garden-target garden-${mission.variant} ${painted ? "is-painted" : ""}`}
      >
        <GardenArtwork
          kind={gardenKind(mission)}
          fill={painted ? colorHex[step.target as PaintColor] : "#e6dfcf"}
          playing={painted}
        />
        <span className="adventure-color-request">
          <Swatch color={step.target as PaintColor} />
          {colorNames[step.target as PaintColor]}
        </span>
      </DropZone>
      <div className="adventure-tray">
        {step.options.map((value) => (
          <Toy
            key={value}
            value={value}
            selected={selected === value}
            hint={hint && value === step.answer}
            disabled={busy}
            onSelect={onSelect}
            onDrop={apply}
          >
            <Swatch color={value as PaintColor} />
          </Toy>
        ))}
      </div>
    </>
  );
}
