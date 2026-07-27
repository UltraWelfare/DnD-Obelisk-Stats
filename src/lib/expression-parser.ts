import {parseExpressionAt} from "acorn";
import type * as ESTree from "estree";
import {formatModifier, getModifier} from "./dnd";

export type Scope = Record<string, unknown>;

const math = {
	mod: (a: number) => getModifier(a),
	format: (a: number) => formatModifier(a),
	floor: Math.floor,
	max: Math.max,
	min: Math.min,
}

export function evaluateTemplatedString(
	template: string,
	scope: Record<string, unknown>,
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
	scope: Scope,
): number | string {
	const evaluated = parseAndEvaluateExpr(expression, {
		...scope,
		math: math,
	});
	if (typeof evaluated === "number" || typeof evaluated === "string") {
		return evaluated;
	} else {
		return String(evaluated);
	}
}

const OPTIONAL_CHAIN_SHORT_CIRCUIT = Symbol("optional-chain-short-circuit");
const BLOCKED_PROPERTIES = new Set<PropertyKey>([
	"__proto__",
	"constructor",
	"prototype",
]);

function parseAndEvaluateExpr(
	expression: string,
	scope: Scope,
): unknown {
	const parsed = parseExpressionAt(expression, 0, {
		ecmaVersion: "latest",
		sourceType: "script",
		allowHashBang: false,
		locations: false,
		ranges: false,
		onComment: undefined,
		onToken: undefined,
		preserveParens: false,
	});

	if (expression.slice(parsed.end).trim() !== "")
		throw new Error("Unexpected content after expression.");

	return evaluate(parsed as ESTree.Expression, scope);
}

function evaluate(node: ESTree.Expression, scope: Scope): unknown {
	switch (node.type) {
		case "Literal":
			return node.value;

		case "Identifier":
			return scope[node.name];

		case "UnaryExpression": {
			const value = evaluate(node.argument, scope);

			switch (node.operator) {
				case "+":
					return +Number(value);
				case "-":
					return -Number(value);
				case "!":
					return !value;
				case "~":
					return ~Number(value);
				default:
					throw new Error(`Unsupported unary operator ${node.operator}`);
			}
		}

		case "BinaryExpression": {
			if (node.left.type === "PrivateIdentifier")
				throw new Error("Private identifiers are not supported.");

			const left = evaluate(node.left, scope);
			const right = evaluate(node.right, scope);

			switch (node.operator) {
				case "+":
					return (left as number) + (right as number);
				case "-":
					return (left as number) - (right as number);
				case "*":
					return (left as number) * (right as number);
				case "/":
					return (left as number) / (right as number);
				case "%":
					return (left as number) % (right as number);
				case "**":
					return (left as number) ** (right as number);

				case "<":
					return (left as number | string) < (right as number | string);
				case "<=":
					return (left as number | string) <= (right as number | string);
				case ">":
					return (left as number | string) > (right as number | string);
				case ">=":
					return (left as number | string) >= (right as number | string);

				case "==":
					return left == right;
				case "!=":
					return left != right;
				case "===":
					return left === right;
				case "!==":
					return left !== right;

				default:
					throw new Error(`Unsupported operator ${node.operator}`);
			}
		}

		case "LogicalExpression": {
			const operator: string = node.operator;

			switch (operator) {
				case "&&": {
					const left = evaluate(node.left, scope);
					return left && evaluate(node.right, scope);
				}

				case "||": {
					const left = evaluate(node.left, scope);
					return left || evaluate(node.right, scope);
				}

				case "??": {
					const left = evaluate(node.left, scope);
					return left ?? evaluate(node.right, scope);
				}

				default:
					throw new Error(`Unsupported operator ${operator}`);
			}
		}

		case "ConditionalExpression":
			return evaluate(node.test, scope)
				? evaluate(node.consequent, scope)
				: evaluate(node.alternate, scope);

		case "MemberExpression": {
			const resolved = resolveMember(node, scope);
			return resolved === OPTIONAL_CHAIN_SHORT_CIRCUIT
				? OPTIONAL_CHAIN_SHORT_CIRCUIT
				: resolved.value;
		}

		case "ChainExpression": {
			const value = evaluate(node.expression, scope);
			return value === OPTIONAL_CHAIN_SHORT_CIRCUIT ? undefined : value;
		}

		case "CallExpression": {
			if (node.callee.type === "Super")
				throw new Error("Super calls are not supported.");

			let fn: unknown;
			let receiver: unknown = undefined;

			if (node.callee.type === "MemberExpression") {
				const resolved = resolveMember(node.callee, scope);

				if (resolved === OPTIONAL_CHAIN_SHORT_CIRCUIT)
					return OPTIONAL_CHAIN_SHORT_CIRCUIT;

				fn = resolved.value;
				receiver = resolved.receiver;
			} else if (node.callee.type === "Identifier") {
				fn = evaluate(node.callee, scope);
			} else {
				throw new Error("Only named functions and object methods are allowed.");
			}

			if (fn == null && node.optional)
				return OPTIONAL_CHAIN_SHORT_CIRCUIT;

			if (typeof fn !== "function") {
				const calleeName = node.callee.type === "Identifier"
					? node.callee.name
					: "Expression";
				throw new Error(`${calleeName} is not a function.`);
			}

			const args = node.arguments.map(arg => {
				if (arg.type === "SpreadElement")
					throw new Error("Spread arguments are not supported.");

				return evaluate(arg, scope);
			});

			return Reflect.apply(
				fn as (...values: unknown[]) => unknown,
				receiver,
				args,
			);
		}

		case "ArrayExpression":
			return node.elements.map(el => {
				if (!el)
					return undefined;

				if (el.type === "SpreadElement")
					throw new Error("Spread is not supported.");

				return evaluate(el, scope);
			});

		default:
			throw new Error(`Unsupported AST node: ${node.type}`);
	}
}

interface ResolvedMember {
	value: unknown;
	receiver: unknown;
}

function resolveMember(
	node: ESTree.MemberExpression,
	scope: Scope,
): ResolvedMember | typeof OPTIONAL_CHAIN_SHORT_CIRCUIT {
	if (node.object.type === "Super")
		throw new Error("Super property access is not supported.");

	const object = evaluate(node.object, scope);

	if (object === OPTIONAL_CHAIN_SHORT_CIRCUIT)
		return OPTIONAL_CHAIN_SHORT_CIRCUIT;

	if (object == null) {
		if (node.optional)
			return OPTIONAL_CHAIN_SHORT_CIRCUIT;

		throw new TypeError("Cannot read properties of null or undefined.");
	}

	const property = resolveProperty(node, scope);

	if (BLOCKED_PROPERTIES.has(property))
		throw new Error(`Access to property "${String(property)}" is not allowed.`);

	const descriptor = Object.getOwnPropertyDescriptor(Object(object), property);

	if (descriptor && !("value" in descriptor))
		throw new Error("Accessor properties are not allowed.");

	return {
		value: descriptor?.value,
		receiver: object,
	};
}

function resolveProperty(
	node: ESTree.MemberExpression,
	scope: Scope,
): PropertyKey {
	if (!node.computed) {
		if (node.property.type !== "Identifier")
			throw new Error("Private identifiers are not supported.");

		return node.property.name;
	}

	if (node.property.type === "PrivateIdentifier")
		throw new Error("Private identifiers are not supported.");

	const property = evaluate(node.property, scope);

	if (
		typeof property !== "string" &&
		typeof property !== "number" &&
		typeof property !== "symbol"
	)
		throw new TypeError("Computed property keys must be strings, numbers, or symbols.");

	return property;
}
