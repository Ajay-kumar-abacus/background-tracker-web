import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { retry } from 'rxjs/operators';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

import { MAP_LIBRARY_CONFIG } from '../map/map-config.token';
import { MapLibraryConfig } from '../map/map.config';

const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable()
export class DatabaseService {
  header: HttpHeaders = new HttpHeaders();

  constructor(
    private http: HttpClient,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    @Inject(MAP_LIBRARY_CONFIG) private config: MapLibraryConfig
  ) {}

  // -------------------- BASE URL HELPERS ------------------------- //

  private get baseUrl(): string {
    return this.config.apiBaseUrl;
  }

  private get uploadUrl(): string {
    return this.config.imageBaseUrl;
  }

  private get token(): string {
    return this.config.getToken ? this.config.getToken() || '' : '';
  }

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Token', 'Bearer ' + this.token);
  }

  private formHeaders(): HttpHeaders {
    return new HttpHeaders().set('Token', 'Bearer ' + this.token);
  }

  // ---------------------- BASIC REQUESTS ------------------------- //

  getRequest(endpoint: string, data?: any) {
    return this.http.post(
      this.baseUrl + endpoint,
      JSON.stringify(data || {}),
      { headers: this.jsonHeaders() }
    );
  }

  postRequest(endpoint: string, data: any) {
    return this.http.post(
      this.baseUrl + endpoint,
      JSON.stringify(data),
      { headers: this.jsonHeaders() }
    );
  }

  uploadFile(endpoint: string, formData: any) {
    return this.http.post(this.uploadUrl + endpoint, formData, {
      headers: this.formHeaders()
    });
  }

  // ----------------------- EXCEL EXPORT --------------------------- //

  exportAsExcelFile(json: any[], fileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data']
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }

  // -------------------- NOTIFICATION EXAMPLE ----------------------- //

  getNotifications() {
    return this.http
      .post(
        this.baseUrl + 'stockdata/getNotification',
        JSON.stringify({}),
        { headers: this.jsonHeaders() }
      )
      .pipe(retry(3));
  }

  // --------------------- SESSION HELPERS --------------------------- //

  goBack() {
    this.location.back();
  }
}
