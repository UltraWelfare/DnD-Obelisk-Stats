import {convertToInputStats, DndCharacterStats, InputDndCharacterStats} from "./dnd";
import {App, parseYaml, stringifyYaml} from "obsidian";
import deepmerge from "deepmerge";

type CharacterStatsListener = (stats: DndCharacterStats) => void;

export class CharacterStatsStore {

	private readonly statsByPath = new Map<string, DndCharacterStats>();
	private readonly listenersByPath = new Map<string, Set<CharacterStatsListener>>();

	constructor(
		private readonly app: App,
	) {
	}

	get(sourcePath: string): DndCharacterStats | undefined {
		return this.statsByPath.get(sourcePath);
	}

	set(sourcePath: string, stats: DndCharacterStats): void {
		this.statsByPath.set(sourcePath, stats);
		this.listenersByPath.get(sourcePath)?.forEach((listener) => listener(stats));
	}

	async update(sourcePath: string, updater: (stats: DndCharacterStats) => DndCharacterStats, emitEventToListeners: boolean = true) {
		const stats = this.statsByPath.get(sourcePath);
		if (stats) {
			const newStats = updater(stats);
			this.statsByPath.set(sourcePath, newStats);

			if (emitEventToListeners)
				this.listenersByPath.get(sourcePath)?.forEach((listener) => listener(newStats));

			const file = this.app.vault.getFileByPath(sourcePath);
			if (file === null) {
				throw new Error(`File not found: ${sourcePath}`);
			}
			await this.app.vault.process(file, (content) => {
				const regex = /```dnd-character-stats\s*\n([\s\S]*?)\n```/;
				return content.replace(regex, (_, yamlContent: string) => {
					const existing = parseYaml(yamlContent) as InputDndCharacterStats;
					const updated = convertToInputStats(newStats);

					const overwriteMerge = <T>(
						destinationArray: T[],
						sourceArray: T[],
					): T[] => sourceArray;

					const final = deepmerge(existing, updated, {
						arrayMerge: overwriteMerge
					});

					return `\`\`\`dnd-character-stats\n${stringifyYaml(final)}\n\`\`\``;
				});
			})
		}
	}

	subscribe(sourcePath: string, listener: CharacterStatsListener): () => void {
		const listeners = this.listenersByPath.get(sourcePath) ?? new Set();
		listeners.add(listener);
		this.listenersByPath.set(sourcePath, listeners);

		return () => {
			listeners.delete(listener);
			if (listeners.size === 0) {
				this.listenersByPath.delete(sourcePath);
			}
		};
	}

	clear(): void {
		this.statsByPath.clear();
		this.listenersByPath.clear();
	}
}
