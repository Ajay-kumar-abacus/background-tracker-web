import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatDialogModule } from '@angular/material';

import { MapComponent } from './map.component';

import { DatabaseService } from '../services/DatabaseService';   // <-- ADD THIS
import { MAP_LIBRARY_CONFIG } from './map-config.token';         // <-- ADD THIS
import { MapLibraryConfig } from './map.config';                 // <-- ADD THIS

@NgModule({
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
export class MapModule {

  // This allows parent app (Hopser or Wigwaam) to pass dynamic settings
  static forRoot(config: MapLibraryConfig): ModuleWithProviders<MapModule> {
    return {
      ngModule: MapModule,
      providers: [
        DatabaseService,                                // <-- ADD HERE
        { provide: MAP_LIBRARY_CONFIG, useValue: config }
      ]
    };
  }
}
