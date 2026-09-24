import { useEffect } from "react";
import type { ExperienceGameId, GameMode } from "../../../types";
import { useSpeech } from "../../../hooks/useSpeech";
import { GameWorld } from "../GameWorld";
import { adventureWorlds } from "../../../content/adventureMissions";
import { OfflinePreparation } from "./OfflinePreparation";
import { platformRuntime } from '../../../services/platformRuntime';
import {
  getActiveProfile,
  getAdventureProgress,
} from "../../../services/learningStoreService";

interface GameModeSelectorProps {
  gameId: ExperienceGameId;
  title: string;
  voiceEnabled: boolean;
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
  onCollection: () => void;
}

export function GameModeSelector({
  gameId,
  title,
  voiceEnabled,
  onSelect,
  onBack,
  onCollection,
}: GameModeSelectorProps) {
  const { speak, stop, preload, getSpeakProps } = useSpeech(voiceEnabled);
  const profile = getActiveProfile();
  const hasCollection =
    profile && getAdventureProgress(profile.id, gameId).rewards.length > 0;

  useEffect(() => {
    preload([
      `איך תרצו לשחק ב${title}? אפשר לצאת להרפתקה, או לשחק בחידון.`,
      "משחק חווייתי, נוגעים במקום ובפריטים כדי לשחק",
      "טריוויה, בוחרים את התשובה הנכונה",
    ]);
  }, [preload, title]);

  useEffect(() => {
    speak(`איך תרצו לשחק ב${title}? אפשר לצאת להרפתקה, או לשחק בחידון.`);
    return stop;
  }, [speak, stop, title]);

  return (
    <GameWorld
      gameId={gameId}
      title={title}
      status="בוחרים משחק"
      onBack={onBack}
      backSpeakProps={getSpeakProps<HTMLButtonElement>("חזרה לתפריט המשחקים")}
    >
      <div className="game-play-card game-mode-selector">
        <span className="question-card__tag">איך משחקים היום?</span>
        <h2>בחרו דרך לשחק</h2>
        <p>אפשר לבחור במשחק חווייתי במגע ישיר, או בחידון המוכר.</p>
        <div className="game-mode-selector__options">
          <button
            type="button"
            className="game-mode-card game-mode-card--featured"
            onClick={() => onSelect("experience")}
            {...getSpeakProps<HTMLButtonElement>(
              "משחק חווייתי, נוגעים במקום ובפריטים כדי לשחק",
            )}
          >
            <img
              src={adventureWorlds[gameId].image}
              alt=""
              className="adventure-mode-preview"
              style={{
                width: "100%",
                height: 150,
                objectFit: "cover",
                borderRadius: 20,
              }}
            />
            <strong>משחק חווייתי</strong>
            <span>{adventureWorlds[gameId].title}</span>
            <kbd>נוגעים ומשחקים</kbd>
          </button>
          <button
            type="button"
            className="game-mode-card"
            onClick={() => onSelect("quiz")}
            {...getSpeakProps<HTMLButtonElement>(
              "טריוויה, בוחרים את התשובה הנכונה",
            )}
          >
            <span className="game-mode-card__icon" aria-hidden="true">
              💡
            </span>
            <strong>טריוויה</strong>
            <span>מקשיבים ובוחרים תשובה</span>
          </button>
        </div>
        {import.meta.env.PROD && !platformRuntime.native && <details className="offline-menu"><summary>שמירה ללא רשת</summary><OfflinePreparation gameId={gameId} /></details>}
        {hasCollection && (
          <button
            type="button"
            className="btn btn--secondary"
            style={{ minHeight: 56, marginTop: 16 }}
            onClick={onCollection}
            {...getSpeakProps<HTMLButtonElement>("האוסף שלי")}
          >
            האוסף שלי ✦
          </button>
        )}
      </div>
    </GameWorld>
  );
}
