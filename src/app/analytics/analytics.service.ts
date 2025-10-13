// analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WorkTeller {
  id: number;
  workTellerType: string;
  total: number;
  amountPaid: number;
  date: string;
  createdAt: string;
  paymentStatus: string;
  uniqueIdentifier: string;
}

export interface ApiResponse {
  message: string;
  data: { data: WorkTeller[]; totalCount: number };
  statusCode: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private apiUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<WorkTeller[]> {
    return this.http.get<ApiResponse>(this.apiUrl).pipe(map((res) => res.data.data));
  }
}
