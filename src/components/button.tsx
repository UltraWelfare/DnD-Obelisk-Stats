import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'neutral' | 'green' | 'red';
	size?: 'small' | 'medium' | 'large';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			type = 'button',
			variant = 'neutral',
			size = 'medium',
			className = '',
			...props
		},
		ref,
	) => {
		const variantClasses = {
			neutral: 'bg-stone-200! hover:bg-stone-300! active:bg-stone-400! border-stone-500! text-stone-900!',
			green: 'bg-emerald-800! hover:bg-emerald-900! active:bg-emerald-800! border-amber-950! text-amber-100!',
			red: 'bg-red-900! hover:bg-red-950! active:bg-red-900! border-amber-950! text-amber-100!',
		}[variant];
		const sizeClasses = {
			small: 'px-2.5! py-1! text-xs',
			medium: 'px-3! py-1.5! text-sm',
			large: 'px-4! py-2! text-base',
		}[size];

		return (
			<button
				ref={ref}
				type={type}
				className={`inline-flex items-center justify-center rounded! border! font-sans font-bold cursor-pointer shadow-none! disabled:opacity-40! disabled:cursor-not-allowed! ${variantClasses} ${sizeClasses} ${className}`.trim()}
				{...props}
			/>
		);
	},
);

Button.displayName = 'Button';
