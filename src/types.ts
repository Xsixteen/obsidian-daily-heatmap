export interface WordCount {
    initial: number;
    current: number;
}

export interface DailyStatsSettings {
    dayCounts: Record<string, number>;
    todaysWordCount: Record<string, WordCount>;
    // Settings
    heatmapTitle: string;
    heatmapSubtitle: string;
    dailyGoal: number;
    colorThresholds: [number, number, number, number]; // 4 thresholds for 5 colors (0 is handled separately)
}

export const DEFAULT_SETTINGS: DailyStatsSettings = {
    dayCounts: {},
    todaysWordCount: {},
    heatmapTitle: "Daily Stats",
    heatmapSubtitle: "Word count heat map",
    dailyGoal: 500,
    colorThresholds: [150, 400, 750, 1500] // Default values
}
