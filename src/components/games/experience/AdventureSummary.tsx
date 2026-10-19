import { useState } from "react";
import { PageControls } from '../../common/PageControls';
import {
  adventureMissions,
  adventureWorlds,
} from "../../../content/adventureMissions";
import {
  getActiveProfile,
  getAdventureProgress,
} from "../../../services/learningStoreService";
import type { ExperienceGameId } from "../../../types";
import { MotionConfig } from "motion/react";
import { WorldCreation } from "./WorldCreation";
import "./adventure.css";

export function AdventureSummary({
  gameId,
  onPlayAgain,
  onBackHome,
}: {
  gameId: ExperienceGameId;
  onPlayAgain: () => void;
  onBackHome: () => void;
}) {
  const profile = getActiveProfile();
  const progress = profile ? getAdventureProgress(profile.id, gameId) : null;
  const rewards = (
    progress?.creations?.length
      ? progress.creations
      : (progress?.rewards.map((id) => ({ id, missionId: id, seed: 0 })) ?? [])
  )
    .map((creation) => ({
      ...creation,
      mission: adventureMissions.find((m) => m.id === creation.missionId),
    }))
    .filter((creation) => creation.mission);
  const [active, setActive] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  return (
    <MotionConfig
      reducedMotion={profile?.accessibility.reducedMotion ? "always" : "user"}
    >
      <section
        className="adventure-collection summary-card"
        dir="rtl"
        data-testid="adventure-summary"
      >
        <span className="adventure-kicker">
          האוסף שלי · {adventureWorlds[gameId].title}
        </span>
        <h1>תראו מה יצרנו!</h1>
        <p>כאן מחכות היצירות שלנו, והדברים שגילינו יחד.</p>
        <div className="adventure-reward-grid">
          {rewards.slice(page * 4, page * 4 + 4).map((creation) => (
            <button
              type="button"
              key={creation.id}
              onClick={() =>
                setActive(active === creation.id ? null : creation.id)
              }
              aria-pressed={active === creation.id}
              className={active === creation.id ? "is-active" : ""}
            >
              <WorldCreation
                mission={creation.mission!}
                seed={creation.seed}
                playing={
                  active === creation.id &&
                  !profile?.accessibility.reducedMotion
                }
              />
              <strong>{creation.mission!.reward}</strong>
              <span>
                {active === creation.id
                  ? "איזה כיף לשחק יחד!"
                  : "נוגעים ומפעילים"}
              </span>
            </button>
          ))}
        </div>
        <PageControls page={page} count={Math.ceil(rewards.length / 4)} onChange={setPage} />
        <div className="adventure-summary-actions">
          <button className="adventure-primary" onClick={onPlayAgain}>
            עוד הרפתקאות
          </button>
          <button className="adventure-secondary" onClick={onBackHome}>
            חזרה לתפריט המשחקים
          </button>
        </div>
      </section>
    </MotionConfig>
  );
}
