var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { retry } from 'rxjs/operators';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { MAP_LIBRARY_CONFIG } from '../map/map-config.token';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
let DatabaseService = class DatabaseService {
    constructor(http, router, location, route, config) {
        this.http = http;
        this.router = router;
        this.location = location;
        this.route = route;
        this.config = config;
        this.header = new HttpHeaders();
    }
    // -------------------- BASE URL HELPERS ------------------------- //
    get baseUrl() {
        return this.config.apiBaseUrl;
    }
    get uploadUrl() {
        return this.config.imageBaseUrl;
    }
    get token() {
        return this.config.getToken ? this.config.getToken() || '' : '';
    }
    jsonHeaders() {
        return new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Token', 'Bearer ' + this.token);
    }
    formHeaders() {
        return new HttpHeaders().set('Token', 'Bearer ' + this.token);
    }
    // ---------------------- BASIC REQUESTS ------------------------- //
    getRequest(endpoint, data) {
        return this.http.post(this.baseUrl + endpoint, JSON.stringify(data || {}), { headers: this.jsonHeaders() });
    }
    post_rqst(endpoint, data) {
        return this.http.post(this.baseUrl + endpoint, JSON.stringify(data), { headers: this.jsonHeaders() });
    }
    uploadFile(endpoint, formData) {
        return this.http.post(this.uploadUrl + endpoint, formData, {
            headers: this.formHeaders()
        });
    }
    // ----------------------- EXCEL EXPORT --------------------------- //
    exportAsExcelFile(json, fileName) {
        const worksheet = XLSX.utils.json_to_sheet(json);
        const workbook = {
            Sheets: { data: worksheet },
            SheetNames: ['data']
        };
        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });
        this.saveAsExcelFile(excelBuffer, fileName);
    }
    saveAsExcelFile(buffer, fileName) {
        const data = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
    }
    // -------------------- NOTIFICATION EXAMPLE ----------------------- //
    getNotifications() {
        return this.http
            .post(this.baseUrl + 'stockdata/getNotification', JSON.stringify({}), { headers: this.jsonHeaders() })
            .pipe(retry(3));
    }
    // --------------------- SESSION HELPERS --------------------------- //
    goBack() {
        this.location.back();
    }
};
DatabaseService = __decorate([
    Injectable(),
    __param(4, Inject(MAP_LIBRARY_CONFIG)),
    __metadata("design:paramtypes", [typeof (_a = typeof HttpClient !== "undefined" && HttpClient) === "function" ? _a : Object, typeof (_b = typeof Router !== "undefined" && Router) === "function" ? _b : Object, typeof (_c = typeof Location !== "undefined" && Location) === "function" ? _c : Object, typeof (_d = typeof ActivatedRoute !== "undefined" && ActivatedRoute) === "function" ? _d : Object, Object])
], DatabaseService);
export { DatabaseService };
