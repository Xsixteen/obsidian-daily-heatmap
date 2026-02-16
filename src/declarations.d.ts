declare module 'react-calendar-heatmap' {
    import * as React from 'react';

    export interface ReactCalendarHeatmapProps {
        startDate: string | Date;
        endDate: string | Date;
        values: any[];
        horizontal?: boolean;
        showMonthLabels?: boolean;
        showWeekdayLabels?: boolean;
        showOutOfRangeDays?: boolean;
        classForValue?: (value: any) => string;
        titleForValue?: (value: any) => string;
        [key: string]: any;
    }

    export default class ReactCalendarHeatmap extends React.Component<ReactCalendarHeatmapProps> { }
}
