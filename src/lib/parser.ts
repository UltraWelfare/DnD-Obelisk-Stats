import {Parser, Value} from "expr-eval-fork";
import {formatModifier, getModifier} from "./dnd";

type ExprFunction = (...args: number[]) => number | string;

interface DndParser extends Parser {
	functions: Record<string, ExprFunction>;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- This is done so we can type the parser as `DndParser` to allow for `functions.X` typings.
const parser = new Parser({
	allowMemberAccess: true
}) as DndParser;

parser.functions.mod = (a: number) => getModifier(a);
parser.functions.format = (a: number) => formatModifier(a);
parser.functions.floor = Math.floor;

export function evaluateTemplate(
	template: string,
	scope: object,
): number | string {
	const fullMatch = template.match(/^\{\{(.*?)}}$/);

	if (fullMatch?.[1]) {
		return evaluateExpression(fullMatch[1], scope);
	}

	return template.replace(/\{\{(.*?)}}/g, (_, expr: string) =>
		String(evaluateExpression(expr, scope)),
	);
}

function evaluateExpression(
	expression: string,
	scope: object,
): number | string {
	try {
		const expr = parser.parse(expression);

		// we cast to Value because the parser expects it. The parser does not allow for nested objects, but because of `allowMemberAccess` we can use them. However, the type is still restricted to flat objects.
		const result = expr.evaluate(scope as Value) as unknown;

		if (typeof result === "number" || typeof result === "string") {
			return result;
		}

		return "unknown math expression result";
	} catch (e) {
		if (e instanceof Error) {
			return e.toString();
		}

		return "unknown error";
	}
}

export function evaluate(obj: Record<string, unknown>) {
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
			const evaluated = evaluateTemplate(value, rootContext);

			current[key] = evaluated;
			currentContext[key] = evaluated;
		} else {
			currentContext[key] = value;
		}
	}
}
