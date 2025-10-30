import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, WorkTeller } from './analytics.service';
import { EChartsOption } from 'echarts';
import transactionsData from '../data/transactions.json';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';

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
  topCustomersChartOption: EChartsOption = {};
  dayOfWeekChartOption: EChartsOption = {};
  timeOfDayChartOption: EChartsOption = {};

  selectedDate: string = '';
  useSpecificDate: boolean = false;

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
    this.updateAllCharts();
  }

  onDateChange(): void {
    if (this.selectedDate) {
      this.useSpecificDate = true;
      this.updateAllCharts();
      this.cdr.detectChanges();
    }
  }

  onFilterChange(): void {
    this.useSpecificDate = false;
    this.selectedDate = '';
    this.updateAllCharts();
    this.cdr.detectChanges();
  }

  onChartTypeChange(): void {
    this.updateChart();
    this.cdr.detectChanges();
  }

  onMetricChange(): void {
    this.updateChart();
    this.cdr.detectChanges();
  }

  private updateAllCharts(): void {
    this.updateChart();
    this.updatePaymentMethodChart();
    this.updatePeakHoursChart();
    this.updateCustomerTypeChart();
    this.updateTopCustomersChart();
    this.updateDayOfWeekChart();
    this.updateTimeOfDayChart();
  }

  private shouldUseLogScale(values: number[]): boolean {
    const maxValue = Math.max(...values.filter((v) => v > 0));
    const minValue = Math.min(...values.filter((v) => v > 0));
    return maxValue > 0 && minValue > 0 && maxValue / minValue > 100;
  }

  private getLogScaleConfig(values: number[]) {
    return {
      type: 'log' as const,
      min: (value: any) => {
        const nonZeroValues = values.filter((v) => v > 0);
        return nonZeroValues.length > 0 ? Math.floor(Math.min(...nonZeroValues) / 10) : 1;
      },
    };
  }

  getRevenueGrowthRate(period: 'month' | 'year' = 'month'): number | null {
    return this.analyticsService.getRevenueGrowthRate(this.transactions, period);
  }

  getCustomerRetentionRate(): number | null {
    return this.analyticsService.getCustomerRetentionRate(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getBusiestDay(): string | null {
    return this.analyticsService.getBusiestDay(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getBusiestMonth(): string | null {
    return this.analyticsService.getBusiestMonth(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getBusiestHour(): string | null {
    return this.analyticsService.getBusiestHour(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getTotalRevenue(): number {
    return this.analyticsService.getTotalRevenue(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getTotalUniqueCustomers(): number {
    return this.analyticsService.getTotalUniqueCustomers(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getAverageOrderValue(): number {
    return this.analyticsService.getAverageOrderValue(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getTransactionCount(): number {
    return this.analyticsService.getTransactionCount(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getDateRangeLabel(): string {
    if (this.useSpecificDate && this.selectedDate) {
      const date = new Date(this.selectedDate);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    const selected = this.dateRangeOptions.find((opt) => opt.value === this.selectedDateRange);
    return selected ? selected.label : '';
  }

  getPaymentSuccessRate(): number {
    return this.analyticsService.getPaymentSuccessRate(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getMostPopularPaymentMethod(): string {
    return this.analyticsService.getMostPopularPaymentMethod(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getCustomerRevenueSplit(): { firstTime: number; repeat: number } {
    return this.analyticsService.getCustomerRevenueSplit(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getDiscountUtilizationRate(): number {
    return this.analyticsService.getDiscountUtilizationRate(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  getPeakRevenueHours(): string {
    return this.analyticsService.getPeakRevenueHours(
      this.transactions,
      this.useSpecificDate ? this.selectedDate : undefined
    );
  }

  shouldShowBusiestHour(): boolean {
    return true;
  }

  shouldShowBusiestDay(): boolean {
    if (this.useSpecificDate) return false;
    const range = this.selectedDateRange;
    return [
      'last7Days',
      'last14Days',
      'last30Days',
      'last60Days',
      'last90Days',
      'thisWeek',
      'lastWeek',
      'last2Months',
      'thisMonth',
      'lastMonth',
      'thisQuarter',
      'lastQuarter',
      'thisYear',
      'lastYear',
      'allTime',
    ].includes(range);
  }

  shouldShowBusiestMonth(): boolean {
    if (this.useSpecificDate || this.selectedDateRange === 'last2Months') return false;
    const range = this.selectedDateRange;
    return [
      'last60Days',
      'last90Days',
      'thisQuarter',
      'lastQuarter',
      'thisYear',
      'lastYear',
      'allTime',
    ].includes(range);
  }

  private updatePaymentMethodChart(): void {
    const paymentData = this.analyticsService.getRevenueByPaymentMethod(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );

    if (!paymentData || paymentData.length === 0) {
      this.paymentMethodChartOption = this.createNoDataChart();
      return;
    }

    const values = paymentData.map((d) => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values.filter((v) => v > 0));
    const useBarChart = maxValue > 0 && minValue > 0 && maxValue / minValue > 100;

    if (useBarChart) {
      const useLogScale = this.shouldUseLogScale(values);
      const labels = paymentData.map((d) => d.name);

      this.paymentMethodChartOption = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const data = Array.isArray(params) ? params[0] : params;
            return `${data.name}: ₦${Number(data.value).toLocaleString()}`;
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            color: '#666',
            fontSize: 11,
            rotate: labels.some((l) => l.length > 8) ? 45 : 0,
          },
        },
        yAxis: {
          ...(useLogScale ? this.getLogScaleConfig(values) : { type: 'value' as const }),
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
              color: (params: any) => {
                const colors = ['#6384ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                return colors[params.dataIndex % colors.length];
              },
              borderRadius: [6, 6, 0, 0],
            },
            barWidth: '60%',
          },
        ],
      };
    } else {
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
              position: 'center',
            },
            labelLine: {
              show: false,
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold',
                formatter: (params: any) => {
                  return `{name|${
                    params.name
                  }}\n{value|₦${params.value.toLocaleString()}}\n{percent|${params.percent}%}`;
                },
                rich: {
                  name: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#333',
                    lineHeight: 22,
                  },
                  value: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#111',
                    lineHeight: 28,
                  },
                  percent: {
                    fontSize: 12,
                    color: '#666',
                    lineHeight: 20,
                  },
                },
              },
            },
            data: paymentData,
          },
        ],
      };
    }
  }

  private updateTopCustomersChart(): void {
    const topCustomers = this.analyticsService.getTop10Customers(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );

    if (!topCustomers || topCustomers.length === 0) {
      this.topCustomersChartOption = this.createNoDataChart();
      return;
    }

    const labels = topCustomers.map((c) => c.name);
    const values = topCustomers.map((c) => c.value);

    this.topCustomersChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = Array.isArray(params) ? params[0] : params;
          return `${data.name}: ₦${Number(data.value).toLocaleString()}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#666', fontSize: 10, rotate: 45, interval: 0 },
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
          itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateDayOfWeekChart(): void {
    const { labels, counts } = this.analyticsService.getTransactionsByDayOfWeek(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );

    if (!counts || counts.every((c) => c === 0)) {
      this.dayOfWeekChartOption = this.createNoDataChart();
      return;
    }

    this.dayOfWeekChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = Array.isArray(params) ? params[0] : params;
          return `${data.name}: ${data.value} transaction${data.value !== 1 ? 's' : ''}`;
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
        },
      },
      series: [
        {
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#6384ff',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateTimeOfDayChart(): void {
    const timeData = this.analyticsService.getTransactionsByTimeOfDay(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );

    if (!timeData || timeData.length === 0) {
      this.timeOfDayChartOption = this.createNoDataChart();
      return;
    }

    this.timeOfDayChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: ${params.value} transaction${params.value !== 1 ? 's' : ''} (${
            params.percent
          }%)`,
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: timeData.map((d) => d.name),
      },
      color: ['#f59e0b', '#6384ff', '#8b5cf6'],
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
            position: 'center',
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: (params: any) => {
                return `{name|${params.name}}\n{value|${params.value} txns}\n{percent|${params.percent}%}`;
              },
              rich: {
                name: {
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#333',
                  lineHeight: 22,
                },
                value: {
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#111',
                  lineHeight: 28,
                },
                percent: {
                  fontSize: 12,
                  color: '#666',
                  lineHeight: 20,
                },
              },
            },
          },
          data: timeData,
        },
      ],
    };
  }

  private updatePeakHoursChart(): void {
    const hourData = this.analyticsService.getRevenueByHour(
      this.transactions,
      this.selectedDateRange,
      this.useSpecificDate ? this.selectedDate : undefined
    );

    if (!hourData || hourData.every((h) => h === 0)) {
      this.peakHoursChartOption = this.createNoDataChart();
      return;
    }

    const sortedHours = hourData
      .map((revenue, hour) => ({ hour, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const labels = sortedHours.map((h) => h.hour.toString().padStart(2, '0') + ':00');
    const values = sortedHours.map((h) => h.revenue);
    const useLogScale = this.shouldUseLogScale(values);

    this.peakHoursChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = Array.isArray(params) ? params[0] : params;
          const hour = data.name;
          const value = data.value;
          return `${hour}: ₦${Number(value).toLocaleString()}`;
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
        ...(useLogScale ? this.getLogScaleConfig(values) : { type: 'value' as const }),
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

    if (split.firstTime === 0 && split.repeat === 0) {
      this.customerTypeChartOption = this.createNoDataChart();
      return;
    }

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
            position: 'center',
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: (params: any) => {
                return `{name|${params.name}}\n{value|${params.value}%}`;
              },
              rich: {
                name: {
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#333',
                  lineHeight: 22,
                },
                value: {
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#111',
                  lineHeight: 32,
                },
              },
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
        this.transactions,
        this.useSpecificDate ? this.selectedDate : undefined
      );

      if (!counts || counts.length === 0 || counts.every((c) => c === 0)) {
        this.chartOption = this.createNoDataChart();
        return;
      }

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

    const { labels, totals } = this.analyticsService.prepareChartSeries(
      this.selectedDateRange,
      this.transactions,
      this.useSpecificDate ? this.selectedDate : undefined
    );

    if (!totals || totals.length === 0 || totals.every((t) => t === 0)) {
      this.chartOption = this.createNoDataChart();
      return;
    }

    const lastActualIndex = this.calculateLastActualIndex(now, labels.length);

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

  private calculateLastActualIndex(now: Date, labelsLength: number): number {
    if (this.useSpecificDate) {
      return labelsLength - 1;
    }

    let lastActualIndex = labelsLength - 1;

    if (this.selectedDateRange === 'today') lastActualIndex = now.getHours();
    else if (this.selectedDateRange === 'yesterday') lastActualIndex = 23;
    else if (this.selectedDateRange === 'thisMonth') lastActualIndex = now.getDate() - 1;
    else if (this.selectedDateRange === 'lastMonth') lastActualIndex = labelsLength - 1;
    else if (this.selectedDateRange === 'thisYear') lastActualIndex = now.getMonth();
    else if (this.selectedDateRange === 'thisWeek') lastActualIndex = now.getDay();
    else if (this.selectedDateRange === 'lastWeek') lastActualIndex = 6;
    else if (this.selectedDateRange === 'last2Months') lastActualIndex = labelsLength - 1;
    else if (this.selectedDateRange === 'thisQuarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      const monthIntoQuarter = now.getMonth() - quarter * 3;
      lastActualIndex = monthIntoQuarter;
    } else if (this.selectedDateRange === 'lastQuarter') lastActualIndex = 2;

    return lastActualIndex;
  }

  private buildForecastChart(
    labels: string[],
    totals: number[],
    lastActualIndex: number,
    now: Date
  ): void {
    const actualLabels = labels.slice(0, lastActualIndex + 1);
    const actualTotals = totals.slice(0, lastActualIndex + 1);

    if (!actualTotals || actualTotals.length === 0 || actualTotals.every((t) => t === 0)) {
      this.chartOption = this.createNoDataChart();
      return;
    }

    const forecastPeriods = 7;
    let forecastLabels: string[] = this.generateForecastLabels(
      now,
      forecastPeriods,
      labels,
      lastActualIndex
    );

    let useTrimmedRegression = ['allTime'].includes(this.selectedDateRange);
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
          let result = params[0].axisValueLabel + '';
          params.forEach((param: any) => {
            if (param.value != null) {
              result += `${param.marker} ${param.seriesName}: ₦${Number(
                param.value
              ).toLocaleString()}`;
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

  private generateForecastLabels(
    now: Date,
    periods: number,
    labels: string[],
    lastActualIndex: number
  ): string[] {
    let forecastLabels: string[] = [];

    if (this.useSpecificDate && labels.length === 24) {
      let startHour = lastActualIndex + 1;
      forecastLabels = Array.from({ length: periods }, (_, i) => {
        let hour = (startHour + i) % 24;
        return hour.toString().padStart(2, '0') + ':00';
      });
      return forecastLabels;
    }

    if (this.selectedDateRange === 'lastYear') {
      let forecastStart = new Date(now.getFullYear(), 0, 1);
      forecastLabels = Array.from({ length: periods }, (_, i) => {
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
        forecastLabels = Array.from({ length: periods }, (_, i) => {
          let m = new Date(forecastStart);
          m.setMonth(forecastStart.getMonth() + i);
          return m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
      }
    } else if (this.selectedDateRange === 'today' || this.selectedDateRange === 'yesterday') {
      let startHour = lastActualIndex + 1;
      forecastLabels = Array.from({ length: periods }, (_, i) => {
        let hour = (startHour + i) % 24;
        return hour.toString().padStart(2, '0') + ':00';
      });
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
      forecastLabels = Array.from({ length: periods }, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      });
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
      forecastLabels = Array.from({ length: periods }, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });
    } else if (['last60Days', 'last90Days'].includes(this.selectedDateRange)) {
      let forecastStartIndex = lastActualIndex + 1;
      if (forecastStartIndex < labels.length) {
        forecastLabels = labels.slice(forecastStartIndex, forecastStartIndex + periods);
      }

      if (forecastLabels.length < periods && labels.length > 0) {
        const lastLabel = labels[labels.length - 1];
        const parts = lastLabel.split(' - ');
        if (parts.length === 2) {
          const endDateStr = parts[1].trim();
          const year = now.getFullYear();
          let lastWeekEnd = new Date(endDateStr + ' ' + year);
          const remaining = periods - forecastLabels.length;
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
    } else if (this.selectedDateRange === 'last2Months') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const targetMonth = currentMonth - 2;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
      const lastDayOfAugust = new Date(targetYear, adjustedMonth + 1, 0);
      let base = new Date(lastDayOfAugust);
      base.setDate(base.getDate() + 1);
      forecastLabels = Array.from({ length: periods }, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      });
    } else if (['thisQuarter', 'lastQuarter'].includes(this.selectedDateRange)) {
      if (labels.length > 0) {
        let lastLabel = labels[labels.length - 1];
        let [monthStr, yearStr] = lastLabel.replace(',', '').split(' ');
        let monthIndex = new Date(Date.parse(monthStr + ' 1, 2000')).getMonth();
        let forecastStart = new Date(parseInt(yearStr), monthIndex + 1, 1);
        forecastLabels = Array.from({ length: periods }, (_, i) => {
          let m = new Date(forecastStart);
          m.setMonth(forecastStart.getMonth() + i);
          return m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
      }
    } else if (this.selectedDateRange === 'thisYear') {
      let base = new Date(now.getFullYear(), lastActualIndex + 1, 1);
      forecastLabels = Array.from({ length: periods }, (_, i) => {
        const m = new Date(base);
        m.setMonth(base.getMonth() + i);
        return m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      });
    } else {
      forecastLabels = Array.from({ length: periods }, (_, i) => 'Period ' + (i + 1));
    }

    return forecastLabels;
  }

  private buildSalesChart(labels: string[], totals: number[]): void {
    if (!totals || totals.length === 0 || totals.every((t) => t === 0)) {
      this.chartOption = this.createNoDataChart();
      return;
    }

    const useLogScale = this.selectedChartType !== 'line' && this.shouldUseLogScale(totals);

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
          type: useLogScale ? 'log' : 'value',
          ...(useLogScale && {
            min: (value: any) => {
              const nonZeroValues = totals.filter((v) => v > 0);
              return nonZeroValues.length > 0 ? Math.floor(Math.min(...nonZeroValues) / 10) : 1;
            },
          }),
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
            areaStyle:
              this.selectedChartType === 'line' ? { color: 'rgba(99, 132, 255, 0.3)' } : undefined,
            barWidth: this.selectedChartType === 'bar' ? '60%' : undefined,
          },
        ],
      };
    }
  }

  private buildGrowthChart(labels: string[], totals: number[], lastActualIndex: number): void {
    const actualLabels = labels.slice(0, lastActualIndex + 1);
    const actualTotals = totals.slice(0, lastActualIndex + 1);

    if (!actualTotals || actualTotals.length === 0 || actualTotals.every((t) => t === 0)) {
      this.chartOption = this.createNoDataChart();
      return;
    }

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

  private createNoDataChart(): EChartsOption {
    return {
      title: {
        text: 'No Data',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 14,
        },
      },
      series: [],
    };
  }

  exportToExcel(): void {
    try {
      const dateRangeLabel = this.getDateRangeLabel();
      const timestamp = new Date().toLocaleString();
      const wb = XLSX.utils.book_new();

      const filteredTransactions = this.getFilteredTransactions();

      try {
        const summaryData = [
          ['ANALYTICS REPORT', ''],
          [],
          ['Date Range', dateRangeLabel],
          ['Exported', timestamp],
          [],
          ['SUMMARY METRICS', ''],
          ['Metric', 'Value'],
          ['Total Revenue', `₦${this.getTotalRevenue().toLocaleString()}`],
          ['Total Transactions', this.getTransactionCount().toString()],
          ['Total Unique Customers', this.getTotalUniqueCustomers().toString()],
          ['Average Order Value', `₦${this.getAverageOrderValue().toLocaleString()}`],
          [
            'Revenue Growth Rate (MoM)',
            this.getRevenueGrowthRate('month') !== null
              ? this.getRevenueGrowthRate('month') + '%'
              : 'N/A',
          ],
          [
            'Revenue Growth Rate (YoY)',
            this.getRevenueGrowthRate('year') !== null
              ? this.getRevenueGrowthRate('year') + '%'
              : 'N/A',
          ],
          [],
          ['CUSTOMER METRICS', ''],
          ['Metric', 'Value'],
          [
            'Customer Retention Rate',
            this.getCustomerRetentionRate() !== null
              ? this.getCustomerRetentionRate() + '%'
              : 'N/A',
          ],
          ['First-Time Customer Revenue', this.getCustomerRevenueSplit().firstTime + '%'],
          ['Repeat Customer Revenue', this.getCustomerRevenueSplit().repeat + '%'],
          [],
          ['PAYMENT METRICS', ''],
          ['Metric', 'Value'],
          ['Payment Success Rate', this.getPaymentSuccessRate() + '%'],
          ['Discount Utilization Rate', this.getDiscountUtilizationRate() + '%'],
          [],
          ['PERFORMANCE METRICS', ''],
          ['Metric', 'Value'],
          ['Busiest Day', this.getBusiestDay() || 'N/A'],
          ['Busiest Hour', this.getBusiestHour() || 'N/A'],
          ['Busiest Month', this.getBusiestMonth() || 'N/A'],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 35 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      } catch (e) {
        console.error('Sheet 1 error:', e);
      }

      try {
        const topCustomers = this.buildTopCustomersData(filteredTransactions);
        const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
        const customersData = [
          ['TOP 10 CUSTOMERS', '', '', '', ''],
          [],
          ['Rank', 'Customer ID', 'Customer Name', 'Revenue', 'Percentage of Total'],
        ];

        topCustomers.forEach((customer: any, index: number) => {
          const percentage =
            totalRevenue > 0 ? ((customer.value / totalRevenue) * 100).toFixed(2) + '%' : '0.00%';
          customersData.push([
            (index + 1).toString(),
            customer.customerId,
            customer.name,
            `₦${customer.value.toLocaleString()}`,
            percentage,
          ]);
        });

        const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
        customersSheet['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 35 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, customersSheet, 'Top Customers');
      } catch (e) {
        console.error('Sheet 2 error:', e);
      }

      try {
        const dailyData = this.buildDailyBreakdown(filteredTransactions);
        const dailySheetData = [
          ['DAILY BREAKDOWN', '', '', ''],
          [],
          ['Date', 'Revenue', 'Transactions', 'Average Order Value'],
        ];

        dailyData.forEach((day: any) => {
          dailySheetData.push([
            day.date,
            `₦${day.revenue.toLocaleString()}`,
            day.transactions.toString(),
            `₦${day.avgValue.toLocaleString()}`,
          ]);
        });

        const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
        dailySheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Breakdown');
      } catch (e) {
        console.error('Sheet 3 error:', e);
      }

      try {
        const paymentMethods = this.buildPaymentMethodBreakdown(filteredTransactions);
        const paymentData = [
          ['PAYMENT METHOD BREAKDOWN', '', '', ''],
          [],
          ['Payment Method', 'Revenue', 'Transaction Count', 'Percentage'],
        ];

        paymentMethods.forEach((method: any) => {
          paymentData.push([
            method.name,
            `₦${method.revenue.toLocaleString()}`,
            method.count.toString(),
            method.percentage + '%',
          ]);
        });

        const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
        paymentSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, paymentSheet, 'Payment Methods');
      } catch (e) {
        console.error('Sheet 4 error:', e);
      }

      try {
        const topHours = this.buildTopHourlyData(filteredTransactions);
        const hoursData = [
          ['TOP 10 REVENUE HOURS', '', ''],
          [],
          ['Hour', 'Revenue', 'Transactions'],
        ];

        topHours.forEach((hour: any) => {
          hoursData.push([
            hour.hour,
            `₦${hour.revenue.toLocaleString()}`,
            hour.transactions.toString(),
          ]);
        });

        const hoursSheet = XLSX.utils.aoa_to_sheet(hoursData);
        hoursSheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, hoursSheet, 'Top Hours');
      } catch (e) {
        console.error('Sheet 5 error:', e);
      }

      try {
        const sourceData = this.buildRevenueBySource(filteredTransactions);
        const sourceSheetData = [
          ['REVENUE BY SOURCE', '', '', ''],
          [],
          ['Source', 'Revenue', 'Transactions', 'Percentage'],
        ];

        sourceData.forEach((source: any) => {
          sourceSheetData.push([
            source.name,
            `₦${source.revenue.toLocaleString()}`,
            source.transactions.toString(),
            source.percentage + '%',
          ]);
        });

        const sourceSheet = XLSX.utils.aoa_to_sheet(sourceSheetData);
        sourceSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, sourceSheet, 'Revenue by Source');
      } catch (e) {
        console.error('Sheet 6 error:', e);
      }

      try {
        const dayOfWeekData = this.buildDayOfWeekBreakdown(filteredTransactions);
        const daySheetData = [
          ['TRANSACTIONS BY DAY OF WEEK', '', '', ''],
          [],
          ['Day', 'Revenue', 'Transactions', 'Average Order Value'],
        ];

        dayOfWeekData.forEach((day: any) => {
          daySheetData.push([
            day.day,
            `₦${day.revenue.toLocaleString()}`,
            day.transactions.toString(),
            `₦${day.avgValue.toLocaleString()}`,
          ]);
        });

        const daySheet = XLSX.utils.aoa_to_sheet(daySheetData);
        daySheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, daySheet, 'Day of Week');
      } catch (e) {
        console.error('Sheet 7 error:', e);
      }

      try {
        const discountData = this.buildDiscountImpact(filteredTransactions);
        const discountSheetData = [
          ['DISCOUNT IMPACT ANALYSIS', ''],
          [],
          ['Metric', 'Value'],
          ['Total Discounts Given', `₦${discountData.totalDiscounts.toLocaleString()}`],
          ['Transactions with Discount', discountData.discountedTransactions.toString()],
          [
            'Average Discount per Transaction',
            `₦${discountData.avgDiscountPerTx.toLocaleString()}`,
          ],
          [
            'Revenue from Discounted Orders',
            `₦${discountData.discountedOrderRevenue.toLocaleString()}`,
          ],
          ['Percentage of Revenue from Discounts', discountData.discountRevenuePercentage + '%'],
        ];

        const discountSheet = XLSX.utils.aoa_to_sheet(discountSheetData);
        discountSheet['!cols'] = [{ wch: 40 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, discountSheet, 'Discount Impact');
      } catch (e) {
        console.error('Sheet 8 error:', e);
      }

      XLSX.writeFile(wb, `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error('Fatal error in exportToExcel:', e);
    }
  }

  private getFilteredTransactions(): WorkTeller[] {
    if (this.useSpecificDate && this.selectedDate) {
      const targetDate = new Date(this.selectedDate);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const targetDay = targetDate.getDate();

      return this.transactions.filter((t) => {
        const orderDate = new Date(t.date || t.createdAt);
        return (
          orderDate.getFullYear() === targetYear &&
          orderDate.getMonth() === targetMonth &&
          orderDate.getDate() === targetDay
        );
      });
    }
    return this.analyticsService.filterByDateRange(this.transactions, this.selectedDateRange);
  }

  private buildTopCustomersData(transactions: WorkTeller[]): any[] {
    const customerMap: {
      [key: string]: {
        customerId: string;
        name: string;
        value: number;
        orderCount: number;
      };
    } = {};

    transactions.forEach((t) => {
      const custId = t.workProfile?.email || 'unknown';
      const name = t.workProfile?.name || 'Unknown';

      if (!customerMap[custId]) {
        customerMap[custId] = {
          customerId: custId,
          name: name,
          value: 0,
          orderCount: 0,
        };
      }

      customerMap[custId].name = name;
      customerMap[custId].value += t.total || 0;
      customerMap[custId].orderCount += 1;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  private buildDailyBreakdown(transactions: WorkTeller[]): any[] {
    const dayMap: {
      [key: string]: { date: string; revenue: number; transactions: number; values: number[] };
    } = {};
    transactions.forEach((t) => {
      const date = new Date(t.date || t.createdAt);
      const dateStr = date.toLocaleDateString();
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { date: dateStr, revenue: 0, transactions: 0, values: [] };
      }
      dayMap[dateStr].revenue += t.total || 0;
      dayMap[dateStr].transactions += 1;
      dayMap[dateStr].values.push(t.total || 0);
    });
    return Object.values(dayMap)
      .map((day) => ({
        date: day.date,
        revenue: day.revenue,
        transactions: day.transactions,
        avgValue: day.transactions > 0 ? Math.round(day.revenue / day.transactions) : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private buildPaymentMethodBreakdown(transactions: WorkTeller[]): any[] {
    const methodMap: { [key: string]: { name: string; revenue: number; count: number } } = {};
    transactions.forEach((t) => {
      const method = t.paymentMethod || 'Unknown';
      if (!methodMap[method]) {
        methodMap[method] = { name: method, revenue: 0, count: 0 };
      }
      methodMap[method].revenue += t.total || 0;
      methodMap[method].count += 1;
    });
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    return Object.values(methodMap)
      .map((method) => ({
        ...method,
        percentage: totalRevenue > 0 ? ((method.revenue / totalRevenue) * 100).toFixed(2) : '0.00',
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private buildTopHourlyData(transactions: WorkTeller[]): any[] {
    const hourMap: { [key: string]: { hour: string; revenue: number; transactions: number } } = {};
    transactions.forEach((t) => {
      const date = new Date(t.date || t.createdAt);
      const hour = date.getHours().toString().padStart(2, '0') + ':00';
      if (!hourMap[hour]) {
        hourMap[hour] = { hour, revenue: 0, transactions: 0 };
      }
      hourMap[hour].revenue += t.total || 0;
      hourMap[hour].transactions += 1;
    });
    return Object.values(hourMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private buildRevenueBySource(transactions: WorkTeller[]): any[] {
    const sourceMap: { [key: string]: { name: string; revenue: number; transactions: number } } =
      {};
    transactions.forEach((t) => {
      const source = t.source || 'Unknown';
      if (!sourceMap[source]) {
        sourceMap[source] = { name: source, revenue: 0, transactions: 0 };
      }
      sourceMap[source].revenue += t.total || 0;
      sourceMap[source].transactions += 1;
    });
    const totalRevenue = Object.values(sourceMap).reduce((sum, s) => sum + s.revenue, 0);
    return Object.values(sourceMap)
      .map((source) => ({
        ...source,
        percentage: totalRevenue > 0 ? ((source.revenue / totalRevenue) * 100).toFixed(2) : '0.00',
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private buildDayOfWeekBreakdown(transactions: WorkTeller[]): any[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap: { [key: number]: { day: string; revenue: number; transactions: number } } = {};
    days.forEach((day, index) => {
      dayMap[index] = { day, revenue: 0, transactions: 0 };
    });
    transactions.forEach((t) => {
      const date = new Date(t.date || t.createdAt);
      const dayIndex = date.getDay();
      dayMap[dayIndex].revenue += t.total || 0;
      dayMap[dayIndex].transactions += 1;
    });
    return Object.values(dayMap).map((day) => ({
      day: day.day,
      revenue: day.revenue,
      transactions: day.transactions,
      avgValue: day.transactions > 0 ? Math.round(day.revenue / day.transactions) : 0,
    }));
  }

  private buildDiscountImpact(transactions: WorkTeller[]): any {
    const discountedTransactions = transactions.filter((t) => (t.discount || 0) > 0);
    const totalDiscounts = discountedTransactions.reduce((sum, t) => sum + (t.discount || 0), 0);
    const discountedOrderRevenue = discountedTransactions.reduce(
      (sum, t) => sum + (t.total || 0),
      0
    );
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    return {
      totalDiscounts,
      discountedTransactions: discountedTransactions.length,
      avgDiscountPerTx:
        discountedTransactions.length > 0
          ? Math.round(totalDiscounts / discountedTransactions.length)
          : 0,
      discountedOrderRevenue,
      discountRevenuePercentage:
        totalRevenue > 0 ? ((discountedOrderRevenue / totalRevenue) * 100).toFixed(2) : '0.00',
    };
  }

  private isInDateRange(transaction: WorkTeller): boolean {
    if (!this.transactions || this.transactions.length === 0) return false;

    const date = new Date(transaction.date || transaction.createdAt);

    try {
      const dateRanges = (this.analyticsService as any).getDateRangeBounds(this.selectedDateRange);

      if (dateRanges && dateRanges.start && dateRanges.end) {
        return date >= dateRanges.start && date <= dateRanges.end;
      }
    } catch (e) {
      // Fallback
    }

    return (
      this.analyticsService.filterByDateRange([transaction], this.selectedDateRange).length > 0
    );
  }
}
