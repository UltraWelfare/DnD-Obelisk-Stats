import {
	DndCharacterStats,
	DndConsumable,
	DndReplenishment,
	DndRestType,
	InputDndCharacterStats,
} from "./dnd";

function replenishConsumable(
	inputConsumable: DndConsumable,
	resolvedConsumable: DndConsumable,
	restType: DndRestType,
): void {
	const replenishesOn = resolvedConsumable.replenishesOn;
	if (!replenishesOn) return;

	if (typeof replenishesOn === "string") {
		if (replenishesOn === restType) {
			inputConsumable.uses = resolvedConsumable.usesMax;
		}
		return;
	}

	const rules: DndReplenishment[] = Array.isArray(replenishesOn)
		? replenishesOn
		: [replenishesOn];
	const matchingRule = rules.find((rule) => rule.type === restType);
	if (!matchingRule) return;

	inputConsumable.uses = matchingRule.amount === undefined
		? resolvedConsumable.usesMax
		: Math.min(
			resolvedConsumable.usesMax,
			Math.max(0, inputConsumable.uses + matchingRule.amount),
		);
}

export function applyRest(
	input: InputDndCharacterStats,
	resolved: DndCharacterStats,
	restType: DndRestType,
): InputDndCharacterStats {
	if (restType === "longRest") {
		input.health.hp = input.health.hpMax;
	}

	if (input.consumables) {
		Object.values(input.consumables).forEach((consumable) => {
			const resolvedConsumable = resolved.consumables[consumable.label];
			if (!resolvedConsumable) return;
			replenishConsumable(consumable, resolvedConsumable, restType);
		});
	}

	return input;
}
