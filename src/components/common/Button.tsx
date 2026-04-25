import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export function Button({ children, variant = 'primary', fullWidth = false, className = '', ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button className={`btn btn--${variant} ${fullWidth ? 'btn--full' : ''} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
