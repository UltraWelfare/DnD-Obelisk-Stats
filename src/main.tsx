import {
	MarkdownRenderChild,
	Plugin,
	parseYaml, MarkdownView
} from 'obsidian';
import {StrictMode} from "react";
import {createRoot, Root} from "react-dom/client";
import {DndAbilityScoresView} from "./components/dnd-ability-scores-view";
import {AppContext} from "./lib/app-context";
import {
	DndCharacterStats,
	InputDndCharacterStats,
	DndAbility, DndConsumable, DndRestType
} from "./lib/dnd";
import DndCalculatedCards from "./components/dnd-calculated-cards";
import {DndSkillsTable} from "./components/dnd-skills-table";
import {CharacterStatsStore} from "./lib/character-stats-store";
import {HPTracker} from "./components/dnd-hp-tracker";
import {DndBadges} from "./components/dnd-badges";
import {
	evaluateTemplate,
} from "./lib/parser";
import {DndConsumablesList} from "./components/dnd-consumables";
import {applyRest} from "./lib/dnd-rest";

class ReactMarkdownRenderChild extends MarkdownRenderChild {
	constructor(
		containerEl: HTMLElement,
		private readonly root: Root,
		private readonly cleanup?: () => void,
	) {
		super(containerEl);
	}

	onunload() {
		this.cleanup?.();
		this.root.unmount();
	}
}


export default class DndPlugin extends Plugin {
	private readonly characterStatsStore = new CharacterStatsStore(this.app);

	private parseData<TData>(source: string): TData & { noSeparator?: boolean } {
		if (source === '')
			return {} as TData & { noSeparator?: boolean };
		return parseYaml(source) as TData & { noSeparator?: boolean };
	}

	private markDndElement(el: HTMLElement, noSeparator: boolean) {
		el.addClass('dnd-rendered');
		if (noSeparator) {
			el.addClass('dnd-no-separator');
		}
	}

	async onload() {
		this.registerDndCharacterStatsProcessor();
		this.registerDndAbilityScoresProcessor();
		this.registerDndSkillsTableProcessor();
		this.registerDndCardsProcessor();
		this.registerDndHpTrackerProcessor();
		this.registerDndBadgesProcessor();
		this.registerDndConsumables();
		this.registerDndSeparatorProcessor();
	}


	private registerDndCardsProcessor() {
		this.registerMarkdownCodeBlockProcessor("dnd-cards", (source, el, ctx) => {
			const parsedData = this.parseData<{
				cards: {
					label: string
					value: string;
				}[];
				perRow?: number;
			}>(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);

			const root = createRoot(el);
			const render = (characterStats: DndCharacterStats) => {
				const evaluated = parsedData.cards.map(p => ({
					label: p.label,
					value: evaluateTemplate(p.value, characterStats).toString()
				}));

				root.render(
					<StrictMode>
						<AppContext.Provider value={this.app}>
							<DndCalculatedCards
								cardsPerRow={parsedData.perRow ?? 4}
								cards={evaluated}/>
						</AppContext.Provider>
					</StrictMode>,
				);
			};
			const unsubscribe = this.characterStatsStore.subscribe(ctx.sourcePath, render);
			const characterStats = this.characterStatsStore.get(ctx.sourcePath);
			if (characterStats) render(characterStats);

			ctx.addChild(new ReactMarkdownRenderChild(el, root, unsubscribe));
		});
	}

	private registerDndSkillsTableProcessor() {
		this.registerMarkdownCodeBlockProcessor("dnd-skills-table", (source, el, ctx) => {
			const parsedData = this.parseData(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);
			const root = createRoot(el);
			const render = (characterStats: DndCharacterStats) => {
				root.render(
					<StrictMode>
						<AppContext.Provider value={this.app}>
							<DndSkillsTable skills={characterStats.skills}/>
						</AppContext.Provider>
					</StrictMode>,
				);
			};
			const unsubscribe = this.characterStatsStore.subscribe(ctx.sourcePath, render);
			const characterStats = this.characterStatsStore.get(ctx.sourcePath);
			if (characterStats) render(characterStats);

			ctx.addChild(new ReactMarkdownRenderChild(el, root, unsubscribe));
		});
	}

	private registerDndCharacterStatsProcessor() {
		this.registerMarkdownCodeBlockProcessor('dnd-character-stats', (source, el, ctx) => {
			const input = this.parseData<InputDndCharacterStats>(source);
			this.characterStatsStore.set(ctx.sourcePath, input);
			this.markDndElement(el, input.noSeparator ?? false);

			const container = el.createDiv({cls: "dnd-stats-badge"});

			// 2. Add a visual indicator or summary tag
			container.createSpan({
				text: "⚔️ Edit Stats",
				cls: "dnd-stats-badge-text"
			});

			container.addEventListener("click", () => {
				void (async () => {
					const section = ctx.getSectionInfo(el);
					if (!section) return;


					const view = this.app.workspace.getActiveViewOfType(MarkdownView);


					if (view) {
						await view.leaf.setViewState({
							...view.leaf.getViewState(),
							state: {
								...view.leaf.getViewState().state,
								mode: "source",
							},
						});
						// Set cursor to line right after ```dnd-stats
						view.editor.setCursor({line: section.lineStart + 1, ch: 0});
						view.editor.focus();
					}
				})();
			});
		});
	}

