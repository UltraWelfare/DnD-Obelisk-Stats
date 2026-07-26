export function typedFromEntries<K extends PropertyKey, V>(
	entries: readonly (readonly [K, V])[]
): Record<K, V> {
	return Object.fromEntries(entries) as Record<K, V>;
}

export function debounce<T extends (...args: never[]) => void>(
	fn: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeout: number | undefined;

	return (...args: Parameters<T>) => {
		if (timeout !== undefined) {
			window.clearTimeout(timeout);
		}

		timeout = window.setTimeout(() => {
			fn(...args);
		}, delay);
	};
}
