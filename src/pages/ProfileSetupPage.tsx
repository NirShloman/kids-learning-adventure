import { FormEvent, useState } from 'react';
import type { Difficulty, LearnerGender, LocalLearnerState } from '../types';
import { ageOptions, difficultyOptions } from '../data/levels';
import { isValidHebrewName, normalizeHebrewName } from '../utils/hebrew';
import { BrandLogo } from '../components/common/BrandLogo';
import { SelectField } from '../components/common/SelectField';

export interface ProfileSetupDraft {
  name: string;
  gender: LearnerGender | null;
  age: LocalLearnerState['age'];
  difficulty: Difficulty;
}

interface ProfileSetupPageProps {
  learner: LocalLearnerState;
  isNew: boolean;
  onSave: (draft: ProfileSetupDraft) => void;
}

export function ProfileSetupPage({ learner, isNew, onSave }: ProfileSetupPageProps) {
  const [name, setName] = useState(isNew ? '' : learner.name);
  const [gender, setGender] = useState<LearnerGender | null>(isNew ? null : learner.gender);
  const [age, setAge] = useState<LocalLearnerState['age'] | null>(isNew ? null : learner.age);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(isNew ? null : learner.difficulty);
  const [showErrors, setShowErrors] = useState(false);
  const normalizedName = normalizeHebrewName(name);
  const nameIsValid = normalizedName.length === 0 || isValidHebrewName(normalizedName);
  const choicesAreValid = age !== null && difficulty !== null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nameIsValid || !choicesAreValid) {
      setShowErrors(true);
      return;
    }
    onSave({ name: normalizedName, gender, age, difficulty });
  }

  return (
    <main className="profile-setup" dir="rtl">
      <form className="profile-setup__card" onSubmit={handleSubmit} noValidate>
        <BrandLogo variant="mark" className="profile-setup__logo" decorative />
        <span className="profile-setup__eyebrow">נעים להכיר</span>
        <h1>{isNew ? 'מי מצטרף אלינו להרפתקה?' : 'בואו נתאים את הפרופיל'}</h1>
        <p>הפרטים נשמרים רק במכשיר הזה ומכוונים את השאלות והמשחקים.</p>

        <label className="profile-setup__field" htmlFor="learner-name">
          <span>כינוי (אופציונלי)</span>
          <input id="learner-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" inputMode="text" maxLength={30} placeholder="אפשר לדלג" aria-invalid={showErrors && !nameIsValid} autoFocus />
        </label>
        {showErrors && !nameIsValid ? <p className="profile-setup__error" role="alert">אם בוחרים כינוי, יש לכתוב אותו בעברית.</p> : null}

        <fieldset className="profile-setup__gender">
          <legend>איזו דמות תלווה אותך? (אופציונלי)</legend>
          <button type="button" className={gender === 'boy' ? 'is-selected' : ''} aria-pressed={gender === 'boy'} onClick={() => setGender('boy')}><span aria-hidden="true">👦</span>אני בן</button>
          <button type="button" className={gender === 'girl' ? 'is-selected' : ''} aria-pressed={gender === 'girl'} onClick={() => setGender('girl')}><span aria-hidden="true">👧</span>אני בת</button>
          <button type="button" className={gender === null ? 'is-selected' : ''} aria-pressed={gender === null} onClick={() => setGender(null)}><span aria-hidden="true">✨</span>בלי העדפה</button>
        </fieldset>

        <div className="profile-setup__learning" aria-label="הגדרות למידה">
          <SelectField id="learner-age" label="גיל" value={age ?? ''} onChange={(event) => setAge(Number(event.target.value) as LocalLearnerState['age'])} aria-invalid={showErrors && age === null}>
            <option value="" disabled>בחרו גיל</option>
            {ageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </SelectField>
          <SelectField id="learner-difficulty" label="רמה" value={difficulty ?? ''} onChange={(event) => setDifficulty(event.target.value as Difficulty)} aria-invalid={showErrors && difficulty === null}>
            <option value="" disabled>בחרו רמה</option>
            {difficultyOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </SelectField>
        </div>
        {showErrors && !choicesAreValid ? <p className="profile-setup__error" role="alert">צריך לבחור גיל ורמה כדי להתאים את המשחקים.</p> : null}

        <button className="profile-setup__submit" type="submit">יאללה, מתחילים!</button>
      </form>
    </main>
  );
}
