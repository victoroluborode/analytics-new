import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, WorkTeller } from './analytics.service';
import { EChartsOption } from 'echarts';
import transactionsData from '../data/transactions.json';
import { NgxEchartsModule } from 'ngx-echarts';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  transactions: WorkTeller[] = [];
  chartOption: EChartsOption = {};

  dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'last7Days', label: 'Last 7 Days' },
    { value: 'last14Days', label: 'Last 14 Days' },
    { value: 'last30Days', label: 'Last 30 Days' },
    { value: 'last60Days', label: 'Last 60 Days' },
    { value: 'last90Days', label: 'Last 90 Days' },
    { value: 'last2Months', label: 'Last 2 Months' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'lastQuarter', label: 'Last Quarter' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'allTime', label: 'All Time' },
  ];

  chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Area Chart' },
    { value: 'pie', label: 'Donut Chart' },
  ];

  metricOptions = [
    { value: 'sales', label: 'Sales Revenue' },
    { value: 'growth', label: 'Sales Growth %' },
    { value: 'forecast', label: 'Sales Forecast' },
  ];

  selectedDateRange: string = 'last7Days';
  selectedChartType: 'bar' | 'line' | 'pie' = 'bar';
  selectedMetric: 'sales' | 'growth' | 'forecast' = 'sales';

  constructor(private analyticsService: AnalyticsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactions = transactionsData.data.data as unknown as WorkTeller[];
    this.updateChart();
  }

  onFilterChange(): void {
    this.updateChart();
    this.cdr.detectChanges();
  }

  onChartTypeChange(): void {
    this.updateChart();
  }

  trimZeroEdges(arr: number[], labels: string[]): { data: number[]; labels: string[] } {
    let start = arr.findIndex((v) => v !== 0);
    let end = arr.length - 1 - [...arr].reverse().findIndex((v) => v !== 0);
    if (start === -1 || end < start) {
      return { data: arr, labels };
    }
    return {
      data: arr.slice(start, end + 1),
      labels: labels.slice(start, end + 1),
    };
  }

  updateChart(): void {
    const now = new Date();
    const { labels, totals, lastActualDate } = this.prepareChartSeries(
      this.selectedDateRange,
      this.transactions
    );

    let lastActualIndex = labels.length - 1;

    if (this.selectedDateRange === 'today') {
      lastActualIndex = now.getHours();
    } else if (this.selectedDateRange === 'yesterday') {
      lastActualIndex = 23;
    } else if (this.selectedDateRange === 'thisMonth') {
      lastActualIndex = now.getDate() - 1;
    } else if (this.selectedDateRange === 'lastMonth') {
      lastActualIndex = labels.length - 1;
    } else if (this.selectedDateRange === 'thisYear') {
      lastActualIndex = now.getMonth();
    } else if (this.selectedDateRange === 'thisWeek') {
      lastActualIndex = now.getDay();
    } else if (this.selectedDateRange === 'lastWeek') {
      lastActualIndex = 6;
    } else if (this.selectedDateRange === 'thisQuarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      const monthIntoQuarter = now.getMonth() - quarter * 3;
      lastActualIndex = monthIntoQuarter;
    } else if (this.selectedDateRange === 'lastQuarter') {
      lastActualIndex = 2;
    } else if (['last60Days', 'last90Days', 'last2Months'].includes(this.selectedDateRange)) {
      lastActualIndex = -1;

      for (let i = labels.length - 1; i >= 0; i--) {
        const parts = labels[i].split('-');
        if (parts.length === 2) {
          const endDateStr = parts[1].trim();
          const year = now.getFullYear();
          const testDate = new Date(`${endDateStr} ${year}`);

          if (!isNaN(testDate.getTime())) {
            testDate.setHours(23, 59, 59, 999);
            if (testDate < now) {
              lastActualIndex = i;
              break;
            }
          }
        }
      }

      if (lastActualIndex === -1) {
        lastActualIndex = -1;
      }
    }

    if (this.selectedMetric === 'forecast') {
      const actualLabels = labels.slice(0, lastActualIndex + 1);
      const actualTotals = totals.slice(0, lastActualIndex + 1);
      const forecastPeriods = 7;
      let forecastLabels: string[] = [];

      let useTrimmedRegression = ['thisYear', 'allTime'].includes(this.selectedDateRange);

      if (this.selectedDateRange === 'lastYear') {
        let forecastStart = new Date(now.getFullYear(), 0, 1);
        forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
          let m = new Date(forecastStart);
          m.setMonth(forecastStart.getMonth() + i);
          return m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
      } else if (this.selectedDateRange === 'allTime') {
        if (labels.length > 0) {
          let lastLabel = labels[labels.length - 1];
          let [monthStr, yearStr] = lastLabel.replace(',', '').split(' ');
          let monthIndex = new Date(Date.parse(monthStr + ' 1, 2000')).getMonth();
          let forecastStart = new Date(parseInt(yearStr), monthIndex + 1, 1);
          forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
            let m = new Date(forecastStart);
            m.setMonth(forecastStart.getMonth() + i);
            return m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          });
        } else {
          forecastLabels = [];
        }
      } else if (this.selectedDateRange === 'today' || this.selectedDateRange === 'yesterday') {
        let startHour = lastActualIndex + 1;
        forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
          let hour = (startHour + i) % 24;
          return hour.toString().padStart(2, '0') + ':00';
        });
        useTrimmedRegression = false;
      } else if (
        ['last7Days', 'last14Days', 'last30Days', 'thisMonth', 'lastMonth'].includes(
          this.selectedDateRange
        )
      ) {
        let base: Date;
        if (this.selectedDateRange === 'thisMonth') {
          base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (this.selectedDateRange === 'lastMonth') {
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const daysInLastMonth = new Date(
            prevMonth.getFullYear(),
            prevMonth.getMonth() + 1,
            0
          ).getDate();
          base = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInLastMonth);
        } else if (lastActualDate) {
          base = new Date(lastActualDate);
        } else {
          base = new Date(now);
        }

        base.setDate(base.getDate() + 1);
        forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
          const d = new Date(base);
          d.setDate(base.getDate() + i);
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });
        useTrimmedRegression = false;
      } else if (['thisWeek', 'lastWeek'].includes(this.selectedDateRange)) {
        let base = new Date(now);
        if (this.selectedDateRange === 'lastWeek') {
          let weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 7 + 7);
          base = weekStart;
        } else {
          let weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          base = weekStart;
          base.setDate(weekStart.getDate() + lastActualIndex + 1);
        }
        forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
          const d = new Date(base);
          d.setDate(base.getDate() + i);
          return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
        });
        useTrimmedRegression = false;
      } else if (['last60Days', 'last90Days', 'last2Months'].includes(this.selectedDateRange)) {
        let forecastStartIndex = lastActualIndex + 1;

        if (forecastStartIndex < labels.length) {
          forecastLabels = labels.slice(forecastStartIndex, forecastStartIndex + forecastPeriods);

          if (forecastLabels.length < forecastPeriods) {
            const lastLabel = labels[labels.length - 1];
            const parts = lastLabel.split('-');
            if (parts.length === 2) {
              const endDateStr = parts[1].trim();
              const year = now.getFullYear();
              let lastWeekEnd = new Date(`${endDateStr} ${year}`);

              const remaining = forecastPeriods - forecastLabels.length;
              for (let i = 1; i <= remaining; i++) {
                const weekStart = new Date(lastWeekEnd);
                weekStart.setDate(lastWeekEnd.getDate() + 1);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                forecastLabels.push(
                  `${weekStart.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })} - ${weekEnd.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}`
                );

                lastWeekEnd = weekEnd;
              }
            }
          }
        }
        useTrimmedRegression = false;
      } else if (['thisQuarter', 'lastQuarter'].includes(this.selectedDateRange)) {
        if (actualLabels.length > 0) {
          let lastLabel = actualLabels[actualLabels.length - 1];
          let [monthStr, yearStr] = lastLabel.replace(',', '').split(' ');
          let monthIndex = new Date(Date.parse(monthStr + ' 1, 2000')).getMonth();
          let forecastStart = new Date(parseInt(yearStr), monthIndex + 1, 1);
          forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
            let m = new Date(forecastStart);
            m.setMonth(forecastStart.getMonth() + i);
            return m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          });
        } else {
          forecastLabels = [];
        }
        useTrimmedRegression = false;
      } else if (this.selectedDateRange === 'thisYear') {
        let base = new Date(now.getFullYear(), lastActualIndex + 1, 1);
        forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
          const m = new Date(base);
          m.setMonth(base.getMonth() + i);
          return m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
      } else {
        forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => `Period ${i + 1}`);
        useTrimmedRegression = false;
      }

      let forecast: number[] = [];
      let actualLabelsToUse = actualLabels;
      if (useTrimmedRegression) {
        let trimmed = this.trimZeroEdges(actualTotals, actualLabels);
        forecast = this.calculateForecast(trimmed.data, forecastPeriods);
        actualLabelsToUse = trimmed.labels;
      } else {
        forecast = this.calculateForecast(actualTotals, forecastPeriods);
      }

      const combinedLabels = [...actualLabelsToUse, ...forecastLabels];

      this.chartOption = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (!Array.isArray(params)) return '';
            let result = params[0].axisValueLabel + '<br/>';
            params.forEach((param: any) => {
              if (param.value != null) {
                result += `${param.marker} ${param.seriesName}: ₦${Number(
                  param.value
                ).toLocaleString()}<br/>`;
              }
            });
            return result;
          },
        },
        legend: { data: ['Actual', 'Forecast'], bottom: 10 },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
          type: 'category',
          data: combinedLabels,
          axisLabel: { color: '#666', rotate: 45, interval: 0, fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#666',
            formatter: (value: number) =>
              `₦${
                value >= 1000000
                  ? (value / 1000000).toFixed(1) + 'M'
                  : value >= 1000
                  ? (value / 1000).toFixed(0) + 'K'
                  : value
              }`,
          },
        },
        series: [
          {
            name: 'Actual',
            type: 'line',
            data: [
              ...actualTotals.slice(actualTotals.length - actualLabelsToUse.length),
              ...Array(forecast.length).fill(null),
            ],
            smooth: true,
            itemStyle: { color: '#6384ff' },
            lineStyle: { width: 3 },
          },
          {
            name: 'Forecast',
            type: 'line',
            data: [...Array(actualLabelsToUse.length).fill(null), ...forecast],
            smooth: true,
            itemStyle: { color: '#f59e0b' },
            lineStyle: { width: 3, type: 'dashed' },
          },
        ],
      };
      return;
    }

    if (this.selectedMetric === 'sales') {
      if (this.selectedChartType === 'pie') {
        this.chartOption = {
          tooltip: {
            trigger: 'item',
            formatter: (params: any) =>
              `${params.name}: ₦${params.value.toLocaleString()} (${params.percent}%)`,
          },
          legend: { orient: 'horizontal', bottom: 10, data: labels },
          series: [
            {
              type: 'pie',
              radius: ['50%', '75%'],
              avoidLabelOverlap: false,
              label: { show: false, position: 'center' },
              emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
              data: labels.map((l, i) => ({ value: totals[i], name: l })),
            },
          ],
        };
      } else {
        this.chartOption = {
          tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
              const value = Array.isArray(params) ? params[0].value : params.value;
              return '₦' + Number(value).toLocaleString();
            },
          },
          legend: { data: ['Sales'], bottom: 10 },
          grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
          xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#666', rotate: 45, interval: 0, fontSize: 11 },
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: '#666',
              formatter: (value: number) =>
                `₦${
                  value >= 1000000
                    ? (value / 1000000).toFixed(1) + 'M'
                    : value >= 1000
                    ? (value / 1000).toFixed(0) + 'K'
                    : value
                }`,
            },
          },
          series: [
            {
              name: 'Sales',
              type: this.selectedChartType,
              data: totals,
              smooth: this.selectedChartType === 'line',
              itemStyle: { color: '#6384ff' },
              areaStyle: this.selectedChartType === 'line' ? {} : undefined,
              barWidth: this.selectedChartType === 'bar' ? '60%' : undefined,
            },
          ],
        };
      }
    } else if (this.selectedMetric === 'growth') {
      const actualLabels = labels.slice(0, lastActualIndex + 1);
      const actualTotals = totals.slice(0, lastActualIndex + 1);
      const growth = this.calculateGrowth(actualTotals);

      this.chartOption = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const value = Array.isArray(params) ? params[0].value : params.value;
            return value != null ? `${value > 0 ? '+' : ''}${value}%` : 'N/A';
          },
        },
        legend: { data: ['Sales Growth'], bottom: 10 },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
          type: 'category',
          data: actualLabels,
          axisLabel: { color: '#666', rotate: 45, interval: 0, fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#666',
            formatter: (value: number) => (value > 0 ? '+' : '') + value + '%',
          },
        },
        series: [
          {
            name: 'Sales Growth',
            type: 'bar',
            data: growth,
            itemStyle: {
              color: (params: any) =>
                params.data == null ? '#cccccc' : params.data < 0 ? '#f43f3b' : '#398ecd',
            },
            barWidth: '60%',
          },
        ],
      };
    }
  }

  calculateForecast(totals: number[], periods: number = 7): number[] {
    const n = totals.length;
    if (n < 2) return Array(periods).fill(totals[0] || 0);

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += totals[i];
      sumXY += i * totals[i];
      sumX2 += i * i;
    }
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    const forecast: number[] = [];
    for (let i = 0; i < periods; i++) {
      const predictedValue = m * (n + i) + b;
      forecast.push(Math.max(0, Math.round(predictedValue)));
    }
    return forecast;
  }

  prepareChartSeries(
    range: string,
    txns: WorkTeller[]
  ): { labels: string[]; totals: number[]; lastActualDate: Date | null } {
    const now = new Date();
    let labels: string[] = [];
    let totals: number[] = [];
    let lastActualDate: Date | null = null;

    if (range === 'today' || range === 'yesterday') {
      labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
      totals = Array(24).fill(0);
      const refDate = new Date(now);
      if (range === 'yesterday') refDate.setDate(now.getDate() - 1);
      txns.forEach((t) => {
        const d = new Date(t.date || t.createdAt);
        if (
          d.getDate() === refDate.getDate() &&
          d.getMonth() === refDate.getMonth() &&
          d.getFullYear() === refDate.getFullYear()
        ) {
          totals[d.getHours()] += t.total;
        }
      });
      return { labels, totals, lastActualDate };
    }

    const lastNDays = {
      last7Days: 7,
      last14Days: 14,
      last30Days: 30,
    } as const;
    if (range in lastNDays) {
      const n = lastNDays[range as keyof typeof lastNDays];
      const days = Array.from({ length: n }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (n - 1 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });
      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayTxns = txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        });
        return dayTxns.reduce((sum, t) => sum + t.total, 0);
      });
      lastActualDate = days[days.length - 1];
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisMonth') {
      const month = now.getMonth();
      const year = now.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
      );
      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayTxns = txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        });
        return dayTxns.reduce((sum, t) => sum + t.total, 0);
      });
      lastActualDate = new Date(year, month, now.getDate());
      return { labels, totals, lastActualDate };
    }

    if (range === 'lastMonth') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = prevMonth.getMonth();
      const year = prevMonth.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
      );
      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayTxns = txns.filter((t) => {
          const td = new Date(t.date || t.createdAt);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        });
        return dayTxns.reduce((sum, t) => sum + t.total, 0);
      });
      lastActualDate = days[days.length - 1];
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisQuarter' || range === 'lastQuarter') {
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      let qYear = now.getFullYear();
      let qNum = range === 'thisQuarter' ? quarter : quarter - 1;
      if (qNum < 1) {
        qNum = 4;
        qYear--;
      }
      const startMonth = (qNum - 1) * 3;
      labels = [];
      totals = [];
      for (let m = 0; m < 3; m++) {
        const monthIndex = startMonth + m;
        const monthTxns = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === qYear && d.getMonth() === monthIndex;
        });
        labels.push(
          new Date(qYear, monthIndex).toLocaleString(undefined, { month: 'short', year: 'numeric' })
        );
        totals.push(monthTxns.reduce((sum, t) => sum + t.total, 0));
      }
      return { labels, totals, lastActualDate };
    }

    if (['last60Days', 'last90Days', 'last2Months'].includes(range)) {
      let start: Date;
      if (range === 'last60Days') {
        start = new Date(now);
        start.setDate(now.getDate() - 59);
      } else if (range === 'last90Days') {
        start = new Date(now);
        start.setDate(now.getDate() - 89);
      } else if (range === 'last2Months') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        start = now;
      }
      const end = new Date(now);

      const weeks: { start: Date; end: Date }[] = [];

      let currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      let wkStart = new Date(currentWeekStart);
      const currentWeekEnd = new Date(wkStart);
      currentWeekEnd.setDate(wkStart.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);

      weeks.push({ start: new Date(wkStart), end: new Date(currentWeekEnd) });

      wkStart.setDate(wkStart.getDate() - 7);

      while (wkStart >= start) {
        const wkEnd = new Date(wkStart);
        wkEnd.setDate(wkStart.getDate() + 6);
        wkEnd.setHours(23, 59, 59, 999);

        weeks.unshift({ start: new Date(wkStart), end: new Date(wkEnd) });
        wkStart.setDate(wkStart.getDate() - 7);
      }

      labels = weeks.map(
        ({ start, end }) =>
          `${start.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      );
      totals = weeks.map(({ start, end }) => {
        return txns.reduce((sum, t) => {
          const d = new Date(t.date || t.createdAt);
          return sum + (d >= start && d <= end ? t.total : 0);
        }, 0);
      });
      if (weeks.length > 0) {
        lastActualDate = weeks[weeks.length - 1].end;
      }
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisYear' || range === 'lastYear') {
      let y = range === 'thisYear' ? now.getFullYear() : now.getFullYear() - 1;
      labels = [];
      totals = [];
      for (let m = 0; m < 12; m++) {
        const monthTxns = txns.filter((t) => {
          const d = new Date(t.date || t.createdAt);
          return d.getFullYear() === y && d.getMonth() === m;
        });
        labels.push(new Date(y, m).toLocaleString(undefined, { month: 'short', year: 'numeric' }));
        totals.push(monthTxns.reduce((sum, t) => sum + t.total, 0));
      }
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisWeek' || range === 'lastWeek') {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      if (range === 'lastWeek') weekStart.setDate(weekStart.getDate() - 7);
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });
      totals = Array(7).fill(0);
      txns.forEach((t) => {
        const d = new Date(t.date || t.createdAt);
        for (let i = 0; i < 7; i++) {
          const currLabelDate = new Date(weekStart);
          currLabelDate.setDate(weekStart.getDate() + i);
          if (
            d.getFullYear() === currLabelDate.getFullYear() &&
            d.getMonth() === currLabelDate.getMonth() &&
            d.getDate() === currLabelDate.getDate()
          ) {
            totals[i] += t.total;
          }
        }
      });
      return { labels, totals, lastActualDate };
    }

    if (range === 'allTime') {
      const years = txns.map((t) => new Date(t.date || t.createdAt).getFullYear());
      const minYear = Math.min(...years),
        maxYear = Math.max(...years);
      labels = [];
      totals = [];
      for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
          const monthTxns = txns.filter((t) => {
            const d = new Date(t.date || t.createdAt);
            return d.getFullYear() === y && d.getMonth() === m;
          });
          if (monthTxns.length) {
            labels.push(
              new Date(y, m).toLocaleString(undefined, { month: 'short', year: 'numeric' })
            );
            totals.push(monthTxns.reduce((sum, t) => sum + t.total, 0));
          }
        }
      }
      return { labels, totals, lastActualDate };
    }
    return { labels: [], totals: [], lastActualDate };
  }

  calculateGrowth(totals: number[]): (number | null)[] {
    return totals.map((val, i, arr) => {
      if (i === 0) return null;
      const prev = arr[i - 1];
      if (prev === 0 && val === 0) return 0;
      if (prev === 0 && val > 0) return 100;
      return Math.round(((val - prev) / prev) * 100);
    });
  }
}
