import * as React from "react";
import ReactCalendarHeatmap from "react-calendar-heatmap";
import { DailyStatsSettings } from "./types";

interface HeatmapProps {
    data: { date: string | Date; count: number }[];
    settings: DailyStatsSettings;
}

const getColorLevel = (count: number, thresholds: [number, number, number, number]): number => {
    if (count === 0) return 0;
    if (count < thresholds[0]) return 1;
    if (count < thresholds[1]) return 2;
    if (count < thresholds[2]) return 3;
    if (count < thresholds[3]) return 4;
    return 5;
};

const Heatmap: React.FC<HeatmapProps> = ({ data, settings }) => {
    const today = new Date();
    let startDate = new Date();

    // effectiveData will hold our processed data including zero-filled days
    let effectiveData: { date: string | Date; count: number }[] = [];

    if (data.length > 0) {
        const dates = data.map(d => (d.date instanceof Date ? d.date : new Date(d.date)).getTime());
        const minDateVal = Math.min(...dates);
        startDate = new Date(minDateVal);

        // Check if the range (today - minDate) is greater than ~1 month (30 days)
        const dayDiff = (today.getTime() - minDateVal) / (1000 * 3600 * 24);
        if (dayDiff <= 30) {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // Create a map for quick lookup of existing data
        // Key is YYYY-MM-DD
        const dataMap = new Map<string, { date: string | Date; count: number }>();
        data.forEach(item => {
            const d = item.date instanceof Date ? item.date : new Date(item.date);
            const key = d.toISOString().split('T')[0];
            dataMap.set(key, item);
        });

        // Fill in missing days
        const current = new Date(startDate);
        while (current <= today) {
            const key = current.toISOString().split('T')[0];
            if (dataMap.has(key)) {
                effectiveData.push(dataMap.get(key)!);
            } else {
                effectiveData.push({ date: key, count: 0 });
            }
            current.setDate(current.getDate() + 1);
        }
    } else {
        startDate.setFullYear(today.getFullYear());
        startDate.setMonth(startDate.getMonth() - 1);
        effectiveData = []; // No data provided, but we could technically fill 0s if we wanted an empty year view, existing logic implies empty
    }

    // Calculate progress
    const todayKey = today.toISOString().split('T')[0];
    const todayData = effectiveData.find(d => {
        const dDate = d.date instanceof Date ? d.date : new Date(d.date);
        return dDate.toISOString().split('T')[0] === todayKey;
    });
    const todayCount = todayData ? todayData.count : 0;
    const progressPercent = Math.min(100, Math.round((todayCount / settings.dailyGoal) * 100));

    return (
        <div className="calendar-container" style={{
            padding: "20px",
            maxWidth: "400px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
        }}>
            <h3 style={{
                textAlign: "center",
                margin: "0 0 10px 0",
                fontSize: "var(--font-ui-medium)",
                color: "var(--text-normal)",
                fontWeight: "600"
            }}>{settings.heatmapTitle}</h3>

            {/* Daily Goal Card */}
            <div style={{
                backgroundColor: "var(--background-secondary)",
                border: "1px solid var(--background-modifier-border)",
                borderRadius: "var(--radius-m)",
                padding: "var(--size-4-4)",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "var(--font-ui-small)",
                    color: "var(--text-muted)"
                }}>
                    <span>Daily Goal</span>
                    <span>
                        <strong style={{ color: "var(--text-normal)" }}>{todayCount}</strong>
                        <span style={{ margin: "0 4px" }}>/</span>
                        {settings.dailyGoal}
                    </span>
                </div>
                <div style={{
                    height: "8px",
                    width: "100%",
                    backgroundColor: "var(--background-modifier-border)",
                    borderRadius: "4px",
                    overflow: "hidden"
                }}>
                    <div style={{
                        height: "100%",
                        width: `${progressPercent}%`,
                        background: "linear-gradient(90deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%)",
                        boxShadow: "0 0 8px var(--interactive-accent)",
                        borderRadius: "4px",
                        transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                    }} />
                </div>
            </div>

            {/* Yearly Progress Card */}
            <div style={{
                backgroundColor: "var(--background-secondary)",
                border: "1px solid var(--background-modifier-border)",
                borderRadius: "var(--radius-m)",
                padding: "var(--size-4-4)",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
            }}>
                <div style={{
                    fontSize: "var(--font-ui-small)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                }}>
                    This Year
                </div>
                <div style={{
                    fontSize: "2em",
                    fontWeight: "bold",
                    color: "var(--text-normal)",
                    lineHeight: "1.2"
                }}>
                    {effectiveData.reduce((sum, day) => {
                        const d = day.date instanceof Date ? day.date : new Date(day.date);
                        return d.getFullYear() === today.getFullYear() ? sum + day.count : sum;
                    }, 0).toLocaleString()}
                    <span style={{ fontSize: "0.4em", marginLeft: "6px", color: "var(--text-muted)", verticalAlign: "baseline" }}>words</span>
                </div>
            </div>

            {/* Heatmap Card */}
            <div style={{
                backgroundColor: "var(--background-secondary)",
                border: "1px solid var(--background-modifier-border)",
                borderRadius: "var(--radius-m)",
                padding: "var(--size-4-4)"
            }}>
                <h4 style={{
                    textAlign: "center",
                    margin: "0 0 10px 0",
                    fontSize: "var(--font-ui-medium)",
                    color: "var(--text-normal)",
                    fontWeight: "600"
                }}>Heatmap</h4>

                <ReactCalendarHeatmap
                    startDate={startDate}
                    endDate={today}
                    values={effectiveData}
                    horizontal={false}
                    showMonthLabels={true}
                    showWeekdayLabels={true}
                    showOutOfRangeDays={false}
                    classForValue={(value: { date: string | Date; count: number } | null) => {
                        if (!value || value.count === 0) {
                            return 'color-empty';
                        }
                        return `color-scale-${getColorLevel(value.count, settings.colorThresholds)}`;
                    }}
                    titleForValue={(value: { date: string | Date; count: number } | null) => {
                        if (!value || !value.date) return '';
                        const dateObj = value.date instanceof Date ? value.date : new Date(value.date);
                        // Use UTC to prevent timezone shift since strings like "2023-01-01" parse as UTC midnight
                        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
                        const year = dateObj.getUTCFullYear();
                        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getUTCDate()).padStart(2, '0');
                        const dateStr = `${weekday} ${year}-${month}-${day}`;
                        return `${value.count} words on ${dateStr}`;
                    }}
                />
            </div>
        </div>
    );
};

export default Heatmap;
