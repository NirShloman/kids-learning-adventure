import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DetectiveItem,
  DetectiveRound,
  DiscoveryScope,
} from "../../../types/detective.types";
import type { LearnerProfile, VisualToken } from "../../../types";
import { useSpeech } from "../../../hooks/useSpeech";
import {
  saveDetectiveRound,
  finishDetectiveRound,
} from "../../../services/learningStoreService";
import {
  answerChoice,
  answerPair,
  orderBySeed,
  useHint,
} from "./detectiveEngine";
import {
  DiscoveryPicture,
  discoveryThemes,
  Stimulus,
  Token,
} from "./DetectiveVisual";
import { gameDefinitions } from "../../../data/games";
import "./detective.css";

interface Props {
  profile: LearnerProfile;
  scope: DiscoveryScope;
  items: DetectiveItem[];
  initialRound: DetectiveRound;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (round: DetectiveRound) => void;
}
export function DetectiveSession({
  profile,
  scope,
  items,
  initialRound,
  voiceEnabled,
  onBack,
  onFinish,
}: Props) {
  const [round, setRound] = useState(initialRound),
    live = useRef(initialRound);
  const [selection, setSelection] = useState<string[]>([]),
    selectionRef = useRef<string[]>([]);
  const [pairFeedback, setPairFeedback] = useState(""),
    pairLocked = useRef(false);
  const [peek, setPeek] = useState<string | null>(null);
  const startedAt = useRef(performance.now()),
    finishGuard = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const { speak, stop, preload } = useSpeech(voiceEnabled);
  const step = round.steps[round.index];
  const stepItems = useMemo(
    () =>
      step.ids
        .map((id) => items.find((item) => item.id === id)!)
        .filter(Boolean),
    [items, step],
  );
  const current = stepItems[0],
    pairMode = step.gameId === "matching" || step.gameId === "memory";
  const title = gameDefinitions.find((game) => game.id === step.gameId)!.title;
  const allCount = round.steps.reduce((sum, s) => sum + s.ids.length, 0),
    done = Object.keys(round.outcomes).length;
  const complete = step.ids.every((id) => Boolean(round.outcomes[id]));
  const outcome = round.outcomes[current.id],
    hasHint = round.hinted.includes(current.id);
  const prompt = pairMode
    ? step.gameId === "memory"
      ? "הופכים שני קלפים ומחפשים זוג."
      : "בוחרים כרטיס מכל צד ומחברים זוג."
    : (current.prompt ?? "מה מתאים?");
  const cards = useMemo(
    () =>
      orderBySeed(
        stepItems.flatMap((item) =>
          ["a", "b"].map((side) => ({
            id: `${item.id}:${side}`,
            item,
            side,
            token: (side === "a"
              ? item.leftVisual
              : item.rightVisual) as VisualToken,
          })),
        ),
        `${round.id}:${round.index}`,
      ),
    [stepItems, round.id, round.index],
  );

  useEffect(() => {
    preload([
      prompt,
      ...stepItems.flatMap((item) => [
        item.hint ?? "",
        item.explanation ?? "",
        ...(item.options ?? []).map((option) => option.label),
      ]),
    ]);
    speak(prompt);
    heading.current?.focus();
    startedAt.current = performance.now();
    return stop;
  }, [prompt, stepItems, preload, speak, stop]);
  useEffect(() => () => stop(), [stop]);
  function commit(
    next: DetectiveRound,
    item?: DetectiveItem,
    correct?: boolean,
    previous?: DetectiveRound,
  ) {
    live.current = next;
    setRound(next);
    saveDetectiveRound(
      profile.id,
      scope,
      next,
      item
        ? {
            profileId: profile.id,
            sessionId: next.id,
            contentId: item.id,
            gameId: step.gameId,
            skillIds: item.skillIds ?? [],
            evidenceForm: item.evidenceForm ?? "visual-choice",
            correct: Boolean(correct),
            attemptNumber: next.attempts[item.id],
            hintUsed: previous?.hinted.includes(item.id) ?? false,
            responseMs: Math.round(performance.now() - startedAt.current),
            monotonicMs: Math.round(performance.now()),
          }
        : undefined,
    );
  }
  function choose(optionId: string) {
    const before = live.current,
      next = answerChoice(before, current, optionId);
    if (before === next) return;
    commit(next, current, optionId === current.correctOptionId, before);
    speak(
      next.outcomes[current.id]
        ? (current.explanation ?? "כל הכבוד!")
        : (current.hint ?? "ננסה שוב."),
    );
  }
  function hint() {
    if (pairLocked.current) return;
    const item = pairMode
      ? stepItems.find((item) => !live.current.outcomes[item.id])
      : current;
    if (!item || live.current.outcomes[item.id]) return;
    commit(useHint(live.current, item.id));
    speak(item.hint ?? "נביט שוב.");
    if (pairMode) {
      setPeek(item.id);
      selectionRef.current = [];
      setSelection([]);
    }
  }
  function clearPair() {
    selectionRef.current = [];
    setSelection([]);
    setPairFeedback("");
    setPeek(null);
    pairLocked.current = false;
    startedAt.current = performance.now();
  }
  function pairClick(cardId: string) {
    if (pairLocked.current || peek) return;
    const card = cards.find((c) => c.id === cardId);
    if (
      !card ||
      live.current.outcomes[card.item.id] ||
      selectionRef.current.includes(cardId)
    )
      return;
    const first = cards.find((c) => c.id === selectionRef.current[0]);
    if (first && step.gameId === "matching" && first.side === card.side) {
      selectionRef.current = [cardId];
      setSelection([cardId]);
      return;
    }
    const next = [...selectionRef.current, cardId];
    selectionRef.current = next;
    setSelection(next);
    if (next.length !== 2 || !first) return;
    pairLocked.current = true;
    const correct = first.item.id === card.item.id;
    const before = live.current,
      updated = answerPair(before, first.item.id, correct);
    commit(updated, first.item, correct, before);
    const feedback = correct
      ? (first.item.explanation ?? "מצאנו זוג!")
      : "הכרטיסים שונים. נזכור אותם וננסה שוב.";
    setPairFeedback(feedback);
    speak(feedback);
  }
  function next() {
    const latest = live.current;
    // Two activations can arrive before React commits the next activity.
    if (
      latest.index !== round.index ||
      !step.ids.every((id) => latest.outcomes[id])
    )
      return;
    stop();
    clearPair();
    if (latest.index + 1 === latest.steps.length) {
      if (finishGuard.current) return;
      finishGuard.current = true;
      finishDetectiveRound(profile.id, scope, latest);
      onFinish(latest);
      return;
    }
    commit({ ...latest, index: latest.index + 1 });
  }
  function renderPair(card: (typeof cards)[number]) {
    const matched = Boolean(round.outcomes[card.item.id]),
      selected = selection.includes(card.id),
      isPeek = peek === card.item.id;
    const visible = step.gameId === "matching" || selected || matched || isPeek;
    return (
      <div className="detective-pair-wrap" key={card.id}>
        <button
          type="button"
          className={`detective-pair-card ${visible ? "" : "detective-pair-card--hidden"} ${matched ? "is-matched" : ""} ${isPeek ? "is-hint" : ""}`}
          data-testid={
            step.gameId === "memory"
              ? "memory-card"
              : `matching-${card.side === "a" ? "left" : "right"}`
          }
          data-pair-id={card.item.id}
          aria-label={
            visible ? card.token.label : `קלף ${cards.indexOf(card) + 1}, סגור`
          }
          aria-pressed={selected}
          disabled={matched || Boolean(peek) || pairLocked.current}
          onClick={() => pairClick(card.id)}
        >
          {visible ? (
            <>
              <Token token={card.token} />
              {matched ? <small>✓ מצאנו זוג</small> : null}
            </>
          ) : (
            <span aria-hidden="true">✦</span>
          )}
        </button>
        <button
          type="button"
          className="detective-option-audio"
          style={{ visibility: visible && !matched ? "visible" : "hidden" }}
          disabled={!voiceEnabled || !visible || matched}
          aria-label={
            visible ? `הקראת כרטיס: ${card.token.label}` : "הקראת כרטיס"
          }
          onClick={() => speak(card.token.label)}
        >
          🔊 הקראה
        </button>
      </div>
    );
  }
  const access = profile.accessibility;
  return (
    <section
      className={`detective-game game-world ${access.reducedMotion ? "detective-reduced-motion" : ""} ${access.highContrast ? "detective-high-contrast" : ""} ${access.largeTouchTargets ? "detective-large-targets" : ""}`}
      dir="rtl"
      data-testid={scope === "mixed" ? "adaptive-session" : "detective-session"}
      data-game={step.gameId}
      data-age={round.age}
      data-difficulty={round.difficulty}
    >
      <header className="detective-header">
        <div>
          <span className="detective-eyebrow">ידע׳לה · בלשי התגליות</span>
          <h1>{scope === "mixed" ? "תרגול מותאם" : title}</h1>
        </div>
        <button
          className="detective-back"
          onClick={() => {
            stop();
            onBack();
          }}
        >
          חזרה לתפריט
        </button>
      </header>
      <div className="detective-layout">
        <aside className="detective-case">
          <h2>איזו תגלית מסתתרת כאן?</h2>
          <DiscoveryPicture scope={scope} progress={done / allCount} />
          <div className="detective-guide">
            <img src="/assets/images/characters/guide-happy.png" alt="" />
            <p>
              כל פתרון מגלה עוד חלק.
              <br />
              אפשר לחשוב, להקשיב ולבקש רמז.
            </p>
          </div>
          <div
            className="detective-progress"
            role="progressbar"
            aria-label="חלקים שנחשפו"
            aria-valuemin={0}
            aria-valuemax={allCount}
            aria-valuenow={done}
          >
            <span style={{ width: `${(done / allCount) * 100}%` }} />
          </div>
          <p>
            {done} מתוך {allCount} תגליות קטנות
          </p>
        </aside>
        <div className="detective-card">
          <div className="detective-card-top">
            <span className="detective-chip">
              {title} · {round.index + 1}/{round.steps.length}
            </span>
            <div className="detective-tools">
              <button
                className="detective-tool"
                aria-label="הקראת ההוראה"
                disabled={!voiceEnabled}
                onClick={() => speak(prompt)}
              >
                🔊 שוב
              </button>
              <button
                className="detective-tool"
                disabled={complete || pairLocked.current}
                onClick={hint}
              >
                💡 רמז
              </button>
            </div>
          </div>
          <h2 ref={heading} tabIndex={-1}>
            {prompt}
          </h2>
          {!pairMode ? (
            <>
              <Stimulus scene={current.scene} />
              <div
                className="detective-answers"
                data-count={current.options?.length}
              >
                {current.options?.map((option) => {
                  const correct = option.id === current.correctOptionId,
                    wrong = round.wrongOptions[current.id]?.includes(option.id);
                  return (
                    <div className="detective-answer-wrap" key={option.id}>
                      <button
                        type="button"
                        className={`detective-answer ${outcome && correct ? "option-card--correct" : ""} ${wrong ? "option-card--wrong" : ""}`}
                        data-testid={
                          step.gameId === "patterns"
                            ? "pattern-option"
                            : step.gameId === "sorting"
                              ? "sorting-option"
                              : "quiz-option"
                        }
                        data-correct={correct}
                        aria-label={option.label}
                        disabled={Boolean(outcome) || wrong}
                        onClick={() => choose(option.id)}
                      >
                        {option.visualToken ? (
                          <Token token={option.visualToken} />
                        ) : null}
                        {option.visualToken?.kind !== "text" ? (
                          <span className="detective-answer-label">
                            {option.label}
                          </span>
                        ) : null}
                        {outcome && correct ? (
                          <span>✓</span>
                        ) : wrong ? (
                          <span>ננסה אחרת</span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className="detective-option-audio"
                        aria-label={`הקראת תשובה: ${option.label}`}
                        disabled={!voiceEnabled}
                        onClick={() => speak(option.label)}
                      >
                        🔊 הקראה
                      </button>
                    </div>
                  );
                })}
              </div>
              {outcome ? (
                <div className="detective-feedback" role="status">
                  <strong>
                    {outcome === "independent"
                      ? "גיליתם בעצמכם!"
                      : outcome === "assisted"
                        ? "הרמז עזר לגלות!"
                        : "מגלים ביחד"}
                  </strong>
                  <p>{current.explanation}</p>
                  <button
                    className="detective-tool"
                    disabled={!voiceEnabled}
                    onClick={() => speak(current.explanation ?? "")}
                  >
                    🔊 הקראת ההסבר
                  </button>
                </div>
              ) : hasHint ? (
                <div
                  className="detective-feedback detective-feedback--hint"
                  role="status"
                >
                  <strong>נחשוב יחד</strong>
                  <p>{current.hint}</p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p>{current.hint}</p>
              <div
                className={`detective-pair-grid ${step.gameId === "matching" ? "detective-pair-grid--matching" : ""}`}
                data-card-count={cards.length}
              >
                {step.gameId === "matching"
                  ? ["a", "b"].map((side) => (
                      <div key={side} className="detective-pair-column">
                        {cards
                          .filter((card) => card.side === side)
                          .map(renderPair)}
                      </div>
                    ))
                  : cards.map(renderPair)}
              </div>
              {peek ? (
                <div
                  className="detective-feedback detective-feedback--hint"
                  role="status"
                >
                  <p>
                    {stepItems.find((item) => item.id === peek)?.explanation}
                  </p>
                  <button className="detective-next" onClick={clearPair}>
                    מסתירים ומנסים
                  </button>
                </div>
              ) : null}
              {pairFeedback ? (
                <div className="detective-feedback" role="status">
                  <p>{pairFeedback}</p>
                  {!complete ? (
                    <button className="detective-next" onClick={clearPair}>
                      ממשיכים לחפש
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
          {complete ? (
            <button type="button" className="detective-next" onClick={next}>
              {round.index + 1 === round.steps.length
                ? "מגלים את התמונה"
                : pairMode
                  ? "לתגלית הבאה"
                  : "לשאלה הבאה"}
            </button>
          ) : null}
        </div>
      </div>
      <span className="visually-hidden">{discoveryThemes[scope].icon}</span>
    </section>
  );
}
