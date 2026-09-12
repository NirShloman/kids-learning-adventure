import type {
  AdventureMission,
  AdventureStep,
  PaintColor,
  Shape,
} from "../../../types/adventure.types";
import { Food, LetterPiece, ShapeGraphic, Swatch } from "./AdventurePieces";

export function ActivityDemo({
  mission,
  step,
}: {
  mission: AdventureMission;
  step: AdventureStep;
}) {
  const token =
    mission.gameId === "numbers" ? (
      <Food kind={step.target} />
    ) : mission.gameId === "letters" ? (
      <LetterPiece
        letter={step.target}
        part={step.kind === "place" ? 0 : undefined}
        parts={step.parts}
      />
    ) : mission.gameId === "shapes" ? (
      <ShapeGraphic shape={step.target as Shape} />
    ) : (
      <Swatch
        color={(step.kind === "mix" ? "yellow" : step.target) as PaintColor}
      />
    );
  return (
    <div className={`adventure-demo demo-${mission.gameId}`} aria-hidden="true">
      <div className="adventure-demo-target">
        {mission.gameId === "numbers" ? <span>2</span> : token}
      </div>
      <div
        className={`adventure-demo-token ${mission.activity === "shape-turn" ? "demo-turn" : ""}`}
      >
        {token}
        <i>☝</i>
      </div>
    </div>
  );
}
