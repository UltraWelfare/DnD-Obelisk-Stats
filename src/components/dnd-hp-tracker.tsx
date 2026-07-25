import {useState, useEffect, useRef, useCallback} from 'react';
import {Button} from "./button";
import {ParchmentHeader, ParchmentSurface} from "./parchment";
import {DndRestType} from "../lib/dnd";

export interface HPTrackerProps {
	currentHp: number;
	maxHp: number;
	tempHp: number;
	onHealthChange: (newHp: number, newTempHp: number) => void;
	hitDie: string;
	hitDiceMax: number;
	hitDiceUsed: number;
	onHitDiceChange: (newUsed: number) => void;
	onRest: (restType: DndRestType) => void;
	className?: string;
}

export function HPTracker({
							  currentHp,
							  maxHp,
							  tempHp: initialTempHp,
							  onHealthChange,
							  hitDie,
							  hitDiceMax,
							  hitDiceUsed,
							  onHitDiceChange,
							  onRest,
							  className = '',
						  }: HPTrackerProps) {
	const [hp, setHp] = useState(currentHp);
	const [tempHp, setTempHp] = useState(initialTempHp);
	const [isEditingHp, setIsEditingHp] = useState(false);
	const [hpEditValue, setHpEditValue] = useState(currentHp.toString());
	const [tempHpEditValue, setTempHpEditValue] = useState('');
	const [customAmount, setCustomAmount] = useState('1');
	const [usedDice, setUsedDice] = useState(hitDiceUsed);

	useEffect(() => {
		setHp(currentHp);
		setHpEditValue(currentHp.toString());
	}, [currentHp]);

	useEffect(() => {
		setTempHp(initialTempHp);
	}, [initialTempHp]);

	useEffect(() => {
		setUsedDice(hitDiceUsed);
	}, [hitDiceUsed]);

	const saveHpTimeoutRef = useRef<number | null>(null);
	const saveDiceTimeoutRef = useRef<number | null>(null);

	const triggerDebouncedHealthSave = useCallback(
		(newHp: number, newTempHp: number) => {
			if (saveHpTimeoutRef.current) window.clearTimeout(saveHpTimeoutRef.current);
			saveHpTimeoutRef.current = window.setTimeout(() => onHealthChange(newHp, newTempHp), 700);
		},
		[onHealthChange]
	);

	const triggerDebouncedDiceSave = useCallback(
		(newUsed: number) => {
			if (saveDiceTimeoutRef.current) window.clearTimeout(saveDiceTimeoutRef.current);
			saveDiceTimeoutRef.current = window.setTimeout(() => onHitDiceChange(newUsed), 700);
		},
		[onHitDiceChange]
	);

	const updateHp = (newHp: number) => {
		const clamped = Math.min(maxHp, Math.max(0, newHp));
		setHp(clamped);
		setHpEditValue(clamped.toString());
		triggerDebouncedHealthSave(clamped, tempHp);
	};

	const takeDamage = (amount: number) => {
		const absorbed = Math.min(tempHp, amount);
		const newTempHp = tempHp - absorbed;
		const newHp = Math.max(0, hp - (amount - absorbed));
		setTempHp(newTempHp);
		setHp(newHp);
		setHpEditValue(newHp.toString());
		triggerDebouncedHealthSave(newHp, newTempHp);
	};

	const replaceTempHp = () => {
		const value = parseInt(tempHpEditValue, 10);
		if (isNaN(value) || value < 0) return;
		setTempHp(value);
		setTempHpEditValue('');
		triggerDebouncedHealthSave(hp, value);
	};

	const updateUsedDice = (newUsed: number) => {
		const clamped = Math.min(hitDiceMax, Math.max(0, newUsed));
		setUsedDice(clamped);
		triggerDebouncedDiceSave(clamped);
	};

	const handleCustomHpAction = (type: 'heal' | 'damage') => {
		const val = parseInt(customAmount, 10);
		if (isNaN(val) || val <= 0) return;
		if (type === 'damage') {
			takeDamage(val);
		} else {
			updateHp(hp + val);
		}
	};

	const hpPercent = Math.min(100, Math.max(0, (hp / (maxHp || 1)) * 100));
	const availableDice = Math.max(0, hitDiceMax - usedDice);

	const hpBarColor = hpPercent <= 25 ? 'bg-red-700!' : hpPercent <= 50 ? 'bg-amber-600!' : 'bg-emerald-700!';

	return (
		<ParchmentSurface className={` shadow-lg w-full ${className}`}>
			<ParchmentHeader title="Health"/>

			<div className="p-3.5 flex flex-col items-center gap-3 relative w-full">
				<div className="flex items-baseline justify-center gap-1.5 w-full">
					{isEditingHp ? (
						<div className="flex items-center gap-1.5">
							<input
								type="number"
								value={hpEditValue}
								onChange={(e) => setHpEditValue(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										updateHp(isNaN(parseInt(hpEditValue, 10)) ? hp : parseInt(hpEditValue, 10));
										setIsEditingHp(false);
									}
									if (e.key === 'Escape') {
										setIsEditingHp(false);
										setHpEditValue(hp.toString());
									}
								}}
								onBlur={() => {
									updateHp(isNaN(parseInt(hpEditValue, 10)) ? hp : parseInt(hpEditValue, 10));
									setIsEditingHp(false);
								}}
								autoFocus
								className="w-20 text-center font-black text-2xl bg-amber-50! border-2! border-red-900! rounded! text-stone-900! p-1! focus:outline-none!"
							/>
							<span className="text-2xl font-bold text-stone-700!">/ {maxHp}</span>
						</div>
					) : (
						<Button
							size="large"
							onClick={() => setIsEditingHp(true)}
							className="group flex items-baseline gap-1.5 bg-transparent! border-0! p-0! shadow-none! cursor-pointer hover:opacity-80 transition-opacity"
							title="Click to edit current HP"
						>
							<span
								className="text-4xl font-black text-stone-900! tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] group-hover:text-red-900!">
								{hp}
							</span>
							<span className="text-2xl font-bold text-stone-700!">/ {maxHp}</span>
						</Button>
					)}
				</div>

				<div
					className="w-full bg-stone-900/10! border border-amber-900/30 rounded-full h-3 p-0.5 overflow-hidden">
					<div
						className={`h-full rounded-full ${hpBarColor}`}
						style={{
							width: `${hpPercent}%`,
							transition: 'width 300ms ease-in-out, background-color 300ms ease-in-out'
						}}
					/>
				</div>

				<div className="flex items-center gap-2 w-full">
					<span className="text-xs font-black uppercase text-sky-900 whitespace-nowrap">
						Temp HP: {tempHp}
					</span>
					<input
						type="number"
						min="0"
						placeholder="New"
						value={tempHpEditValue}
						onChange={(e) => setTempHpEditValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') replaceTempHp();
						}}
						className="w-16 text-center text-xs font-bold bg-amber-50/90! border! border-sky-900/40! rounded! py-1.5! px-1! focus:outline-none! text-stone-900!"
						title="Temporary HP replaces your current temporary HP; it does not stack"
					/>
					<Button size="small" onClick={replaceTempHp} className="uppercase"
					        title="Replace current temporary HP">
						Set temp HP
					</Button>
				</div>

				<div className="flex items-center justify-between w-full gap-2">
					<div className="flex gap-1.5">
						<Button size="small" onClick={() => takeDamage(5)}>-5</Button>
						<Button size="small" onClick={() => takeDamage(1)}>-1</Button>
					</div>
					<div className="flex gap-1.5">
						<Button size="small" onClick={() => updateHp(hp + 1)}>+1</Button>
						<Button size="small" onClick={() => updateHp(hp + 5)}>+5</Button>
					</div>
				</div>

				<div className="flex items-center gap-2 w-full pt-2 border-t border-amber-900/20">
					<Button
						variant="red"
						onClick={() => handleCustomHpAction('damage')}
						className="flex-1 uppercase"
					>
						Damage
					</Button>
					<input
						type="number"
						placeholder="Amt"
						value={customAmount}
						onChange={(e) => setCustomAmount(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleCustomHpAction('damage');
						}}
						className="w-16 text-center text-xs font-bold bg-amber-50/90! border! border-amber-900/40! rounded! py-1.5! px-1! focus:outline-none! focus:border-red-900! text-stone-900!"
					/>
					<Button
						variant="green"
						onClick={() => handleCustomHpAction('heal')}
						className="flex-1 uppercase"
					>
						Heal
					</Button>
				</div>

				<div className="w-full pt-2.5 mt-1 border-t-2 border-amber-900/30 flex items-center justify-between">
					<div className="flex flex-col">
						<span className="text-[10px] font-sans font-black tracking-wider text-red-900 uppercase">
							Hit Dice ({hitDie})
						</span>
						<div className="flex items-baseline gap-1 mt-0.5">
							<span className="text-xl font-black text-stone-900">{availableDice}</span>
							<span className="text-xs font-bold text-stone-600">/ {hitDiceMax} Available</span>
							{usedDice > 0 && (
								<span className="text-[10px] font-sans text-red-900/80 ml-1 font-semibold">
									({usedDice} spent)
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-1.5">
						<Button
							variant="red"
							size="small"
							onClick={() => updateUsedDice(usedDice + 1)}
							disabled={usedDice >= hitDiceMax}
							className="uppercase"
							title="Spend 1 Hit Die"
						>
							Use
						</Button>
						<Button
							size="small"
							onClick={() => updateUsedDice(usedDice - 1)}
							disabled={usedDice <= 0}
							className="uppercase"
							title="Recover 1 Hit Die"
						>
							Recover
						</Button>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2.5 border-t-2 border-amber-900/30">
					<Button size="large" onClick={() => onRest("shortRest")}>
						Short Rest
					</Button>
					<Button size="large" variant="green" onClick={() => onRest("longRest")}>
						Long Rest
					</Button>
				</div>
			</div>
		</ParchmentSurface>
	);
}
