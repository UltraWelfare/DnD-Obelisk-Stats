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
	evaluateTemplatedString,
} from "./lib/expression-parser";
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
					sublabel?: string;
					offlabel?: string;
				}[];
				perRow?: number;
				perRowDesktop?: number;
				perRowMobile?: number;
			}>(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);

			const root = createRoot(el);
			const render = (characterStats: DndCharacterStats) => {
				const evaluated = parsedData.cards.map(p => ({
					label: p.label,
					value: evaluateTemplatedString(p.value, characterStats).toString(),
					sublabel: p.sublabel ? evaluateTemplatedString(p.sublabel, characterStats).toString() : undefined,
					offlabel: p.offlabel ? evaluateTemplatedString(p.offlabel, characterStats).toString() : undefined,
				}));

				root.render(
					<StrictMode>
						<AppContext.Provider value={this.app}>
							<DndCalculatedCards
								cardsPerRowDesktop={parsedData.perRowDesktop ?? parsedData.perRow ?? 4}
								cardsPerRowMobile={parsedData.perRowMobile ?? parsedData.perRow ?? 2}
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
				await this.characterStatsStore.update(ctx.sourcePath, (input) => {
					input.health.hp = newHp;
					input.health.tempHp = newTempHp;
					return input;
				});
			};

			const onHitDiceChange = async (newUsed: number) => {
				await this.characterStatsStore.update(ctx.sourcePath, (input) => {
					input.health.hitDiceUsed = newUsed;
					return input;
				});
			};

			const onRest = async (restType: DndRestType) => {
				await this.characterStatsStore.update(ctx.sourcePath, (input, resolved) =>
					applyRest(input, resolved, restType)
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
					value: evaluateTemplatedString(p.value, characterStats)
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
			const parsedData = this.parseData<{ hideZeroMaxUses?: boolean }>(source);
			this.markDndElement(el, parsedData.noSeparator ?? false);
			const root = createRoot(el);

			const hideZeroMaxUses = parsedData.hideZeroMaxUses ?? true;

			const onConsumableChange = async (key: string, updated: Partial<DndConsumable>) => {
				await this.characterStatsStore.update(ctx.sourcePath, (input) => {
					const consumable = input.consumables?.[key];
					if (consumable && input.consumables) {
						input.consumables[key] = {
							...consumable,
							...updated
						};
					}
					return input;
				});
			}

			const render = (characterStats: DndCharacterStats) => {
				const consumables = hideZeroMaxUses
					? Object.fromEntries(
						Object.entries(characterStats.consumables).filter(([, item]) => item.usesMax !== 0)
					)
					: characterStats.consumables;

				root.render(
					<StrictMode>
						<AppContext.Provider value={this.app}>
							<DndConsumablesList
								consumables={characterStats.consumables}
								onConsumableChange={(key, updated) =>
									void onConsumableChange(key, updated)
								}/>
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
