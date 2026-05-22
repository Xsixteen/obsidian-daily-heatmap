import * as React from "react";
import { useState, useMemo } from "react";
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
    // State for the selected year
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Use local date for today to match main.ts logic
    const today = new Date();
    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    // Create a date object that represents "today" in the same UTC-midnight terms as the data keys
    // This ensures loop comparisons and heatmap endDate are consistent
    const todayUtc = new Date(todayKey);
    todayUtc.setUTCDate(todayUtc.getUTCDate() + 1);

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
        while (current <= todayUtc) {
            const key = current.toISOString().split('T')[0];
            const item = dataMap.get(key);
            if (item) {
                effectiveData.push(item);
            } else {
                effectiveData.push({ date: key, count: 0 });
            }
            current.setDate(current.getDate() + 1);
        }
    } else {
        startDate.setFullYear(today.getFullYear());
        startDate.setMonth(startDate.getMonth() - 1);
        effectiveData = [];
    }

    // Extract unique years from the data, plus the current year, and sort descending
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        years.add(today.getFullYear());
        data.forEach(item => {
            const d = item.date instanceof Date ? item.date : new Date(item.date);
            years.add(d.getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [data, today.getFullYear()]);

    // Filter effectiveData and determine display dates based on selectedYear
    const isCurrentYear = selectedYear === today.getFullYear();
    const displayEndDate = isCurrentYear ? todayUtc : new Date(`${selectedYear}-12-31T00:00:00.000Z`);

    // For start date: if it's the current year but we don't have enough data to fill a month, 
    // we use the original startDate (which might be ~1 month ago). 
    // If it's a prior year, show the whole year.
    // If data goes way back, and we only want to show the selected year, let's start at Jan 1st of that year.
    const displayStartDate = isCurrentYear
        ? new Date(Math.max(startDate.getTime(), new Date(`${selectedYear}-01-01T00:00:00.000Z`).getTime()))
        : new Date(`${selectedYear}-01-01T00:00:00.000Z`);

    // Only include data that falls within the selected year for the heatmap view
    const yearlyData = effectiveData.filter(d => {
        const dDate = d.date instanceof Date ? d.date : new Date(d.date);
        return dDate.getUTCFullYear() === selectedYear; // Using UTC since our keys are UTC-based
    });

    const lastYear = selectedYear - 1;
    const lastYearItems = data.filter(d => {
        const dDate = d.date instanceof Date ? d.date : new Date(d.date);
        return dDate.getUTCFullYear() === lastYear;
    });
    const hasLastYearData = lastYearItems.length > 0;
    const lastYearCount = lastYearItems.reduce((sum, day) => sum + day.count, 0);


    // Calculate progress (only relevant for current year, but calculation is fine)
    const todayData = effectiveData.find(d => {
        const dDate = d.date instanceof Date ? d.date : new Date(d.date);
        return dDate.toISOString().split('T')[0] === todayKey;
    });
    const todayCount = todayData ? todayData.count : 0;
    const progressPercent = Math.min(100, Math.round((todayCount / settings.dailyGoal) * 100));

    return (
        <div className="daily-heatmap__container">
            <h3 className="daily-heatmap__title">{settings.heatmapTitle}</h3>

            {/* Daily Goal Card */}
            <div className="daily-heatmap__card">
                <div className="daily-heatmap__metric-header">
                    <span>Daily Goal</span>
                    <span>
                        <strong style={{ color: "var(--text-normal)" }}>{todayCount}</strong>
                        <span style={{ margin: "0 4px" }}>/</span>
                        {settings.dailyGoal}
                    </span>
                </div>
                <div className="daily-heatmap__progress-bar-container">
                    <div
                        className="daily-heatmap__progress-bar-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Yearly Progress Card */}
            <div className="daily-heatmap__card">
                <div className="daily-heatmap__yearly-label">
                    {isCurrentYear ? "This Year" : `${selectedYear}`}
                </div>
                <div className="daily-heatmap__yearly-value">
                    {yearlyData.reduce((sum, day) => sum + day.count, 0).toLocaleString()}
                    <span className="daily-heatmap__yearly-suffix">words</span>
                </div>
            </div>

            {/* Last Year Progress Card */}
            {(settings.showLastYearBox ?? true) && (
                <div className="daily-heatmap__card">
                    <div className="daily-heatmap__yearly-label">
                        {isCurrentYear ? "Last Year" : `${lastYear}`}
                    </div>
                    <div className="daily-heatmap__yearly-value">
                        {hasLastYearData ? (
                            <>
                                {lastYearCount.toLocaleString()}
                                <span className="daily-heatmap__yearly-suffix">words</span>
                            </>
                        ) : (
                            "-"
                        )}
                    </div>
                </div>
            )}

            {/* Heatmap Card */}
            <div className="daily-heatmap__card">
                <h4 className="daily-heatmap__section-title">Heatmap</h4>

                <ReactCalendarHeatmap
                    startDate={displayStartDate}
                    endDate={displayEndDate}
                    values={yearlyData}
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

            {/* Pagination / Year Links */}
            {availableYears.length > 1 && (
                <div className="daily-heatmap__pagination" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                    {availableYears.map(year => (
                        <a
                            key={year}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedYear(year);
                            }}
                            className={`daily-heatmap__year-link ${selectedYear === year ? 'is-active' : ''}`}
                            style={{
                                cursor: 'pointer',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: selectedYear === year ? 'var(--text-on-accent)' : 'var(--text-muted)',
                                backgroundColor: selectedYear === year ? 'var(--interactive-accent)' : 'transparent',
                                textDecoration: 'none',
                                fontWeight: selectedYear === year ? 'bold' : 'normal'
                            }}
                        >
                            {year}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Heatmap;
