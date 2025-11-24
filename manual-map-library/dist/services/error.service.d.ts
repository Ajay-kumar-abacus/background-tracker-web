import { HttpErrorResponse } from "@angular/common/http";
export declare class ErrorService {
    constructor();
    handelError(err: HttpErrorResponse): import("rxjs").Observable<never>;
}
