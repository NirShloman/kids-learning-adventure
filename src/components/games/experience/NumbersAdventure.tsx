import { useState } from "react";
import { motion } from "motion/react";
import {
  ChoiceTray,
  DropZone,
  Food,
  Toy,
  type BoardProps,
} from "./AdventurePieces";

export function NumbersAdventure(props: BoardProps) {
  const { step, mission, selected, hint, busy, onSelect, onAnswer } = props;
  const [count, setCount] = useState(step.initial ?? 0);
  const [fed, setFed] = useState(false);
  const food =
    step.kind === "count"
      ? step.target
      : mission.activity === "share" && mission.variant === 1
        ? "cookie"
        : ["apple", "strawberry", "cookie", "carrot"][mission.variant];
  const add = () => {
    if (busy) return;
    setCount((n) => Math.min(12, n + 1));
  };
  if (step.kind === "choose")
    return (
      <>
        <div className="adventure-number-display">
          <img
            className="adventure-monster"
            src="/assets/experience/v2/monster-eat.webp"
            alt="המפלצת נהנית מהארוחה"
          />
          {step.target === "compare" ? (
            <div className="adventure-compare">
              {["first", "second"].map((id, i) => (
                <div key={id} className="adventure-small-plate">
                  <b>{i + 1}</b>
                  <span>
                    {Array.from(
                      { length: (i === 0 ? step.count : step.initial) ?? 0 },
                      (_, j) => (
                        <Food key={j} kind={food} />
                      ),
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="adventure-count-evidence">
              {Array.from({ length: Number(step.answer) }, (_, i) => (
                <Food key={i} kind={food} />
              ))}
            </div>
          )}
        </div>
        <ChoiceTray {...props} />
      </>
    );
  return (
    <>
      <div className="adventure-kitchen-customer">
        <motion.img
          className="adventure-monster"
          src={`/assets/experience/v2/monster-${fed ? "eat" : count ? "ready" : "idle"}.webp`}
          alt="מימו המפלצת מחכה לארוחה"
          animate={
            fed
              ? { rotate: [0, -5, 5, 0], scale: [1, 1.04, 1] }
              : { y: [0, -3, 0] }
          }
          transition={{ duration: 2.6, repeat: Infinity }}
        />
        <div className="adventure-order" aria-label={`הזמנה של ${step.count}`}>
          <span>
            {mission.activity === "share"
              ? step.id === "friend-one"
                ? "לחבר הראשון"
                : "לחבר השני"
              : "ההזמנה שלי"}
          </span>
          <strong>{step.count}</strong>
          <Food kind={food} />
          {hint && (
            <span className="adventure-order-dots">
              {"● ".repeat(step.count ?? 0)}
            </span>
          )}
        </div>
      </div>
      <div className="adventure-plate-area">
        <DropZone
          label="הוספת פרי לצלחת"
          onClick={() => {
            if (selected === "food") add();
          }}
          disabled={busy}
          className="adventure-plate"
        >
          <span
            className="adventure-plate-food"
            role="img"
            aria-label={`${count} פריטים בצלחת`}
            data-count={count}
          >
            {Array.from({ length: count }, (_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, y: -24 }}
                animate={{ scale: 1, y: 0 }}
              >
                <Food kind={food} />
              </motion.span>
            ))}
          </span>
          {!count && (
            <span className="adventure-empty-plate">נניח כאן את האוכל</span>
          )}
        </DropZone>
        <button
          type="button"
          className="adventure-small-button"
          disabled={busy || count <= (step.initial ?? 0)}
          onClick={() => setCount((n) => Math.max(step.initial ?? 0, n - 1))}
          aria-label="החזרת פרי אחד"
        >
          −
        </button>
      </div>
      <div className="adventure-tray adventure-kitchen-tray">
        <Toy
          value="food"
          selected={selected === "food"}
          disabled={busy}
          onSelect={onSelect}
          onDrop={add}
        >
          <Food kind={food} />
        </Toy>
        <span className="adventure-touch-hint">
          נוגעים בפרי ואז בצלחת
          <br />
          אפשר גם לגרור
        </span>
        <button
          type="button"
          className="adventure-primary"
          disabled={busy}
          onClick={() => {
            setFed(String(count) === step.answer);
            onAnswer(String(count));
          }}
        >
          מגישים <span aria-hidden="true">↗</span>
        </button>
      </div>
    </>
  );
}
