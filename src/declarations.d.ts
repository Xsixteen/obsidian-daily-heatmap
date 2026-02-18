declare module 'react-calendar-heatmap' {
    import * as React from 'react';

    export interface ReactCalendarHeatmapProps {
        startDate: string | Date;
        endDate: string | Date;
        values: { date: string | Date; count: number }[];
        horizontal?: boolean;
        showMonthLabels?: boolean;
        showWeekdayLabels?: boolean;
        showOutOfRangeDays?: boolean;
        classForValue?: (value: { date: string | Date; count: number } | null) => string;
        titleForValue?: (value: { date: string | Date; count: number } | null) => string;
    }

    export default class ReactCalendarHeatmap extends React.Component<ReactCalendarHeatmapProps> { }
}
