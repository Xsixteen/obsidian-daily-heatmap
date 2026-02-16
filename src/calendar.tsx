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

    return (
        <div className="calendar-container" style={{ padding: "10px", maxWidth: "400px", margin: "0 auto" }}>
            <h4 style={{ textAlign: "center", marginBottom: "10px" }}>{settings.heatmapTitle}</h4>
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
    );
};

export default Heatmap;
