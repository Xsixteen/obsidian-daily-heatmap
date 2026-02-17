import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_STATS_TRACKER } from "./constants";
import { createRoot, Root } from "react-dom/client";
import * as React from "react";
import Calendar from "./calendar";
import { DailyStatsSettings } from "./types";

export default class StatsTrackerView extends ItemView {
    private settings: DailyStatsSettings;
    private root: Root | null = null;

    constructor(leaf: WorkspaceLeaf, settings: DailyStatsSettings) {
        super(leaf);
        this.settings = settings;
    }

    getDisplayText() {
        return "Daily stats";
    }

    getIcon() {
        return "bar-graph";
    }

    getViewType() {
        return VIEW_TYPE_STATS_TRACKER;
    }

    onOpen(): Promise<void> {
        this.renderView();
        return Promise.resolve();
    }

    onClose(): Promise<void> {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
        return Promise.resolve();
    }

    refresh(settings: DailyStatsSettings) {
        this.settings = settings;
        this.renderView();
    }

    private renderView() {
        // Create a root element if it doesn't exist
        const container = this.contentEl;

        if (!this.root) {
            this.root = createRoot(container);
        }

        const data = Object.entries(this.settings.dayCounts).map(([date, count]) => ({
            date: date,
            count: count
        }));

        this.root.render(React.createElement(Calendar, { data, settings: this.settings }));
    }
}
