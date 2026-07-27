import {evaluateTemplatedString} from "./expression-parser";

export function evaluateObject(obj: Record<string, unknown>) {
	const context: Record<string, unknown> = {};
	visit(obj, context, context);
	return obj;
}

function visit(
	current: Record<string, unknown>,
	currentContext: Record<string, unknown>,
	rootContext: Record<string, unknown>,
) {
	for (const [key, value] of Object.entries(current)) {
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value)
		) {
			const childContext: Record<string, unknown> = {};
			currentContext[key] = childContext;

			visit(
				value as Record<string, unknown>,
				childContext,
				rootContext,
			);
		} else if (typeof value === "string") {
			const evaluated = evaluateTemplatedString(value, rootContext);

			current[key] = evaluated;
			currentContext[key] = evaluated;
		} else {
			currentContext[key] = value;
		}
	}
}
