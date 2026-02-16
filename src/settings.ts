import { App, PluginSettingTab, Setting } from 'obsidian';
import DailyStats from './main';

export class DailyStatsSettingTab extends PluginSettingTab {
    plugin: DailyStats;

    constructor(app: App, plugin: DailyStats) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Heatmap Title')
            .setDesc('Title to display on the heatmap')
            .addText(text => text
                .setPlaceholder('Daily Writing Stats')
                .setValue(this.plugin.settings.heatmapTitle)
                .onChange(async (value) => {
                    this.plugin.settings.heatmapTitle = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateView();
                }));

        new Setting(containerEl)
            .setName('Color Thresholds')
            .setDesc('Set the word count thresholds for the 5 color intensities. Separate with commas (e.g. 150, 400, 750, 1500)')
            .addText(text => text
                .setPlaceholder('150, 400, 750, 1500')
                .setValue(this.plugin.settings.colorThresholds.join(', '))
                .onChange(async (value) => {
                    const thresholds = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                    if (thresholds.length === 4) {
                        this.plugin.settings.colorThresholds = [thresholds[0], thresholds[1], thresholds[2], thresholds[3]];
                        await this.plugin.saveSettings();
                        this.plugin.updateView();
                    }
                }));

        new Setting(containerEl)
            .setName('Daily Goal')
            .setDesc('Set your daily word count goal (default: 500)')
            .addText(text => text
                .setPlaceholder('500')
                .setValue(String(this.plugin.settings.dailyGoal))
                .onChange(async (value) => {
                    const goal = parseInt(value.trim());
                    if (!isNaN(goal)) {
                        this.plugin.settings.dailyGoal = goal;
                        await this.plugin.saveSettings();
                        this.plugin.updateView();
                    }
                }));
    }
}
