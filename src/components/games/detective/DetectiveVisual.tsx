import type { QuestionScene, VisualToken } from "../../../types";
import type { DiscoveryScope } from "../../../types/detective.types";

export function Token({ token }: { token: VisualToken }) {
  if (token.kind === "quantity")
    return (
      <span className="detective-quantity" aria-label={token.label} role="img">
        {Array.from({ length: token.count ?? 0 }, (_, i) => (
          <span key={i} aria-hidden="true">
            {token.value}
          </span>
        ))}
      </span>
    );
  if (token.kind === "color")
    return (
      <span
        className="detective-swatch"
        style={{ background: token.value }}
        role="img"
        aria-label={token.label}
      />
    );
  if (token.kind === "shape")
    return (
      <svg
        className="detective-shape"
        viewBox="0 0 100 100"
        role="img"
        aria-label={token.label}
      >
        <g
          transform={`rotate(${token.rotation ?? 0} 50 50)`}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        >
          {token.value === "circle" ? <circle cx="50" cy="50" r="37" /> : null}
          {token.value === "oval" ? (
            <ellipse cx="50" cy="50" rx="40" ry="25" />
          ) : null}
          {token.value === "square" ? (
            <rect x="17" y="17" width="66" height="66" />
          ) : null}
          {token.value === "rectangle" ? (
            <rect x="9" y="25" width="82" height="50" />
          ) : null}
          {token.value === "triangle" ? (
            <polygon points="50,10 93,86 7,86" />
          ) : null}
          {token.value === "diamond" ? (
            <polygon points="50,5 78,50 50,95 22,50" />
          ) : null}
          {token.value === "pentagon" ? (
            <polygon points="50,7 91,37 76,87 24,87 9,37" />
          ) : null}
          {token.value === "hexagon" ? (
            <polygon points="28,12 72,12 94,50 72,88 28,88 6,50" />
          ) : null}
        </g>
      </svg>
    );
  return (
    <span
      className={`detective-token detective-token--${token.kind}`}
      role={token.kind === "emoji" ? "img" : undefined}
      aria-label={token.label}
    >
      {token.value}
    </span>
  );
}
export function Stimulus({ scene }: { scene?: QuestionScene }) {
  if (!scene) return null;
  return (
    <div
      className={`detective-stimulus detective-stimulus--${scene.kind}`}
      dir={scene.kind === "sequence" ? "ltr" : undefined}
    >
      {scene.kind === "sequence" ? (
        <span
          className="detective-sequence-start"
          aria-label="מתחילים משמאל ומתקדמים ימינה"
        >
          →
        </span>
      ) : null}
      {scene.items.map((token, index) => (
        <div className="detective-stimulus-item" key={index}>
          {scene.kind === "addition" && index > 0 ? (
            <span aria-label="ועוד">+</span>
          ) : null}
          <Token token={token} />
          {scene.kind === "groups" ? (
            <small>{index === 0 ? "הקבוצה הראשונה" : "הקבוצה השנייה"}</small>
          ) : null}
        </div>
      ))}
    </div>
  );
}
export const discoveryThemes: Record<
  DiscoveryScope,
  { title: string; icon: string; color: string; objects: string[] }
> = {
  letters: {
    title: "הספרייה הסודית",
    icon: "📚",
    color: "#7760c7",
    objects: ["📖", "✉️", "🔤", "🪶", "📚", "🔑"],
  },
  numbers: {
    title: "תחנת החלל",
    icon: "🚀",
    color: "#326cb8",
    objects: ["🚀", "🪐", "⭐", "🌙", "🛰️", "☄️"],
  },
  shapes: {
    title: "הארמון הגאומטרי",
    icon: "🏰",
    color: "#b36d2f",
    objects: ["🏰", "🔺", "🔷", "🟡", "🚩", "🌳"],
  },
  colors: {
    title: "הגן הצבעוני",
    icon: "🌷",
    color: "#ad477b",
    objects: ["🌷", "🌈", "🦋", "🌻", "🌿", "🐞"],
  },
  matching: {
    title: "בית החברים",
    icon: "🏡",
    color: "#3c8867",
    objects: ["🏡", "🐱", "🐶", "🌲", "🪁", "☀️"],
  },
  memory: {
    title: "אי הזיכרונות",
    icon: "🏝️",
    color: "#b27625",
    objects: ["🏝️", "🐚", "⛵", "🐠", "🦀", "🌞"],
  },
  patterns: {
    title: "רכבת ההפתעות",
    icon: "🚂",
    color: "#287f92",
    objects: ["🚂", "🚃", "🌻", "🌳", "🎈", "☁️"],
  },
  sorting: {
    title: "השוק הקטן",
    icon: "🧺",
    color: "#aa604c",
    objects: ["🧺", "🍎", "🥕", "🎸", "👕", "🚲"],
  },
  mixed: {
    title: "מועדון התגליות",
    icon: "🔭",
    color: "#6754a1",
    objects: ["🔭", "🌍", "💡", "📚", "🌈", "✨"],
  },
};
export function DiscoveryPicture({
  scope,
  progress = 1,
  compact = false,
}: {
  scope: DiscoveryScope;
  progress?: number;
  compact?: boolean;
}) {
  const theme = discoveryThemes[scope],
    reveal = Math.max(0, Math.min(12, Math.floor(progress * 12)));
  return (
    <div
      className={`discovery-picture ${compact ? "discovery-picture--compact" : ""}`}
      style={{ "--discovery-color": theme.color } as React.CSSProperties}
      role="img"
      aria-label={
        progress >= 1 ? theme.title : "תמונה מסתורית שנחשפת עם כל תגלית"
      }
    >
      <svg viewBox="0 0 360 260" aria-hidden="true">
        <rect width="360" height="260" rx="28" fill="#e2f1ee" />
        <circle cx="295" cy="52" r="29" fill="#ffdf89" />
        <path d="M0 182Q110 86 224 175T360 168V260H0Z" fill="#bdddb4" />
        <path d="M0 219Q140 148 360 218V260H0Z" fill="#92c7ac" />
        <path
          d="M152 260Q118 182 211 161"
          fill="none"
          stroke="#fff0c8"
          strokeWidth="30"
        />
        {theme.objects.map((object, i) => (
          <text
            key={i}
            x={[70, 174, 287, 65, 178, 290][i]}
            y={[108, 128, 118, 214, 215, 215][i]}
            textAnchor="middle"
            fontSize={i === 1 ? 76 : 49}
          >
            {object}
          </text>
        ))}
        {Array.from({ length: 12 }, (_, i) =>
          i >= reveal ? (
            <g key={i}>
              <rect
                x={(i % 4) * 90 + 1}
                y={Math.floor(i / 4) * 87 + 1}
                width="88"
                height="85"
                rx="12"
                fill={theme.color}
              />
              <text
                x={(i % 4) * 90 + 45}
                y={Math.floor(i / 4) * 87 + 53}
                textAnchor="middle"
                fill="#ffffff"
                opacity=".8"
                fontSize="24"
              >
                ✦
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}
