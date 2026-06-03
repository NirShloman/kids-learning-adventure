import { DuplicateCheckResult } from '../../types';

interface DuplicateWarningProps {
  duplicate?: DuplicateCheckResult;
}

export function DuplicateWarning({ duplicate }: DuplicateWarningProps) {
  if (!duplicate) {
    return (
      <section className="admin-duplicate admin-duplicate--idle">
        <h3>בדיקת כפילויות</h3>
        <p>הבדיקה תרוץ מול שאלות מאושרות וממתינות לפני שמירה.</p>
      </section>
    );
  }

  const tone = duplicate.isDuplicate ? 'bad' : duplicate.isSimilar ? 'warn' : 'good';
  const title = duplicate.isDuplicate
    ? 'נמצאה כפילות'
    : duplicate.isSimilar
      ? 'נמצאה שאלה דומה'
      : 'לא נמצאה כפילות';

  return (
    <section className={`admin-duplicate admin-duplicate--${tone}`}>
      <div>
        <h3>{title}</h3>
        <p>ציון דמיון: {Math.round(duplicate.similarityScore * 100)}%</p>
      </div>
      {duplicate.reason ? <p>{duplicate.reason}</p> : null}
      {duplicate.matchedQuestionIds.length ? (
        <div className="admin-duplicate__matches">
          {duplicate.matchedQuestionIds.slice(0, 6).map((id) => <span key={id}>{id}</span>)}
        </div>
      ) : null}
    </section>
  );
}
