export function typedFromEntries<K extends PropertyKey, V>(
	entries: readonly (readonly [K, V])[]
): Record<K, V> {
	return Object.fromEntries(entries) as Record<K, V>;
}

export interface DebouncedFunction<T extends (...args: never[]) => void> {
	(...args: Parameters<T>): void;
	cancel(): void;
}

export function debounce<T extends (...args: never[]) => void>(
	fn: T,
	delay: number,
): DebouncedFunction<T> {
	let timeout: number | undefined;

	const debounced = (...args: Parameters<T>) => {
		if (timeout !== undefined) {
			window.clearTimeout(timeout);
		}

		timeout = window.setTimeout(() => {
			fn(...args);
		}, delay);
	};

	debounced.cancel = () => {
		if (timeout !== undefined) {
			window.clearTimeout(timeout);
			timeout = undefined;
		}
	};

	return debounced;
}
