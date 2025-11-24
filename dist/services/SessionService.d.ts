import { OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DatabaseService } from './DatabaseService';
import { Observable } from 'rxjs';
export declare class SessionStorage implements OnInit {
    private route;
    private router;
    db: DatabaseService;
    users: any;
    nextUrl: any;
    loginUrl: any;
    ActivatedRoute: any;
    loading: any;
    constructor(route: ActivatedRoute, router: Router, db: DatabaseService);
    ngOnInit(): void;
    getSe(): Observable<any>;
    logoutSession(): void;
    setSession(data: any): void;
}
