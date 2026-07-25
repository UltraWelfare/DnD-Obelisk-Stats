import {ReactNode} from "react";
import {ParchmentSurface} from "./parchment";

export interface DndBadgeProps {
	label: string;
	value: ReactNode;
	className?: string;
}

export function Badge({label, value, className = ''}: DndBadgeProps) {
	return (
		<ParchmentSurface className={`inline-flex items-center gap-2 px-3 py-1.5 shadow-md ${className}`}>
			<span className="text-xs font-black uppercase tracking-wider text-red-900">{label}</span>
			<div className="w-px self-stretch bg-red-900/25" />
			<span className="text-sm font-black tracking-tight text-stone-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
				{value}
			</span>
		</ParchmentSurface>
	);
}
