import {
  getActiveProfile,
  getDetectiveProgress,
} from "../../../services/learningStoreService";
import { DiscoveryPicture, discoveryThemes } from "./DetectiveVisual";
import type { DiscoveryScope } from "../../../types/detective.types";
import "./detective.css";

export function DiscoveryCollection() {
  const profile = getActiveProfile();
  if (!profile) return null;
  const discoveries = getDetectiveProgress(profile.id).discoveries;
  if (!discoveries.length) return null;
  const scopes = [...new Set(discoveries.map((value) => value.scope))];
  return (
    <details className="detective-collection">
      <summary>🔎 אוסף התגליות שלי · {discoveries.length}</summary>
      <div className="detective-collection-grid">
        {scopes.map((scope) => (
          <figure key={scope}>
            <DiscoveryPicture scope={scope} />
            <figcaption>
              {discoveryThemes[scope].title} ·{" "}
              {discoveries.filter((v) => v.scope === scope).length} סבבים
            </figcaption>
          </figure>
        ))}
      </div>
    </details>
  );
}
export function LastDiscovery({ scope }: { scope?: DiscoveryScope }) {
  const profile = getActiveProfile();
  if (!profile) return null;
  const last = getDetectiveProgress(profile.id).last;
  if (!last || (scope && last.scope !== scope)) return null;
  return (
    <div className="detective-summary" data-testid="discovery-summary">
      <h3>גילינו את {discoveryThemes[last.scope].title}!</h3>
      <DiscoveryPicture scope={last.scope} compact />
      <p>התגלית נוספה לאוסף שלכם.</p>
      <div className="detective-summary-counts">
        <p>
          <strong>{last.independent}</strong>בעצמכם
        </p>
        <p>
          <strong>{last.assisted}</strong>בעזרת רמז או ניסיון נוסף
        </p>
        <p>
          <strong>{last.demonstrated}</strong>גילינו ביחד
        </p>
      </div>
    </div>
  );
}
