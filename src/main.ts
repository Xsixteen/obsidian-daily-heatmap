import { TFile, Plugin, MarkdownView, debounce, Debouncer, WorkspaceLeaf, addIcon, moment } from 'obsidian';
import { VIEW_TYPE_STATS_TRACKER } from './constants';
import StatsTrackerView from './view';
import { DailyStatsSettings, DEFAULT_SETTINGS } from './types';
import { DailyStatsSettingTab } from './settings';

export default class DailyStats extends Plugin {
	settings: DailyStatsSettings;
	statusBarEl: HTMLElement;
	currentWordCount: number;
	today: string;
	debouncedUpdate: Debouncer<[string, string], void>;



	async onload() {
		await this.loadSettings();
		//	await this.migrateData();

		this.statusBarEl = this.addStatusBarItem();
		this.updateDate();

		if (Object.prototype.hasOwnProperty.call(this.settings.dayCounts, this.today)) {
			// This will also update the status bar
			this.updateCounts();
		} else {
			this.currentWordCount = 0;
			this.statusBarEl.setText("0 words today");
		}

		this.debouncedUpdate = debounce((contents: string, filepath: string) => {
			this.updateWordCount(contents, filepath);
		}, 400, false);

		this.registerView(
			VIEW_TYPE_STATS_TRACKER,
			(leaf: WorkspaceLeaf) => new StatsTrackerView(leaf, this.settings)
		);

		this.addCommand({
			id: "show-daily-stats-tracker-view",
			name: "Open tracker view",
			checkCallback: (checking: boolean) => {
				if (checking) {
					return (
						this.app.workspace.getLeavesOfType(VIEW_TYPE_STATS_TRACKER).length === 0
					);
				}
				this.initLeaf();
			},
		});

		this.addSettingTab(new DailyStatsSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this))
		);

		// Event for when the user types
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor, info) => {
				if (info.file) {
					const content = editor.getValue();
					this.debouncedUpdate(content, info.file.path);
				}
			})
		);

		addIcon("bar-graph", `<path fill="currentColor" stroke="none" d="M10,90 V50 a5,5 0 0 1 5,-5 h10 a5,5 0 0 1 5,5 V90 z M40,90 V15 a5,5 0 0 1 5,-5 h10 a5,5 0 0 1 5,5 V90 z M70,90 V35 a5,5 0 0 1 5,-5 h10 a5,5 0 0 1 5,5 V90 z" />`);



		if (this.app.workspace.layoutReady) {
			this.initLeaf();
		} else {
			this.app.workspace.onLayoutReady(this.initLeaf.bind(this));
		}
	}

	// Migrate old date format (YYYY/M/D) to ISO (YYYY-MM-DD)
	async migrateData() {
		let changed = false;
		const newDayCounts: Record<string, number> = {};

		for (const [date, count] of Object.entries(this.settings.dayCounts)) {
			// Check for old format: YYYY/M/D where month is 0-indexed
			// Regex looks for "YYYY/D/D" or "YYYY/D/DD" etc
			if (date.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
				const parts = date.split('/');
				const year = parseInt(parts[0]);
				const month = parseInt(parts[1]); // 0-indexed in old plugin
				const day = parseInt(parts[2]);

				// Create date object (months are 0-indexed in JS Date too, so this matches old logic)
				const d = new Date(year, month, day);
				// Format to YYYY-MM-DD
				const isoDate = moment(d).format('YYYY-MM-DD');

				// Merge counts if multiple old entries map to same ISO date (unlikely but safe)
				newDayCounts[isoDate] = (newDayCounts[isoDate] || 0) + count;
				changed = true;
			} else {
				// Keep existing if already correct or different format
				newDayCounts[date] = count;
			}
		}

		if (changed) {
			console.debug("Migrating Daily Stats data to ISO format...");
			this.settings.dayCounts = newDayCounts;
			await this.saveSettings();
		}
	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE_STATS_TRACKER).length) {
			return;
		}
		void this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_STATS_TRACKER,
		});
	}

	onQuickPreview(file: TFile, contents: string) {
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			this.debouncedUpdate(contents, file.path);
		}
	}

	//Credit: better-word-count by Luke Leppan (https://github.com/lukeleppan/better-word-count)
	getWordCount(text: string) {
		let words = 0;

		const matches = text.match(
			/[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/gm
		);

		if (matches) {
			for (let i = 0; i < matches.length; i++) {
				if (matches[i].charCodeAt(0) > 19968) {
					words += matches[i].length;
				} else {
					words += 1;
				}
			}
		}

		return words;
	}

	updateWordCount(contents: string, filepath: string) {
		const curr = this.getWordCount(contents);
		this.updateDate();

		if (Object.prototype.hasOwnProperty.call(this.settings.dayCounts, this.today)) {
			if (Object.prototype.hasOwnProperty.call(this.settings.todaysWordCount, filepath)) {//updating existing file
				this.settings.todaysWordCount[filepath].current = curr;
			} else {//created new file during session
				this.settings.todaysWordCount[filepath] = { initial: curr, current: curr };
			}
		} else {//new day, flush the cache
			this.settings.todaysWordCount = {};
			this.settings.todaysWordCount[filepath] = { initial: curr, current: curr };
		}
		this.updateCounts();
	}

	updateDate() {
		// Use standard ISO format
		this.today = moment().format('YYYY-MM-DD');
	}

	updateCounts() {
		this.currentWordCount = Object.values(this.settings.todaysWordCount).map((wordCount) => Math.max(0, wordCount.current - wordCount.initial)).reduce((a, b) => a + b, 0);

		// Only update and save if the count has changed
		if (this.settings.dayCounts[this.today] !== this.currentWordCount) {
			this.settings.dayCounts[this.today] = this.currentWordCount;
			void this.saveSettings();
		}

		// Update UI
		this.statusBarEl.setText(this.currentWordCount + " words today");

		// Update View
		this.updateView();
	}

	updateView() {
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_STATS_TRACKER)[0];
		if (leaf && leaf.view instanceof StatsTrackerView) {
			leaf.view.refresh(this.settings);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}