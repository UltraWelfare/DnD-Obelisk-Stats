import {DndCharacterSkills, DndSkillType, dndSkillTypes} from "../lib/dnd";
import {ParchmentHeader, ParchmentSurface} from "./parchment";

export interface DndSkillsTableProps {
	skills: DndCharacterSkills;
	className?: string;
}

const SKILL_METADATA: Record<DndSkillType, { label: string; ability: string }> = {
	acrobatics: {label: 'Acrobatics', ability: 'DEX'},
	animalHandling: {label: 'Animal Handling', ability: 'WIS'},
	arcana: {label: 'Arcana', ability: 'INT'},
	athletics: {label: 'Athletics', ability: 'STR'},
	deception: {label: 'Deception', ability: 'CHA'},
	history: {label: 'History', ability: 'INT'},
	insight: {label: 'Insight', ability: 'WIS'},
	intimidation: {label: 'Intimidation', ability: 'CHA'},
	investigation: {label: 'Investigation', ability: 'INT'},
	medicine: {label: 'Medicine', ability: 'WIS'},
	nature: {label: 'Nature', ability: 'INT'},
	perception: {label: 'Perception', ability: 'WIS'},
	performance: {label: 'Performance', ability: 'CHA'},
	persuasion: {label: 'Persuasion', ability: 'CHA'},
	religion: {label: 'Religion', ability: 'INT'},
	sleightOfHand: {label: 'Sleight of Hand', ability: 'DEX'},
	stealth: {label: 'Stealth', ability: 'DEX'},
	survival: {label: 'Survival', ability: 'WIS'},
};

const dotClass = (isExpertise: boolean, isProficient: boolean) => {
	if (isExpertise) return 'w-2.5 h-2.5 bg-amber-500 ring-2 ring-red-900';
	if (isProficient) return 'w-2.5 h-2.5 bg-red-900';
	return 'w-2 h-2 bg-transparent border-red-900/60';
};

const formatModifier = (mod: number) =>
	mod >= 0 ? `+${mod}` : `${mod}`;

export function DndSkillsTable({ skills, className = '' }: DndSkillsTableProps) {
	const renderSkillColumn = (skillKeys: readonly DndSkillType[]) => (
		<div className="flex flex-col">
			{skillKeys.map((skillKey) => {
				const meta = SKILL_METADATA[skillKey];
				const skillData = skills[skillKey];
				const isExpertise = skillData?.bonus === 'expertise';
				const isProficient = skillData?.bonus === 'proficient';

				return (
					<div
						key={skillKey}
						className="flex items-center justify-between py-1 px-0.5 border-b border-amber-900/15 hover:bg-amber-900/10 rounded transition-colors group"
					>
						<div className="w-6 flex items-center justify-center shrink-0">
							<span className={`inline-block rounded-full border border-red-900 transition-all ${dotClass(isExpertise, isProficient)}`} />
						</div>

						<div className="flex-1 flex items-baseline gap-1 pl-1 pr-2 min-w-0">
							<span className="font-bold text-stone-900 text-xs group-hover:text-red-950 truncate">
								{meta.label}
							</span>
							<span className="text-[9px] font-sans font-semibold text-stone-500 uppercase shrink-0">
								({meta.ability})
							</span>
						</div>

						<div className="w-8 flex justify-end shrink-0">
							<span className="inline-block px-1.5 py-0.5 rounded bg-stone-900/5 border border-amber-900/20 text-stone-950 text-xs font-serif font-black min-w-[28px] text-center">
								{skillData ? formatModifier(skillData.modifier) : '+0'}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);

	const leftColumn = dndSkillTypes.slice(0, 9);
	const rightColumn = dndSkillTypes.slice(9);

	return (
		<ParchmentSurface className={`overflow-hidden shadow-lg w-full ${className}`}>
			<ParchmentHeader title="Skills" />

			<div className="p-3 relative z-20 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full">
				{renderSkillColumn(leftColumn)}
				{renderSkillColumn(rightColumn)}
			</div>
		</ParchmentSurface>
	);
}
