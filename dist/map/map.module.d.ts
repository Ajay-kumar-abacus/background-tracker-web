import { ModuleWithProviders } from '@angular/core';
import { MapLibraryConfig } from './map.config';
export declare class MapModule {
    static forRoot(config: MapLibraryConfig): ModuleWithProviders<MapModule>;
}
