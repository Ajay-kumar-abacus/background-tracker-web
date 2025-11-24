import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MapLibraryConfig } from '../map/map.config';
export declare class DatabaseService {
    private http;
    private router;
    private location;
    private route;
    private config;
    header: HttpHeaders;
    constructor(http: HttpClient, router: Router, location: Location, route: ActivatedRoute, config: MapLibraryConfig);
    private get baseUrl();
    private get uploadUrl();
    private get token();
    private jsonHeaders;
    private formHeaders;
    getRequest(endpoint: string, data?: any): any;
    post_rqst(endpoint: string, data: any): any;
    uploadFile(endpoint: string, formData: any): any;
    exportAsExcelFile(json: any[], fileName: string): void;
    private saveAsExcelFile;
    getNotifications(): any;
    goBack(): void;
}
