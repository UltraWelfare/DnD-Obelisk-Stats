import {DndConsumable} from "../lib/dnd";
import {Button} from "./button";
import {ParchmentHeader, ParchmentSurface} from "./parchment";

export interface DndConsumablesListProps {
	consumables: Record<string, DndConsumable>;
	onConsumableChange: (key: string, updated: DndConsumable) => void;
	className?: string;
}

export function DndConsumablesList({
	consumables,
	onConsumableChange,
	className = '',
}: DndConsumablesListProps) {
	const handleDelta = (key: string, delta: number) => {
		const item = consumables[key];
		if (!item) return;
		const newUses = Math.min(item.usesMax, Math.max(0, item.uses + delta));
		onConsumableChange(key, {...item, uses: newUses});
	};

	return (
		<ParchmentSurface className={`overflow-hidden shadow-lg w-full ${className}`}>
			<ParchmentHeader title="Consumables" />

			<div className="p-3 relative flex flex-col gap-1 w-full">
				<div className="flex items-center justify-between pb-1.5 mb-1 border-b-2 border-red-900/40 text-[10px] uppercase font-sans font-black text-red-950 tracking-wider px-1">
					<span className="flex-1">Item / Feature</span>
					<span className="w-16 text-center">Uses</span>
					<span className="w-20 text-right">Actions</span>
				</div>

				{Object.keys(consumables).length === 0 ? (
					<div className="text-center py-4 text-xs italic text-stone-600">
						No consumables tracked.
					</div>
				) : (
					Object.entries(consumables).map(([key, item]) => (
						<div
							key={key}
							className="flex items-center justify-between py-1.5 px-1 border-b border-amber-900/15 hover:bg-amber-900/10 rounded transition-colors group"
						>
							<span className="flex-1 pr-2 min-w-0 font-bold text-stone-900 text-xs group-hover:text-red-950 truncate">
								{item.label}
							</span>

							<div className="w-16 text-center shrink-0">
								<span className="inline-block px-1.5 py-0.5 rounded bg-stone-900/5 border border-amber-900/20 text-stone-950 text-xs font-serif font-black min-w-[36px]">
									{item.uses} / {item.usesMax}
								</span>
							</div>

							<div className="w-20 flex justify-end gap-1 shrink-0">
								<Button
									variant="red"
									size="small"
									onClick={() => handleDelta(key, -1)}
									disabled={item.uses <= 0}
									className="size-8! p-0!"
									title="Use 1"
								>
									-1
								</Button>
								<Button
									size="small"
									onClick={() => handleDelta(key, 1)}
									disabled={item.uses >= item.usesMax}
									className="size-8! p-0!"
									title="Restore 1"
								>
									+1
								</Button>
							</div>
						</div>
					))
				)}
			</div>
		</ParchmentSurface>
	);
}
