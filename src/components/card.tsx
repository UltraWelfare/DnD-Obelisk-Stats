import {ReactNode} from "react";
import {ObsidianModal} from "./obsidian-modal";
import {useApp} from "../lib/app-context";
import {ParchmentSurface} from "./parchment";

export interface DndStatCardProps {
	label: string;
	value: string;
	sublabel?: ReactNode;
	offlabel?: ReactNode;
	modalContent?: string;
	className?: string;
}

export function Card({
	label,
	value,
	sublabel,
	offlabel,
	modalContent,
	className = '',
}: DndStatCardProps) {
	const app = useApp();

	const handleCardClick = () => {
		if (modalContent && app) {
			new ObsidianModal(app, {content: modalContent}).open();
		}
	};

	return (
		<ParchmentSurface
			onClick={handleCardClick}
			className={`flex flex-col items-center w-24 min-h-32 p-2 pb-3.5 shadow-lg transition-transform active:scale-95 hover:-translate-y-1 hover:shadow-xl ${modalContent ? 'cursor-pointer' : 'cursor-default'} ${className}`}
		>
			{modalContent && (
				<div className="absolute top-1 right-1 z-10 w-4 h-4 grid place-items-center rounded-full pt-0.5 bg-red-900/15 text-red-900 font-sans font-bold leading-none pointer-events-none">
					<span>*</span>
				</div>
			)}

			<div className="w-full h-8 flex items-center justify-center border-b border-red-900/30 px-1 shrink-0 relative">
				<span className="text-[11px] font-black tracking-wider text-red-900 uppercase text-center leading-tight line-clamp-2">
					{label}
				</span>
			</div>

			<div className="flex-1 flex items-center justify-center w-full px-1 pb-1 text-center relative overflow-hidden">
				<span className="text-stone-900 tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] break-words max-w-full text-lg leading-tight font-black">
					{value}
				</span>
			</div>

			{sublabel && (
				<div className="flex items-center justify-center w-full text-center relative overflow-hidden">
					<span className="text-stone-900 tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] break-words max-w-full text-xs">
						{sublabel}
					</span>
				</div>
			)}

			{offlabel && (
				<div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
					<div className="px-3 py-0.5 bg-red-900 text-amber-100 border border-amber-950 rounded-full text-[11px] font-bold font-sans shadow-md whitespace-nowrap">
						{offlabel}
					</div>
				</div>
			)}
		</ParchmentSurface>
	);
}
