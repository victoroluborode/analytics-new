import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodOrdersAnalyticsService, FoodOrder } from './food-orders-analytics.service';
import { EChartsOption } from 'echarts';
import foodOrdersData from '../data/foodorder.json';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';

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
  ordersByTimeOfDayChartOption: EChartsOption = {};
  isLoading: boolean = true;
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
        this.updateAllCharts();
        this.isLoading = false;
        this.cdr.detectChanges();
      }, 100);
    } catch (error) {
      console.error('Error loading orders:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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

  private updateAllCharts(): void {
    this.updateDeliveryMethodChart();
    this.updateOrdersPerHourChart();
    this.updateTopCustomersChart();
    this.updateRevenueOverTimeChart();
    this.updateOrdersByDayChart();
    this.updateOrdersByTimeOfDayChart();
  }

  private getFilteredOrders(): FoodOrder[] {
    if (this.useSpecificDate && this.selectedDate) {
      return this.filterBySpecificDate(this.orders, this.selectedDate);
    }
    return this.analyticsService.filterByDateRange(this.orders, this.selectedDateRange);
  }

  private filterBySpecificDate(orders: FoodOrder[], dateString: string): FoodOrder[] {
    const targetDate = new Date(dateString);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetDay = targetDate.getDate();

    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return (
        orderDate.getFullYear() === targetYear &&
        orderDate.getMonth() === targetMonth &&
        orderDate.getDate() === targetDay
      );
    });
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

  getRevenueGrowthRate(period: 'month' | 'year' = 'month'): number | null {
    if (this.isLoading || this.orders.length === 0) return null;
    return this.analyticsService.getRevenueGrowthRate(this.orders, period);
  }

  getTotalRevenue(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.getFilteredOrders();
    return filtered.reduce((sum, o) => sum + o.total, 0);
  }

  getTotalOrders(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    return this.getFilteredOrders().length;
  }

  getAverageOrderValue(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.getFilteredOrders();
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, o) => sum + o.total, 0);
    return total / filtered.length;
  }

  getOrderCompletionRate(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.getFilteredOrders();
    if (filtered.length === 0) return 0;
    const completed = filtered.filter((o) => o.isClosed === true).length;
    return Math.round((completed / filtered.length) * 100);
  }

  getDeliveryPickupSplit(): { delivery: number; pickup: number } {
    if (this.isLoading || this.orders.length === 0) {
      return { delivery: 0, pickup: 0 };
    }
    const filtered = this.getFilteredOrders();
    if (filtered.length === 0) return { delivery: 0, pickup: 0 };

    const delivery = filtered.filter((o) => o.deliveryMethod === 'Delivery').length;
    const pickup = filtered.filter((o) => o.deliveryMethod === 'Pickup').length;
    const total = filtered.length;

    return {
      delivery: Math.round((delivery / total) * 100),
      pickup: Math.round((pickup / total) * 100),
    };
  }

  getTotalUniqueCustomers(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.getFilteredOrders();
    const uniqueCustomerIds = new Set(
      filtered.map((o) => o.workProfileId?.toString() || 'unknown')
    );
    return uniqueCustomerIds.size;
  }

  getBusiestDay(): string | null {
    if (this.isLoading || this.orders.length === 0) return null;
    const filtered = this.getFilteredOrders();
    if (filtered.length === 0) return null;

    const dayCounts: { [key: string]: number } = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    filtered.forEach((o) => {
      const day = days[new Date(o.createdAt).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.keys(dayCounts).reduce((a, b) => (dayCounts[a] > dayCounts[b] ? a : b));
  }

  getBusiestHour(): string | null {
    if (this.isLoading || this.orders.length === 0) return null;
    const filtered = this.getFilteredOrders();
    if (filtered.length === 0) return null;

    const hourCounts = Array(24).fill(0);
    filtered.forEach((o) => {
      hourCounts[new Date(o.createdAt).getHours()]++;
    });

    const busiestHour = hourCounts.indexOf(Math.max(...hourCounts));
    return `${busiestHour.toString().padStart(2, '0')}:00`;
  }

  getPendingOrders(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.getFilteredOrders();
    return filtered.filter((o) => o.workTeller?.paymentStatus !== 'FullyPaid').length;
  }

  getCompletedOrders(): number {
    if (this.isLoading || this.orders.length === 0) return 0;
    const filtered = this.getFilteredOrders();
    return filtered.filter((o) => o.workTeller?.paymentStatus === 'FullyPaid').length;
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
    return this.analyticsService.getDateRangeLabel(this.selectedDateRange);
  }

  private updateDeliveryMethodChart(): void {
    if (this.orders.length === 0) {
      this.deliveryMethodChartOption = this.createNoDataChart();
      return;
    }

    const filtered = this.getFilteredOrders();
    const methodRevenue: { [key: string]: number } = {};

    filtered.forEach((o) => {
      const method = o.deliveryMethod || 'Other';
      methodRevenue[method] = (methodRevenue[method] || 0) + o.total;
    });

    const deliveryData = Object.entries(methodRevenue)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);

    if (deliveryData.length === 0) {
      this.deliveryMethodChartOption = this.createNoDataChart();
      return;
    }

    this.deliveryMethodChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const name = params.name || 'Unknown';
          const value = params.value || 0;
          return `${name}: ₦${Number(value).toLocaleString()} (${params.percent}%)`;
        },
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: deliveryData.map((d) => d.name),
      },
      color: ['#6384ff', '#10b981', '#7c3aed'],
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
          data: deliveryData,
        },
      ],
    };
  }

  private updateOrdersPerHourChart(): void {
    if (this.orders.length === 0) {
      this.ordersPerHourChartOption = this.createNoDataChart();
      return;
    }

    const filtered = this.getFilteredOrders();
    const hourCounts = Array(24).fill(0);

    filtered.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      hourCounts[hour]++;
    });

    if (hourCounts.every((count) => count === 0)) {
      this.ordersPerHourChartOption = this.createNoDataChart();
      return;
    }

    const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

    this.ordersPerHourChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const hour = params[0].name;
            const value = params[0].value;
            return `${hour}: ${value} order${value !== 1 ? 's' : ''}`;
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
          data: hourCounts,
          itemStyle: {
            color: '#8b5cf6',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateTopCustomersChart(): void {
    if (this.orders.length === 0) {
      this.topCustomersChartOption = this.createNoDataChart();
      return;
    }

    const filtered = this.getFilteredOrders();
    const customerData: {
      [key: string]: { name: string; revenue: number; orderCount: number };
    } = {};

    filtered.forEach((o) => {
      const custId = o.workProfileId?.toString() || 'unknown';
      const custName = o.workProfile?.name || 'Unknown';

      if (!customerData[custId]) {
        customerData[custId] = {
          name: custName,
          revenue: 0,
          orderCount: 0,
        };
      }

      customerData[custId].name = custName;
      customerData[custId].revenue += o.total;
      customerData[custId].orderCount++;
    });

    const topCustomers = Object.values(customerData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    if (topCustomers.length === 0) {
      this.topCustomersChartOption = this.createNoDataChart();
      return;
    }
    const labels = topCustomers.map((c) => c.name);
    const values = topCustomers.map((c) => c.revenue);

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
            return `${name}: ₦${Number(value).toLocaleString()}`;
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
      this.revenueOverTimeChartOption = this.createNoDataChart();
      return;
    }

    const filtered = this.getFilteredOrders();

    if (filtered.length === 0) {
      this.revenueOverTimeChartOption = this.createNoDataChart();
      return;
    }

    if (
      this.useSpecificDate ||
      this.selectedDateRange === 'today' ||
      this.selectedDateRange === 'yesterday'
    ) {
      const hourlyRevenue = Array(24).fill(0);

      filtered.forEach((o) => {
        const hour = new Date(o.createdAt).getHours();
        hourlyRevenue[hour] += o.total;
      });

      if (hourlyRevenue.every((r) => r === 0)) {
        this.revenueOverTimeChartOption = this.createNoDataChart();
        return;
      }

      const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

      this.revenueOverTimeChartOption = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (Array.isArray(params) && params.length > 0) {
              const label = params[0].name;
              const value = params[0].value;
              return `${label}: ₦${Number(value).toLocaleString()}`;
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
            data: hourlyRevenue,
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
      return;
    }

    const { labels, values } = this.analyticsService.getRevenueOverTime(
      this.orders,
      this.selectedDateRange
    );

    if (labels.length === 0 || values.every((v) => v === 0)) {
      this.revenueOverTimeChartOption = this.createNoDataChart();
      return;
    }

    this.revenueOverTimeChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const label = params[0].name;
            const value = params[0].value;
            return `${label}: ₦${Number(value).toLocaleString()}`;
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

  private updateOrdersByDayChart(): void {
    if (this.orders.length === 0) {
      this.ordersByDayChartOption = this.createNoDataChart();
      return;
    }

    const filtered = this.getFilteredOrders();
    const dayCounts = Array(7).fill(0);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    filtered.forEach((o) => {
      const day = new Date(o.createdAt).getDay();
      dayCounts[day]++;
    });

    if (dayCounts.every((count) => count === 0)) {
      this.ordersByDayChartOption = this.createNoDataChart();
      return;
    }

    this.ordersByDayChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const day = params[0].name;
            const value = params[0].value;
            return `${day}: ${value} order${value !== 1 ? 's' : ''}`;
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
        data: days,
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
          data: dayCounts,
          itemStyle: {
            color: '#6384ff',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '60%',
        },
      ],
    };
  }

  private updateOrdersByTimeOfDayChart(): void {
    if (this.orders.length === 0) {
      this.ordersByTimeOfDayChartOption = this.createNoDataChart();
      return;
    }

    const filtered = this.getFilteredOrders();
    const timeSlots = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
    };

    filtered.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      if (hour >= 6 && hour < 12) {
        timeSlots.Morning++;
      } else if (hour >= 12 && hour < 18) {
        timeSlots.Afternoon++;
      } else {
        timeSlots.Evening++;
      }
    });

    const timeData = Object.entries(timeSlots).map(([name, value]) => ({ name, value }));
    const hasData = timeData.some((d) => d.value > 0);

    if (!hasData) {
      this.ordersByTimeOfDayChartOption = this.createNoDataChart();
      return;
    }

    this.ordersByTimeOfDayChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: ${params.value} order${params.value !== 1 ? 's' : ''} (${
            params.percent
          }%)`,
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: timeData.map((d) => d.name),
      },
      color: ['#10b981', '#6384ff', '#7c3aed'],
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
                return `{name|${params.name}}\n{value|${params.value} orders}\n{percent|${params.percent}%}`;
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

  exportToExcel(): void {
    try {
      const timestamp = new Date().toLocaleString();
      const dateRangeLabel =
        this.useSpecificDate && this.selectedDate
          ? new Date(this.selectedDate).toLocaleDateString()
          : this.dateRangeOptions.find((opt) => opt.value === this.selectedDateRange)?.label ||
            'All Time';

      const wb = XLSX.utils.book_new();
      const filtered = this.getFilteredOrders();

      try {
        const orderStats = this.calculateOrderStats(filtered);
        const summaryData = [
          ['FOOD ORDERS REPORT', ''],
          [],
          ['Generated', timestamp],
          ['Date Range', dateRangeLabel],
          ['Total Orders', filtered.length.toString()],
          [],
          ['ORDER SUMMARY', ''],
          ['Metric', 'Value'],
          ['Total Orders', orderStats.totalOrders.toString()],
          ['Total Revenue', `₦${orderStats.totalRevenue.toLocaleString()}`],
          ['Average Order Value', `₦${orderStats.avgOrderValue.toLocaleString()}`],
          ['Completed Orders', orderStats.completed.toString()],
          ['Pending Orders', orderStats.pending.toString()],
          [],
          ['DELIVERY BREAKDOWN', ''],
          ['Delivery Method', 'Orders', 'Revenue'],
        ];

        Object.entries(orderStats.deliveryBreakdown).forEach(([method, data]: any) => {
          summaryData.push([method, data.count.toString(), `₦${data.revenue.toLocaleString()}`]);
        });

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      } catch (e) {
        console.error('Summary sheet error:', e);
      }

      try {
        const ordersData = [
          ['ORDER DETAILS', '', '', '', '', ''],
          [],
          ['Order ID', 'Date', 'Customer', 'Delivery Method', 'Total', 'Payment Status'],
        ];

        filtered.forEach((order: any) => {
          const customerName = order.workProfile?.name || 'Unknown';
          const paymentStatus = order.workTeller?.paymentStatus || 'Unknown';
          const deliveryMethod = order.deliveryMethod || 'Unknown';
          const total = order.total || order.workTeller?.total || 0;
          const date = new Date(order.createdAt).toLocaleDateString();

          ordersData.push([
            order.id?.toString() || '',
            date,
            customerName,
            deliveryMethod,
            `₦${total.toLocaleString()}`,
            paymentStatus,
          ]);
        });

        const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
        ordersSheet['!cols'] = [
          { wch: 12 },
          { wch: 15 },
          { wch: 25 },
          { wch: 18 },
          { wch: 18 },
          { wch: 18 },
        ];
        XLSX.utils.book_append_sheet(wb, ordersSheet, 'Orders');
      } catch (e) {
        console.error('Orders sheet error:', e);
      }

      try {
        const deliveryData = this.buildDeliveryMethodBreakdown(filtered);
        const deliverySheetData = [
          ['DELIVERY METHOD BREAKDOWN', '', '', ''],
          [],
          ['Method', 'Orders', 'Revenue', 'Percentage'],
        ];

        deliveryData.forEach((item: any) => {
          deliverySheetData.push([
            item.method,
            item.count.toString(),
            `₦${item.revenue.toLocaleString()}`,
            item.percentage + '%',
          ]);
        });

        const deliverySheet = XLSX.utils.aoa_to_sheet(deliverySheetData);
        deliverySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, deliverySheet, 'Delivery Methods');
      } catch (e) {
        console.error('Delivery breakdown sheet error:', e);
      }

      try {
        const topCustomers = this.buildTopCustomers(filtered);
        const customerSheetData = [
          ['TOP CUSTOMERS', '', '', '', ''],
          [],
          ['Rank', 'Customer ID', 'Customer Name', 'Orders', 'Total Spent'],
        ];

        topCustomers.forEach((customer: any, index: number) => {
          customerSheetData.push([
            (index + 1).toString(),
            customer.customerId,
            customer.name,
            customer.orderCount.toString(),
            `₦${customer.totalSpent.toLocaleString()}`,
          ]);
        });

        const customerSheet = XLSX.utils.aoa_to_sheet(customerSheetData);
        customerSheet['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, customerSheet, 'Top Customers');
      } catch (e) {
        console.error('Top customers sheet error:', e);
      }

      try {
        const dailyData = this.buildDailyStats(filtered);
        const dailySheetData = [
          ['DAILY ORDER STATISTICS', '', '', ''],
          [],
          ['Date', 'Orders', 'Revenue', 'Average Order Value'],
        ];

        dailyData.forEach((day: any) => {
          dailySheetData.push([
            day.date,
            day.orderCount.toString(),
            `₦${day.revenue.toLocaleString()}`,
            `₦${day.avgOrderValue.toLocaleString()}`,
          ]);
        });

        const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
        dailySheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Stats');
      } catch (e) {
        console.error('Daily stats sheet error:', e);
      }

      XLSX.writeFile(wb, `food-orders-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error('Fatal error in exportToExcel:', e);
    }
  }

  private calculateOrderStats(orders: FoodOrder[]): any {
    const stats = {
      totalOrders: orders.length,
      totalRevenue: 0,
      avgOrderValue: 0,
      completed: 0,
      pending: 0,
      deliveryBreakdown: {} as any,
    };

    orders.forEach((order: any) => {
      const revenue = order.total || order.workTeller?.total || 0;
      const paymentStatus = order.workTeller?.paymentStatus || 'Unknown';
      const deliveryMethod = order.deliveryMethod || 'Unknown';

      stats.totalRevenue += revenue;

      if (paymentStatus === 'FullyPaid') {
        stats.completed++;
      } else {
        stats.pending++;
      }

      if (!stats.deliveryBreakdown[deliveryMethod]) {
        stats.deliveryBreakdown[deliveryMethod] = { count: 0, revenue: 0 };
      }
      stats.deliveryBreakdown[deliveryMethod].count++;
      stats.deliveryBreakdown[deliveryMethod].revenue += revenue;
    });

    stats.avgOrderValue =
      stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;

    return stats;
  }

  private buildDeliveryMethodBreakdown(orders: FoodOrder[]): any[] {
    const methodMap: { [key: string]: { count: number; revenue: number } } = {};
    let totalRevenue = 0;

    orders.forEach((order: any) => {
      const method = order.deliveryMethod || 'Unknown';
      const revenue = order.total || order.workTeller?.total || 0;

      if (!methodMap[method]) {
        methodMap[method] = { count: 0, revenue: 0 };
      }
      methodMap[method].count++;
      methodMap[method].revenue += revenue;
      totalRevenue += revenue;
    });

    return Object.entries(methodMap).map(([method, data]: any) => ({
      method,
      count: data.count,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(2) : '0.00',
    }));
  }

  private buildTopCustomers(orders: FoodOrder[]): any[] {
    const customerMap: {
      [key: string]: {
        name: string;
        customerId: string;
        orderCount: number;
        totalSpent: number;
      };
    } = {};

    orders.forEach((order: any) => {
      const custId = order.workProfileId?.toString() || 'unknown';
      const customerName = order.workProfile?.name || 'Unknown';
      const revenue = order.total || order.workTeller?.total || 0;

      if (!customerMap[custId]) {
        customerMap[custId] = {
          name: customerName,
          customerId: custId,
          orderCount: 0,
          totalSpent: 0,
        };
      }

      customerMap[custId].name = customerName;
      customerMap[custId].orderCount++;
      customerMap[custId].totalSpent += revenue;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }

  private buildDailyStats(orders: FoodOrder[]): any[] {
    const dayMap: {
      [key: string]: { date: string; orderCount: number; revenue: number; orders: any[] };
    } = {};

    orders.forEach((order: any) => {
      const date = new Date(order.createdAt);
      const dateStr = date.toLocaleDateString();
      const revenue = order.total || order.workTeller?.total || 0;

      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { date: dateStr, orderCount: 0, revenue: 0, orders: [] };
      }

      dayMap[dateStr].orderCount++;
      dayMap[dateStr].revenue += revenue;
      dayMap[dateStr].orders.push(order);
    });

    return Object.values(dayMap)
      .map((day) => ({
        date: day.date,
        orderCount: day.orderCount,
        revenue: day.revenue,
        avgOrderValue: day.orderCount > 0 ? Math.round(day.revenue / day.orderCount) : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
