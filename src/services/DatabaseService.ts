import { Injectable, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { retry } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

import { MAP_LIBRARY_CONFIG } from '../map/map-config.token';
import { MapLibraryConfig } from '../map/map.config';
import { ErrorService } from './error.service';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({ providedIn: 'root' })
export class DatabaseService implements OnInit {

    constructor(
        public http: HttpClient,
        private _errService: ErrorService,
        public location: Location,
        private router: Router,
        public route: ActivatedRoute,

        @Inject(MAP_LIBRARY_CONFIG) private config: MapLibraryConfig
    ) {
        this.st_user = (this.config.getUserData ? this.config.getUserData() : {}) || {};
    }

    // 🔥 REPLACED HARD-CODED HOPSER LINKS
    dbUrl = this.config.apiBaseUrl;
    uploadUrl = this.config.imageBaseUrl || '';
    downloadUrl = (this.config.imageBaseUrl || '') + 'Download_excel/';

    // everything else same
    header: any = new HttpHeaders();
    data: any;
    myProduct: any = {};
    peraluser: any = {};
    tmp;
    detail: any = {};
    counterArray: any = {};
    drArray: any = [];
    InfluenceArray: any = [];
    leadArray: any = [];
    counterArray1: any = {};
    st_user: any
    orderFilterPrimary: any = {}
    orderFilterSecondary: any = {}
    dealerListSearch: any = {}
    directDealerListSearch: any = {}
    distributorListSearch: any = {}
    login_data: any = {};
    filteredData: any = {}
    datauser: any = {};
    loading: any;
    customer_name: any;
    franchise_name: any;
    franchise_id;
    franchise_location;
    challans: any = [];
    currentUserID: any;
    pageLimit = 50;

    ngOnInit() { }

    setData(data) {
        this.filteredData = data;
    }

    getData() {
        return this.filteredData;
    }

    // 🔥 TOKEN FROM CONFIG INSTEAD OF LOCAL STORAGE
    private get token() {
        return this.config.getToken ? this.config.getToken() : '';
    }

    auth_rqust(data: any, fn: any) {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers });
    }

    fetchData(data: any, fn: any) {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers });
    }

    LogInCheck(username, password) {
        this.data = { username, password };
        return this.http.post(this.dbUrl + "/login/submitnew/", JSON.stringify(this.data),
            { headers: new HttpHeaders() });
    }

    public exportAsExcelFile(json: any[], excelFileName: string): void {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
        const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, excelFileName);
    }

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
    }

    upload_image(val, fn_name) {
        return this.http.post(this.uploadUrl + fn_name, val, {
            headers: new HttpHeaders().set('Token', 'Bearer ' + this.token)
        });
    }

    FileData(request_data: any, fn: any) {
        let headers = new HttpHeaders().set('Token', 'Bearer ' + this.token);
        return this.http.post(this.dbUrl + fn, request_data, { headers });
    }

    private extractData(res: Response) {
        const body = res;
        return body || {};
    }

    get_rqst2(request_data: any, fn: any): any {
        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Token', 'Bearer ' + this.token);

        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers });
    }

    public share_data: any;

    set_fn(val: any) {
        this.share_data = val;
    }

    get_fn() {
        return this.share_data;
    }

    chek_seission() {
        this.datauser = this.config.getUserData ? this.config.getUserData() : {};

        if (this.datauser && this.datauser.id) {
            return true;
        } else {
            this.router.navigate([''], { queryParams: { returnUrl: this.router.url } });
            return false;
        }
    }

    goBack() {
        window.history.back();
    }

    noificaton_rqst(): any {
        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Token', 'Bearer ' + this.token);

        return this.http.post(this.dbUrl + 'stockdata/getNotification',
            JSON.stringify({ login_id: this.datauser?.id }),
            { headers }).pipe(retry(3));
    }

    notifications: any = [];
    all_notifications: any = [];

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

    post_rqst(request_data: any, fn: any): any {
        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Token', 'Bearer ' + this.token);

        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers });
    }

    offFlag: any = false;
    offNotifiy: any = false;

    sendNotify(index) {
        if (this.offFlag) return;
        var e = this.notifications[index];
        if (!e) return;

        const title = e.title;
        let options = {
            body: e.message,
            icon: 'favicon.ico'
        };
    }

    numeric_Number(event: any) {
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
        this.st_user = this.config.getUserData ? this.config.getUserData() : {};

        this.post_rqst(
            { user_id: this.st_user?.id, user_type: this.st_user?.type },
            "Influencer/influencerMasterList"
        ).subscribe(r => {
            if (r) {
                this.InfluenceArray = r['result'] || r['modules'];
            }
        });
    }

    dr_list() {
        this.st_user = this.config.getUserData ? this.config.getUserData() : {};

        this.post_rqst(
            { user_id: this.st_user?.id, user_type: this.st_user?.type },
            "CustomerNetwork/distributionNetworkModule"
        ).subscribe(r => {
            if (r) {
                this.drArray = r['modules'];
            }
        });
    }
}
