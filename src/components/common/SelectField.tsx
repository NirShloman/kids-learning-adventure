import type { SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
}

export function SelectField({ id, label, className = '', children, ...props }: SelectFieldProps) {
  return (
    <label className={`select-field ${className}`.trim()} htmlFor={id}>
      <span className="select-field__label">{label}</span>
      <span className="select-field__control">
        <select id={id} {...props}>{children}</select>
        <span className="select-field__arrow" aria-hidden="true">⌄</span>
      </span>
    </label>
  );
}
