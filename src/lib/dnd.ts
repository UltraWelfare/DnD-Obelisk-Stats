import {typedFromEntries} from "./utils";

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
	"intimidation":"cha",
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

export const defaultDndAbilityScores: DndCharacterAbilityScores = typedFromEntries(
	dndAbilityScoreTypes.map((type) => [
		type,
		{ score: 10, modifier: getModifier(10), savingThrowModifier: getModifier(10) }
	])
);

export type DndCharacterSkills = Record<DndSkillType, {
	bonus: "normal" | "proficient" | "expertise",
	calculatedModifier: number,
}>;

export const defaultDndCharacterSkills: DndCharacterSkills = Object.keys(dndSkillAbilityTypes).reduce((acc, key) => {
	acc[key as DndSkillType] = {
		bonus: "normal",
		calculatedModifier: 0,
	};
	return acc;
}, {} as DndCharacterSkills);

export type DndConsumable = {
	label: string;
	usesMax: number;
	uses: number;
	replenishesOn?: DndRestType | DndReplenishment | DndReplenishment[]
}

export type DndRestType = "longRest" | "shortRest";

export type DndReplenishment = {
	type: DndRestType;
	amount?: number;
}


export type InputDndCharacterStats = {
	health: {
		hp: number,
		hpMax: number,
		tempHp?: number,
		hitDie: string,
		hitDiceMax: number,
		hitDiceUsed: number,
	},
	level: number,
	pb: number,
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
	consumables?: Record<string, DndConsumable>
} & {
	[key: string]: unknown;
};

export type DndCharacterStats = {
	level: number;
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

export function convertToInputStats(stats: DndCharacterStats): InputDndCharacterStats {
	return {
		...stats,
		level: stats.level,
		pb: stats.pb,
		health: {hitDiceMax: stats.health.hitDiceMax, hitDiceUsed: stats.health.hitDiceUsed, hitDie: stats.health.hitDie, hp: stats.health.hp, hpMax: stats.health.hpMax, tempHp: stats.health.tempHp},
		abilities: typedFromEntries(
			Object.keys(stats.abilities).map(ability => [ability as keyof typeof stats.abilities, stats.abilities[ability as keyof typeof stats.abilities]?.score ?? 0]),
		),
		savingThrows: structuredClone(stats.savingThrows),
		skills: typedFromEntries(
			Object.keys(stats.skills)
				.filter(skillName => {
					const skill = stats.skills[skillName as keyof typeof stats.skills];
					return skill.bonus !== "normal";
				})
				.map(skill => [skill, stats.skills[skill as keyof typeof stats.skills].bonus ?? "normal"])
		),
		consumables: structuredClone(stats.consumables)
	}
}
export function convertFromInputStats(input: InputDndCharacterStats){


	return {
		...input,
		level: input.level,
		pb: input.pb,
		health: {
			hp: input.health.hp,
			hpMax: input.health.hpMax,
			tempHp: Math.max(0, input.health.tempHp ?? 0),
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
		})),
		savingThrows: structuredClone(input.savingThrows ?? []),
		skills: typedFromEntries(dndSkillTypes.map(type => {
			const inputSkill = input.skills[type];
			const correlatedAbility: DndAbility = dndSkillAbilityTypes[type];
			const abilityScore = input.abilities[correlatedAbility];
			const abilityModifier = getModifier(abilityScore);

			return [type, {
				bonus: inputSkill ?? "normal",
				calculatedModifier: abilityModifier + (inputSkill ?
						inputSkill === 'proficient' ? input.pb
							: inputSkill === 'expertise' ? input.pb * 2
								: 0
						: 0
				)
			}];
		})),
		consumables: structuredClone(input.consumables ?? {})
	} satisfies DndCharacterStats;
}

export function getModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
	return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

