import { Injectable } from '@angular/core';
import {HttpErrorResponse } from "@angular/common/http";
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor() { }

  handelError(err: HttpErrorResponse){
    if(!err.error || !err.error.error){
      return throwError('unknown')
    }
    else{
      return throwError(err.error.error)
    }
  }
}
