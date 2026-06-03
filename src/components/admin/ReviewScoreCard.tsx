import { QuestionReviewReport } from '../../types';

interface ReviewScoreCardProps {
  review?: QuestionReviewReport;
}

function scoreClass(score: number): string {
  if (score >= 90) return 'admin-score admin-score--good';
  if (score >= 75) return 'admin-score admin-score--warn';
  return 'admin-score admin-score--bad';
}

export function ReviewScoreCard({ review }: ReviewScoreCardProps) {
  if (!review) {
    return (
      <section className="admin-review-card">
        <h3>בדיקת איכות</h3>
        <p>הריצו בדיקה כדי לראות ציון, בעיות והמלצות לפני שמירה.</p>
      </section>
    );
  }

  const scores = [
    ['כללי', review.overallScore],
    ['גיל', review.ageFitScore],
    ['בהירות', review.clarityScore],
    ['שפה', review.languageScore],
    ['פדגוגיה', review.pedagogyScore],
    ['בטיחות', review.safetyScore],
    ['גיוון', review.diversityScore],
    ['נגישות', review.accessibilityScore]
  ] as const;

  return (
    <section className="admin-review-card">
      <div className="admin-review-card__header">
        <h3>בדיקת איכות</h3>
        <span className={review.approved ? 'admin-status admin-status--approved' : 'admin-status admin-status--needs_changes'}>
          {review.status}
        </span>
      </div>

      <div className="admin-score-grid">
        {scores.map(([label, score]) => (
          <div key={label} className={scoreClass(score)}>
            <strong>{score}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {review.issues.length ? (
        <div className="admin-issues">
          {review.issues.map((issue, index) => (
            <div key={`${issue.field}-${index}`} className={`admin-issue admin-issue--${issue.severity}`}>
              <strong>{issue.field}</strong>
              <span>{issue.message}</span>
              {issue.suggestion ? <small>{issue.suggestion}</small> : null}
            </div>
          ))}
        </div>
      ) : (
        <p>לא נמצאו בעיות חסימה.</p>
      )}

      <p className="admin-review-card__recommendation">{review.finalRecommendation}</p>
    </section>
  );
}
