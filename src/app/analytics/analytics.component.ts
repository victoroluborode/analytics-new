import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, WorkTeller } from './analytics.service';
import { EChartsOption } from 'echarts';
import transactionsData from '../data/transactions.json';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

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
  paymentMethodChartOption: EChartsOption = {};
  peakHoursChartOption: EChartsOption = {};
  customerTypeChartOption: EChartsOption = {};

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
    { value: 'growth', label: 'Sales Growth' },
    { value: 'forecast', label: 'Sales Forecast' },
    { value: 'volume', label: 'Transactions Volume' },
  ];

  selectedDateRange: string = 'today';
  selectedChartType: 'bar' | 'line' | 'pie' = 'bar';
  selectedMetric: 'sales' | 'growth' | 'forecast' | 'volume' = 'sales';

  constructor(private analyticsService: AnalyticsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactions = transactionsData.data.data as unknown as WorkTeller[];
    this.updateChart();
    this.updatePaymentMethodChart();
    this.updatePeakHoursChart();
    this.updateCustomerTypeChart();
  }

  onFilterChange(): void {
    this.updateChart();
    this.updatePaymentMethodChart();
    this.updatePeakHoursChart();
    this.updateCustomerTypeChart();
    this.cdr.detectChanges();
  }

  onChartTypeChange(): void {
    this.updateChart();
  }

  getRevenueGrowthRate(period: 'month' | 'year' = 'month'): number | null {
    return this.analyticsService.getRevenueGrowthRate(this.transactions, period);
  }

  getCustomerRetentionRate(): number | null {
    return this.analyticsService.getCustomerRetentionRate(
      this.transactions,
      this.selectedDateRange
    );
  }

  getBusiestDay(): string | null {
    return this.analyticsService.getBusiestDay(this.transactions);
  }

  getBusiestMonth(): string | null {
    return this.analyticsService.getBusiestMonth(this.transactions);
  }

  getBusiestHour(): string | null {
    return this.analyticsService.getBusiestHour(this.transactions);
  }

  getAverageOrderValue(): number {
    return this.analyticsService.getAverageOrderValue(this.transactions, this.selectedDateRange);
  }

  getDateRangeLabel(): string {
    const selected = this.dateRangeOptions.find((opt) => opt.value === this.selectedDateRange);
    return selected ? selected.label : '';
  }

  getPaymentSuccessRate(): number {
    return this.analyticsService.getPaymentSuccessRate(this.transactions, this.selectedDateRange);
  }

  getMostPopularPaymentMethod(): string {
    return this.analyticsService.getMostPopularPaymentMethod(
      this.transactions,
      this.selectedDateRange
    );
  }

  getCustomerRevenueSplit(): { firstTime: number; repeat: number } {
    return this.analyticsService.getCustomerRevenueSplit(this.transactions, this.selectedDateRange);
  }

  getDiscountUtilizationRate(): number {
    return this.analyticsService.getDiscountUtilizationRate(
      this.transactions,
      this.selectedDateRange
    );
  }

  getPeakRevenueHours(): string {
    return this.analyticsService.getPeakRevenueHours(this.transactions);
  }

  private updatePaymentMethodChart(): void {
    const paymentData = this.analyticsService.getRevenueByPaymentMethod(
      this.transactions,
      this.selectedDateRange
    );

    this.paymentMethodChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: ₦${params.value.toLocaleString()} (${params.percent}%)`,
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: paymentData.map((d) => d.name),
      },
      color: ['#6384ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 10,
              fontWeight: 'bold',
            },
          },
          data: paymentData,
        },
      ],
    };
  }

  private updatePeakHoursChart(): void {
    const hourData = this.analyticsService.getRevenueByHour(
      this.transactions,
      this.selectedDateRange
    );

    const sortedHours = hourData
      .map((revenue, hour) => ({ hour, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const labels = sortedHours.map((h) => h.hour.toString().padStart(2, '0') + ':00');
    const values = sortedHours.map((h) => h.revenue);

    this.peakHoursChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const value = Array.isArray(params) ? params[0].value : params.value;
          return `₦${Number(value).toLocaleString()}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: '#666',
          fontSize: 11,
        },
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
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#8b5cf6',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateCustomerTypeChart(): void {
    const split = this.getCustomerRevenueSplit();

    this.customerTypeChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ${params.value}%`,
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
      },
      color: ['#10b981', '#6384ff'],
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 10,
              fontWeight: 'bold',
            },
          },
          data: [
            { value: split.firstTime, name: 'First-Time' },
            { value: split.repeat, name: 'Repeat' },
          ],
        },
      ],
    };
  }

  updateChart(): void {
    const now = new Date();

    if (this.selectedMetric === 'volume') {
      const { labels, counts } = this.analyticsService.prepareChartSeriesVolume(
        this.selectedDateRange,
        this.transactions
      );

      this.chartOption = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const value = Array.isArray(params) ? params[0].value : params.value;
            return value + ' Transactions';
          },
        },
        legend: { data: ['Volume'], bottom: 10 },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: { color: '#666', rotate: 45, interval: 0, fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#666' },
        },
        series: [
          {
            name: 'Volume',
            type: 'line',
            data: counts,
            smooth: true,
            itemStyle: { color: '#9f4fff' },
            areaStyle: { color: '#e0cafd' },
            lineStyle: { width: 3 },
          },
        ],
      };
      return;
    }

    const { labels, totals, lastActualDate } = this.analyticsService.prepareChartSeries(
      this.selectedDateRange,
      this.transactions
    );

    let lastActualIndex = labels.length - 1;
    if (this.selectedDateRange === 'today') lastActualIndex = now.getHours();
    else if (this.selectedDateRange === 'yesterday') lastActualIndex = 23;
    else if (this.selectedDateRange === 'thisMonth') lastActualIndex = now.getDate() - 1;
    else if (this.selectedDateRange === 'lastMonth') lastActualIndex = labels.length - 1;
    else if (this.selectedDateRange === 'thisYear') lastActualIndex = now.getMonth();
    else if (this.selectedDateRange === 'thisWeek') lastActualIndex = now.getDay();
    else if (this.selectedDateRange === 'lastWeek') lastActualIndex = 6;
    else if (this.selectedDateRange === 'last2Months') lastActualIndex = labels.length - 1;
    else if (this.selectedDateRange === 'thisQuarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      const monthIntoQuarter = now.getMonth() - quarter * 3;
      lastActualIndex = monthIntoQuarter;
    } else if (this.selectedDateRange === 'lastQuarter') lastActualIndex = 2;

    if (this.selectedMetric === 'forecast') {
      this.buildForecastChart(labels, totals, lastActualIndex, now);
      return;
    }

    if (this.selectedMetric === 'sales') {
      this.buildSalesChart(labels, totals);
    } else if (this.selectedMetric === 'growth') {
      this.buildGrowthChart(labels, totals, lastActualIndex);
    }
  }

  private buildForecastChart(
    labels: string[],
    totals: number[],
    lastActualIndex: number,
    now: Date
  ): void {
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
      }
      base.setDate(base.getDate() + lastActualIndex + 1);
      forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });
      useTrimmedRegression = false;
    } else if (['last60Days', 'last90Days'].includes(this.selectedDateRange)) {
      let forecastStartIndex = lastActualIndex + 1;
      if (forecastStartIndex < labels.length) {
        forecastLabels = labels.slice(forecastStartIndex, forecastStartIndex + forecastPeriods);
      }
      if (forecastLabels.length < forecastPeriods) {
        const lastLabel = labels[labels.length - 1];
        const parts = lastLabel.split(' - ');
        if (parts.length === 2) {
          const endDateStr = parts[1].trim();
          const year = now.getFullYear();
          let lastWeekEnd = new Date(endDateStr + ' ' + year);
          const remaining = forecastPeriods - forecastLabels.length;
          for (let i = 1; i <= remaining; i++) {
            const weekStart = new Date(lastWeekEnd);
            weekStart.setDate(lastWeekEnd.getDate() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            forecastLabels.push(
              weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
                ' - ' +
                weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            );
            lastWeekEnd = weekEnd;
          }
        }
      }
      useTrimmedRegression = false;
    } else if (this.selectedDateRange === 'last2Months') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const targetMonth = currentMonth - 2;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;

      const lastDayOfAugust = new Date(targetYear, adjustedMonth + 1, 0);
      let base = new Date(lastDayOfAugust);
      base.setDate(base.getDate() + 1);

      forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      });
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
      forecastLabels = Array.from({ length: forecastPeriods }, (_, i) => 'Period ' + (i + 1));
      useTrimmedRegression = false;
    }

    let forecast: number[] = [];
    let actualLabelsToUse = actualLabels;

    if (useTrimmedRegression) {
      let trimmed = this.analyticsService.trimZeroEdges(actualTotals, actualLabels);
      forecast = this.analyticsService.calculateForecast(trimmed.data, forecastPeriods);
      actualLabelsToUse = trimmed.labels;
    } else {
      forecast = this.analyticsService.calculateForecast(actualTotals, forecastPeriods);
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
          lineStyle: { width: 3 },
        },
      ],
    };
  }

  private buildSalesChart(labels: string[], totals: number[]): void {
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
  }

  private buildGrowthChart(labels: string[], totals: number[], lastActualIndex: number): void {
    const actualLabels = labels.slice(0, lastActualIndex + 1);
    const actualTotals = totals.slice(0, lastActualIndex + 1);
    const growth = this.analyticsService.calculateGrowth(actualTotals);

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
