import {HTMLAttributes, ReactNode} from "react";

export interface ParchmentSurfaceProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

export function ParchmentSurface({
	children,
	className = '',
	style,
	...props
}: ParchmentSurfaceProps) {
	return (
		<div
			className={`relative rounded-md border-2 border-red-900/80 bg-[radial-gradient(circle_at_center,#FAF4E8_0%,#E8D9BF_100%)] font-serif text-stone-900 select-none ${className}`}
			style={style}
			{...props}
		>
			<div className="absolute inset-1 rounded border border-amber-900/20 pointer-events-none" />
			{children}
		</div>
	);
}

export interface ParchmentHeaderProps {
	title: ReactNode;
	accessory?: ReactNode;
	className?: string;
}

export function ParchmentHeader({title, accessory, className = ''}: ParchmentHeaderProps) {
	return (
		<div className={`bg-red-900 text-amber-100 px-4 py-2 border-b border-amber-950 flex items-center justify-between relative ${className}`}>
			<h3 className="uppercase m-0! text-sm! truncate">{title}</h3>
			{accessory}
		</div>
	);
}
