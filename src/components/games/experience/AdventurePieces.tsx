import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { colorHex, shapeNames } from "../../../content/adventureMissions";
import type {
  AdventureMission,
  AdventureStep,
  PaintColor,
  Shape,
} from "../../../types/adventure.types";
import { itemLabel } from "./adventureEngine";

export interface BoardProps {
  mission: AdventureMission;
  step: AdventureStep;
  selected: string | null;
  hint: boolean;
  busy: boolean;
  onSelect: (value: string) => void;
  onAnswer: (value: string, rotation?: number) => void;
}

export function Toy({
  value,
  children,
  selected,
  hint = false,
  disabled = false,
  onSelect,
  onDrop,
  rotation = 0,
}: {
  value: string;
  children: ReactNode;
  selected?: boolean;
  hint?: boolean;
  disabled?: boolean;
  onSelect: (value: string) => void;
  onDrop?: (value: string) => void;
  rotation?: number;
}) {
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const ignoreClick = useRef(false);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const cancel = () => {
    pointer.current = null;
    setGhost(null);
  };
  useEffect(() => {
    window.addEventListener("resize", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("resize", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, []);
  return (
    <>
      <motion.button
        type="button"
        className={`adventure-toy ${selected ? "is-selected" : ""} ${hint ? "is-hinted" : ""}`}
        data-toy={value}
        aria-label={itemLabel(value)}
        aria-pressed={Boolean(selected)}
        disabled={disabled}
        whileTap={{ scale: 0.94 }}
        style={{ rotate: rotation }}
        onPointerDown={(event) => {
          // Motion emits synthetic pointer events for keyboard activation; these
          // have no browser pointer to capture. The normal click handles keyboard.
          if (
            !event.isTrusted ||
            !onDrop ||
            pointer.current ||
            !event.isPrimary ||
            event.button !== 0
          )
            return;
          pointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            moved: false,
          };
          ignoreClick.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const p = pointer.current;
          if (!p || p.id !== event.pointerId) return;
          if (Math.hypot(event.clientX - p.x, event.clientY - p.y) > 8)
            p.moved = true;
          if (p.moved) setGhost({ x: event.clientX, y: event.clientY - 65 });
        }}
        onPointerUp={(event) => {
          const p = pointer.current;
          if (!p || p.id !== event.pointerId) return;
          ignoreClick.current = p.moved;
          if (p.moved) {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
            let target = document
              .elementFromPoint(event.clientX, event.clientY)
              ?.closest("[data-drop-zone]");
            if (!target) {
              const scene = event.currentTarget.closest(".adventure");
              const tolerance =
                scene?.getAttribute("data-strong-snap") === "true" ? 44 : 24;
              target = [
                ...(scene?.querySelectorAll("[data-drop-zone]") ?? []),
              ].filter((node) => {
                const box = node.getBoundingClientRect();
                return (
                  node.getAttribute("aria-disabled") !== "true" &&
                  event.clientX >= box.left - tolerance &&
                  event.clientX <= box.right + tolerance &&
                  event.clientY >= box.top - tolerance &&
                  event.clientY <= box.bottom + tolerance
                );
              }).sort((a, b) => {
                const distance = (node: Element) => {
                  const box = node.getBoundingClientRect();
                  return Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
                };
                return distance(a) - distance(b);
              })[0];
            }
            if (target && target.getAttribute("aria-disabled") !== "true")
              onDrop?.(value);
          }
          cancel();
        }}
        onPointerCancel={(event) => {
          if (pointer.current?.id !== event.pointerId) return;
          ignoreClick.current = true;
          cancel();
        }}
        onLostPointerCapture={(event) => {
          if (pointer.current?.id === event.pointerId) cancel();
        }}
        onClick={() => {
          if (ignoreClick.current) {
            ignoreClick.current = false;
            return;
          }
          onSelect(value);
        }}
      >
        {children}
      </motion.button>
      {ghost &&
        createPortal(
          <div
            className="adventure-drag-ghost"
            style={{
              left: ghost.x,
              top: ghost.y,
              transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
            }}
            aria-hidden="true"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
export function DropZone({
  children,
  onClick,
  disabled = false,
  label = "מקום לחלק שבחרתם",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-drop-zone="true"
      aria-disabled={disabled}
      disabled={disabled}
      className={`adventure-drop ${className}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function ShapeGraphic({
  shape,
  fill = "#59b9c4",
  rotation = 0,
}: {
  shape: Shape;
  fill?: string;
  rotation?: number;
}) {
  const id = useId().replace(/:/g, "");
  const paths: Record<Shape, string> = {
    circle: "M50 10a40 40 0 1 0 0 80a40 40 0 1 0 0-80",
    square: "M15 15H85V85H15Z",
    triangle: "M50 9L94 87H6Z",
    rectangle: "M7 25H93V75H7Z",
    oval: "M50 21a44 29 0 1 0 0 58a44 29 0 1 0 0-58",
    star: "M50 6L63 35L95 38L71 60L78 93L50 76L22 93L29 60L5 38L37 35Z",
  };
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={shapeNames[shape]}
      className="adventure-shape"
    >
      <defs>
        <linearGradient id={id} x2=".5" y2="1">
          <stop stopColor="white" stopOpacity=".55" />
          <stop offset=".55" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>
      <g transform={`rotate(${rotation} 50 50)`}>
        <path d={paths[shape]} fill={fill} stroke="#ffffffaa" strokeWidth="3" />
        <path d={paths[shape]} fill={`url(#${id})`} />
      </g>
    </svg>
  );
}
export function LetterPiece({
  letter,
  part,
  parts = 3,
  complete = false,
}: {
  letter: string;
  part?: number;
  parts?: number;
  complete?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const [ink, setInk] = useState({ x: 20, y: 20, width: 140, height: 140 });
  useEffect(() => {
    let active = true;
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!active || !ctx) return;
      ctx.font = '800 156px "Heebo Variable"';
      ctx.textAlign = "center";
      const metrics = ctx.measureText(letter);
      const width =
        metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
      const height =
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      if (width > 0 && height > 0)
        setInk({
          x: 90 - metrics.actualBoundingBoxLeft - 2,
          y: 139 - metrics.actualBoundingBoxAscent - 2,
          width: width + 4,
          height: height + 4,
        });
    };
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
    };
  }, [letter]);
  // Split the actual ink along its long axis. Fixed canvas thirds produce
  // invisible pieces for narrow letters such as ו and small letters such as י.
  const horizontal = ink.width >= ink.height;
  const clip =
    part === undefined
      ? { x: 0, y: 0, width: 180, height: 180 }
      : horizontal
        ? {
            x: ink.x + (part * ink.width) / parts,
            y: 0,
            width: ink.width / parts,
            height: 180,
          }
        : {
            x: 0,
            y: ink.y + (part * ink.height) / parts,
            width: 180,
            height: ink.height / parts,
          };
  return (
    <svg viewBox="0 0 180 180" className="adventure-letter" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect {...clip} />
        </clipPath>
      </defs>
      <text
        x="90"
        y="139"
        textAnchor="middle"
        fontFamily="Heebo Variable"
        fontWeight="800"
        fontSize="156"
        fill={complete ? "#7755b1" : "#dfb355"}
        stroke={complete ? "#f3e6ff" : "#fff4c8"}
        strokeWidth="2"
        clipPath={`url(#${id})`}
      >
        {letter}
      </text>
    </svg>
  );
}
export function Swatch({ color }: { color: PaintColor }) {
  return (
    <span
      className="adventure-paint-pot"
      style={{ backgroundColor: colorHex[color] }}
    >
      <span />
    </span>
  );
}
export function Food({ kind = "apple" }: { kind?: string }) {
  if (kind === "cookie")
    return (
      <svg viewBox="0 0 100 100" className="adventure-food" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="#d8a35f"
          stroke="#b67f44"
          strokeWidth="6"
        />
        <circle cx="45" cy="43" r="33" fill="#efc783" />
        {[
          [29, 35],
          [60, 23],
          [66, 57],
          [37, 68],
          [43, 48],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="#76533f" />
        ))}
      </svg>
    );
  if (kind === "carrot")
    return (
      <svg viewBox="0 0 100 100" className="adventure-food" aria-hidden="true">
        <path
          d="M57 25Q72 2 78 10M62 26Q96 12 90 27M59 24Q55 3 66 7"
          stroke="#68a866"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M26 88Q23 31 55 24Q89 26 73 48Z"
          fill="#ef934c"
          stroke="#ce7438"
          strokeWidth="4"
        />
        <path
          d="M38 43L54 51M32 62L41 66"
          stroke="#ffc572"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <img
      className="adventure-food"
      src={`/assets/images/objects/${kind === "strawberry" ? "strawberry" : "apple"}.png`}
      alt=""
      draggable={false}
    />
  );
}
export function ChoiceTray({
  step,
  hint,
  busy,
  onAnswer,
}: Pick<BoardProps, "step" | "hint" | "busy" | "onAnswer">) {
  return (
    <div className="adventure-tray" role="group" aria-label="בוחרים תשובה">
      {step.options.map((value) => (
        <Toy
          key={value}
          value={value}
          hint={hint && value === step.answer}
          disabled={busy}
          onSelect={onAnswer}
        >
          {value in colorHex ? (
            <Swatch color={value as PaintColor} />
          ) : value in shapeNames ? (
            <ShapeGraphic shape={value as Shape} />
          ) : (
            <span className="adventure-symbol">
              {value === "first" ? "①" : value === "second" ? "②" : value}
            </span>
          )}
        </Toy>
      ))}
    </div>
  );
}

export function ToyCreation({
  mission,
  progress = 3,
  playing = false,
}: {
  mission: AdventureMission;
  progress?: number;
  playing?: boolean;
}) {
  const colors = ["#f2b34b", "#60b6c4", "#dd859c"];
  const recipe = mission.shapes ?? ["square", "triangle", "circle"];
  const layouts: Record<
    string,
    Array<[number, number, number, number, number?]>
  > = {
    "shape-house": [
      [52, 82, 126, 126],
      [38, 5, 154, 110],
      [95, 115, 45, 45],
    ],
    "shape-boat": [
      [8, 130, 212, 75],
      [66, 20, 100, 120],
      [102, 38, 20, 152],
    ],
    "shape-rocket": [
      [65, 52, 100, 135],
      [68, 0, 94, 85],
      [94, 87, 43, 43],
    ],
    "shape-flower": [
      [75, 50, 85, 85],
      [74, 120, 95, 52, -30],
      [57, 28, 125, 125],
    ],
    "shape-windmill": [
      [90, 95, 50, 120],
      [76, 15, 90, 90],
      [15, 48, 200, 50],
    ],
    "shape-bridge": [
      [12, 120, 205, 65],
      [5, 57, 92, 94],
      [130, 75, 65, 125],
    ],
    "shape-fish": [
      [13, 48, 153, 105],
      [140, 54, 85, 99, 90],
      [75, 13, 75, 70],
    ],
    "shape-arrow": [
      [12, 44, 84, 94, -90],
      [60, 60, 125, 64],
      [143, 44, 84, 94, 90],
    ],
    "shape-car": [
      [15, 37, 200, 140],
      [20, 121, 75, 75],
      [140, 121, 75, 75],
    ],
    "shape-robot": [
      [72, 10, 90, 90],
      [47, 93, 139, 113],
      [103, 125, 30, 30],
    ],
    "shape-train": [
      [15, 87, 153, 91],
      [139, 27, 80, 136],
      [39, 147, 57, 57],
    ],
    "shape-castle": [
      [23, 82, 65, 125],
      [12, 18, 87, 85],
      [98, 96, 111, 111],
    ],
  };
  const layout =
    layouts[mission.id.replace("v2-", "")] ?? layouts["shape-house"];
  return (
    <motion.div
      className={`adventure-creation ${playing ? "is-playing" : ""}`}
      animate={
        playing
          ? { y: [0, -10, 0], rotate: [0, -4, 4, 0] }
          : { y: 0, rotate: 0 }
      }
      transition={{ duration: 1.4, repeat: playing ? Infinity : 0 }}
      role="img"
      aria-label={mission.reward}
    >
      {recipe.map((shape, i) => (
        <div
          key={i}
          className="adventure-creation-piece"
          style={{
            left: layout[i][0],
            top: layout[i][1],
            width: layout[i][2],
            height: layout[i][3],
            transform: `rotate(${layout[i][4] ?? 0}deg)`,
            opacity: i < progress ? 1 : 0.16,
          }}
        >
          <ShapeGraphic shape={shape as Shape} fill={colors[i]} />
        </div>
      ))}
    </motion.div>
  );
}
