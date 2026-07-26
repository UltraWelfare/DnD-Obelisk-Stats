import {
	DndConsumable,
	DndReplenishment,
	DndRestType,
	InputDndCharacterStats,
} from "./dnd";

function replenishConsumable(
	consumable: DndConsumable,
	restType: DndRestType,
): void {
	const replenishesOn = consumable.replenishesOn;
	if (!replenishesOn) return;

	if (typeof replenishesOn === "string") {
		if (replenishesOn === restType) {
			consumable.uses = consumable.usesMax;
		}
		return;
	}

	const rules: DndReplenishment[] = Array.isArray(replenishesOn)
		? replenishesOn
		: [replenishesOn];
	const matchingRule = rules.find((rule) => rule.type === restType);
	if (!matchingRule) return;

	consumable.uses = matchingRule.amount === undefined
		? consumable.usesMax
		: Math.min(
			consumable.usesMax,
			Math.max(0, consumable.uses + matchingRule.amount),
		);
}

export function applyRest(
	characterStats: InputDndCharacterStats,
	restType: DndRestType,
): InputDndCharacterStats {
	if (restType === "longRest") {
		characterStats.health.hp = characterStats.health.hpMax;
	}

	if (characterStats.consumables) {
		Object.values(characterStats.consumables).forEach((consumable) => {
			replenishConsumable(consumable, restType);
		});
	}

	return characterStats;
}
