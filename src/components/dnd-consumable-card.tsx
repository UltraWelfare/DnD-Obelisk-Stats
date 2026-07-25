import {DndConsumable} from "../lib/dnd";
import {Button} from "./button";
import {ParchmentHeader, ParchmentSurface} from "./parchment";

export interface DndConsumableCardProps {
	consumable: DndConsumable;
	onUpdate: (updated: DndConsumable) => void;
	className?: string;
}

export function DndConsumableCard({ consumable, onUpdate, className = '' }: DndConsumableCardProps) {
	const handleDelta = (delta: number) => {
		const newUses = Math.min(consumable.usesMax, Math.max(0, consumable.uses + delta));
		onUpdate({...consumable, uses: newUses});
	};

	return (
		<ParchmentSurface className={`overflow-hidden shadow-lg w-full max-w-xs ${className}`}>
			<ParchmentHeader
				title={consumable.label}
				accessory={<span className="ml-2 text-[10px] font-sans font-semibold tracking-wider text-amber-200/85 uppercase shrink-0">
					CHARGES
				</span>}
			/>

			<div className="p-3 flex flex-col items-center gap-2 relative w-full">
				<div className="flex items-baseline justify-center gap-1">
					<span className="text-3xl font-black text-stone-900! tracking-tight">{consumable.uses}</span>
					<span className="text-xl font-bold text-stone-600!">/ {consumable.usesMax}</span>
				</div>

				<div className="flex items-center justify-center gap-2 w-full pt-1">
					<Button
						variant="red"
						size="small"
						onClick={() => handleDelta(-1)}
						disabled={consumable.uses <= 0}
					>
						- Use
					</Button>
					<Button
						size="small"
						onClick={() => handleDelta(1)}
						disabled={consumable.uses >= consumable.usesMax}
					>
						+ Restore
					</Button>
				</div>
			</div>
		</ParchmentSurface>
	);
}
