// create-map-tracking-setup.js

const fs = require("fs");
const { execSync } = require("child_process");

console.log("============================================");
console.log("       🚀 MAP TRACKING AUTOMATION STARTING");
console.log("============================================\n");

// -----------------------------------------------------------
// 1️⃣ INSTALL MAP LIBRARY
// -----------------------------------------------------------
console.log("➡ Installing Map Library from GitHub...");
execSync(
  "npm install git+https://github.com/Ajay-kumar-abacus/background-tracker-web.git",
  { stdio: "inherit" }
);

// -----------------------------------------------------------
// 2️⃣ CREATE MAP-TRACKING MODULE
// -----------------------------------------------------------
console.log("\n➡ Creating map-tracking module...");
execSync(
  "ng g module map-tracking --module app.module --route map-tracking",
  { stdio: "inherit" }
);

// -----------------------------------------------------------
// 3️⃣ CREATE MAP-TRACKING COMPONENT
// -----------------------------------------------------------
console.log("\n➡ Creating map-tracking component...");
execSync(
  "ng g c map-tracking/map-tracking --skip-import --skip-tests=true",
  { stdio: "inherit" }
);

// -----------------------------------------------------------
// 4️⃣ WRITE <app-map> INTO map-tracking.component.html
// -----------------------------------------------------------
console.log("\n➡ Injecting <app-map>...");
fs.writeFileSync(
  "src/app/map-tracking/map-tracking/map-tracking.component.html",
  "<app-map></app-map>"
);
console.log("✔ HTML updated");

// -----------------------------------------------------------
// 5️⃣ OVERWRITE map-tracking.module.ts
// -----------------------------------------------------------
console.log("\n➡ Updating map-tracking.module.ts...");

const mapTrackingModuleContent = `
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatDialogModule } from '@angular/material';
import { RouterModule } from '@angular/router';

import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { AppUtilityModule } from 'src/app/app-utility.module';
import { MaterialModule } from 'src/app/material';
import { AuthComponentGuard } from 'src/app/auth-component.guard';

import { MapTrackingComponent } from './map-tracking/map-tracking.component';
import { MapModule } from 'tracking-map-manual/dist/map/map.module';

const mapTrackingRoutes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: MapTrackingComponent,
        canActivate: [AuthComponentGuard],
        data: { expectedRole: ['1'] }
      }
    ]
  }
];

@NgModule({
  declarations: [MapTrackingComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(mapTrackingRoutes),
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule,
    MaterialModule,
    AutocompleteLibModule,
    MatIconModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    AppUtilityModule,

    MapModule.forRoot({
      apiBaseUrl: 'https://wigwamply.basiq360.com/api/index.php/',
      imageBaseUrl: 'https://wigwamply.basiq360.com/api/index.php/',
      getToken: () => sessionStorage.getItem('token'),
      getUserData: () => JSON.parse(sessionStorage.getItem('user')),
      permissions: JSON.parse(sessionStorage.getItem('permissions')),
      projectName: "WIGWAAM"
    })
  ]
})
export class MapTrackingModule { }
`;

fs.writeFileSync("src/app/map-tracking/map-tracking.module.ts", mapTrackingModuleContent);
console.log("✔ map-tracking.module.ts updated");

// -----------------------------------------------------------
// 6️⃣ INSERT MAP MENU BELOW ATTENDANCE MENU
// -----------------------------------------------------------
console.log("\n➡ Updating navigation…");

const navPath = "src/app/navigation/navigation.component.html";
let navHtml = fs.readFileSync(navPath, "utf8");

const attendanceKey = 'routerLink="/attendance"';

const mapMenu = `
<li>
  <a mat-button routerLink="/map-tracking" routerLinkActive="active">
    <i class="material-icons">domain</i> Map Tracking
  </a>
</li>
`;

if (!navHtml.includes('routerLink="/map-tracking"')) {
  if (navHtml.includes(attendanceKey)) {
    navHtml = navHtml.replace(/<\/li>(\s*)/, `</li>\n${mapMenu}\n`);
    console.log("✔ MAP TRACKING added under Attendance");
  } else {
    navHtml += mapMenu;
    console.log("⚠ Attendance not found, added MAP TRACKING at bottom");
  }
  fs.writeFileSync(navPath, navHtml);
} else {
  console.log("✔ MAP TRACKING already exists");
}

// -----------------------------------------------------------
// 7️⃣ ADD ROUTE TO app-routing.module.ts
// -----------------------------------------------------------
console.log("\n➡ Updating app-routing.module.ts...");

const routePath = "src/app/app-routing.module.ts";
let routeContent = fs.readFileSync(routePath, "utf8");

if (!routeContent.includes("map-tracking.module")) {
  routeContent = routeContent.replace(
    "const routes: Routes = [",
    `const routes: Routes = [
    { path: "map-tracking", loadChildren: './map-tracking/map-tracking.module#MapTrackingModule' },`
  );
  fs.writeFileSync(routePath, routeContent);
  console.log("✔ Route added");
} else {
  console.log("✔ Route already added");
}

// // -----------------------------------------------------------
// // 8️⃣ UPDATE app-utility.module.ts (Import + Declare + Export)
// // -----------------------------------------------------------
// console.log("\n➡ Updating app-utility.module.ts...");

// const utilPath = "src/app/app-utility.module.ts";
// let utilContent = fs.readFileSync(utilPath, "utf8");

// // Add import
// if (!utilContent.includes("MapTrackingComponent")) {
//   utilContent = utilContent.replace(
//     /(@NgModule)/,
//     `import { MapTrackingComponent } from './map-tracking/map-tracking/map-tracking.component';\n\n$1`
//   );
// }

// // Add to declarations
// utilContent = utilContent.replace(
//   "declarations: [",
//   "declarations: [\n    MapTrackingComponent,"
// );

// // Add to exports
// utilContent = utilContent.replace(
//   "exports: [",
//   "exports: [\n    MapTrackingComponent,"
// );

// fs.writeFileSync(utilPath, utilContent);

// console.log("✔ app-utility.module.ts updated");

// -----------------------------------------------------------

console.log("\n============================================");
console.log("    🎉 MAP-TRACKING SETUP COMPLETE!");
console.log("============================================\n");
