import {DndAbility, DndCharacterAbilityScores, formatModifier} from "../lib/dnd";
import {Card} from "./card";

interface DndAbilityScoresViewProps {
	abilities: DndCharacterAbilityScores;
	notes: Partial<Record<DndAbility, string>>;
}

export function DndAbilityScoresView({abilities, notes}: DndAbilityScoresViewProps) {
	return (
		<div className="my-3 flex flex-wrap justify-center gap-3">
			{Object.entries(abilities).map(([name, statValue]) => (
				<Card
					key={name}
					label={name}
					value={formatModifier(statValue.modifier)}
					sublabel={<>
						Saving: <span className="font-bold">{formatModifier(statValue.savingThrowModifier)}</span>
					</>}
					offlabel={statValue.score.toString()}
					modalContent={notes[name as DndAbility]}
				/>
			))}
		</div>
	);
}
