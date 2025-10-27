import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodOrdersAnalyticsService, FoodOrder } from './food-orders-analytics.service';
import { EChartsOption } from 'echarts';
import foodOrdersData from '../data/foodorder.json';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

@Component({
  selector: 'app-food-orders-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  templateUrl: './food-orders-analytics.component.html',
  styleUrls: ['../analytics/analytics.component.css'],
})
export class FoodOrdersAnalyticsComponent implements OnInit {
  orders: FoodOrder[] = [];
  deliveryMethodChartOption: EChartsOption = {};
  ordersPerHourChartOption: EChartsOption = {};
  topCustomersChartOption: EChartsOption = {};
  revenueOverTimeChartOption: EChartsOption = {};
  ordersByDayChartOption: EChartsOption = {};

  

  isLoading: boolean = true;

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

  selectedDateRange: string = 'allTime';

  constructor(
    private analyticsService: FoodOrdersAnalyticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadOrders();
    }, 0);
  }

  loadOrders(): void {
    try {
      this.isLoading = true;

      this.orders = foodOrdersData.data.data as unknown as FoodOrder[];

      setTimeout(() => {
        this.updateDeliveryMethodChart();
        this.updateOrdersPerHourChart();
        this.updateTopCustomersChart();
        this.updateRevenueOverTimeChart();
        this.updateOrdersByDayChart();

        this.isLoading = false;
        this.cdr.detectChanges();
      }, 100);
    } catch (error) {
      console.error('Error loading orders:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onFilterChange(): void {
    this.updateDeliveryMethodChart();
    this.updateOrdersPerHourChart();
    this.updateTopCustomersChart();
    this.updateRevenueOverTimeChart();
    this.updateOrdersByDayChart();
    this.cdr.detectChanges();
  }

  getRevenueGrowthRate(period: 'month' | 'year' = 'month'): number | null {
    if (this.isLoading || this.orders.length === 0) return null;
    return this.analyticsService.getRevenueGrowthRate(this.orders, period);
  }

  getTotalRevenue(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.analyticsService.filterByDateRange(this.orders, this.selectedDateRange);
    return filtered.reduce((sum, o) => sum + o.total, 0);
  }

  getTotalOrders(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.analyticsService.filterByDateRange(this.orders, this.selectedDateRange);
    return filtered.length;
  }

  getAverageOrderValue(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    return this.analyticsService.getAverageOrderValue(this.orders, this.selectedDateRange);
  }

  getOrderCompletionRate(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    return this.analyticsService.getOrderCompletionRate(this.orders, this.selectedDateRange);
  }

  getDeliveryPickupSplit(): { delivery: number; pickup: number } {
    if (this.isLoading || this.orders.length === 0) return { delivery: 0, pickup: 0 };
    return this.analyticsService.getDeliveryPickupSplit(this.orders, this.selectedDateRange);
  }

  getTotalUniqueCustomers(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    return this.analyticsService.getTotalUniqueCustomers(this.orders, this.selectedDateRange);
  }

  getBusiestDay(): string | null {
    if (this.isLoading || this.orders.length === 0) return null;
    return this.analyticsService.getBusiestDay(this.orders);
  }

  getBusiestHour(): string | null {
    if (this.isLoading || this.orders.length === 0) return null;
    return this.analyticsService.getBusiestHour(this.orders);
  }

  getPendingOrders(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    return this.analyticsService.getPendingOrders(this.orders, this.selectedDateRange);
  }

  getCompletedOrders(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    return this.analyticsService.getCompletedOrders(this.orders, this.selectedDateRange);
  }

  getDateRangeLabel(): string {
    return this.analyticsService.getDateRangeLabel(this.selectedDateRange);
  }

  private updateDeliveryMethodChart(): void {
    if (this.orders.length === 0) return;

    const deliveryData = this.analyticsService.getRevenueByDeliveryMethod(
      this.orders,
      this.selectedDateRange
    );

    const filteredData = deliveryData.filter((d) => d.name === 'Delivery' || d.name === 'Pickup');

    this.deliveryMethodChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: ₦${params.value.toLocaleString()} (${params.percent}%)`,
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: filteredData.map((d) => d.name),
      },
      color: ['#6384ff', '#10b981'],
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
          data: filteredData,
        },
      ],
    };
  }

  private updateOrdersPerHourChart(): void {
    if (this.orders.length === 0) return;

    const hourData = this.analyticsService.getOrdersByHour(this.orders, this.selectedDateRange);
    const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

    this.ordersPerHourChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const hour = params[0].name;
            const value = params[0].value;
            return `${hour}<br/>${value} order${value !== 1 ? 's' : ''}`;
          }
          return '';
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
          fontSize: 10,
          interval: 3,
          rotate: 0,
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
          data: hourData,
          itemStyle: {
            color: '#8b5cf6',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateOrdersByDayChart(): void {
    if (this.orders.length === 0) return;

    const dayData = this.analyticsService.getOrdersByDayOfWeek(this.orders, this.selectedDateRange);
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    this.ordersByDayChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const day = params[0].name;
            const value = params[0].value;
            return `${day}<br/>${value} order${value !== 1 ? 's' : ''}`;
          }
          return '';
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%', 
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: '#666',
          fontSize: 10,
          interval: 0,
          rotate: 45, 
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
          data: dayData,
          itemStyle: {
            color: '#f59e0b',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateTopCustomersChart(): void {
    if (this.orders.length === 0) {
      this.topCustomersChartOption = {};
      return;
    }

    const topCustomers = this.analyticsService.getTopCustomers(
      this.orders,
      this.selectedDateRange,
      10
    );

    const labels =
      topCustomers.length > 0
        ? topCustomers.map((c) => c.name)
        : [
            'Customer 1',
            'Customer 2',
            'Customer 3',
            'Customer 4',
            'Customer 5',
            'Customer 6',
            'Customer 7',
            'Customer 8',
            'Customer 9',
            'Customer 10',
          ];

    const values = topCustomers.length > 0 ? topCustomers.map((c) => c.revenue) : Array(10).fill(0);

    this.topCustomersChartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'none',
        },
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const name = params[0].name;
            const value = params[0].value;
            return `${name}<br/>₦${Number(value).toLocaleString()}`;
          }
          return '';
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '25%',
        top: '3%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: '#666',
          fontSize: 10,
          rotate: 45,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#666',
          fontSize: 10,
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
            color: '#10b981',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateRevenueOverTimeChart(): void {
    if (this.orders.length === 0) {
      this.revenueOverTimeChartOption = {};
      return;
    }

    const { labels, values } = this.analyticsService.getRevenueOverTime(
      this.orders,
      this.selectedDateRange
    );

    if (labels.length === 0) {
      this.revenueOverTimeChartOption = {};
      return;
    }

    this.revenueOverTimeChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const label = params[0].name;
            const value = params[0].value;
            return `${label}<br/>₦${Number(value).toLocaleString()}`;
          }
          return '';
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: '#666',
          fontSize: 11,
          rotate: 45,
          interval: 0, 
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#666',
          fontSize: 10,
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
          type: 'line',
          data: values,
          smooth: true,
          itemStyle: {
            color: '#6384ff',
          },
          areaStyle: {
            color: 'rgba(99, 132, 255, 0.2)',
          },
          lineStyle: {
            width: 3,
          },
        },
      ],
    };
  }
}