	private registerDndAbilityScoresProcessor() {
		this.registerMarkdownCodeBlockProcessor("dnd-ability-scores", (source, el, ctx) => {
			const parsedData = this.parseData<Partial<Record<DndAbility, string>>>(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);
			const root = createRoot(el);
			const render = (characterStats: DndCharacterStats) => {
				root.render(
					<StrictMode>
						<AppContext.Provider value={this.app}>
							<DndAbilityScoresView
								notes={parsedData ?? {}}
								abilities={characterStats.abilities}/>
						</AppContext.Provider>
					</StrictMode>,
				);
			};
			const unsubscribe = this.characterStatsStore.subscribe(ctx.sourcePath, render);
			const characterStats = this.characterStatsStore.get(ctx.sourcePath);
			if (characterStats) render(characterStats);

			ctx.addChild(new ReactMarkdownRenderChild(el, root, unsubscribe));
		});
	}

	private registerDndHpTrackerProcessor() {
		this.registerMarkdownCodeBlockProcessor("dnd-hp-tracker", (source, el, ctx) => {
			const parsedData = this.parseData(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);
			const root = createRoot(el);


			const onHealthChange = async (newHp: number, newTempHp: number) => {
				await this.characterStatsStore.update(ctx.sourcePath, (characterStats) => {
					characterStats.health.hp = newHp;
					characterStats.health.tempHp = newTempHp;
					return characterStats;
				});
			};

			const onHitDiceChange = async (newUsed: number) => {
				await this.characterStatsStore.update(ctx.sourcePath, (characterStats) => {
					characterStats.health.hitDiceUsed = newUsed;
					return characterStats;
				});
			};

			const onRest = async (restType: DndRestType) => {
				await this.characterStatsStore.update(ctx.sourcePath, (characterStats) =>
					applyRest(characterStats, restType)
				);
			};

			const render = (characterStats: DndCharacterStats) => {
				root.render(
					<StrictMode>
						<HPTracker
							currentHp={characterStats.health.hp}
							maxHp={characterStats.health.hpMax}
							tempHp={characterStats.health.tempHp}
							onHealthChange={(newHp, newTempHp) => void onHealthChange(newHp, newTempHp)}
							hitDiceMax={characterStats.health.hitDiceMax}
							hitDiceUsed={characterStats.health.hitDiceUsed}
							hitDie={characterStats.health.hitDie}
							onHitDiceChange={(value) => void onHitDiceChange(value)}
							onRest={(restType) => void onRest(restType)}
						/>
					</StrictMode>
				)
			}

			const unsubscribe = this.characterStatsStore.subscribe(ctx.sourcePath, render);
			const characterStats = this.characterStatsStore.get(ctx.sourcePath);
			if (characterStats) render(characterStats);

			ctx.addChild(new ReactMarkdownRenderChild(el, root, unsubscribe));
		});
	}

	private registerDndBadgesProcessor() {
		this.registerMarkdownCodeBlockProcessor('dnd-badges', (source, el, ctx) => {
			const parsedData = this.parseData<{
				badges: {
					label: string;
					value: string;
				}[];
			}>(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);

			const root = createRoot(el);
			const render = (characterStats: DndCharacterStats) => {
				const evaluated = parsedData.badges.map(p => ({
					label: p.label,
					value: evaluateTemplate(p.value, characterStats)
				}));

				root.render(
					<StrictMode>
						<AppContext.Provider value={this.app}>
							<DndBadges
								badges={evaluated}/>
						</AppContext.Provider>
					</StrictMode>,
				);
			};
			const unsubscribe = this.characterStatsStore.subscribe(ctx.sourcePath, render);
			const characterStats = this.characterStatsStore.get(ctx.sourcePath);
			if (characterStats) render(characterStats);

			ctx.addChild(new ReactMarkdownRenderChild(el, root, unsubscribe));

		})
	}

	private registerDndConsumables() {
		this.registerMarkdownCodeBlockProcessor('dnd-consumables', (source, el, ctx) => {
			const parsedData = this.parseData(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);
			const root = createRoot(el);

			const onConsumableChange = async (key: string, updated: DndConsumable) => {
				await this.characterStatsStore.update(ctx.sourcePath, (input) => {
					if (input.consumables) {
						input.consumables[key] = updated;
					}

					return input;
				});
			}

			const render = (characterStats: DndCharacterStats) => {
				root.render(
					<StrictMode>
						<AppContext.Provider value={this.app}>
							<DndConsumablesList
								consumables={characterStats.consumables}
								onConsumableChange={function (key: string, updated: DndConsumable): void {
									void onConsumableChange(key, updated);
								}}/>
						</AppContext.Provider>
					</StrictMode>,
				);
			};
			const unsubscribe = this.characterStatsStore.subscribe(ctx.sourcePath, render);
			const characterStats = this.characterStatsStore.get(ctx.sourcePath);
			if (characterStats) render(characterStats);

			ctx.addChild(new ReactMarkdownRenderChild(el, root, unsubscribe));
		})
	}

	private registerDndSeparatorProcessor() {
		this.registerMarkdownCodeBlockProcessor('dnd-separator', (_source, el) => {
			el.createDiv({
				cls: "w-full my-4 h-px",
				attr: {
					style: "background-image: linear-gradient(to right, transparent, #7f1d1d, transparent);",
				},
			});
		});
	}

	onunload() {
		this.characterStatsStore.clear();
	}

}
