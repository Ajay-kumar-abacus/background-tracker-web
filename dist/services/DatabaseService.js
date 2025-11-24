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
import { retry } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { MAP_LIBRARY_CONFIG } from '../map/map-config.token';
import { ErrorService } from './error.service';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
let DatabaseService = class DatabaseService {
    constructor(http, _errService, location, router, route, config) {
        this.http = http;
        this._errService = _errService;
        this.location = location;
        this.router = router;
        this.route = route;
        this.config = config;
        // 🔥 REPLACED HARD-CODED HOPSER LINKS
        this.dbUrl = this.config.apiBaseUrl;
        this.uploadUrl = this.config.imageBaseUrl || '';
        this.downloadUrl = (this.config.imageBaseUrl || '') + 'Download_excel/';
        // everything else same
        this.header = new HttpHeaders();
        this.myProduct = {};
        this.peraluser = {};
        this.detail = {};
        this.counterArray = {};
        this.drArray = [];
        this.InfluenceArray = [];
        this.leadArray = [];
        this.counterArray1 = {};
        this.orderFilterPrimary = {};
        this.orderFilterSecondary = {};
        this.dealerListSearch = {};
        this.directDealerListSearch = {};
        this.distributorListSearch = {};
        this.login_data = {};
        this.filteredData = {};
        this.datauser = {};
        this.challans = [];
        this.pageLimit = 50;
        this.notifications = [];
        this.all_notifications = [];
        this.offFlag = false;
        this.offNotifiy = false;
        this.st_user = (this.config.getUserData ? this.config.getUserData() : {}) || {};
    }
    ngOnInit() { }
    setData(data) {
        this.filteredData = data;
    }
    getData() {
        return this.filteredData;
    }
    // 🔥 TOKEN FROM CONFIG INSTEAD OF LOCAL STORAGE
    get token() {
        return this.config.getToken ? this.config.getToken() : '';
    }
    auth_rqust(data, fn) {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers });
    }
    fetchData(data, fn) {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers });
    }
    LogInCheck(username, password) {
        this.data = { username, password };
        return this.http.post(this.dbUrl + "/login/submitnew/", JSON.stringify(this.data), { headers: new HttpHeaders() });
    }
    exportAsExcelFile(json, excelFileName) {
        const worksheet = XLSX.utils.json_to_sheet(json);
        const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, excelFileName);
    }
    saveAsExcelFile(buffer, fileName) {
        const data = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
    }
    upload_image(val, fn_name) {
        return this.http.post(this.uploadUrl + fn_name, val, {
            headers: new HttpHeaders().set('Token', 'Bearer ' + this.token)
        });
    }
    FileData(request_data, fn) {
        let headers = new HttpHeaders().set('Token', 'Bearer ' + this.token);
        return this.http.post(this.dbUrl + fn, request_data, { headers });
    }
    extractData(res) {
        const body = res;
        return body || {};
    }
    get_rqst2(request_data, fn) {
        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Token', 'Bearer ' + this.token);
        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers });
    }
    set_fn(val) {
        this.share_data = val;
    }
    get_fn() {
        return this.share_data;
    }
    chek_seission() {
        this.datauser = this.config.getUserData ? this.config.getUserData() : {};
        if (this.datauser && this.datauser.id) {
            return true;
        }
        else {
            this.router.navigate([''], { queryParams: { returnUrl: this.router.url } });
            return false;
        }
    }
    goBack() {
        window.history.back();
    }
    noificaton_rqst() {
        var _a;
        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Token', 'Bearer ' + this.token);
        return this.http.post(this.dbUrl + 'stockdata/getNotification', JSON.stringify({ login_id: (_a = this.datauser) === null || _a === void 0 ? void 0 : _a.id }), { headers }).pipe(retry(3));
    }
    noificaton() {
        this.noificaton_rqst().subscribe(d => {
            this.all_notifications = d.notifications;
            if (d.notify.length > 0 && !this.offNotifiy) {
                this.offFlag = false;
                this.notifications = d.notify;
                this.sendNotify(0);
            }
        });
    }
    post_rqst(request_data, fn) {
        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Token', 'Bearer ' + this.token);
        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers });
    }
    sendNotify(index) {
        if (this.offFlag)
            return;
        var e = this.notifications[index];
        if (!e)
            return;
        const title = e.title;
        let options = {
            body: e.message,
            icon: 'favicon.ico'
        };
    }
    numeric_Number(event) {
        const pattern = /[0-9\+\-\ ]/;
        let inputChar = String.fromCharCode(event.charCode);
        if (event.keyCode != 8 && !pattern.test(inputChar)) {
            event.preventDefault();
        }
    }
    count_list() {
        this.st_user = this.config.getUserData ? this.config.getUserData() : {};
        if (this.st_user.data) {
            this.login_data = this.st_user.data;
        }
        this.post_rqst({}, "Left_Navigation/left_navigation_counter").subscribe(r => {
            if (r) {
                this.counterArray = r['data'];
            }
        });
    }
    influencer_netwrk() {
        var _a, _b;
        this.st_user = this.config.getUserData ? this.config.getUserData() : {};
        this.post_rqst({ user_id: (_a = this.st_user) === null || _a === void 0 ? void 0 : _a.id, user_type: (_b = this.st_user) === null || _b === void 0 ? void 0 : _b.type }, "Influencer/influencerMasterList").subscribe(r => {
            if (r) {
                this.InfluenceArray = r['result'] || r['modules'];
            }
        });
    }
    dr_list() {
        var _a, _b;
        this.st_user = this.config.getUserData ? this.config.getUserData() : {};
        this.post_rqst({ user_id: (_a = this.st_user) === null || _a === void 0 ? void 0 : _a.id, user_type: (_b = this.st_user) === null || _b === void 0 ? void 0 : _b.type }, "CustomerNetwork/distributionNetworkModule").subscribe(r => {
            if (r) {
                this.drArray = r['modules'];
            }
        });
    }
};
DatabaseService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(5, Inject(MAP_LIBRARY_CONFIG)),
    __metadata("design:paramtypes", [typeof (_a = typeof HttpClient !== "undefined" && HttpClient) === "function" ? _a : Object, ErrorService, typeof (_b = typeof Location !== "undefined" && Location) === "function" ? _b : Object, typeof (_c = typeof Router !== "undefined" && Router) === "function" ? _c : Object, typeof (_d = typeof ActivatedRoute !== "undefined" && ActivatedRoute) === "function" ? _d : Object, Object])
], DatabaseService);
export { DatabaseService };
