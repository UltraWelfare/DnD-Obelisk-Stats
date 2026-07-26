import {
	DndCharacterStats,
	DndConsumable,
	DndReplenishment,
	DndRestType,
	InputDndCharacterStats, InputDndConsumable,
} from "./dnd";

function replenishConsumable(
	inputConsumable: InputDndConsumable,
	resolvedConsumable: Readonly<DndConsumable>,
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

	if (Array.isArray(replenishesOn)) {
		if (replenishesOn.length > 0 && typeof replenishesOn[0] === "string") {
			if ((replenishesOn as DndRestType[]).includes(restType)) {
				inputConsumable.uses = resolvedConsumable.usesMax;
			}
			return;
		}

		const rules = replenishesOn as DndReplenishment[];
		const matchingRule = rules.find((rule) => rule.type === restType);
		if (!matchingRule) return;

		inputConsumable.uses = matchingRule.amount === undefined
			? resolvedConsumable.usesMax
			: Math.min(
				resolvedConsumable.usesMax,
				Math.max(0, inputConsumable.uses + matchingRule.amount),
			);
		return;
	}

	const matchingRule = replenishesOn.type === restType ? replenishesOn : undefined;
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
	resolved: Readonly<DndCharacterStats>,
	restType: DndRestType,
): InputDndCharacterStats {
	if (restType === "longRest") {
		input.health.hp = resolved.health.hpMax;
	}

	const inputConsumables = input.consumables;
	if (!inputConsumables) return input;

	Object.keys(inputConsumables).forEach((consumableKey) => {
		const inputConsumable = inputConsumables[consumableKey];
		const resolvedConsumable = resolved.consumables[consumableKey];
		if (!resolvedConsumable || !inputConsumable) return;
		replenishConsumable(inputConsumable, resolvedConsumable, restType);
	});

	return input;
}
