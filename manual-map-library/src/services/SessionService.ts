import { Injectable, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DatabaseService } from './DatabaseService';
// import { DialogComponent } from '../dialog/dialog.component';
import { Observable, of } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class SessionStorage implements OnInit {
    users: any = {};
    nextUrl: any;
    loginUrl: any = '';
    ActivatedRoute: any;
    loading: any = false;

    constructor(private route: ActivatedRoute, private router: Router, public db: DatabaseService) {
        this.ActivatedRoute = route;
    }

    ngOnInit() {
        this.users.logged = false;
        this.users.token = '';
    }

    getSe(): Observable<any> {
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

    setSession(data: any) {
        this.loading = true;
        this.db.auth_rqust(data, 'auth/login')
            .subscribe((data: any) => {
                if (data.token) {
                    this.users = data.user;
                    this.users.token = data.token;
                    this.users.logged = true;
                    localStorage.setItem('users', JSON.stringify(this.users));

                    this.loading = false;

                    var home_page = '';
                    if (this.users.access_level == 1) {
                        home_page = '/dashboard';

                    } else {
                        // this.dialog.alert("info","Not Allowed ","  You'r not allowed for Login!");
                        home_page = '';


                    }


                    this.nextUrl = this.route.snapshot.queryParams['returnUrl'] || home_page;

                    this.router.navigate([this.nextUrl]);


                } else {
                    this.loading = false;
                
                    this.router.navigate([this.loginUrl]);
                }
            }, error => {
                this.loading = false;
             
                this.router.navigate([this.loginUrl]);
            });
    }

}
