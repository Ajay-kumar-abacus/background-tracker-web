var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MapModule_1;
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatDialogModule } from '@angular/material';
import { MapComponent } from './map.component';
import { DatabaseService } from '../services/DatabaseService'; // <-- ADD THIS
import { MAP_LIBRARY_CONFIG } from './map-config.token'; // <-- ADD THIS
let MapModule = MapModule_1 = class MapModule {
    // This allows parent app (Hopser or Wigwaam) to pass dynamic settings
    static forRoot(config) {
        return {
            ngModule: MapModule_1,
            providers: [
                DatabaseService, // <-- ADD HERE
                { provide: MAP_LIBRARY_CONFIG, useValue: config }
            ]
        };
    }
};
MapModule = MapModule_1 = __decorate([
    NgModule({
        declarations: [
            MapComponent
        ],
        imports: [
            CommonModule,
            FormsModule,
            ReactiveFormsModule,
            MatIconModule,
            MatDialogModule
        ],
        exports: [
            MapComponent
        ]
    })
], MapModule);
export { MapModule };
