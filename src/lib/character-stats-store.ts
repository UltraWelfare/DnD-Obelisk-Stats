import {convertFromInputStats, DndCharacterStats, InputDndCharacterStats} from "./dnd";
import {App, parseYaml, stringifyYaml } from "obsidian";
import deepmerge from "deepmerge";
import {debounce} from "./utils";

type CharacterStatsListener = (stats: DndCharacterStats) => void;

export class CharacterStatsStore {

	private readonly statsByPath = new Map<string,
		{
			input: InputDndCharacterStats,
			resolved: DndCharacterStats
		}
	>();

	private readonly listenersByPath = new Map<string, Set<CharacterStatsListener>>();

	constructor(
		private readonly app: App,
	) {
	}

	get(sourcePath: string): DndCharacterStats | undefined {
		return this.statsByPath.get(sourcePath)?.resolved;
	}

	set(sourcePath: string,
		input: InputDndCharacterStats,
	): void {
		const newValue = {
			input,
			resolved: convertFromInputStats(input)
		};
		this.statsByPath.set(sourcePath, newValue);
		this.listenersByPath.get(sourcePath)?.forEach((listener) => listener(newValue.resolved));
	}

	async update(sourcePath: string, updater: (input: InputDndCharacterStats, resolved: Readonly<DndCharacterStats>) => InputDndCharacterStats, emitEventToListeners: boolean = true) {
		const value = this.statsByPath.get(sourcePath);
		if (value) {
			const newInput = updater(value.input, value.resolved);
			const newValue = {
				input: newInput,
				resolved: convertFromInputStats(newInput)
			};
			this.statsByPath.set(sourcePath, newValue);

			if (emitEventToListeners)
				this.listenersByPath.get(sourcePath)?.forEach((listener) => listener(newValue.resolved));

			this.debouncedSaveToFile(sourcePath, newValue);
		}
	}

	private readonly debouncedSaveToFile = debounce(
		(
			sourcePath: string,
			value: { input: InputDndCharacterStats; resolved: DndCharacterStats },
		) => this.saveToFile(sourcePath, value),
		1000,
	);

	private async saveToFile(sourcePath: string, value: { input: InputDndCharacterStats; resolved: DndCharacterStats }) {
		const file = this.app.vault.getFileByPath(sourcePath);
		if (file === null) {
			throw new Error(`File not found: ${sourcePath}`);
		}
		await this.app.vault.process(file, (content) => {
			const regex = /```dnd-character-stats\s*\n([\s\S]*?)\n```/;
			return content.replace(regex, (_, yamlContent: string) => {
				const existing = parseYaml(yamlContent) as InputDndCharacterStats;

				const overwriteMerge = <T>(
					destinationArray: T[],
					sourceArray: T[],
				): T[] => sourceArray;

				const final = deepmerge(existing, value.input, {
					arrayMerge: overwriteMerge,
				});
				return `\`\`\`dnd-character-stats\n${stringifyYaml(final)}\n\`\`\``;
			});
		})
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
