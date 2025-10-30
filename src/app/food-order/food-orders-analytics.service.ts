import { Injectable } from '@angular/core';

export interface FoodOrder {
  id: number;
  workTellerId: number;
  workProfileId: number;
  addressToDeliverToId: number | null;
  offeringDeliveryPriceId: number | null;
  total: number;
  subtotal: number;
  tax: number;
  isClosed: boolean;
  deliveryNote: string | null;
  deliveryMethod: 'Delivery' | 'Pickup';
  createdAt: string;
  dateClosed: string | null;
  workProfile: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  addressToDeliverTo?: {
    id: number;
    address: string;
    addressLabel: string;
  } | null;
  items?: Array<{
    id: number;
    quantity: number;
    price: number;
    menuItem: {
      name: string;
      description: string;
    };
  }>;
  workTeller?: {
    paymentStatus: string;
    amountPaid: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FoodOrdersAnalyticsService {
  constructor() {}

  getRevenueGrowthRate(orders: FoodOrder[], period: 'month' | 'year' = 'month'): number | null {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    if (period === 'month') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now.getFullYear(), 11, 31);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31);
    }

    const currentRevenue = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= currentStart && d <= currentEnd;
      })
      .reduce((sum, o) => sum + o.total, 0);

    const previousRevenue = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= previousStart && d <= previousEnd;
      })
      .reduce((sum, o) => sum + o.total, 0);

    if (previousRevenue === 0) return null;
    return Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);
  }

  getAverageOrderValue(orders: FoodOrder[], selectedDateRange: string): number {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, o) => sum + o.total, 0);
    return total / filtered.length;
  }

  getOrderCompletionRate(orders: FoodOrder[], selectedDateRange: string): number {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    if (filtered.length === 0) return 0;
    const completed = filtered.filter((o) => o.isClosed === true).length;
    return Math.round((completed / filtered.length) * 100);
  }

  getDeliveryPickupSplit(
    orders: FoodOrder[],
    selectedDateRange: string
  ): { delivery: number; pickup: number } {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    if (filtered.length === 0) return { delivery: 0, pickup: 0 };

    const delivery = filtered.filter((o) => o.deliveryMethod === 'Delivery').length;
    const pickup = filtered.filter((o) => o.deliveryMethod === 'Pickup').length;
    const total = filtered.length;

    return {
      delivery: Math.round((delivery / total) * 100),
      pickup: Math.round((pickup / total) * 100),
    };
  }

  getTotalUniqueCustomers(orders: FoodOrder[], selectedDateRange: string): number {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    const uniqueCustomerIds = new Set(filtered.map((o) => o.workProfileId));
    return uniqueCustomerIds.size;
  }

  getBusiestDay(orders: FoodOrder[]): string | null {
    if (orders.length === 0) return null;

    const dayCounts: { [key: string]: number } = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    orders.forEach((o) => {
      const day = days[new Date(o.createdAt).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.keys(dayCounts).reduce((a, b) => (dayCounts[a] > dayCounts[b] ? a : b));
  }

  getBusiestHour(orders: FoodOrder[]): string | null {
    if (orders.length === 0) return null;

    const hourCounts = Array(24).fill(0);
    orders.forEach((o) => hourCounts[new Date(o.createdAt).getHours()]++);

    const busiestHour = hourCounts.indexOf(Math.max(...hourCounts));
    return busiestHour.toString().padStart(2, '0') + ':00';
  }

  getRevenueByDeliveryMethod(
    orders: FoodOrder[],
    selectedDateRange: string
  ): { name: string; value: number }[] {
    const filtered = this.filterByDateRange(orders, selectedDateRange);

    const methodRevenue: { [key: string]: number } = { Delivery: 0, Pickup: 0 };
    filtered.forEach((o) => {
      methodRevenue[o.deliveryMethod] = (methodRevenue[o.deliveryMethod] || 0) + o.total;
    });

    return Object.entries(methodRevenue)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }

  getOrdersByHour(orders: FoodOrder[], selectedDateRange: string): number[] {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    const hourCounts = Array(24).fill(0);

    filtered.forEach((o) => hourCounts[new Date(o.createdAt).getHours()]++);
    return hourCounts;
  }

  getOrdersByDayOfWeek(orders: FoodOrder[], selectedDateRange: string): number[] {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    const dayCounts = Array(7).fill(0);
    filtered.forEach((o) => {
      const dayOfWeek = new Date(o.createdAt).getDay();
      dayCounts[dayOfWeek]++;
    });

    return dayCounts;
  }

  getTopCustomers(
    orders: FoodOrder[],
    selectedDateRange: string,
    limit: number = 10
  ): { name: string; revenue: number; orderCount: number }[] {
    const filtered = this.filterByDateRange(orders, selectedDateRange);

    const customerData: {
      [key: number]: { name: string; revenue: number; orderCount: number };
    } = {};

    filtered.forEach((o) => {
      if (!o.workProfile || !o.workProfile.name) {
        return;
      }

      const custId = o.workProfileId;
      if (!customerData[custId]) {
        customerData[custId] = {
          name: o.workProfile.name,
          revenue: 0,
          orderCount: 0,
        };
      }
      customerData[custId].revenue += o.total;
      customerData[custId].orderCount++;
    });

    return Object.values(customerData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  getPendingOrders(orders: FoodOrder[], selectedDateRange: string): number {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    return filtered.filter((o) => o.workTeller?.paymentStatus !== 'FullyPaid').length;
  }

  getCompletedOrders(orders: FoodOrder[], selectedDateRange: string): number {
    const filtered = this.filterByDateRange(orders, selectedDateRange);
    return filtered.filter((o) => o.workTeller?.paymentStatus === 'FullyPaid').length;
  }

  getRevenueOverTime(
    orders: FoodOrder[],
    selectedDateRange: string
  ): { labels: string[]; values: number[] } {
    const result = this.prepareChartSeries(selectedDateRange, orders);
    return { labels: result.labels, values: result.totals };
  }

  prepareChartSeries(
    range: string,
    orders: FoodOrder[]
  ): { labels: string[]; totals: number[]; lastActualDate: Date | null } {
    const now = new Date();
    let labels: string[] = [];
    let totals: number[] = [];
    let lastActualDate: Date | null = null;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    if (range === 'today' || range === 'yesterday') {
      labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
      totals = Array(24).fill(0);
      const refDate = new Date(now);
      if (range === 'yesterday') {
        refDate.setDate(now.getDate() - 1);
      }

      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        if (
          d.getDate() === refDate.getDate() &&
          d.getMonth() === refDate.getMonth() &&
          d.getFullYear() === refDate.getFullYear()
        ) {
          totals[d.getHours()] += o.total;
        }
      });
      return { labels, totals, lastActualDate };
    }

    const lastNDays = { last7Days: 8, last14Days: 15, last30Days: 31 } as const;
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
        const dayOrders = orders.filter((o) => {
          const od = new Date(o.createdAt);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        });
        return dayOrders.reduce((sum, o) => sum + o.total, 0);
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
        const dayOrders = orders.filter((o) => {
          const od = new Date(o.createdAt);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        });
        return dayOrders.reduce((sum, o) => sum + o.total, 0);
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
        const dayOrders = orders.filter((o) => {
          const od = new Date(o.createdAt);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        });
        return dayOrders.reduce((sum, o) => sum + o.total, 0);
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
        const monthOrders = orders.filter((o) => {
          const d = new Date(o.createdAt);
          return d.getFullYear() === qYear && d.getMonth() === monthIndex;
        });
        labels.push(
          new Date(qYear, monthIndex).toLocaleString(undefined, { month: 'short', year: 'numeric' })
        );
        totals.push(monthOrders.reduce((sum, o) => sum + o.total, 0));
      }
      return { labels, totals, lastActualDate };
    }

    if (range === 'last2Months') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const targetMonth = currentMonth - 2;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;

      const startDate = new Date(targetYear, adjustedMonth, 1);
      const endDate = new Date(targetYear, adjustedMonth + 1, 0);

      const days: Date[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }

      labels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      totals = days.map((d) => {
        const dayOrders = orders.filter((o) => {
          const od = new Date(o.createdAt);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        });
        return dayOrders.reduce((sum, o) => sum + o.total, 0);
      });
      lastActualDate = endDate;
      return { labels, totals, lastActualDate };
    }

    if (['last60Days', 'last90Days'].includes(range)) {
      const n = range === 'last60Days' ? 60 : 90;
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - n + 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const weeks: { start: Date; end: Date }[] = [];
      let currentStart = new Date(startDate);

      while (currentStart <= endDate) {
        const weekEnd = new Date(currentStart);
        weekEnd.setDate(currentStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        weeks.push({
          start: new Date(currentStart),
          end: weekEnd <= endDate ? weekEnd : new Date(endDate),
        });

        currentStart.setDate(currentStart.getDate() + 7);
      }

      labels = weeks.map(
        ({ start, end }) =>
          `${start.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      );

      totals = weeks.map(({ start, end }) =>
        orders.reduce((sum, o) => {
          const od = new Date(o.createdAt);
          return od >= start && od <= end ? sum + o.total : sum;
        }, 0)
      );

      lastActualDate = weeks[weeks.length - 1].end;
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisYear' || range === 'lastYear') {
      let y = range === 'thisYear' ? now.getFullYear() : now.getFullYear() - 1;
      labels = [];
      totals = [];
      for (let m = 0; m < 12; m++) {
        const monthOrders = orders.filter((o) => {
          const d = new Date(o.createdAt);
          return d.getFullYear() === y && d.getMonth() === m;
        });
        labels.push(new Date(y, m).toLocaleString(undefined, { month: 'short', year: 'numeric' }));
        totals.push(monthOrders.reduce((sum, o) => sum + o.total, 0));
      }
      return { labels, totals, lastActualDate };
    }

    if (range === 'thisWeek' || range === 'lastWeek') {
      const monday = getMonday(now);
      if (range === 'lastWeek') {
        monday.setDate(monday.getDate() - 7);
      }

      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      });

      totals = Array(7).fill(0);
      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        for (let i = 0; i < 7; i++) {
          const currLabelDate = new Date(monday);
          currLabelDate.setDate(monday.getDate() + i);
          if (
            d.getFullYear() === currLabelDate.getFullYear() &&
            d.getMonth() === currLabelDate.getMonth() &&
            d.getDate() === currLabelDate.getDate()
          ) {
            totals[i] += o.total;
          }
        }
      });
      return { labels, totals, lastActualDate };
    }

    if (range === 'allTime') {
      const years = orders.map((o) => new Date(o.createdAt).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      labels = [];
      totals = [];
      for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
          const monthOrders = orders.filter((o) => {
            const d = new Date(o.createdAt);
            return d.getFullYear() === y && d.getMonth() === m;
          });
          if (monthOrders.length) {
            labels.push(
              new Date(y, m).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
            );
            totals.push(monthOrders.reduce((sum, o) => sum + o.total, 0));
          }
        }
      }
      return { labels, totals, lastActualDate };
    }

    return { labels: [], totals: [], lastActualDate };
  }

  getMostPopularMenuItems(
    orders: FoodOrder[],
    selectedDateRange: string,
    limit: number = 10
  ): { name: string; quantity: number; revenue: number }[] {
    const filtered = this.filterByDateRange(orders, selectedDateRange);

    const itemData: {
      [key: string]: { name: string; quantity: number; revenue: number };
    } = {};

    filtered.forEach((o) => {
      if (!o.items || !Array.isArray(o.items) || o.items.length === 0) {
        return;
      }

      o.items.forEach((item) => {
        if (!item || !item.menuItem || !item.menuItem.name) {
          return;
        }

        const itemName = item.menuItem.name;
        const quantity = item.quantity || 0;
        const price = item.price || 0;

        if (!itemData[itemName]) {
          itemData[itemName] = {
            name: itemName,
            quantity: 0,
            revenue: 0,
          };
        }
        itemData[itemName].quantity += quantity;
        itemData[itemName].revenue += price * quantity;
      });
    });

    const result = Object.values(itemData);
    if (result.length === 0) {
      return [];
    }

    return result.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }

  public filterByDateRange(orders: FoodOrder[], selectedDateRange: string): FoodOrder[] {
    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    switch (selectedDateRange) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;

      case 'yesterday':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'thisWeek': {
        const monday = getMonday(now);
        periodStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      }

      case 'lastWeek': {
        const monday = getMonday(now);
        const lastMonday = new Date(monday);
        lastMonday.setDate(monday.getDate() - 7);
        periodStart = lastMonday;
        periodEnd = new Date(monday);
        break;
      }

      case 'last7Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;

      case 'last14Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;

      case 'last30Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;

      case 'last60Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        break;

      case 'last90Days':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
        break;

      case 'last2Months': {
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        periodStart = twoMonthsAgo;
        periodEnd = new Date(
          twoMonthsAgo.getFullYear(),
          twoMonthsAgo.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      }

      case 'thisMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;

      case 'lastMonth':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;

      case 'thisQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = quarter * 3;
        periodStart = new Date(now.getFullYear(), quarterStartMonth, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      }

      case 'lastQuarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const lastQuarterStartMonth = quarter === 0 ? 9 : (quarter - 1) * 3;
        const lastQuarterYear = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        periodStart = new Date(lastQuarterYear, lastQuarterStartMonth, 1);
        periodEnd = new Date(lastQuarterYear, lastQuarterStartMonth + 3, 0, 23, 59, 59);
        break;
      }

      case 'thisYear':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;

      case 'lastYear':
        periodStart = new Date(now.getFullYear() - 1, 0, 1);
        periodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;

      case 'allTime':
        periodStart = new Date(-8640000000000000);
        periodEnd = new Date(8640000000000000);
        break;

      default:
        return orders;
    }

    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= periodStart && d <= periodEnd;
    });
  }

  getMetricGrowth(
    orders: FoodOrder[],
    currentRange: string,
    metric: 'revenue' | 'orders' | 'aov'
  ): { current: number; previous: number; percentChange: number | null } {
    const current = new Date();
    let previousRange: string;

    switch (currentRange) {
      case 'today':
        previousRange = 'yesterday';
        break;
      case 'yesterday':
        const twoDaysAgo = new Date(current);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const threeDaysAgo = new Date(current);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return this.calculateGrowthBetweenDates(orders, twoDaysAgo, threeDaysAgo, metric);
      case 'thisWeek':
        previousRange = 'lastWeek';
        break;
      case 'thisMonth':
        previousRange = 'lastMonth';
        break;
      case 'last7Days':
        const prev7Start = new Date(current);
        prev7Start.setDate(prev7Start.getDate() - 14);
        const prev7End = new Date(current);
        prev7End.setDate(prev7End.getDate() - 8);
        return this.calculateGrowthBetweenDates(orders, prev7End, prev7Start, metric);
      case 'last30Days':
        const prev30Start = new Date(current);
        prev30Start.setDate(prev30Start.getDate() - 60);
        const prev30End = new Date(current);
        prev30End.setDate(prev30End.getDate() - 31);
        return this.calculateGrowthBetweenDates(orders, prev30End, prev30Start, metric);
      default:
        return { current: 0, previous: 0, percentChange: null };
    }

    const currentFiltered = this.filterByDateRange(orders, currentRange);
    const previousFiltered = this.filterByDateRange(orders, previousRange);

    const currentValue = this.getMetricValue(currentFiltered, metric);
    const previousValue = this.getMetricValue(previousFiltered, metric);

    const percentChange =
      previousValue === 0 ? null : ((currentValue - previousValue) / previousValue) * 100;

    return { current: currentValue, previous: previousValue, percentChange };
  }

  private calculateGrowthBetweenDates(
    orders: FoodOrder[],
    endDate: Date,
    startDate: Date,
    metric: 'revenue' | 'orders' | 'aov'
  ): { current: number; previous: number; percentChange: number | null } {
    const filtered = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
    const value = this.getMetricValue(filtered, metric);
    return { current: 0, previous: value, percentChange: null };
  }

  private getMetricValue(orders: FoodOrder[], metric: 'revenue' | 'orders' | 'aov'): number {
    if (metric === 'revenue') {
      return orders.reduce((sum, o) => sum + o.total, 0);
    } else if (metric === 'orders') {
      return orders.length;
    } else {
      const total = orders.reduce((sum, o) => sum + o.total, 0);
      return orders.length === 0 ? 0 : total / orders.length;
    }
  }

  getOrdersByTimeOfDay(
    orders: FoodOrder[],
    selectedDateRange: string
  ): { name: string; value: number }[] {
    const filtered = this.filterByDateRange(orders, selectedDateRange);

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

    return Object.entries(timeSlots).map(([name, value]) => ({ name, value }));
  }

  getDateRangeLabel(selectedDateRange: string): string {
    const options: { [key: string]: string } = {
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      lastWeek: 'Last Week',
      last7Days: 'Last 7 Days',
      last14Days: 'Last 14 Days',
      last30Days: 'Last 30 Days',
      last60Days: 'Last 60 Days',
      last90Days: 'Last 90 Days',
      last2Months: 'Last 2 Months',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisQuarter: 'This Quarter',
      lastQuarter: 'Last Quarter',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      allTime: 'All Time',
    };
    return options[selectedDateRange] || '';
  }
}
