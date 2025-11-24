var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DatabaseService } from './DatabaseService';
// import { DialogComponent } from '../dialog/dialog.component';
import { of } from 'rxjs';
let SessionStorage = class SessionStorage {
    constructor(route, router, db) {
        this.route = route;
        this.router = router;
        this.db = db;
        this.users = {};
        this.loginUrl = '';
        this.loading = false;
        this.ActivatedRoute = route;
    }
    ngOnInit() {
        this.users.logged = false;
        this.users.token = '';
    }
    getSe() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        return of(this.users);
    }
    logoutSession() {
        this.users = {};
        this.users.logged = false;
        this.users.token = '';
        this.db.can_active = '';
        this.db.datauser = {};
        localStorage.removeItem('users');
    }
    setSession(data) {
        this.loading = true;
        this.db.auth_rqust(data, 'auth/login')
            .subscribe((data) => {
            if (data.token) {
                this.users = data.user;
                this.users.token = data.token;
                this.users.logged = true;
                localStorage.setItem('users', JSON.stringify(this.users));
                this.loading = false;
                var home_page = '';
                if (this.users.access_level == 1) {
                    home_page = '/dashboard';
                }
                else {
                    // this.dialog.alert("info","Not Allowed ","  You'r not allowed for Login!");
                    home_page = '';
                }
                this.nextUrl = this.route.snapshot.queryParams['returnUrl'] || home_page;
                this.router.navigate([this.nextUrl]);
            }
            else {
                this.loading = false;
                this.router.navigate([this.loginUrl]);
            }
        }, error => {
            this.loading = false;
            this.router.navigate([this.loginUrl]);
        });
    }
};
SessionStorage = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [ActivatedRoute, Router, DatabaseService])
], SessionStorage);
export { SessionStorage };
