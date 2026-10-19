import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PageControls } from '../../common/PageControls';
import { CollectionEmblem } from '../../common/CollectionEmblem';
import { getActiveProfile, getDetectiveProgress, getProfileData } from '../../../services/learningStoreService';
import { worldCollection, worldProgress, collectionMilestones, type CollectionWorld } from '../../../data/worldCollection';
import { DiscoveryPicture, discoveryThemes } from './DetectiveVisual';
import type { DiscoveryScope } from '../../../types/detective.types';
import type { GameId } from '../../../types';
import './detective.css';
import './collection.css';

const rewardNames = (world: CollectionWorld) => [world.keepsake, world.companion, `כוכב ${world.name}`];

export function DiscoveryCollection({ onPlay }: { onPlay?: (game: GameId) => void }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<CollectionWorld | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const cards = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastSelected = useRef<string | null>(null);
  useEffect(() => {
    if (selected) { heading.current?.focus(); lastSelected.current = selected.gameId; }
    else if (lastSelected.current) cards.current[lastSelected.current]?.focus();
  }, [selected]);
  const profile = getActiveProfile();
  if (!profile) return null;
  const data = getProfileData(profile.id);
  const total = worldCollection.reduce((sum, world) => sum + worldProgress(data, world.gameId).earned, 0);
  const mixed = worldProgress(data, 'mixed').count;
  const progress = selected ? worldProgress(data, selected.gameId) : null;
  return <section className="world-collection" aria-label="האוסף שלי">
    {selected && progress ? <>
      <div className="collection-detail__top"><button type="button" onClick={() => setSelected(null)}>→ לכל האוצרות</button><span>העולם הקטן שלי</span></div>
      <div className="collection-detail" style={{ '--world-color': selected.color } as CSSProperties}>
        <div className="collection-detail__art"><img src={`/assets/worlds/${selected.gameId}-keepsake.webp`} alt={`פסלון ${selected.companion}`} /><span className="collection-seal"><CollectionEmblem kind={progress.earned ? progress.earned - 1 : 0} /></span></div>
        <div className="collection-detail__body">
          <h2 ref={heading} tabIndex={-1}>{selected.name}</h2>
          <p>{selected.story}</p>
          <ol className="collection-milestones">
            {rewardNames(selected).map((name, index) => <li key={name} data-earned={progress.count >= collectionMilestones[index]}>
              <span className="collection-emblem"><CollectionEmblem kind={index} /></span>
              <div><strong>{name}</strong><small>{progress.count >= collectionMilestones[index] ? 'באוסף שלי ✓' : index === 0 ? 'נפתח אחרי הרפתקה אחת' : `נפתח אחרי ${collectionMilestones[index]} הרפתקאות`}</small></div>
            </li>)}
          </ol>
          <p className="collection-detail__hint">{progress.next ? `עוד ${progress.remaining === 1 ? 'הרפתקה אחת' : `${progress.remaining} הרפתקאות`} והמזכרת הבאה שלכם!` : 'כל המזכרות של העולם הזה כבר שלכם!'}</p>
          {onPlay && selected.gameId !== 'mixed' && <button type="button" className="collection-play" onClick={() => onPlay(selected.gameId as GameId)}>יוצאים להרפתקה ←</button>}
        </div>
      </div>
    </> : <>
      <header className="collection-header"><div><span className="collection-eyebrow">עולמות קטנים, תגליות גדולות</span><h2>האוסף שלי</h2><p>{total ? 'כל מזכרת מספרת סיפור של הרפתקה.' : 'ההרפתקה הראשונה שלכם תהפוך למזכרת.'}</p></div><div className="collection-total"><strong>{total}<small> / 24</small></strong><span>מזכרות שגיליתי</span></div></header>
      <div className="collection-grid">
        {worldCollection.slice(page * 4, page * 4 + 4).map((world, index) => {
          const state = worldProgress(data, world.gameId);
          return <button type="button" key={world.gameId} ref={node => { cards.current[world.gameId] = node; }} className="world-keepsake" data-unlocked={state.earned > 0} style={{ '--world-color': world.color } as CSSProperties} onClick={() => setSelected(world)} aria-label={`${world.name}, ${state.earned} מתוך 3 מזכרות`}>
            <div className="world-keepsake__art"><img src={`/assets/worlds/${world.gameId}-keepsake.webp`} alt="" decoding="async" /><span className="world-keepsake__number" aria-hidden="true">{String(page * 4 + index + 1).padStart(2, '0')}</span><span className="world-keepsake__status">{state.earned ? 'בעולם שלי' : 'מחכה לגילוי'}</span></div>
            <div className="world-keepsake__body"><h3>{world.name}</h3><div className="world-keepsake__rewards" aria-hidden="true">{collectionMilestones.map((milestone, i) => <span key={milestone} data-earned={state.count >= milestone}><CollectionEmblem kind={i} /></span>)}</div><span className="world-keepsake__hint">{state.earned === 3 ? 'כל האוצרות נאספו' : state.earned ? `${state.earned} מתוך 3 מזכרות` : 'כאן מתחיל סיפור חדש'}</span></div>
          </button>;
        })}
      </div>
      <footer className="collection-footer"><span>{mixed > 0 ? `וגם ${mixed} מסעות משולבים שהשלמתם ✦` : 'מגלים · משחקים · אוספים'}</span><PageControls page={page} count={2} onChange={setPage} /></footer>
    </>}
  </section>;
}

export function LastDiscovery({ scope }: { scope?: DiscoveryScope }) {
  const profile = getActiveProfile();
  if (!profile) return null;
  const last = getDetectiveProgress(profile.id).last;
  if (!last || (scope && last.scope !== scope)) return null;
  const world = worldCollection.find(world => world.gameId === last.scope);
  const progress = worldProgress(getProfileData(profile.id), last.scope);
  return <div className="detective-summary" data-testid="discovery-summary">
    <h3>גילינו את {world?.name ?? discoveryThemes[last.scope].title}!</h3>
    {world ? <img className="discovery-world-preview" src={`/assets/worlds/${world.gameId}-keepsake.webp`} alt={world.companion} /> : <DiscoveryPicture scope={last.scope} compact />}
    <p>{world && collectionMilestones.some(m => m === progress.count) ? `מזכרת חדשה באוסף: ${rewardNames(world)[progress.earned - 1]}!` : 'התגלית נוספה לאוסף שלכם.'}</p>
    <div className="detective-summary-counts"><p><strong>{last.independent}</strong>בעצמכם</p><p><strong>{last.assisted}</strong>בעזרת רמז או ניסיון נוסף</p><p><strong>{last.demonstrated}</strong>גילינו ביחד</p></div>
  </div>;
}
