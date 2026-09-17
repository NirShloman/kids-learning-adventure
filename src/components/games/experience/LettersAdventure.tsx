import {
  ChoiceTray,
  DropZone,
  LetterPiece,
  Toy,
  type BoardProps,
} from "./AdventurePieces";

export function LettersAdventure(props: BoardProps) {
  const { step, selected, hint, busy, onSelect, onAnswer } = props;
  if (step.kind === "choose")
    return (
      <>
        <div className="adventure-letter-sign">
          <span className="adventure-sign-string" />
          {step.word ? (
            <div className="adventure-word" aria-label={step.word}>
              <span className="adventure-word-gap">?</span>
              {step.word.slice(1)}
            </div>
          ) : (
            <div className="adventure-letter-discovery" aria-hidden="true">
              ?<span>איזו אות מסתתרת כאן?</span>
            </div>
          )}
        </div>
        <ChoiceTray {...props} />
      </>
    );
  return (
    <>
      <DropZone
        disabled={busy}
        onClick={() => {
          if (selected) onAnswer(selected);
        }}
        className="adventure-letter-mould"
        label="חיבור החלק לתבנית האות"
      >
        <LetterPiece letter={step.target} />
        {Array.from({ length: step.part ?? 0 }, (_, i) => (
          <div className="adventure-letter-layer" key={i}>
            <LetterPiece
              letter={step.target}
              parts={step.parts}
              part={i}
              complete
            />
          </div>
        ))}
        <div className="adventure-letter-layer adventure-next-part">
          <LetterPiece
            letter={step.target}
            parts={step.parts}
            part={step.part}
          />
        </div>
      </DropZone>
      <div className="adventure-tray" role="group" aria-label="חלקי האות">
        {step.options
          .filter((value) => Number(value.slice(5)) >= (step.part ?? 0))
          .map((value) => (
            <Toy
              key={value}
              value={value}
              selected={selected === value}
              hint={hint && value === step.answer}
              disabled={busy}
              onSelect={onSelect}
              onDrop={onAnswer}
            >
              <LetterPiece
                letter={step.target}
                part={Number(value.slice(5))}
                parts={step.parts}
              />
            </Toy>
          ))}
      </div>
    </>
  );
}
