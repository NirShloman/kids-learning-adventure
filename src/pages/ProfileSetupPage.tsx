import { FormEvent, useState } from 'react';
import type { LearnerGender, LocalLearnerState } from '../types';
import { isValidHebrewName, normalizeHebrewName } from '../utils/hebrew';
import { BrandLogo } from '../components/common/BrandLogo';

interface ProfileSetupPageProps {
  learner: LocalLearnerState;
  onSave: (name: string, gender: LearnerGender | null) => void;
}

export function ProfileSetupPage({ learner, onSave }: ProfileSetupPageProps) {
  const [name, setName] = useState(learner.name);
  const [gender, setGender] = useState<LearnerGender | null>(learner.gender);
  const [showErrors, setShowErrors] = useState(false);
  const normalizedName = normalizeHebrewName(name);
  const nameIsValid = normalizedName.length === 0 || isValidHebrewName(normalizedName);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nameIsValid) {
      setShowErrors(true);
      return;
    }
    onSave(normalizedName, gender);
  }

  return (
    <main className="profile-setup" dir="rtl">
      <form className="profile-setup__card" onSubmit={handleSubmit} noValidate>
        <BrandLogo variant="mark" className="profile-setup__logo" decorative />
        <span className="profile-setup__eyebrow">נעים להכיר</span>
        <h1>מי מצטרף אלינו להרפתקה?</h1>
        <p>הפרטים נשמרים רק במכשיר הזה.</p>

        <label className="profile-setup__field" htmlFor="learner-name">
          <span>כינוי (אופציונלי)</span>
          <input
            id="learner-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            inputMode="text"
            maxLength={30}
            placeholder="אפשר לדלג"
            aria-invalid={showErrors && !nameIsValid}
            autoFocus
          />
        </label>
        {showErrors && !nameIsValid ? <p className="profile-setup__error" role="alert">אם בוחרים כינוי, יש לכתוב אותו בעברית.</p> : null}

        <fieldset className="profile-setup__gender">
          <legend>איזו דמות תלווה אותך? (אופציונלי)</legend>
          <button type="button" className={gender === 'boy' ? 'is-selected' : ''} aria-pressed={gender === 'boy'} onClick={() => setGender('boy')}>
            <span aria-hidden="true">👦</span>
            ניר
          </button>
          <button type="button" className={gender === 'girl' ? 'is-selected' : ''} aria-pressed={gender === 'girl'} onClick={() => setGender('girl')}>
            <span aria-hidden="true">👧</span>
            שיר
          </button>
          <button type="button" className={gender === null ? 'is-selected' : ''} aria-pressed={gender === null} onClick={() => setGender(null)}>
            <span aria-hidden="true">✨</span>
            בלי העדפה
          </button>
        </fieldset>

        <button className="profile-setup__submit" type="submit">יאללה, מתחילים!</button>
      </form>
    </main>
  );
}
