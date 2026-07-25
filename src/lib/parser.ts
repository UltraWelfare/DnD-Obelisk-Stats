import {Parser, Value} from "expr-eval";
import {convertToInputStats, DndCharacterStats, formatModifier, getModifier} from "./dnd";
import {typedFromEntries} from "./utils";

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

export function evaluateTemplate(template: string, scope: object) {
	return template.replace(/\{\{(.*?)}}/g, (_, mathExpression: string) => {
		try {
			const expr = parser.parse(mathExpression);
			// we cast to Value because the parser expects it. The parser does not allow for nested objects but because of `allowMemberAccess` we can use them. However the type is still restricted to flat objects.
			const result = expr.evaluate(scope as Value) as unknown;
			if (typeof result === 'number')
				return Number(result).toString();
			if (typeof result === 'string')
				return result;
			return "unknown math expression result";
		} catch (e) {
			if (e instanceof Error)
				return e.toString();
			return "unknown error";
		}
	});
}

export function convertDndCharStatsToParserScope(stats: DndCharacterStats) {
	// Get the scheme as close to the input as possible
	const input = convertToInputStats(stats);

	return {
		...input,
		// Change skills.
		skills: typedFromEntries(
			Object.keys(stats.skills).map(key => [key, stats.skills[key as keyof typeof stats.skills].calculatedModifier ])
		)
	}
}
