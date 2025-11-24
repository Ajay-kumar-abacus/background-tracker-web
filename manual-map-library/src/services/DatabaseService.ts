import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { retry, catchError, retryWhen, delay, scan } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
// import { DialogComponent } from 'src/app/dialog.component';
import { Observable } from 'rxjs';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { componentRefresh } from '@angular/core/src/render3/instructions';
// import { DatePikerFormat } from 'src/_Pipes/DatePikerFormat.pipe';
import { ErrorService } from './error.service';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({ providedIn: 'root' })
export class DatabaseService implements OnInit {
    page_limit: any;
    PostRequest(arg0: { filter: any; }, arg1: string) {
        throw new Error('Method not implemented.');
    }


    // build command:-  npm run ng-high-memory//




    // <------------------ Live Link ------------------------------>
    dbUrl = "https://hosperelectrical.basiq360.com/api/index.php/";
    uploadUrl = "https://hosperelectrical.basiq360.com/api/uploads/";
    downloadUrl = "https://hosperelectrical.basiq360.com/api/uploads/Download_excel/";




     // <------------------ Dev Link ------------------------------>
    // dbUrl = "https://dev.basiq360.com/hosper_electrical/api/index.php/";
    // uploadUrl = "https://dev.basiq360.com/hosper_electrical/api/uploads/";
    // downloadUrl = "https://dev.basiq360.com/hosper_electrical/api/uploads/Download_excel/";


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
    constructor(public http: HttpClient, private _errService: ErrorService, public location: Location, private router: Router, public route: ActivatedRoute,) {
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
    auth_rqust(data: any, fn: any) {
        this.header.append('Content-Type', 'application/json');
        // this.count_list();
        // this.dr_list();
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers: this.header })
    }
    pickerFormat(val, format: any = 'Y-M-D') {
        // if (val) return new DatePikerFormat().transform(val, format);
    }
    fetchData(data: any, fn: any) {
        this.header.append('Content-Type', 'application/json');
        return this.http.post(this.dbUrl + fn, JSON.stringify(data), { headers: this.header })
    }
    can_active: any = "";
    LogInCheck(username, password) {
        this.data = { username, password };
        return this.http.post(this.dbUrl + "/login/submitnew/", JSON.stringify(this.data), { headers: this.header });
    }

    public exportAsExcelFile(json: any[], excelFileName: string): void {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
        const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, excelFileName);
    }
    private saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], {
            type: EXCEL_TYPE
        });
        FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
    }


    upload_image(val, fn_name) {
        return this.http.post(this.dbUrl + fn_name, val, { headers: this.header });

    }
    FileData(request_data: any, fn: any) {
        this.header.append('Content-Type', undefined);
        let headers;
        headers = this.header.set('Token', 'Bearer ' + this.st_user.token);
        return this.http.post(this.dbUrl + fn, request_data, { headers: headers });
    }













    private extractData(res: Response) {
        const body = res;
        return body || {};
    }














    get_rqst2(request_data: any, fn: any): any {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        headers = headers.set('Token', 'Bearer ' + this.datauser.token);
        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers: this.header })
    }



    // get_rqst3(request_data: any, fn: any): any {
    //     let headers = new HttpHeaders().set('Content-Type', 'application/json');
    //     headers = headers.set('Token', 'Bearer ' + this.datauser.token);
    //     return this.http.get(this.myurl2 + fn, { headers: headers });
    // }

    public share_data: any;

    set_fn(val: any) {
        this.share_data = val;
    }

    get_fn() {
        return this.share_data;
    }



    chek_seission() {
        this.datauser = JSON.parse(localStorage.getItem('users')) || {};
        if (this.datauser.id) {
            return true;
        } else {
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


    noificaton_rqst(): any {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        headers = headers.set('Token', 'Bearer ' + this.datauser.token);
        return this.http.post(this.dbUrl + 'stockdata/getNotification', JSON.stringify({ 'login_id': this.datauser.id }), { headers: headers }).
            pipe(
                retry(3),
            );
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
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        headers = headers.set('Token', 'Bearer ' + this.st_user.token);
        return this.http.post(this.dbUrl + fn, JSON.stringify(request_data), { headers: headers })

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
        }

    }

    crypto(val, mode: any = true) {
        // if (val) return new Crypto().transform(val, mode);
        // else return '';
    }





    numeric_Number(event: any) {
        const pattern = /[0-9\+\-\ ]/;
        let inputChar = String.fromCharCode(event.charCode);
        if (event.keyCode != 8 && !pattern.test(inputChar)) {
            event.preventDefault();
        }
    }


    count_list() {
        this.st_user = JSON.parse(localStorage.getItem('st_user')) || [];
        if (this.st_user.data) {
            this.login_data = this.st_user.data
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
}
