import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { getActiveProfile } from "../../../services/learningStoreService";
import type { ExperienceGameId } from "../../../types";
import { prepareAdventureOffline } from "./adventureOffline";

export function OfflinePreparation({ gameId }: { gameId: ExperienceGameId }) {
  const [status, setStatus] = useState<"idle" | "saving" | "ready" | "error">(
    "idle",
  );
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  if (!import.meta.env.PROD || Capacitor.isNativePlatform()) return null;
  const save = async () => {
    setStatus("saving");
    try {
      await prepareAdventureOffline(
        gameId,
        getActiveProfile()?.avatarId ?? "shir",
      );
      if (active.current) setStatus("ready");
    } catch {
      if (active.current) setStatus("error");
    }
  };
  return (
    <div className="adventure-offline-preparation">
      <button
        type="button"
        className="btn btn--secondary"
        style={{ minHeight: 56, marginTop: 16 }}
        disabled={status === "saving" || status === "ready"}
        onClick={save}
      >
        {status === "saving"
          ? "שומרים את המשחק…"
          : status === "ready"
            ? "המשחק מוכן גם ללא רשת"
            : "שמירה למשחק ללא רשת"}
      </button>
      <p role="status">
        {status === "error"
          ? "השמירה לא הושלמה. אפשר לנסות שוב בחיבור לרשת."
          : status === "ready"
            ? "התמונות והקריינות נשמרו במכשיר הזה."
            : ""}
      </p>
    </div>
  );
}
