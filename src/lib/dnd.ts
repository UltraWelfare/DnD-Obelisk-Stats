import {typedFromEntries} from "./utils";
import {evaluateObject} from "./object-parser";

export const dndAbilityScoreTypes = [
	"str", "dex", "con", "int", "wis", "cha"
] as const;
export type DndAbility = typeof dndAbilityScoreTypes[number];

export const dndSkillTypes = [
	"acrobatics",
	"animalHandling",
	"arcana",
	"athletics",
	"deception",
	"history",
	"insight",
	"intimidation",
	"investigation",
	"medicine",
	"nature",
	"perception",
	"performance",
	"persuasion",
	"religion",
	"sleightOfHand",
	"stealth",
	"survival",
] as const;
export type DndSkillType = typeof dndSkillTypes[number];

export const dndSkillAbilityTypes: Record<DndSkillType, DndAbility> = {
	"acrobatics": "dex",
	"animalHandling": "wis",
	"arcana": "int",
	"athletics": "str",
	"deception": "cha",
	"history": "int",
	"insight": "wis",
	"intimidation": "cha",
	"investigation": "int",
	"medicine": "wis",
	"nature": "int",
	"perception": "wis",
	"performance": "cha",
	"persuasion": "cha",
	"religion": "int",
	"sleightOfHand": "dex",
	"stealth": "dex",
	"survival": "wis",
};


export type DndCharacterAbilityScores = Record<DndAbility, {
	score: number;
	modifier: number;
	savingThrowModifier: number;
}>;


export type DndCharacterSkills = Record<DndSkillType, {
	bonus: "normal" | "proficient" | "expertise",
	modifier: number,
}>;

export type InputDndConsumable = {
	label: string;
	usesMax: string | number;
	uses: number;
	replenishesOn?: DndRestType | DndRestType[] | DndReplenishment | DndReplenishment[]
}

export type DndConsumable = {
	label: string;
	usesMax: number;
	uses: number;
	replenishesOn?: DndRestType | DndRestType[] | DndReplenishment | DndReplenishment[]
}

export type DndRestType = "longRest" | "shortRest";

export type DndReplenishment = {
	type: DndRestType;
	amount?: number;
}


export type InputDndCharacterStats = {
	pb: number,
	health: {
		hp: number,
		hpMax: number | string,
		tempHp?: number | string,
		hitDie: string,
		hitDiceMax: number | string,
		hitDiceUsed: number,
	},
	abilities: {
		str: number,
		dex: number,
		con: number,
		int: number,
		wis: number,
		cha: number,
	},
	savingThrows?: DndAbility[],
	skills: Record<DndSkillType, "normal" | "proficient" | "expertise">,
	consumables?: Record<string, InputDndConsumable>
} & {
	[key: string]: unknown;
};

export type DndCharacterStats = {
	pb: number;
	health: {
		hp: number;
		hpMax: number;
		tempHp: number;
		hitDie: string;
		hitDiceMax: number;
		hitDiceUsed: number;
	};
	savingThrows: DndAbility[],
	abilities: DndCharacterAbilityScores;
	skills: DndCharacterSkills;
	consumables: Record<string, DndConsumable>
} & {
	[key: string]: unknown;
};

export function convertFromInputStats(input: InputDndCharacterStats) {
	const temporary: Record<string, unknown> = {
		...input,
		pb: input.pb,
		health: {
			hp: input.health.hp,
			hpMax: input.health.hpMax,
			tempHp: input.health.tempHp ?? 0,
			hitDie: input.health.hitDie,
			hitDiceMax: input.health.hitDiceMax,
			hitDiceUsed: input.health.hitDiceUsed
		},
		abilities: typedFromEntries(Object.keys(input.abilities).map(ability => {
			const score = input.abilities[ability as keyof typeof input.abilities];
			const modifier = getModifier(score);
			const isProficient = input.savingThrows?.find(savingThrow => savingThrow === ability);
			return [ability as keyof typeof input.abilities, {
				score,
				modifier,
				savingThrowModifier: isProficient ? modifier + input.pb : modifier
			}];
		})) satisfies DndCharacterAbilityScores,
		savingThrows: structuredClone(input.savingThrows ?? []),
		skills: typedFromEntries(dndSkillTypes.map(type => {
			const inputSkill = input.skills[type];
			const correlatedAbility: DndAbility = dndSkillAbilityTypes[type];
			const abilityScore = input.abilities[correlatedAbility];
			const abilityModifier = getModifier(abilityScore);

			return [type, {
				bonus: inputSkill ?? "normal",
				modifier: abilityModifier + (inputSkill ?
						inputSkill === 'proficient' ? input.pb
							: inputSkill === 'expertise' ? input.pb * 2
								: 0
						: 0
				)
			}];
		})) satisfies DndCharacterSkills,
		consumables: structuredClone(input.consumables ?? {})
	};

	return evaluateObject(temporary) as DndCharacterStats;
}

export function getModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
	return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

