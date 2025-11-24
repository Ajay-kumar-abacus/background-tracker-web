var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { retry } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
// import { DatePikerFormat } from 'src/_Pipes/DatePikerFormat.pipe';
import { ErrorService } from './error.service';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
let DatabaseService = class DatabaseService {
    PostRequest(arg0, arg1) {
        throw new Error('Method not implemented.');
    }
    constructor(http, _errService, location, router, route) {
        this.http = http;
        this._errService = _errService;
        this.location = location;
        this.router = router;
        this.route = route;
        // build command:-  npm run ng-high-memory//
        // <------------------ Live Link ------------------------------>
        this.dbUrl = "https://hosperelectrical.basiq360.com/api/index.php/";
        this.uploadUrl = "https://hosperelectrical.basiq360.com/api/uploads/";
        this.downloadUrl = "https://hosperelectrical.basiq360.com/api/uploads/Download_excel/";
        // <------------------ Dev Link ------------------------------>
        // dbUrl = "https://dev.basiq360.com/hosper_electrical/api/index.php/";
        // uploadUrl = "https://dev.basiq360.com/hosper_electrical/api/uploads/";
        // downloadUrl = "https://dev.basiq360.com/hosper_electrical/api/uploads/Download_excel/";
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
        this.can_active = "";
        this.notifications = [];
        this.all_notifications = [];
        this.offFlag = false;
        this.offNotifiy = false;
        this.st_user = JSON.parse(localStorage.getItem('st_user')) || [];
    }
    ngOnInit() { }
    setData(data) {
        this.filteredData = data;
    }
    getData() {
        return this.filteredData;
    }
    // **Login fetch data start** ///
    auth_rqust(data, fn) {
        this.header.append('Content-Type', 'application/json');
        // this.count_list();
        // this.dr_list();
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers: this.header });
    }
    pickerFormat(val, format = 'Y-M-D') {
        // if (val) return new DatePikerFormat().transform(val, format);
    }
    fetchData(data, fn) {
        this.header.append('Content-Type', 'application/json');
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers: this.header });
    }
    LogInCheck(username, password) {
        this.data = { username, password };
        return this.http.post(this.dbUrl + "/login/submitnew/", JSON.stringify(this.data), { headers: this.header });
    }
    exportAsExcelFile(json, excelFileName) {
        const worksheet = XLSX.utils.json_to_sheet(json);
        const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, excelFileName);
    }
    saveAsExcelFile(buffer, fileName) {
        const data = new Blob([buffer], {
            type: EXCEL_TYPE
        });
        FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
    }
    upload_image(val, fn_name) {
        return this.http.post(this.dbUrl + fn_name, val, { headers: this.header });
    }
    FileData(request_data, fn) {
        this.header.append('Content-Type', undefined);
        let headers;
        headers = this.header.set('Token', 'Bearer ' + this.st_user.token);
        return this.http.post(this.dbUrl + fn, request_data, { headers: headers });
    }
    extractData(res) {
        const body = res;
        return body || {};
    }
    get_rqst2(request_data, fn) {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        headers = headers.set('Token', 'Bearer ' + this.datauser.token);
        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers: this.header });
    }
    set_fn(val) {
        this.share_data = val;
    }
    get_fn() {
        return this.share_data;
    }
    chek_seission() {
        this.datauser = JSON.parse(localStorage.getItem('users')) || {};
        if (this.datauser.id) {
            return true;
        }
        else {
            // this.dialog.error("You'r session logged out ! Please Login agian");
            // this.dialog.alert("info","Session Logged Out","You'r session logged out ! Please Login agian");
            this.router.navigate([''], { queryParams: { returnUrl: this.router.url } });
            return false;
        }
    }
    // crypto(val, mode:any = true){
    //     if(val) return new Crypto().transform( val, mode);
    //     else return '';
    // }
    // pickerFormat(val, format:any = 'Y-M-D'){
    //     if(val) return new DatePikerFormat().transform( val, format);
    // }
    goBack() {
        window.history.back();
    }
    noificaton_rqst() {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        headers = headers.set('Token', 'Bearer ' + this.datauser.token);
        return this.http.post(this.dbUrl + 'stockdata/getNotification', JSON.stringify({ 'login_id': this.datauser.id }), { headers: headers }).
            pipe(retry(3));
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
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        headers = headers.set('Token', 'Bearer ' + this.st_user.token);
        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers: headers });
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
    crypto(val, mode = true) {
        // if (val) return new Crypto().transform(val, mode);
        // else return '';
    }
    numeric_Number(event) {
        const pattern = /[0-9\+\-\ ]/;
        let inputChar = String.fromCharCode(event.charCode);
        if (event.keyCode != 8 && !pattern.test(inputChar)) {
            event.preventDefault();
        }
    }
    count_list() {
        this.st_user = JSON.parse(localStorage.getItem('st_user')) || [];
        if (this.st_user.data) {
            this.login_data = this.st_user.data;
            this.post_rqst({}, "Left_Navigation/left_navigation_counter").subscribe(r => {
                if (r) {
                    this.counterArray = r['data'];
                }
                else {
                }
            });
        }
        else {
            this.post_rqst({}, "Left_Navigation/left_navigation_counter").subscribe(r => {
                if (r) {
                    this.counterArray = r['data'];
                }
                else {
                }
            });
        }
    }
    influencer_netwrk() {
        this.st_user = JSON.parse(localStorage.getItem('st_user')) || [];
        if (this.st_user.data) {
            this.login_data = this.st_user.data;
            this.post_rqst({ 'user_id': this.login_data.id, 'user_type': this.login_data.type }, "Influencer/influencerMasterList").subscribe(r => {
                if (r) {
                    this.InfluenceArray = r['result'];
                }
            });
        }
        else {
            this.post_rqst({ 'user_id': this.login_data.id, 'user_type': this.login_data.type }, "Influencer/influencerMasterList").subscribe(r => {
                if (r) {
                    this.InfluenceArray = r['modules'];
                }
            });
        }
    }
    dr_list() {
        this.st_user = JSON.parse(localStorage.getItem('st_user')) || [];
        if (this.st_user.data) {
            this.login_data = this.st_user.data;
            this.post_rqst({ 'user_id': this.login_data.id, 'user_type': this.login_data.type }, "CustomerNetwork/distributionNetworkModule").subscribe(r => {
                if (r) {
                    this.drArray = r['modules'];
                }
                else {
                }
            });
        }
        else {
            this.post_rqst({ 'user_id': this.login_data.id, 'user_type': this.login_data.type }, "CustomerNetwork/distributionNetworkModule").subscribe(r => {
                if (r) {
                    this.drArray = r['modules'];
                }
                else {
                }
            });
        }
    }
};
DatabaseService = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [typeof (_a = typeof HttpClient !== "undefined" && HttpClient) === "function" ? _a : Object, ErrorService, typeof (_b = typeof Location !== "undefined" && Location) === "function" ? _b : Object, typeof (_c = typeof Router !== "undefined" && Router) === "function" ? _c : Object, typeof (_d = typeof ActivatedRoute !== "undefined" && ActivatedRoute) === "function" ? _d : Object])
], DatabaseService);
export { DatabaseService };
