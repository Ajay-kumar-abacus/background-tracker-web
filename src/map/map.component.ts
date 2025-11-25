import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, Inject } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

// import { OlaMaps } from 'olamaps-web-sdk'
import { DOCUMENT } from '@angular/common';
import { DatabaseService } from '../services/DatabaseService';
declare var OlaMaps: any;

// Declare Leaflet for map functionality
declare const L: any;
declare var zingchart: any;

interface EmployeeData {
  name: string;
  employee_id: string;
  contact_01: any;
}

interface LocationData {
  lat: number;
  lng: number;
  type: string;
  address: string;
  timestamp: string;
  distance_from_last?: string;
  total_distance_from_start?: string;
  date_created: string;
  dr_name?: string;
  dr_type_name?: string;
  visit_end?: string;
  sequence?: number;
  id?: string;
}

interface LatestLocation {
  lat: number;
  lng: number;
  gps: string;
  time: string;
  total_checkin: number;
}

interface TrackingAccuracy {
  background: number;
  virtual: number;
}

interface PlaybackControl {
  speed: number;
  progress: number;
  status: string;
  start: () => void;
  pause: () => void;
}

@Component({
  selector: 'app-map',
 template: `
 <div class="main-container" style="overflow:overlay">
  <div class="location-tracker-container">

    <!-- Employee Info Card -->
    <!-- Modern Employee Card Template -->
    <div class="employee-card" *ngIf="!isLoading && !isSidebarVisible">
      <div class="employee-header">
        <div class="employee-avatar">
          <i class="material-icons">person</i>
        </div>

        <div class="employee-details" *ngIf="employeeData">
          <h3>{{ employeeData.name || 'Employee Name1' }}</h3>
          <p>
            <span class="employee-meta-item">
              <i class="material-icons" style="font-size: 14px;">badge</i>
              {{ employeeData.employee_id || 'EMP001' }}
            </span>
            <span class="employee-meta-item">
              <i class="material-icons" style="font-size: 14px;">phone</i>
              {{ employeeData.contact_01 || '+91 XXXX XXX XXX' }}
            </span>
          </p>
          <div class="user-selection">
            <div class="dropdown-container">
              <label for="dateSelect">Select Date</label>
              <div class="header-actions">
                <input type="date" id="dateSelect" [(ngModel)]="selectedDate" (change)="onDateChange()" [max]="maxDate"
                  class="date-input-small">
              </div>
            </div>

           <div class="dropdown-container">
  <label for="userSearch">Select Employee</label>

  <div class="custom-dropdown" (click)="showList()">
    <!-- Search box inside dropdown -->
    <input
      type="text"
      id="userSearch"
      placeholder="Search employee..."
      [(ngModel)]="searchTerm"
      (input)="loadUsersList()"
      class="user-search"
    />

    <!-- Dropdown list -->
    <ul class="dropdown-list" *ngIf="userList?.length && userListing">
      <li 
        *ngFor="let user of userList"
        (click)="selectUser(user)"
        [class.selected]="selectedUserId === user.id"
      >
        {{ user.name }} - {{ user.employee_id }}
      </li>
    </ul>

    <!-- Loading indicator -->
    <div class="loading-spinner-small" *ngIf="isLoadingUsers"></div>
  </div>
</div>


          </div>
        </div>
        <div class="kpi-grid" *ngIf="!isSidebarVisible && !isLoading && selectedUserId">



          <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-info">
                <span class="kpi-label">GPS Distance</span>
                <span class="kpi-value">{{total_distance || 0}} KM</span>
                <span class="kpi-subtitle">today</span>
              </div>
              <div class="kpi-icon kpi-icon-purple">
                <i class="material-icons">route</i>
              </div>
            </div>
          </div>
            <div class="kpi-card clickable" (click)="showMeterDistance()">
            <div class="kpi-content">
              <div class="kpi-info">
                <span class="kpi-label">Meter Distance</span>
                <span class="kpi-value">{{ getTotalDistance() }} KM</span>
                <span class="kpi-subtitle clickable-subtitle">Click to view images</span>
              </div>
              <div class="kpi-icon kpi-icon-purple">
                <i class="material-icons">route</i>
              </div>
            </div>
          </div>
          <div class="kpi-card clickable" (click)="showCheckinTimeline()">
  <div class="kpi-content">
    <div class="kpi-info">
      <span class="kpi-label">Checkin Distance</span>
      <span class="kpi-value">{{summaryTimelineCheckin?.total_direct_km || 0}} KM</span>
      <span class="kpi-subtitle clickable-subtitle">Click to view timeline</span>
    </div>
    <div class="kpi-icon kpi-icon-purple">
      <i class="material-icons">route</i>
    </div>
  </div>
</div>

          <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-info">
                <span class="kpi-label">Active Time</span>
                <span class="kpi-value">{{activeTime|| 0}}</span>
                <span class="kpi-subtitle">today</span>
              </div>
              <div class="kpi-icon kpi-icon-purple">
                <i class="material-icons">schedule</i>
              </div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-info">
                <span class="kpi-label">Battery</span>
                <span class="kpi-value">{{summarizeData?.battery_level ? summarizeData.battery_level + '%' :
                  '--'}}</span>
                <span class="kpi-subtitle">across devices</span>
              </div>
             <div class="aurora-battery-section">
              <div class="aurora-battery-visual">
                <div class="aurora-battery-shell" [style.border-color]="getBatteryColor(summarizeData?.battery_level)">
                  <div class="aurora-battery-core" 
                       [style.height.%]="summarizeData?.battery_level"
                       [style.background]="getBatteryColor(summarizeData?.battery_level)">                        
                  </div>
                 
                  <div class="aurora-battery-tip" [style.background]="getBatteryColor(summarizeData?.battery_level)"></div>
                </div>
               
              </div>
            </div>
            </div>
          </div>
           
          <div class="kpi-card" (click)="showMissingPermissions()"
            [style.cursor]="missingPermissionsCount > 0 ? 'pointer' : 'default'">
            <div class="kpi-content">
              <div class="kpi-info">
                <span class="kpi-label">Missing Permissions</span>
                <span class="kpi-value">{{missingPermissionsCount}}</span>
                <span class="kpi-subtitle " [ngClass]="missingPermissionsCount>0 ?'blinking-red':''">action
                  needed</span>
              </div>
              <div class="kpi-icon kpi-icon-green">
                <i class="material-icons">location_on</i>
              </div>
            </div>
          </div>
            <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-info">
                <span class="kpi-label">Attendance Variation</span>
                <span class="kpi-value">{{attendanceVariation|| 0}}</span>
                <span class="kpi-subtitle">today</span>
              </div>
              <div class="kpi-icon kpi-icon-purple">
                <i class="material-icons">schedule</i>
              </div>
            </div>
          </div>

          <ng-container *ngIf="showMoreKpis">
            <div class="kpi-card">
              <div class="kpi-content">
                <div class="kpi-info">
                  <span class="kpi-label">Total Calls (TC)</span>
                  <span class="kpi-value">{{ TC || 0 }}</span>
                  <span class="kpi-subtitle">today</span>
                </div>
                <div class="kpi-icon kpi-icon-blue">
                  <i class="material-icons">call</i>
                </div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-content">
                <div class="kpi-info">
                  <span class="kpi-label">Productive Calls (PC)</span>
                  <span class="kpi-value">{{ PC || 0 }}</span>
                  <span class="kpi-subtitle">today</span>
                </div>
                <div class="kpi-icon kpi-icon-green">
                  <i class="material-icons">call_made</i>
                </div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-content">
                <div class="kpi-info">
                  <span class="kpi-label">Secondary Sale</span>
                  <span class="kpi-value">₹ {{ secondary_sale_amount || 0 }}</span>
                  <span class="kpi-subtitle">today</span>
                </div>
                <div class="kpi-icon kpi-icon-orange">
                  <i class="material-icons">shopping_cart</i>
                </div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-content">
                <div class="kpi-info">
                  <span class="kpi-label">New Counter TC</span>
                  <span class="kpi-value">{{ New_counter_TC || 0 }}</span>
                  <span class="kpi-subtitle">today</span>
                </div>
                <div class="kpi-icon kpi-icon-teal">
                  <i class="material-icons">add_call</i>
                </div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-content">
                <div class="kpi-info">
                  <span class="kpi-label">New Counter PC</span>
                  <span class="kpi-value">{{ New_counter_PC || 0 }}</span>
                  <span class="kpi-subtitle">today</span>
                </div>
                <div class="kpi-icon kpi-icon-lime">
                  <i class="material-icons">add_shopping_cart</i>
                </div>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-content">
                <div class="kpi-info">
                  <span class="kpi-label">New counter Primary Value</span>
                  <span class="kpi-value">₹ {{ counter_primary_Value || 0 }}</span>
                  <span class="kpi-subtitle">today</span>
                </div>
                <div class="kpi-icon kpi-icon-orange">
                  <i class="material-icons">shopping_cart</i>
                </div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <div class="kpi-info">
                  <span class="kpi-label">New counter Secondary Value</span>
                  <span class="kpi-value">₹ {{ counter_secondary_Value || 0 }}</span>
                  <span class="kpi-subtitle">today</span>
                </div>
                <div class="kpi-icon kpi-icon-orange">
                  <i class="material-icons">shopping_cart</i>
                </div>
              </div>
            </div>
          </ng-container>

          <div class="kpi-card kpi-toggle-card" (click)="showMoreKpis = !showMoreKpis">
            <div class="kpi-content">
              <div class="kpi-info">
                <span class="kpi-value">{{ showMoreKpis ? 'Show Less' : 'Show More' }}</span>
              </div>
              <div class="kpi-icon kpi-icon-blue">
                <i class="material-icons">{{ showMoreKpis ? 'unfold_less' : 'unfold_more' }}</i>
              </div>
            </div>
          </div>

        
        </div>

        

 
      </div>
       <div class="header-info" *ngIf="isToday()">
              <span *ngIf="summarizeData.device_model">{{ summarizeData.device_model }} ( {{
                summarizeData.android_version }})</span>
              <span *ngIf="summarizeData.created_at">Last updated: {{ summarizeData.created_at | date:'medium' }}</span>
            </div>
             <div class="header-info" *ngIf="!isToday()">
              <span *ngIf="summarizeData.device_model">{{ summarizeData.device_model }} (Android {{
                summarizeData.android_version }})</span>
            </div>

      <!-- Modern Control Section -->

    </div>

<!-- Checkin Timeline Alert Modal -->
<!-- Checkin Timeline Side Panel -->
<div class="checkin-timeline-overlay" *ngIf="showCheckinAlert" (click)="closeCheckinAlert()">
  <div class="checkin-timeline-sidepanel" (click)="$event.stopPropagation()">
    <div class="checkin-timeline-header">
      <button class="checkin-timeline-close" (click)="closeCheckinAlert()" aria-label="Close timeline">
        <i class="material-icons">close</i>
      </button>
      <h3 class="checkin-timeline-title">Check-in Journey Timeline</h3>
    </div>

    <div class="checkin-timeline-content">
      <div class="checkin-summary-box">
        <div class="checkin-summary-item">
          <span class="summary-label">Total Distance</span>
          <span class="summary-value">{{summaryTimelineCheckin?.total_route_km || 0}} KM</span>
        </div>
        <div class="checkin-summary-item">
          <span class="summary-label">Shortest Distance</span>
          <span class="summary-value">{{summaryTimelineCheckin?.total_direct_km || 0}} KM</span>
        </div>
         <!-- <div class="checkin-summary-item">
          <span class="summary-label">Check-in to Check-out</span>
          <span class="summary-value">{{summaryTimelineCheckin?.checkin_to_checkin_route_km || 0}} KM</span>
        </div>
         <div class="checkin-summary-item">
          <span class="summary-label">Check-in to Check-Out Shortest</span>
          <span class="summary-value">{{summaryTimelineCheckin?.checkin_to_checkin_direct_km || 0}} KM</span>
        </div> -->
        <!-- <div class="checkin-summary-item">
          <span class="summary-label">Total Stops</span>
          <span class="summary-value">{{summaryTimelineCheckin?.total_stops || 0}}</span>
        </div> -->
      </div>

      <div class="checkin-timeline-list">
        <div class="checkin-event-card" *ngFor="let event of timelineCheckin; let i = index">
          <div class="checkin-event-sidebar">
            <div class="checkin-event-number">{{event.sequence}}</div>
            <div class="checkin-event-line" *ngIf="i < timelineCheckin?.length - 1"></div>
          </div>
          
          <div class="checkin-event-content">
            <div class="checkin-event-header">
              <span class="checkin-event-type" [ngClass]="'type-' + event.type">
                <i class="material-icons">
                  {{event.type === 'attendance_start' ? 'play_circle' : 
                    event.type === 'attendance_stop' ? 'stop_circle' : 
                    event.type === 'checkin' ? 'where_to_vote' : 'place'}}
                </i>
                {{event.type === 'attendance_start' ? 'Day Start' : 
                  event.type === 'attendance_stop' ? 'Day End' : 
                  event.type === 'checkin' ? 'Check-in' : event.type}}
              </span>
              <!-- Show single time for non-checkin events -->
              <span *ngIf="event.type !== 'checkin'" class="checkin-event-time">
                {{event.datetime | date:'h:mm a'}}
              </span>
              <!-- Show start and end time for checkin events -->
              <div *ngIf="event.type === 'checkin' && findCheckinById(event.details?.checkin_id) as checkinDetails">
                <span class="checkin-event-time" style="font-size: 11px; display: block; text-align: right;">
                  <strong>In:</strong> {{ checkinDetails.visit_start | date:'h:mm a' }}
                </span>
                <span *ngIf="checkinDetails.visit_end" class="checkin-event-time" style="font-size: 11px; display: block; text-align: right;">
                  <strong>Out:</strong> {{ checkinDetails.visit_end | date:'h:mm a' }}
                </span>
                <ng-container *ngIf="checkinDetails.visit_end">
                  <div class="checkin-event-duration">
                    <i class="material-icons">timer</i>
                    <span>{{ calculateDuration(checkinDetails.visit_start, checkinDetails.visit_end) != null ? calculateDuration(checkinDetails.visit_start, checkinDetails.visit_end) : '--' }}</span>
                  </div>
                </ng-container>
              </div>
            </div>
            
            <div class="checkin-event-description">{{event.description}}</div>
            
            <div class="checkin-event-details" *ngIf="event.details">
              <i class="material-icons">business</i>
              <span>{{event.details.dr_name}}</span>
            </div>
            
            <div class="checkin-event-location" *ngIf="event.location">
              <i class="material-icons">location_on</i>
              <span>{{event.location.address}}</span>
            </div>
            
            <div class="checkin-event-distance" *ngIf="event.distance_from_previous">
              <div class="distance-badge">
                <i class="material-icons">straighten</i>
                <span>{{event.distance_from_previous.km}} KM from last point</span>
              </div>
              <!-- <div class="cumulative-badge">
                Total: {{event.cumulative_km}} KM
              </div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    <!-- Custom Alert Modal -->
    <div class="alert-overlay" *ngIf="showAlert">
      <div class="alert-container">
        <div class="alert-header">
          <div class="alert-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="m12 17.02.01 0" />
            </svg>
          </div>
          <h3 class="alert-title">Tracking Accuracy Issues</h3>
          <button class="alert-close" (click)="closeAlert()" aria-label="Close alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="alert-content">
          <p class="alert-description">The following issues are affecting tracking accuracy and need attention:</p>

          <div class="issues-list">
            <div class="issue-item" *ngFor="let issue of missingPermissions">
              <div class="issue-bullet"></div>
              <span class="issue-text">{{ issue }}</span>
            </div>
          </div>
        </div>

        <div class="alert-actions">
          <button class="btn-secondary" (click)="closeAlert()">Dismiss</button>
          <button class="btn-primary" (click)="resolveIssues()">Resolve Issues</button>
        </div>
      </div>
    </div>

    <!-- Missing Permissions Disclaimer Modal -->
    <div class="alert-overlay" *ngIf="showPermissionsDisclaimer">
      <div class="alert-container">
        <div class="alert-header" style="background-color: #ffc107;">
          <div class="alert-icon" style="color: #212529;">
            <svg width="24" height="24" viewBox="0 0 24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="m12 17.02.01 0" />
            </svg>
          </div>
          <h3 class="alert-title" style="color: #212529;">Missing Permissions Disclaimer</h3>
        </div>
        <div class="alert-content">
          <p class="alert-description">
            Please note that routing and distance calculations may be affected due to missing permissions. Ensure all necessary permissions are granted for accurate tracking.
          </p>
        </div>
        <div class="alert-actions">
          <button class="btn-secondary" (click)="showPermissionsDisclaimer = false">Dismiss</button>
        </div>
      </div>
    </div>

    <!-- Android Version Warning Modal -->
    <div class="alert-overlay" *ngIf="summarizeData?.android_version && +summarizeData.android_version <= 12">
      <div class="alert-container">
        <div class="alert-header" style="background-color: #ffc107;">
          <div class="alert-icon" style="color: #212529;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="m12 17.02.01 0" />
            </svg>
          </div>
          <h3 class="alert-title" style="color: #212529;">Android Version Disclaimer</h3>
        </div>

        <div class="alert-content">
          <p class="alert-description">
            This device is running <strong>Android {{summarizeData.android_version}}</strong>.
            For Android versions 12 and below, Google may restrict background location access, which can affect live tracking accuracy.
          </p>
          <p>This is a limitation of the Android Operating System and not an issue with the application.</p>
        </div>

        <div class="alert-actions">
          <button class="btn-secondary" (click)="summarizeData.android_version = null">Dismiss</button>
        </div>
      </div>
    </div>
      <!-- Custom Alert Modal -->
    <div class="alert-overlay" *ngIf="showMeterAlert">
      <div class="alert-container">
        <div class="alert-header">
          <div class="alert-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="m12 17.02.01 0" />
            </svg>
          </div>
          <h3 class="alert-title">Meter Images</h3>
          <button class="alert-close" (click)="closeMeterAlert()" aria-label="Close alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="alert-content">
          <p class="alert-description">The following images are uploaded at the start and stop of Attendance:</p>
          <div style="display: flex;">
            
                      <div class="img-container w200" *ngIf="attendanceData.start_meter_image != ''">
                    <div (click)="goToImage(url + 'attendence/'+ attendanceData.start_meter_image)"
                      class="image-block wp100">
                      <img src="{{url+ 'attendence/'+ attendanceData.start_meter_image}}">
                    </div>
                    <div style="text-align: center;font-size: 20px;font-weight: 500;background: aliceblue;">{{attendanceData.start_meter_reading}}</div>
                    <div style="text-align: center;font-size: 20px;font-weight: 500;background: aliceblue;">Start Meter</div>
                  </div>
                  <div class="img-container w200" *ngIf="attendanceData.stop_meter_image != ''">
                    <div (click)="goToImage(url + 'attendence/'+ attendanceData.stop_meter_image)"
                      class="image-block wp100">
                      <img src="{{url+ 'attendence/'+ attendanceData.stop_meter_image}}"> 
                    </div>
                     <div style="text-align: center;font-size: 20px;font-weight: 500;background: aliceblue;">{{attendanceData.stop_meter_reading}}</div>
                     <div style="text-align: center;font-size: 20px;font-weight: 500;background: aliceblue;">Stop Meter</div>
                  </div>
          </div>

         
        </div>

        <div class="alert-actions">
          <button class="btn-secondary" (click)="closeMeterAlert()">Dismiss</button>
      
        </div>
      </div>
    </div>





    <!-- Tab Navigation && locationMarkers.length > 0-->
    <div class="tab-navigation-wrapper" *ngIf="!isLoading ">
      <div class="tab-controls">
        <div class="fullscreen-toggle">
          <span class="toggle-label">Full Screen</span>
          <label class="switch">
            <input type="checkbox" [(ngModel)]="isSidebarVisible">
            <span class="slider"></span>
          </label>
        </div>
       
        <button class="refresh-btn" (click)="initializeData()">
          <i class="material-icons">refresh</i>
          Refresh
        </button>


      </div>
      

      <div class="tab-navigation">
        <button class="tab-button" [class.active]="activeTab === 'liveusers'" (click)="switchTab('liveusers')" *ngIf="isToday()">
          <i class="material-icons">group</i>
          <span>Live Users</span>
        </button>
        
        <!-- Show Live tab only for today's date -->
        <button class="tab-button" [class.active]="activeTab === 'live'" (click)="switchTab('live')" *ngIf="isToday()">
          <i class="material-icons">podcasts</i>
          <span>Live Tracking</span>
        </button>

        <!-- Route tab (previously Live) -->
        <button class="tab-button" [class.active]="activeTab === 'route'" (click)="switchTab('route')">
          <i class="material-icons">route</i>
          <span>Route</span>
        </button>

        <button class="tab-button" [class.active]="activeTab === 'playback'" (click)="switchTab('playback')">
          <i class="material-icons">play_circle</i>
          <span>Playback</span>
        </button>

        <button class="tab-button" [class.active]="activeTab === 'health'" (click)="switchTab('health')"
          *ngIf="isToday()">
          <i class="material-icons">healing</i>
          <span>Device Health</span>
        </button>
        <button class="tab-button" [class.active]="activeTab === 'timeline'" (click)="switchTab('timeline')">
          <i class="material-icons">timeline</i>
          <span>Timeline</span>
        </button>

        <button class="tab-button" [class.active]="activeTab === 'permissions'" (click)="switchTab('permissions')">
  <i class="material-icons">security</i>
  <span>Missing Permissions</span>
</button>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-content-grid" *ngIf="!isLoading">


      <!-- Main Map Area -->
      <main class="map-section"
        *ngIf="activeTab !== 'permissions' && activeTab !== 'timeline' && activeTab !== 'battery' && activeTab !== 'summary' && activeTab !== 'health' && activeTab !== 'liveusers'">
        <div class="map-container">
          <div id="trackingMap" class="tracking-map" *ngIf="locationMarkers.length > 0"></div>

          <!-- Map Controls Overlay -->
          <div class="map-controls" style="z-index: 400;" *ngIf="oldFlag!=true">
            <!-- <button class="map-control-btn">
              <i class="material-icons">my_location</i>
            </button>
            <button class="map-control-btn">
              <i class="material-icons">zoom_in</i>
            </button>
            <button class="map-control-btn">
              <i class="material-icons">zoom_out</i>
            </button>
            <button class="map-control-btn">
              <i class="material-icons">layers</i>
            </button> -->
            <div class="fullscreen-toggle snapToRoad" *ngIf="!isToday()">
              <span class="toggle-label" style="font-size:20px;font-weight:700;">Snap To Road</span>
              <label class="switch">
                <input type="checkbox" [(ngModel)]="snapToRoad" (change)="toggleRoadChange()">
                <span class="slider"></span>
              </label>
            </div>
            <!-- Wrap your existing snippet with the class below -->
            <div class="map-info-card" *ngIf="isSidebarVisible">
              <div class="map-info-name">{{employeeData.name}}</div>
              <div class="map-info-date">{{selectedDate}}</div>
            </div>

          </div>

          <!-- Playback Controls -->
          <div class="playback-controls" style="z-index: 400;" *ngIf="activeTab === 'playback' && !isMapLoading">
            <div class="playback-left">
              <button class="control-btn play-btn" *ngIf="playbackStatus === 'paused' || playbackStatus === 'stopped'"
                (click)="startPlayback()">
                <i class="material-icons">play_arrow</i>
              </button>
              <button class="control-btn pause-btn" *ngIf="playbackStatus === 'playing'" (click)="pausePlayback()">
                <i class="material-icons">pause</i>
              </button>

              <div class="playback-info">
                <span class="playback-time">{{playbackDateTime}}</span>
                <span class="playback-status">{{playbackStatus}}</span>
              </div>
            </div>

            <div class="progress-section">
              <input type="range" min="0" max="100" [(ngModel)]="playbackProgress" (input)="updateProgress($event)"
                class="progress-slider">
            </div>

            <div class="playback-right">
              <div class="speed-controls">
                <button class="speed-btn" (click)="toggleSpeedControl()">
                  <i class="material-icons">speed</i>
                  <span>{{ playbackDelay/1000 }}x</span>
                </button>

                <div class="speed-dropdown" *ngIf="showSpeedControl">
                  <input type="range" min="300" max="5000" step="100" [ngModel]="playbackDelay"
                    (change)="updateSpeed($event)" class="speed-slider">
                  <div class="speed-labels">
                    <span>0.3x</span>
                    <span>5x</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Loading Overlay -->
          <div class="loading-overlay" *ngIf="isMapLoading">
            <!-- <div class="loading-spinner"></div> -->
            <img style="height: 30%;" src="assets/mapIcon/finder.gif" />
            <p>Loading map data...</p>
          </div>
          <div class="loading-overlay" *ngIf="locationMarkers.length==0 && !isMapLoading">
            <img style="height: 80%;" src="assets/mapIcon/noData.ico" />
            <p>No Data Found</p>
          </div>
        </div>
      </main>

      <!-- Battery Analytics -->
      <section class="analytics-section" *ngIf="activeTab === 'battery'" style="width:100%">
        <div class="analytics-card">
          <div class="card-header">
            <h3>Battery Consumption Analytics</h3>
            <div class="header-actions">
              <button class="action-btn">
                <i class="material-icons">download</i>
                Export
              </button>
            </div>
          </div>
          <div class="chart-container">
            <div id="analyticsChart" class="chart-wrapper">
              <a class="zc-ref" href="https://www.zingchart.com/">Powered by ZingChart</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Summary Table -->
      <section class="summary-section" *ngIf="activeTab === 'summary'">
        <div class="summary-card">
          <div class="card-header">
            <h3>Attendance Summary</h3>
            <div class="header-actions">
              <input type="date" [(ngModel)]="selectedDate" (change)="loadAttendanceSummary()" [max]="maxDate"
                class="date-input-small">
              <button class="action-btn">
                <i class="material-icons">download</i>
                Export
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="summary-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Activity Type</th>
                  <th>Check-in Time</th>
                  <th>Check-out Time</th>
                  <th>Location</th>
                  <th>Customer Info</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of attendanceSummary; let i = index">
                  <td>{{i + 1}}</td>
                  <td>
                    <span class="activity-badge">{{record.type}}</span>
                  </td>
                  <td>{{getCheckinTime(record) | date:'h:mm a'}}</td>
                  <td>{{getCheckoutTime(record) | date:'h:mm a'}}</td>
                  <td class="location-cell">{{record.address || '--'}}</td>
                  <td>
                    <div class="customer-info">
                      <strong>{{record.dr_name}}</strong>
                      <span class="customer-type">({{record.dr_type_name || '--'}})</span>
                    </div>
                  </td>
                  <td>
                    <button class="table-action-btn">
                      <i class="material-icons">visibility</i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="no-data-state" *ngIf="attendanceSummary.length === 0">
              <i class="material-icons">event_busy</i>
              <p>No attendance data available for selected date</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Device Health Section -->
      <section class="device-health-section" *ngIf="activeTab === 'health' && summarizeData">
        <div class="device-health-card">
          <div class="card-header">
            <h3>Device Health Status</h3>
            <div class="header-info">
              <span *ngIf="summarizeData.device_model">{{ summarizeData.device_model }} (Android {{
                summarizeData.android_version }})</span>
              <span *ngIf="summarizeData.created_at">Last updated: {{ summarizeData.created_at | date:'medium' }}</span>
            </div>
          </div>

          <div class="health-content-grid">
            <!-- Health Score -->
            <div class="health-score-container">
              <h4>Health Score</h4>
              <div class="health-score-circle" [ngClass]="getHealthScoreClass(summarizeData.health_score)">
                <span class="score">{{ summarizeData.health_score || 'N/A' }}%</span>
              </div>
              <p>A measure of device configuration for optimal tracking.</p>
            </div>

            <!-- Key Metrics -->
            <div class="key-metrics-container">
              <h4>Key Metrics</h4>
              <div class="metrics-grid">
                <!-- State -->
                <div class="metric-item">
                  <i class="material-icons">battery_std</i>
                  <span class="metric-label">Battery Level</span>
                  <span class="metric-value">{{ summarizeData.battery_level }}%</span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">wifi</i>
                  <span class="metric-label">Internet</span>
                  <span class="metric-value"
                    [class.ok]="summarizeData.internet_type && summarizeData.internet_type !== 'None' && summarizeData.internet_type !== ''"
                    [class.issue]="!summarizeData.internet_type || summarizeData.internet_type === 'None' || summarizeData.internet_type === ''">
                    {{ summarizeData.internet_type || 'None' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">track_changes</i>
                  <span class="metric-label">Location Accuracy</span>
                  <span class="metric-value">{{ summarizeData.location_accuracy }}m</span>
                </div>

                <!-- Settings -->
                <div class="metric-item">
                  <i class="material-icons">location_on</i>
                  <span class="metric-label">Location Services</span>
                  <span class="metric-value" [class.ok]="summarizeData.is_location_enabled == '1'"
                    [class.issue]="summarizeData.is_location_enabled != '1'">
                    {{ summarizeData.is_location_enabled == '1' ? 'On' : 'Off' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">gps_fixed</i>
                  <span class="metric-label">GPS Provider</span>
                  <span class="metric-value" [class.ok]="summarizeData.is_gps_enabled == '1'"
                    [class.issue]="summarizeData.is_gps_enabled != '1'">
                    {{ summarizeData.is_gps_enabled == '1' ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">network_cell</i>
                  <span class="metric-label">Network Provider</span>
                  <span class="metric-value" [class.ok]="summarizeData.is_network_location_enabled == '1'"
                    [class.issue]="summarizeData.is_network_location_enabled != '1'">
                    {{ summarizeData.is_network_location_enabled == '1' ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">battery_saver</i>
                  <span class="metric-label">Battery Optimization</span>
                  <span class="metric-value" [class.ok]="summarizeData.is_battery_optimized == '0'"
                    [class.issue]="summarizeData.is_battery_optimized != '0'">
                    {{ summarizeData.is_battery_optimized == '0' ? 'Off' : 'On' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">power_settings_new</i>
                  <span class="metric-label">Power Saving Mode</span>
                  <span class="metric-value" [class.ok]="summarizeData.is_power_save_mode == '0'"
                    [class.issue]="summarizeData.is_power_save_mode != '0'">
                    {{ summarizeData.is_power_save_mode == '0' ? 'Off' : 'On' }}
                  </span>
                </div>

                <!-- Permissions -->
                <div class="metric-item">
                  <i class="material-icons">my_location</i>
                  <span class="metric-label">Fine Location</span>
                  <span class="metric-value" [class.ok]="summarizeData.fine_location == '1'"
                    [class.issue]="summarizeData.fine_location != '1'">
                    {{ summarizeData.fine_location == '1' ? 'Granted' : 'Denied' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">location_searching</i>
                  <span class="metric-label">Coarse Location</span>
                  <span class="metric-value" [class.ok]="summarizeData.coarse_location == '1'"
                    [class.issue]="summarizeData.coarse_location != '1'">
                    {{ summarizeData.coarse_location == '1' ? 'Granted' : 'Denied' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">security</i>
                  <span class="metric-label">Background Location</span>
                  <span class="metric-value" [class.ok]="summarizeData.has_background_permission == '1'"
                    [class.issue]="summarizeData.has_background_permission != '1'">
                    {{ summarizeData.has_background_permission == '1' ? 'Granted' : 'Denied' }}
                  </span>
                </div>
                <div class="metric-item">
                  <i class="material-icons">history_toggle_off</i>
                  <span class="metric-label">Background Tracking</span>
                  <span class="metric-value" [class.ok]="summarizeData.can_track_background == '1'"
                    [class.issue]="summarizeData.can_track_background != '1'">
                    {{ summarizeData.can_track_background == '1' ? 'Allowed' : 'Blocked' }}
                  </span>
                </div>
                
              </div>
            </div>
          </div>

          <div class="issues-recommendations-grid">
            <!-- Device Issues -->
            <!-- <div class="list-container issues">
              <div class="list-header">
                <i class="material-icons">warning</i>
                <h4>Detected Issues</h4>
              </div>
              <ul>
                <li *ngFor="let issue of summarizeData.device_issues_array">{{ formatIssueText(issue) }}</li>
                <li *ngIf="!summarizeData.device_issues_array || summarizeData.device_issues_array.length === 0">No
                  issues detected.</li>
              </ul>
            </div> -->

            <!-- Recommendations -->
            <!-- <div class="list-container recommendations">
              <div class="list-header">
                <i class="material-icons">lightbulb</i>
                <h4>Recommendations</h4>
              </div>
              <ul>
                <li *ngFor="let rec of summarizeData.recommendations_array">{{ rec }}</li>
                <li *ngIf="!summarizeData.recommendations_array || summarizeData.recommendations_array.length === 0">
                  Device is optimally configured.</li>
              </ul>
            </div> -->
          </div>
        </div>
      </section>
      <section class="device-health-section" *ngIf="activeTab === 'health' && !summarizeData">
        <div class="no-data-state" style="padding-top: 50px; text-align: center;">
          <i class="material-icons" style="font-size: 48px;">healing</i>
          <p>No device health data available for the selected user or date.</p>
        </div>
      </section>

      <!-- Live Users Tracking Section -->
      <section class="live-users-section" *ngIf="activeTab === 'liveusers'">
        <div class="live-users-container">
          <div class="live-users-sidebar" [class.collapsed]="!showUsersList">
            <div class="sidebar-header">
              <h3>Active Users</h3>
              <div class="toggle-sidebar-btn">
            
                <strong style="background: aliceblue;padding:10px;
                border-radius:10px;">{{liveUsersData.length}}</strong>
              
            </div> 
            </div> 
            

            <div class="users-list" *ngIf="showUsersList">
              <div class="user-card" *ngFor="let user of liveUsersData"
                [class.selected]="selectedLiveUsers.has(user.user.id.toString())"
                (click)="toggleUserSelection(user.user.id.toString())">
                <div class="user-avatar">
                  <i class="material-icons">person</i>
                  <span class="status-indicator" [class.active]="user.movement.is_moving"></span>
                </div>
                <div class="user-details">
                  <h4>{{user.user.name || 'Unknown'}}</h4>
                  <p class="user-id">ID: {{user.user.employee_id || 'N/A'}}</p>
                  <div class="user-stats">
                    <span class="stat-item">
                      <i class="material-icons">battery_std</i>
                      {{user.device.battery_level}}%
                    </span>
                   
                  </div>
                  <div class="user-activity">
                    <span class="activity-badge" [class]="user.movement.activity">
                      {{user.movement.activity || 'unknown'}}
                    </span>
                  </div>
                
                </div>
              </div>
            </div>

            <!-- <div class="sidebar-summary" *ngIf="showUsersList">
              <div class="summary-item">
                <span>Total Users:</span>
                <strong>{{liveUsersData.length}}</strong>
              </div>
              <div class="summary-item">
                <span>Active:</span>
                <strong>{{getActiveUsersCount()}}</strong>
              </div>
              <div class="summary-item">
                <span>Selected:</span>
                <strong>{{selectedLiveUsers.size}}</strong>
              </div>
            </div> -->
          </div>

          <div class="live-users-map-container">
            <div id="liveUsersMap" class="live-users-map"></div>

            <!-- Map Controls -->
            <div class="live-map-controls-btn">
             
              <button class="control-btn-live" (click)="refreshLiveUsers()">
                <i class="material-icons">refresh</i>
                Refresh
              </button>
             
            </div>

            <!-- Loading State -->
            <div class="loading-overlay" *ngIf="isLoadingLiveUsers">
              <div class="loading-spinner"></div>
              <p>Loading live users data...</p>
            </div>
          </div>
        </div>
      </section>

      <div *ngIf="activeTab === 'testing'" class="testing-tab-content">
        <div class="polyline-input-container">
          <h3>Plot Encoded Polyline</h3>
          <textarea [(ngModel)]="testPolyline" placeholder="Enter encoded polyline here" rows="6"></textarea>
          <button class="plot-button" (click)="plotTestPolyline()">Plot Polyline</button>
        </div>
        <div id="testMapContainer" style="height: 600px; width: 100%; border-radius: 8px; margin-top: 16px;"></div>
      </div>
      
      
      <!-- Timeline Section -->
      <section class="timeline-section" *ngIf="activeTab === 'timeline'">
        <div class="timeline-container" *ngIf="timelineEvents.length > 0">
          <div class="timeline-header">
            <h2>Daily Activity Timeline</h2>
            <div class="timeline-stats">
              <span class="stat-item">
                <i class="material-icons">event</i>
                {{timelineEvents.length}} Events
              </span>
             
              <span class="stat-item">
                <i class="material-icons">timer</i>
                {{timelineData.analytics?.total_travel_time || 0}} mins
              </span>
            </div>
            <!-- Map Toggle Button -->
            <button class="map-toggle-btn" (click)="toggleTimelineMap()" [class.active]="showTimelineMap">
              <i class="material-icons">{{showTimelineMap ? 'map' : 'view_list'}}</i>
              {{showTimelineMap ? 'Hide Map' : 'Show Map'}}
            </button>
          </div>

          <div class="timeline-content" [class.with-map]="showTimelineMap">
            <!-- Map View (conditionally shown) -->
            <div class="timeline-map-panel" *ngIf="showTimelineMap">
              <div id="timelineMapView" class="timeline-map-view"></div>
            </div>

            <!-- Timeline List (hidden when map is shown) -->
            <div class="timeline-track" *ngIf="!showTimelineMap">
              <div class="timeline-event" *ngFor="let event of timelineEvents; let i = index">
                <div class="timeline-time">{{event.time}}</div>

                <div class="timeline-marker" [ngClass]="getTimelineEventClass(event.type)">
                  <i class="material-icons">{{getTimelineIcon(event.type)}}</i>
                </div>

                <div class="timeline-card" [ngClass]="getTimelineEventClass(event.type)">
                  <h4>{{ event.type === 'visit' ? event.visit_count + ' . Visit : ' + event.title : event.title }}</h4>
                  <p class="event-description">{{event.description}}</p>
                  <!-- Enhanced Order Amount Display -->
                  <div *ngIf="event.order_amount > 0" class="event-order-amount">
                    <i class="material-icons">shopping_cart</i>
                    <span>Order Amount: {{ event.order_amount | currency:'INR':'symbol':'1.2-2' }}</span>
                  </div>

                  <div class="event-details" *ngIf="event.type === 'travel'">
                    <span><i class="material-icons">schedule</i> {{event.duration_minutes}} mins</span>
                    <span><i class="material-icons">speed</i> {{event.avg_speed_kmh}} km/h</span>
                  </div>

                  <div class="event-location" *ngIf="event.location">
                    <i class="material-icons">location_on</i>
                    <span>{{event.location.address || 'Location'}}</span>
                  </div>
                </div>

                <div class="timeline-gap" *ngIf="hasTimelineGap(i)">
                  <div class="gap-indicator">
                    <i class="material-icons">warning</i>
                    <span>Gap: {{getGapDuration(i)}} mins</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline Insights Panel -->
            <!-- <div class="timeline-insights-panel" *ngIf="!showTimelineMap && timelineInsights">
              <div class="list-container summary" *ngIf="timelineInsights.summary?.length > 0">
                <div class="list-header">
                  <i class="material-icons">summarize</i>
                  <h4>Summary</h4>
                </div>
                <ul>
                  <li *ngFor="let item of timelineInsights.summary">{{ item }}</li>
                </ul>
              </div>

              <div class="list-container recommendations" *ngIf="timelineInsights.recommendations?.length > 0">
                <div class="list-header">
                  <i class="material-icons">lightbulb</i>
                  <h4>Recommendations</h4>
                </div>
                <ul>
                  <li *ngFor="let item of timelineInsights.recommendations">{{ item }}</li>
                </ul>
              </div>

              <div class="list-container patterns" *ngIf="timelineInsights.patterns?.length > 0">
                <div class="list-header">
                  <i class="material-icons">insights</i>
                  <h4>Patterns</h4>
                </div>
                <ul>
                  <li *ngFor="let item of timelineInsights.patterns">{{ item }}</li>
                </ul>
              </div>
            </div> -->

          </div>
        </div>
         <div class="timeline-container map-container" *ngIf="timelineEvents.length <=0">
      <div class="loading-overlay">
            <img style="height: 80%;" src="assets/mapIcon/noData.ico" />
            <p>No Data Found</p>
          </div>
         </div>
      </section>


      <!-- Permissions Report Section -->
<section class="permissions-section" *ngIf="activeTab === 'permissions'">
  <div class="permissions-container">
    <div class="permissions-header">
      <h2>Missing Device Permissions Report</h2>

      <div style="display: flex;gap: 10px;">
        <button class="action-btn" (click)="downloadPermissionsReport()">
         
                <i class="material-icons">download</i>
                Export
              </button>
           
      <div class="date-info">
        <span>{{selectedDate | date:'fullDate'}}</span>
      </div>
      </div>
      
              
    </div>    <div class="permissions-layout" *ngIf="permissionsList.length > 0">
      <!-- Android Version Warning -->
      <div class="alert-container" *ngIf="summarizeData?.android_version && +summarizeData.android_version <= 12" style="margin-bottom: 1rem; border: 1px solid #ffc107; border-radius: 8px;">
        <div class="alert-header" style="background-color: #ffc107; border-top-left-radius: 7px; border-top-right-radius: 7px;">
          <div class="alert-icon" style="color: #212529;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="m12 17.02.01 0" />
            </svg>
          </div>
          <h3 class="alert-title" style="color: #212529;">Android Version Disclaimer</h3>
        </div>
        <div class="alert-content">
          <p class="alert-description">
            This device is running <strong>Android {{summarizeData.android_version}}</strong>. For Android versions 12 and below, Google may restrict background location access, which can affect live tracking accuracy. This is a limitation of the Android Operating System and not an issue with the application.
          </p>
        </div>
      </div>

      <!-- Modern Hourly Timeline Sidebar -->
      <div class="hourly-sidebar">
        <h3>Hourly Timeline</h3>
        <div class="hours-list">
          <div class="hour-item" 
               *ngFor="let hour of getHoursList()"
               [class.active]="selectedHour === hour"
               (click)="selectHour(hour)">
            
            <div class="hour-header">
              <span class="hour-time">{{hour}}</span>
              <span class="hour-count">{{getHourlyStatuses(hour).total}}</span>
            </div>
            
            <div class="hour-battery">
              <i class="material-icons" [style.color]="getBatteryColor(getHourlyStatuses(hour).avgBattery)">
                {{getBatteryIcon(getHourlyStatuses(hour).avgBattery)}}
              </i>
              <span class="battery-level">{{getHourlyStatuses(hour).avgBattery}}%</span>
            </div>
            
            <div class="hour-issues">
              <span class="issues-count" [class.critical]="getHourlyStatuses(hour).criticalIssues > 0">
                {{getHourlyStatuses(hour).totalIssues}} issues
              </span>
             
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Details Panel -->
      <div class="permissions-details">
        <div class="details-header">
          <h3>Device Status at {{selectedHour}}</h3>
          <div class="hour-summary">
            <div class="summary-badge total">
              <i class="material-icons">assessment</i>
              <span>{{getHourlyStatuses(selectedHour).total}} Records</span>
            </div>
            <div class="summary-badge" 
                 [ngClass]="getHourlyStatuses(selectedHour).batteryStatus">
              <i class="material-icons">{{getBatteryIcon(getHourlyStatuses(selectedHour).avgBattery)}}</i>
              <span>{{getHourlyStatuses(selectedHour).avgBattery}}% Battery</span>
            </div>
            <div class="summary-badge issues" 
                 [class.critical]="getHourlyStatuses(selectedHour).criticalIssues > 0">
              <i class="material-icons">{{getHourlyStatuses(selectedHour).criticalIssues > 0 ? 'error' : 'check_circle'}}</i>
              <span>{{getHourlyStatuses(selectedHour).totalIssues}} Issues</span>
            </div>
          </div>
        </div>

        <div class="issues-timeline">
          <div class="issue-record" 
               *ngFor="let record of getSelectedHourPermissions(); let i = index"
               [class.critical]="isCritical(record)">
            
            <div class="record-time">
              <span class="time">{{record.timestamp | date:'HH:mm:ss'}}</span>
            </div>
            
            <div class="record-battery">
              <div class="battery-info">
                <i class="material-icons" [style.color]="getBatteryColor(record.battery_level)">
                  {{getBatteryIcon(record.battery_level)}}
                </i>
                <span class="battery-text" [style.color]="getBatteryColor(record.battery_level)">
                  {{record.battery_level}}%
                </span>
              </div>
            </div>
            
            <div class="record-issues">
              <div class="issues-container" *ngIf="record.issues && record.issues.length > 0; else noIssues">
                <div class="issue-chip red" *ngFor="let issue of record.issues" >
                  <i class="material-icons">{{getIssueIcon(issue)}}</i>
                  <span>{{formatIssueText(issue)}}</span>
                </div>
              </div>
              
              <ng-template #noIssues>
                <div class="no-issues">
                  <i class="material-icons good">check_circle</i>
                  <span>No Issues Detected</span>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- No data for selected hour -->
        <div class="no-hour-data" *ngIf="getSelectedHourPermissions().length === 0">
          <i class="material-icons">schedule</i>
          <p>No device status recorded at {{selectedHour}}</p>
        </div>
      </div>
    </div>

    <!-- Modern No data state -->
    <div class="no-permissions-data" *ngIf="permissionsList.length === 0">
      <i class="material-icons">devices_other</i>
      <h3>No Device Data Available</h3>
      <p>No device status information found for the selected date and user. Please check your filters or try a different date range.</p>
    </div>
  </div>
</section>

    </div>

    <!-- Loading State -->
    <div class="loading-skeleton" *ngIf="isLoading">
      <div class="skeleton-header"></div>
      <div class="skeleton-kpis"></div>
      <div class="skeleton-content">
        <div class="skeleton-sidebar"></div>
        <div class="skeleton-main"></div>
      </div>
    </div>
  </div>
</div>
`,
styles: [`
 body {
  
  background: #f8faff;
  color: #1e293b;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}
.glow-route {
  filter: drop-shadow(0 0 6px #2196F3);
}
/* ===== MAIN CONTAINER ===== */
.main-container {
  min-height: 100vh;
  // background: linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%);
  display: flex;
  flex-direction: column;

}

/* ===== MAP INFO CARD ===== */
.map-info-card {

  z-index: 1000;

  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 
    0 4px 10px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.05);

  padding: 10px 14px;
  min-width: 160px;
  max-width: 240px;

  display: flex;
  flex-direction: column;
  gap: 4px;

  pointer-events: auto; /* set to none if you want map clicks to pass through */
 
}


::ng-deep .live-marker-pulse {
  animation: pulse 2s infinite;
  
  img {
    filter: drop-shadow(0 0 6px rgba(33, 150, 243, 0.6));
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 10px rgba(33, 150, 243, 0.8));
  }
  100% {
    transform: scale(1);
  }
}
/* Text inside */
.map-info-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.map-info-date {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.2;
}



.blinking-red{
  color: #fff !important;
  animation: blink-animation 1.2s infinite ease-in-out;
  background: linear-gradient(135deg, #ff4d4d, #b30000);
  padding:5px;
  border: 1px solid #ff1a1a;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px !important;
  box-shadow: 0 3px 8px rgba(255, 0, 0, 0.3);
  text-align: center;
  display: inline-block;
  letter-spacing: 0.5px;
}

/* Blinking animation */
@keyframes blink-animation {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}



.location-tracker-container {
  width: 100%;
  max-width: 95vw;
  margin: 0 auto;
  padding: clamp(8px, 1vw, 16px);
  padding-top: 0;
  flex: 1;
}

/* This can replace the .charging-green class */

.charging-fill-effect {
  position: relative;
  /* This orange should match the background of the .kpi-icon-orange class */
  background-color: #ff9800; 
  overflow: hidden; /* This is crucial to contain the animation */
}

.charging-fill-effect::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #28a745; /* Green charging color */
  
  /* The animation makes the green layer move up and down */
  animation: charge-fill-animation 2.5s infinite ease-in-out;
}

@keyframes charge-fill-animation {
  0% {
    transform: translateY(100%); /* Start at the bottom (icon is orange) */
  }
  50% {
    transform: translateY(0%); /* Fill to the top (icon is green) */
  }
  100% {
    transform: translateY(100%); /* Recede to the bottom (back to orange) */
  }
}


/* Switch Component */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  display: none;
}

.slider {
  position: absolute;
  cursor: pointer;
  background-color: #ccc;
  border-radius: 24px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}

input:checked + .slider {
  background:linear-gradient(135deg, #10b981, #059669);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 8px 14px;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

/* ===== KPI GRID ===== */
/* ===== EMPLOYEE CARD - COMPACT VERSION ===== */
.employee-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.employee-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 0;
}

.employee-avatar {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.employee-avatar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
}

.employee-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.employee-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.employee-details p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.employee-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.employee-meta-item i {
  font-size: 12px !important;
}

/* User Selection - Compact under employee name */
.user-selection {
  background: linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 10px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  gap: 10px;
  margin-top: 8px;
  /* Aligned under employee name */
  
  max-width: 500px; /* Limit width to keep compact */
}
// Live Users Section Styles
.live-users-section {
  width: 100%;
  
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.live-users-container {
  display: flex;
  height: 100%;
  position: relative;
}

.live-users-sidebar {
  width: 320px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  max-height: 650px;
  
  &.collapsed {
    width: 50px;
  }
}

.sidebar-header {
  padding: 20px;
  background: white;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }
}

.toggle-sidebar-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    background: #f0f0f0;
    border-radius: 4px;
  }
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.user-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 15px;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  &.selected {
    background: #e3f2fd;
    border: 2px solid #2196F3;
  }
}

.user-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  .status-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #9E9E9E;
    border: 2px solid white;
    
    &.active {
      background: #4CAF50;
      animation: pulse 2s infinite;
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.user-details {
  flex: 1;
  
  h4 {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: #333;
  }
  
  .user-id {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 12px;
  }
}

.user-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #666;
    
    i {
      font-size: 16px;
    }
  }
}

.user-activity {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.activity-badge,
.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
}

.activity-badge {
  &.still {
    background: #e0e0e0;
    color: #666;
  }
  &.walking {
    background: #fff3e0;
    color: #f57c00;
  }
  &.running {
    background: #fce4ec;
    color: #c2185b;
  }
  &.driving {
    background: #e8f5e9;
    color: #388e3c;
  }
}

.status-badge {
  &.stationary {
    background: #c8e6c9;
    color: #2e7d32;
  }
  &.idle {
    background: #ffe0b2;
    color: #e65100;
  }
  &.moving {
    background: #bbdefb;
    color: #1565c0;
  }
}

.last-update {
  margin: 0;
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    font-size: 14px;
  }
}

.sidebar-summary {
  padding: 15px 20px;
  background: white;
  border-top: 1px solid #dee2e6;
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    
    span {
      color: #666;
    }
    
    strong {
      color: #333;
    }
  }
}

.live-users-map-container {
  flex: 1;
  position: relative;
}

.live-users-map {
  width: 100%;
  height: 100%;
}

.live-map-controls-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  .control-btn-live {
    background: white;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    i {
      font-size: 20px;
      color: #666;
    }
  }
}

.auto-refresh-toggle {
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  
  span {
    font-size: 13px;
    color: #666;
  }
}

.dropdown-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.dropdown-container label {
  font-weight: 600;
  color: #374151;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.date-input-small,
.user-dropdown {
  padding: 6px 8px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  width: 100%;
  height: 32px; /* Fixed height for consistency */
}

.date-input-small:focus,
.user-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 0 0 2px rgba(59, 130, 246, 0.1);
}

.user-dropdown:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  width: 100%;
}

.loading-spinner-small {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
}

/* ===== KPI GRID - 4 CARDS IN ONE LINE ===== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  margin-top: 16px;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: default;
  min-width: 0; /* Allow cards to shrink */
}
.kpi-toggle-card {
  cursor: pointer;
  background: #f8fafc;
  border-style: dashed;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.kpi-card.clickable {
  cursor: pointer;
}

.kpi-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.kpi-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-subtitle {
  font-size: 10px;
  color: #94a3b8;
}

.kpi-subtitle.blinking-red {
  color: #ef4444;
  animation: blink 1.5s ease-in-out infinite;
}

.kpi-subtitle.clickable-subtitle {
  color: #3b82f6;
  font-weight: 500;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.kpi-icon i {
  font-size: 18px;
}

.kpi-icon-blue { 
  background: linear-gradient(135deg, #3b82f6, #1e40af); 
}

.kpi-icon-green { 
  background: linear-gradient(135deg, #10b981, #059669); 
}

.kpi-icon-purple { 
  background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
}

.kpi-icon-orange { 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
}

.charging-fill-effect {
  background: linear-gradient(135deg, #10b981, #059669);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); 
  }
  50% { 
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); 
  }
}

/* ===== RESPONSIVE BREAKPOINTS ===== */

/* Large Tablet */
@media screen and (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  
  .kpi-card {
    padding: 12px;
  }
  
  .kpi-value {
    font-size: 16px;
  }
  
  .kpi-label {
    font-size: 10px;
  }
  
  .kpi-icon {
    width: 32px;
    height: 32px;
  }
  
  .kpi-icon i {
    font-size: 16px;
  }
}

/* Tablet View */
@media screen and (max-width: 768px) {
  .employee-card {
    padding: 14px;
  }
  
  .employee-header {
    gap: 12px;
  }
  
  .employee-avatar {
    width: 48px;
    height: 48px;
  }
  
  .employee-avatar i {
    font-size: 20px;
  }
  
  .employee-details h3 {
    font-size: 16px;
  }
  
  .user-selection {
    margin-left: 60px; /* 48px avatar + 12px gap */
    padding: 8px;
    max-width: 400px;
  }
  
  .dropdown-container label {
    font-size: 9px;
  }
  
  .date-input-small,
  .user-dropdown {
    padding: 5px 7px;
    font-size: 11px;
    height: 28px;
  }
  
  /* Keep 4 columns but smaller */
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  
  .kpi-card {
    padding: 10px;
  }
  
  .kpi-value {
    font-size: 14px;
  }
  
  .kpi-label {
    font-size: 9px;
  }
  
  .kpi-subtitle {
    font-size: 9px;
  }
  
  .kpi-icon {
    width: 28px;
    height: 28px;
  }
  
  .kpi-icon i {
    font-size: 14px;
  }
}

/* Mobile View */
@media screen and (max-width: 580px) {
  /* Stack dropdowns vertically on mobile */
  .user-selection {
    margin-left: 0;
    margin-top: 12px;
    flex-direction: column;
    max-width: 100%;
  }
  
  /* 2x2 grid on mobile */
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .kpi-card {
    padding: 10px;
  }
  
  .kpi-value {
    font-size: 16px;
  }
  
  .kpi-label {
    font-size: 10px;
  }
}

/* Very small devices */
@media screen and (max-width: 360px) {
  .employee-card {
    padding: 10px;
  }
  
  .employee-avatar {
    width: 44px;
    height: 44px;
  }
  
  .employee-details h3 {
    font-size: 14px;
  }
  
  .employee-meta-item {
    font-size: 10px;
    padding: 2px 4px;
  }
  
  .date-input-small,
  .user-dropdown {
    font-size: 10px;
    height: 26px;
  }
  
  /* Single column on very small screens */
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .kpi-card {
    padding: 10px;
  }
  
  .kpi-value {
    font-size: 16px;
  }
}


.loading-spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .employee-header {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .employee-status {
    align-items: flex-start;
    flex-direction: row;
    gap: 12px;
  }
  
  .user-selection {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .employee-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .employee-avatar {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 0 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 3px;
}

.stat-label {
  font-size: 10px;
  opacity: 0.9;
  font-weight: 500;
}

/* Timeline Container */
.timeline-container {

  overflow-y: auto;
  padding: 14px 16px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.timeline-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.timeline-marker {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 14px;
}

.timeline-marker.checkin {
  background: linear-gradient(135deg, #10b981, #059669);
}

.timeline-marker.checkout {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.timeline-marker.attendance {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
}

.timeline-marker.background {
  background: linear-gradient(135deg, #64748b, #475569);
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  border-radius:10px
}

.timeline-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.timeline-time {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 500;
}

.timeline-address {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.timeline-coords {
  font-size: 10px;
  color: #94a3b8;
 
}
.timeline-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.timeline-map-panel {
  width: 50%;
  position: relative;
  border-right: 1px solid #dee2e6;
}

.timeline-map-view {
  width: 100%;
  height: 100%;
}

.timeline-track {
  width: 30%;
  padding: 30px;
  overflow-y: auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 70px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e0e0e0;
  }
}

.timeline-summary {
  width: 20%;
  background: #f8f9fa;
  padding: 20px;
  border-left: 1px solid #dee2e6;
  overflow-y: auto;
}
.map-toggle-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  margin-top: 15px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  &.active {
    background: white;
    color: #764ba2;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  
  i {
    font-size: 20px;
  }
}

.timeline-content {
  &.with-map {
    .timeline-map-panel {
      width: 100%;
      height: clamp(600px, 50vh, 600px);
    }
  }
}

.timeline-map-panel {
  height: 100%;
  position: relative;
}

.timeline-map-view {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}
/* Last Location Card */
.last-location-card {
  padding: 14px 16px;
  border-top: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.location-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.location-header i {
  color: #d97706;
  font-size: 16px;
}

.location-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin: 0;
}

.location-details .location-time {
  font-size: 11px;
  font-weight: 600;
  color: #d97706;
  margin-bottom: 4px;
}

.location-details .location-address {
  font-size: 12px;
  color: #92400e;
  margin-bottom: 3px;
  line-height: 1.3;
}

.location-details .location-coords {
  font-size: 10px;
  color: #a16207;
  
}

/* No Data State */
.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 16px;
  color: #94a3b8;
  text-align: center;
}

.no-data-state i {
  font-size: 250px;
  margin-bottom: 10px;
  opacity: 0.7;
}

.no-data-state p {
  font-size: 25px;
  font-weight: 500;
  margin: 0;
}

/* ===== MAP SECTION ===== */
.map-section {
  position: relative;
  flex: 1;
  min-width: 320px;
}

.map-container {
  position: relative;
  background: white;
  border-radius: clamp(10px, 1.2vw, 16px);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  height: clamp(100vh, 50vh, 600px);
  display: flex;
  flex-direction: column;
}

.tracking-map {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: clamp(12px, 1.5vw, 16px);
  flex: 1;
}

/* Map Controls */
.map-controls {
  position: absolute;
  top: clamp(10px, 1.5vw, 20px);
  right: clamp(10px, 1.5vw, 20px);
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.8vw, 8px);
  z-index: 10;
}

.map-control-btn {
  width: clamp(28px, 3.5vw, 44px);
  height: clamp(28px, 3.5vw, 44px);
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: clamp(6px, 1vw, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  font-size: clamp(12px, 1.4vw, 16px);
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .main-content-grid {
    flex-direction: column;
  }
  
  .sidebar-panel {
    flex: none;
    order: 2;
  }
  
  .map-section {
    order: 1;
  }
  
  .tab-navigation-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tab-controls {
    justify-content: center;
  }
  
  .playback-controls {
    flex-direction: column;
    gap: clamp(8px, 2vw, 16px);
  }
  
  .progress-section {
    margin: 0;
    order: 2;
  }
  
  .playback-left {
    order: 1;
    justify-content: center;
  }
  
  .playback-right {
    order: 3;
    align-self: center;
  }
}

@media (max-width: 480px) {
  .kpi-grid {
    flex-direction: column;
  }
  
  .kpi-card {
    flex: none;
  }
  
  .employee-header {
    flex-direction: column;
    text-align: center;
  }
  
  .employee-status {
    text-align: center;
  }
  
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .timeline-time {
    align-self: flex-end;
  }
}

.map-control-btn:hover {
  background: #f8fafc;
  color: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

/* Playback Controls */
.playback-controls {
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.playback-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  font-size: 16px;
}

.play-btn {
  background: linear-gradient(135deg, #10b981, #059669);
}

.pause-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.control-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.playback-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.playback-time {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.playback-status {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-section {
  flex: 1;
  margin: 0 14px;
}

.progress-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e2e8f0;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.progress-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.playback-right {
  position: relative;
}

.speed-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.speed-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.checkin-event-duration {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #e8eaf6; /* A light indigo background */
  color: #3f51b5; /* A matching indigo text color */
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-top: 4px;
  float: right; /* Aligns it to the right */
}

.checkin-event-duration .material-icons {
  font-size: 14px;
}


.speed-dropdown {
  position: absolute;
  bottom: 48px;
  right: 0;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  min-width: 130px;
}

.speed-slider {
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: #e2e8f0;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  margin-bottom: 6px;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  cursor: pointer;
}

.speed-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #64748b;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
  border-radius: 14px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 2px solid #f1f5f9;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  font-size: 30px;
  font-weight: 500;
  color: #64748b;
}

/* ===== ANALYTICS SECTION ===== */
.analytics-section,
.summary-section {
  grid-column: 1 / -1;
}

.analytics-card,
.summary-card {
  background: white;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #f8faff, #f1f5ff);
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}


.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

/* Chart Container */
.chart-container {
  padding: 16px;
}

.chart-wrapper {
  height: 300px;
  background: #f8faff;
  border-radius: 12px;
  padding: 14px;
  position: relative;
}

.zc-ref {
  display: none;
}

/* ===== SUMMARY TABLE ===== */
.table-container {
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table th {
  background: linear-gradient(135deg, #1e40af, #1e3a8a);
  color: white;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-table th:first-child {
  border-top-left-radius: 0;
}

.summary-table th:last-child {
  border-top-right-radius: 0;
}

.summary-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  font-size: 12px;
  vertical-align: middle;
}

.summary-table tbody tr:hover {
  background: #f8faff;
}

.activity-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.location-cell {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.customer-type {
  font-size: 10px;
  color: #64748b;
}

.table-action-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  font-size: 12px;
}

.table-action-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* ===== LOADING SKELETON ===== */
.loading-skeleton {
  animation: fadeIn 0.3s ease;
}

.skeleton-header,
.skeleton-kpis,
.skeleton-sidebar,
.skeleton-main {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 14px;
}

.skeleton-header {
  height: 70px;
  margin-bottom: 16px;
}

.skeleton-kpis {
  height: 90px;
  margin-bottom: 16px;
}

.skeleton-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
}

.skeleton-sidebar {
  height: 450px;
}

.skeleton-main {
  height: 450px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== SCROLLBAR STYLING ===== */
.timeline-container::-webkit-scrollbar,
.table-container::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.timeline-container::-webkit-scrollbar-track,
.table-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.timeline-container::-webkit-scrollbar-thumb,
.table-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 2px;
}

.timeline-container::-webkit-scrollbar-thumb:hover,
.table-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ===== UTILITY CLASSES ===== */
.text-center { text-align: center; }
.hidden { display: none !important; }
.sr-only { 
  position: absolute; 
  width: 1px; 
  height: 1px; 
  padding: 0; 
  margin: -1px; 
  overflow: hidden; 
  clip: rect(0, 0, 0, 0); 
  border: 0; 
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 3px;
}

.status-active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.last-ping {
  display: block;
  font-size: 10px;
  color: #94a3b8;
}

/* ===== TAB NAVIGATION ===== */
.tab-navigation-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 14px;
}

.tab-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fullscreen-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #1e40af, #1e3a8a);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 8px 14px;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
}

.tab-navigation {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  gap: 3px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 500;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button.active {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
}

.tab-button:hover:not(.active) {
  background: #f8fafc;
  color: #1e293b;
}

/* ===== MAIN CONTENT GRID ===== */
.main-content-grid {
  display: flex;
  gap: clamp(12px, 2vw, 24px);
  min-height: clamp(400px, 50vh, 600px);
  flex-wrap: wrap;
}

/* ===== SIDEBAR PANEL ===== */
.sidebar-panel {
  display: flex;
  flex-direction: column;
  flex: 0 0 clamp(280px, 25vw, 360px);
  min-width: 280px;
}

.panel-card {
  background: white;
  border-radius: clamp(10px, 1.2vw, 16px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  height: fit-content;
  flex: 1;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(12px, 1.5vw, 20px);
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #f8faff, #f1f5ff);
  flex-wrap: wrap;
  gap: clamp(8px, 1vw, 16px);
}

.panel-header h3 {
  font-size: clamp(12px, 1.4vw, 16px);
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.date-input-small {
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 15px;
  font-size: 15px;
  color: #1e293b;
  background: white;
  cursor: pointer;
}

.date-input-small:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Quick Stats */
.quick-stats {
  display: flex;
  padding: 14px 16px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
}



@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Add this to your map.component.scss file */

.route-arrow {
  pointer-events: none;
  z-index: 1000;
}

.route-arrow div {
  transition: transform 0.3s ease;
}

/* Animation for dashed line effect */
@keyframes dash {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: 30;
  }
}

/* Enhanced playback marker styles */
.playback-marker {
  z-index: 1001;
}

.playback-marker div {
  transition: transform 0.3s ease;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
  }
  50% {
    box-shadow: 0 3px 15px rgba(255,87,34,0.6);
  }
  100% {
    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
  }
}

/* Custom marker styles */
.custom-marker {
  z-index: 999;
}

.current-location-marker {
  z-index: 1002;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.snapToRoad {
  padding: 12px 18px;
  border: 1px solid rgba(30, 64, 175, 0.6);
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;

  /* Subtle depth */
  box-shadow: 0 6px 15px rgba(30, 64, 175, 0.25), 
              inset 0 1px 2px rgba(255, 255, 255, 0.15);

  /* Smooth hover effect */
  transition: all 0.3s ease;
}

.snapToRoad:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(30, 64, 175, 0.35);
  background: linear-gradient(135deg, #2563eb, #1e3a8a);
}

.snapToRoad:active {
  transform: scale(0.98);
}
  
/* Device Health Section */
.device-health-section {

  padding: 20px;
  background-color: #f9fafb;
  width: 100%;
}
 .header-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.875rem;
      color: #6b7280;
    }

.device-health-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 16px;

    h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .header-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.875rem;
      color: #6b7280;
    }
  }
}

.health-content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  align-items: start;
}

.health-score-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;

  h4 {
    font-size: 1.125rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 16px;
  }

  .health-score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    border-width: 8px;
    border-style: solid;
    transition: all 0.3s ease;

    &.score-good {
      border-color: #22c55e;
      color: #166534;
    }
    &.score-medium {
      border-color: #f59e0b;
      color: #92400e;
    }
    &.score-poor {
      border-color: #ef4444;
      color: #991b1b;
    }

    .score {
      font-size: 2.25rem;
      font-weight: 700;
    }
  }

  p {
    font-size: 0.875rem;
    color: #6b7280;
    max-width: 200px;
  }
}

.key-metrics-container {
  h4 {
    font-size: 1.125rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 16px;
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.metric-item {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;

  .material-icons {
    font-size: 2rem;
    color: #4b5563;
  }

  .metric-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .metric-value {
    font-size: 1.125rem;
    font-weight: 600;

    &.ok {
      color: #16a34a;
    }
    &.issue {
      color: #dc2626;
    }
  }
}

.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  animation: overlayFadeIn 0.3s ease-out;
}

/* Alert Container */
.alert-container {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  animation: alertSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Alert Header */
.alert-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 24px 24px 0 24px;
  position: relative;
}

.alert-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #92400e;
}

.alert-title {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.4;
  padding-top: 8px;
}

.alert-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alert-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Alert Content */
.alert-content {
  padding: 20px 24px 0 24px;
}

.alert-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

/* Issues List */
.issues-list {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 4px;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.issue-item:last-child {
  margin-bottom: 0;
}

.issue-bullet {
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.issue-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  flex: 1;
}

/* Alert Actions */
.alert-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 10px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}

/* Buttons */
.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 80px;
}

.btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
.timeline-section {
  width: 100%;

  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.timeline-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.timeline-header {
  padding: 20px;
 background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
   color: white;
   border-radius: 10px;
  
  h2 {
    margin: 0 0 15px 0;
    font-size: 24px;
  }
}

.timeline-stats {
  display: flex;
  gap: 30px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    i {
      font-size: 18px;
    }
  }
}

.timeline-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.timeline-track {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 70px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e0e0e0;
  }
}

.timeline-event {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
  position: relative;
}

.timeline-time {
  width: 60px;
  font-size: 12px;
  color: #666;
  text-align: right;
  padding-top: 12px;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 20px;
  z-index: 1;
  position: relative;
  
  &.event-start {
    background: #4CAF50;
    color: white;
  }
  
  &.event-stop {
    background: #f44336;
    color: white;
  }
  
  &.event-travel {
    background: #2196F3;
    color: white;
  }
    &.event-checkin {
    background: #ea24e3;
    color: white;
  }
  
  &.event-visit {
    background: #9C27B0;
    color: white;
  }
  
  i {
    font-size: 20px;
  }
}

.timeline-card {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  h4 {
    margin: 0 0 8px 0;
    color: #333;
  }
  
  .event-description {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
  }
}

// Add this to your map.component.scss file

.event-order-amount {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #e8f5e9; // A light green background
  color: #2e7d32; // A dark green text color
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #c8e6c9;

  .material-icons {
    font-size: 20px;
  }
}


.event-details {
  display: flex;
  gap: 15px;
  margin-top: 10px;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #666;
    
    i {
      font-size: 16px;
    }
  }
}

.event-location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 13px;
  color: #666;
  
  i {
    font-size: 16px;
  }
}

.timeline-gap {
  position: absolute;
  left: 70px;
  top: 60px;
  
  .gap-indicator {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 20px;
    padding: 5px 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    i {
      color: #ff9800;
      font-size: 16px;
    }
    
    span {
      font-size: 12px;
      color: #856404;
    }
  }
}

.timeline-summary {
  width: 350px;
  background: #f8f9fa;
  padding: 20px;
  border-left: 1px solid #dee2e6; 
  overflow-y: auto;
  
  h3 {
    margin: 0 0 20px 0;
    color: #333;
  }
}

.timeline-insights-panel {
  width: 400px;
  background-color: #f9fafb;
  border-left: 1px solid #e5e7eb;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;

  .list-container {
    background-color: transparent;
    padding: 0;

    &.summary ul li { border-color: #3b82f6; }
    &.recommendations ul li { border-color: #10b981; }
    &.patterns ul li { border-color: #f59e0b; }

    .list-header {
      .material-icons {
        font-size: 1.75rem;
      }
    }
    
    &.summary .list-header { color: #3b82f6; }
    &.recommendations .list-header { color: #10b981; }
    &.patterns .list-header { color: #f59e0b; }
  }

  .no-insights-text {
    font-size: 0.9rem;
    color: #6b7280;
    padding: 12px;
    background-color: #ffffff;
    border-radius: 6px;
    text-align: center;
  }
}

.custom-dropdown {
  position: relative;
  width: 100%;
}

.user-search {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
}

.dropdown-list {
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-top: 4px;
  z-index: 1000;
  list-style: none;
  padding: 0;
}

.dropdown-list li {
  padding: 8px;
  cursor: pointer;
}

.dropdown-list li:hover,
.dropdown-list li.selected {
  background: #f3f4f6;
}


.summary-grid {
  display: grid;
  gap: 15px;
  margin-bottom: 30px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  
  i {
    color: #666;
  }
  
  span {
    font-size: 14px;
    color: #333;
  }
}

.gaps-section {
  h4 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
  }
}

.gap-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #fff3cd;
  border-radius: 6px;
  margin-bottom: 10px;
  
  .gap-time {
    font-weight: 600;
    color: #856404;
  }
  
  .gap-duration {
    color: #856404;
    font-size: 14px;
  }
}

/* Animations */
@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes alertSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .alert-container {
    margin: 16px;
    max-width: none;
    border-radius: 12px;
  }
  
  .alert-header {
    padding: 20px 20px 0 20px;
  }
  
  .alert-content {
    padding: 16px 20px 0 20px;
  }
  
  .alert-actions {
    padding: 8px;
    flex-direction: column-reverse;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
  
  .alert-title {
    font-size: 18px;
  }
}



.issues-recommendations-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.list-container {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 20px;

  .list-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #374151;

    .material-icons {
      font-size: 1.5rem;
    }

    h4 {
      font-size: 1.125rem;
      font-weight: 500;
      margin: 0;
    }
  }

  &.issues {
    .list-header {
      color: #d97706; // amber-600
    }
  }
  &.recommendations {
    .list-header {
      color: #1d4ed8; // blue-700
    }
  }

  ul {
    list-style: none;
    padding-left: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;

    li {
      background-color: #ffffff;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid;
      font-size: 0.9rem;
      color: #4b5563;
    }
  }

  &.issues ul li {
    border-color: #f59e0b; // amber-500
  }
  &.recommendations ul li {
    border-color: #3b82f6; // blue-500
  }
}

// Responsive adjustments
@media (max-width: 992px) {
  .health-content-grid,
  .issues-recommendations-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .device-health-card .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Checkin Timeline Side Panel Styles */
.checkin-timeline-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  animation: fadeIn 0.3s ease;
  cursor: pointer;
}

.checkin-timeline-sidepanel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 600px;
  max-width: 90vw;
  background: white;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideInFromRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: default;
  overflow: hidden;
}

.checkin-timeline-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.checkin-timeline-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  margin-right: 16px;
}

.checkin-timeline-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.checkin-timeline-title {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.checkin-timeline-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f7f8fa;
}

.checkin-summary-box {
  background: white;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 5;
}

.checkin-summary-item {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  background: #f7f8fa;
}

.summary-label {
  display: block;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.checkin-timeline-list {
  padding: 24px;
}

.checkin-event-card {
  display: flex;
  gap: 20px;
  margin-bottom: 0;
  position: relative;
}

.checkin-event-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.checkin-event-number {
  width: 40px;
  height: 40px;
  background: white;
  border: 3px solid #667eea;
  color: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  z-index: 2;
}

.checkin-event-line {
  position: absolute;
  top: 40px;
  bottom: -24px;
  width: 2px;
  background: #e0e0e0;
  left: 50%;
  transform: translateX(-50%);
}

.checkin-event-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.checkin-event-content:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateX(-4px);
}

.checkin-event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.checkin-event-type {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.checkin-event-type i {
  font-size: 16px;
}

.checkin-event-type.type-attendance_start {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.checkin-event-type.type-attendance_stop {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.checkin-event-type.type-checkin {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.checkin-event-time {
  font-size: 13px;
  color: #999;
  font-weight: 500;
}

.checkin-event-description {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.checkin-event-details,
.checkin-event-location {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.checkin-event-details i,
.checkin-event-location i {
  font-size: 16px;
  color: #999;
  margin-top: 2px;
}

.checkin-event-distance {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  align-items: center;
}

.distance-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #f0f8ff;
  border-radius: 16px;
  font-size: 12px;
  color: #1976d2;
  font-weight: 600;
}

.distance-badge i {
  font-size: 14px;
}

.cumulative-badge {
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .checkin-timeline-sidepanel {
    width: 100%;
    max-width: 100%;
  }
  
  .checkin-summary-box {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* Scrollbar styling for the side panel */
.checkin-timeline-content::-webkit-scrollbar {
  width: 6px;
}

.checkin-timeline-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.checkin-timeline-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.checkin-timeline-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
// Modern Permissions Section Styles
.permissions-section {
  width: 100%;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  
  .permissions-container {
    max-width: 1600px;
    margin: 0 auto;
  }

  // Modern Header
  .permissions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    padding: 1.5rem 2rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
    
    h2 {
      color: #1e293b;
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .date-info {
      color: #64748b;
      font-size: 0.95rem;
      font-weight: 500;
      padding: 0.5rem 1rem;
      background: rgba(100, 116, 139, 0.1);
      border-radius: 12px;
    }
  }

  // Modern Layout Grid
  .permissions-layout {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 2rem;
    height: 75vh;
  }

  // Modernized Sidebar
  .hourly-sidebar {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow-y: auto;
    
    h3 {
      margin: 0 0 1.5rem 0;
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .hours-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .hour-item {
      padding: 1rem;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
      background: rgba(248, 250, 252, 0.8);
      
      &:hover {
        background: rgba(241, 245, 249, 0.9);
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      
      &.active {
        color: white;
        border-color: #6366f1;
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
        transform: translateY(-2px);
        
        .hour-time, .hour-count, .battery-level, .issues-count {
          color: rgba(255, 255, 255, 0.95);
        }
        
        .hour-count {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .critical-badge {
          background: rgba(239, 68, 68, 0.9);
        }
      }
      
      .hour-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        
        .hour-time {
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }
        
        .hour-count {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      }
      
      .hour-battery {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        
        .material-icons {
          font-size: 18px;
        }
        
        .battery-level {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
        }
      }
      
      .hour-issues {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        .issues-count {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
          
          &.critical {
            color: #ef4444;
            font-weight: 600;
          }
        }
        
        .critical-badge {
          background: #ef4444;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 600;
          align-self: flex-start;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
      }
    }
  }

  // Modern Details Panel
  .permissions-details {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow-y: auto;
    
    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      
      h3 {
        margin: 0;
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 600;
      }
      
      .hour-summary {
        display: flex;
        gap: 1rem;
        
        .summary-badge {
          padding: 0.5rem 1rem;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          
          &.total {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            color: #475569;
          }
          
          &.good { 
            background: linear-gradient(135deg, #dcfce7, #bbf7d0);
            color: #15803d;
          }
          
          &.warning { 
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            color: #d97706;
          }
          
          &.critical { 
            background: linear-gradient(135deg, #fee2e2, #fecaca);
            color: #dc2626;
          }
          
          &.issues.critical { 
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
          }
        }
      }
    }
    
    .issues-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .issue-record {
      display: grid;
      grid-template-columns: 80px 140px 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
      background: rgba(248, 250, 252, 0.8);
      border-radius: 16px;
      border-left: 4px solid #cbd5e1;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: white;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      
      &.critical {
        border-left-color: #ef4444;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(254, 226, 226, 0.8));
        
        &:hover {
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
        }
      }
      
      .record-time {
        .time {
        
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 600;
          background: rgba(100, 116, 139, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
        }
      }
      
      .battery-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        
        .material-icons {
          font-size: 24px;
        }
        
        .battery-text {
          font-weight: 600;
          font-size: 0.95rem;
        }
      }
      
      .issues-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        
       
      }
       .issue-chip {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
          
          .material-icons {
            font-size: 14px;
          }
          
          &:hover {
            transform: translateY(-1px);
          }
          
          &.red {
            background: linear-gradient(135deg, #fee2e2, #fecaca);
            color: #dc2626;
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
          }
          
          &.orange {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            color: #d97706;
            box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2);
          }
          
          &.gray {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            color: #64748b;
            box-shadow: 0 2px 8px rgba(100, 116, 139, 0.1);
          }
        }
      
      .no-issues {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #059669;
        font-size: 0.875rem;
        font-weight: 500;
        
        .material-icons.good {
          color: #059669;
          font-size: 18px;
        }
      }
    }
    
    .no-hour-data {
      text-align: center;
      padding: 3rem;
      color: #64748b;
      
      .material-icons {
        font-size: 48px;
        margin-bottom: 1rem;
        opacity: 0.6;
        color: #94a3b8;
      }
      
      p {
        font-size: 1.1rem;
        font-weight: 500;
      }
    }
  }

  // No Data State
  .no-permissions-data {
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    
    .material-icons {
      font-size: 64px;
      margin-bottom: 1.5rem;
      color: #94a3b8;
      opacity: 0.7;
    }
    
    h3 {
      margin-bottom: 0.75rem;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    p {
      font-size: 1rem;
      line-height: 1.6;
      color: #64748b;
    }
  }
}

// Modern Responsive Design
@media (max-width: 1200px) {
  .permissions-section .permissions-layout {
    grid-template-columns: 300px 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .permissions-section {
    padding: 1rem;
    
    .permissions-layout {
      grid-template-columns: 1fr;
      height: auto;
      gap: 1rem;
    }
    
    .hourly-sidebar {
      height: 200px;
      
      .hours-list {
        flex-direction: row;
        overflow-x: auto;
        gap: 0.75rem;
        padding-bottom: 0.5rem;
        
        .hour-item {
          min-width: 140px;
          flex-shrink: 0;
        }
      }
    }
    
    .permissions-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .issue-record {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
}

  .aurora-battery-section {
      display: flex;
      align-items: center;
      justify-content: center;

      .aurora-battery-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;

        .aurora-battery-shell {
          width: 33px;
          height: 60px;
          border: 3px solid #10b981;
          border-radius: 8px;
          position: relative;
          background: rgba(241, 245, 249, 0.8);

          .aurora-battery-core {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 4px;
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;

            &::before,
            &::after {
              content: "";
              position: absolute;
              width: 200%;
              height: 200%;
              top: 0;
              left: 50%;
              background: rgba(255, 255, 255, 0.25);
              transform-origin: 50% 50%;
            }

            &::before {
              border-radius: 45%;
              animation: wave-animation 7s linear infinite;
            }

            &::after {
              border-radius: 40%;
              animation: wave-animation 13s linear infinite;
              opacity: 0.7;
            }
          }

          .aurora-battery-tip {
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 6px;
            border-radius: 2px;
          }

          .aurora-battery-percent {
            position: absolute;
            z-index: 2;
            font-size: 1rem;
            font-weight: 700;
            text-align: center;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        }
      }
    }

@keyframes wave-animation {
  0% {
    transform: translate(-50%, -75%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -75%) rotate(360deg);
  }
}

`]

})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('trackingMap') mapElement: ElementRef;
  userList: any[] = [];
  selectedUserId: string = '';
  isLoadingUsers: boolean = false;
  showCheckinAlert: boolean = false;
  activeTab: string = 'live';
  isLoading: boolean = false;
  isMapLoading: boolean = false;
  private chartId = 'analyticsChart';
  permissionsData: any = {};
permissionsList: any[] = [];
groupedPermissions: any = {};
selectedHour: string = '';
hourlyStats: any = {};
summarizeData: any = {}; 

  showTimelineMap: boolean = false;
  timelineMapView: any;
  private chart: any;
  private _isSidebarVisible: boolean = false;

  get isSidebarVisible(): boolean {
    return this._isSidebarVisible;
  }

  set isSidebarVisible(value: boolean) {
    if (this._isSidebarVisible !== value) {
      this._isSidebarVisible = value;
      this.toggleFullScreen(value);
      this.onFullscreenToggle();
    }
  }


  // Live Users Tracking Properties
  liveUsersData: any[] = [];
  liveUsersMarkers: any[] = [];
  liveUsersUpdateInterval: any;
  showUsersList: boolean = true;
  selectedLiveUsers: Set<string> = new Set();

  timelineEvents: any[] = [];
  timelineData: any = {};

  // Add these at the top of your class with other properties
  private liveTrackingInterval: any;
  private currentLiveMarker: any;
  private previousPosition: [number, number] | null = null;
  private isAnimating: boolean = false;

  // TrackPlayer properties
  private trackPlayer: any;
  private trackPlayerInterval: any;
  private trackPlayerPoints: any[] = [];

  employeeData: EmployeeData = {
    name: '',
    employee_id: '',
    contact_01: ''
  };

  locationData: LocationData[] = [];
  latestLocation: LatestLocation = {
    lat: 0,
    lng: 0,
    gps: '',
    time: '',
    total_checkin: 0
  };

  attendanceSummary: LocationData[] = [];
  checkinData: LocationData[] = [];

  trackingAccuracy: TrackingAccuracy = {
    background: 0,
    virtual: 0
  };

  map: any;
  locationMarkers: LocationData[] = [];
  roadRoute: any; // This will hold the road-based route
  routingControl: any;
  trackingInterval: any;

  selectedDate: string = moment().format('YYYY-MM-DD');
  maxDate: string = moment().format('YYYY-MM-DD');
  totalDistance: string = '0';
  locationDistance: string = '0';

  playbackControl: PlaybackControl;
  playbackStatus: string = 'stopped';
  playbackProgress: number = 0;
  playbackSpeed: number = 1000;
  showSpeedControl: boolean = false;
  playbackMarker: any;
  playbackInterval: any;
  roadRouteCoordinates: [number, number][] = []; // Store road route coordinates
  currentPlaybackIndex: number = 0; // Track current position in route

  batteryData: number[] = [];
  batteryTimeLabels: string[] = [];
  batteryChart: any;

  payload: any = {};
  userId: string = '';
  playbackDateTime: any;
  total_distance: any;
  debugFlag: any = false;
  
  snapToRoad: boolean = false;
  end_point: any;
  start_point: any;
  activeTime: any;
  missingPermissionsCount: number = 0;
  missingPermissions: string[] = [];
  oldFlag: any = false;
  userLocationsData: any;
  timeline_gaps: any;
  checkin: any; 
  attendanceData: any;
  url: any;
  userListing: boolean = false;
  checkinKM: any;
  timelineCheckin: any;
  summaryTimelineCheckin: any;
  dateTimeKM: any; // Add this property for TrackPlayer
  liveTrackPlayer: any;
  downurl: any = '';
  timelineInsights: any;
  // Sales & Performance KPIs
  TC: any;
  PC: any;
  secondary_sale_amount: any;
  New_Counter: any;
  New_counter_TC: any;
  New_counter_PC: any;
  counter_primary_Value: any;
  counter_secondary_Value: any;
  showMoreKpis: boolean = false;
  baseLat: any;
  baseLng: any;
  attendanceVariation: any;
  showPermissionsDisclaimer: boolean=false;
  
// showGpsTooltip: boolean = false;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public service: DatabaseService,
    public dialogs: MatDialog,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
     this.downurl = service.uploadUrl;
    this.initializePlaybackControl();
    this.url = this.service.uploadUrl;
  }

  ngAfterViewInit(): void {
    // this.renderChart();
  }

  ngOnInit(): void {
    this.loadRouteParams();

    this.activeTab = 'liveusers';

    if (this.selectedUserId || this.payload.user_id) {
      this.initializeData();
    }

    this.loadUsersList();
    this.switchTab('liveusers');
  }

  ngOnDestroy(): void {
    if (this.trackPlayer) {
      this.trackPlayer.pause();
      this.trackPlayer.remove();
      this.trackPlayer = null;
    }
    if (this.liveTrackPlayer) {
      this.liveTrackPlayer.pause();
      this.liveTrackPlayer.remove();
      this.liveTrackPlayer = null;
    }
    if (this.map) {
      this.map.remove();
    }
    if (this.liveUsersMap) {
      this.liveUsersMap.remove();
    }
    this.clearIntervals();
  }

  showCheckinTimeline(): void {
    if (this.timelineCheckin && this.timelineCheckin.length > 0) {
      this.showCheckinAlert = true;
    }
  }

  // Add method to close the alert
  closeCheckinAlert(): void {
    this.showCheckinAlert = false;
  }

  isToday(): boolean {
    return moment(this.selectedDate).isSame(moment(), 'day');
  }

  private renderChart(): void {
    console.log("line 141");

    // Use the component's chartId property
    const chartContainer = document.getElementById(this.chartId);
    if (!chartContainer) {
      console.error('Chart container not found. Element ID:', this.chartId);
      return;
    }

    const myConfig = {
      type: "line",
      utc: true,
      plotarea: {
        margin: "dynamic 45 60 dynamic",
      },
      legend: {
        layout: "float",
        backgroundColor: "none",
        borderWidth: 0,
        shadow: 0,
        align: "center",
        adjustLayout: true,
        toggleAction: "none", // <-- disables remove/hide toggle
        item: {
          padding: 7,
          marginRight: 17,
          cursor: "default" // no pointer effect
        }
      },
      scaleX: {
        minValue: new Date().setHours(8, 0, 0, 0), // start 8:00 AM
        maxValue: new Date().setHours(23, 30, 0, 0), // end 11:30 PM
        step: 3600000,
        transform: {
          type: "date",
          all: "%h:%i %A",
        },
        label: { visible: false },
        minorTicks: 0
      },
      scaleY: {
        minValue: 0,
        maxValue: 100,
        step: 10,
        lineColor: "#f6f7f8",
        shadow: 0,
        guide: {
          lineStyle: "dashed"
        },
        label: {
          text: "Battery %"
        },
        minorTicks: 0
      },
      crosshairX: {
        lineColor: "#efefef",
        plotLabel: {
          borderRadius: "5px",
          borderWidth: "1px",
          borderColor: "#f6f7f8",
          padding: "10px",
          fontWeight: "bold"
        },
        scaleLabel: {
          fontColor: "#000",
          backgroundColor: "#f6f7f8",
          borderRadius: "5px"
        }
      },
      tooltip: {
        visible: true,
        text: "%v%" // <-- only value with percentage
      },
      plot: {
        highlight: true,
        tooltipText: "%v%",
        shadow: 0,
        lineWidth: "2px",
        marker: {
          type: "circle",
          size: 3
        },
        highlightState: {
          lineWidth: 3
        },
        animation: {
          effect: 1,
          sequence: 2,
          speed: 100,
        }
      },
      series: [{
        values: [85, 82, 78, 75, 72, 69, 65, 60, 55], // battery % values
        lineColor: "#007790",
        marker: {
          backgroundColor: "#007790",
          borderWidth: 1,
          borderColor: "#69dbf1"
        },
        highlightMarker: {
          size: 6,
          backgroundColor: "#007790"
        },
        text: "" // <-- no legend text
      }]
    };

    try {
      // Destroy existing chart if it exists
      if (this.chart) {
        zingchart.exec(this.chartId, 'destroy');
      }

      // Render the chart
      this.chart = zingchart.render({
        id: this.chartId,
        data: myConfig,
        height: '400px', // Set explicit height instead of '100%'
        width: '100%'
      });

      console.log("Chart rendered successfully");
    } catch (error) {
      console.error("Error rendering chart:", error);
    }
  }

  private loadRouteParams(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      console.log('Route params:', params)
      if (params) {
        this.payload = params;
        this.userId = params.user_id || '';
        this.selectedUserId = params.user_id || '';
        this.selectedDate = params.start_date || moment().format('YYYY-MM-DD');
      }
    });
  }

  private initializeData(): void {
    this.isLoading = true;
    setTimeout(() => {
      // this.loadEmployeeData();
      this.loadLocationData();
      this.UserInformation();
      this.UserInformationDetail();
      this.loadTrackingAccuracy();
      this.loadLocationTimeLine();
      this.loadGetDayActivityTimeline()
       this.loadGetPermissionReport()
    }, 1000);
  }

  private calculateTotalDistance(): void {
    let distance = 0;
    for (let i = 1; i < this.locationData.length; i++) {
      distance += parseFloat(this.locationData[i].distance_from_last || '0');
    }
    this.totalDistance = distance.toFixed(1);
    this.locationDistance = this.totalDistance;
  }

 

  private loadTrackingAccuracy(): void {
    this.trackingAccuracy = {
      background: 85,
      virtual: 92
    };
  }

  private loadAttendanceSummary(): void {
    this.attendanceSummary = this.locationData.filter(loc =>
      loc.type === 'Attendence Start' || loc.type === 'Checkin'
    );
  }

  switchTab(tab: string): void {
    // Clear live tracking interval when switching away from live
    if (this.activeTab === 'live' && tab !== 'live') {
      if (this.liveTrackingInterval) {
        clearInterval(this.liveTrackingInterval);
        this.liveTrackingInterval = null;
      }
    }

    this.activeTab = tab;
    switch (tab) {
      case 'live':
        if (this.isToday()) {
          this.initializeLiveMap();
        }
        break;
      case 'route':
        this.initializeRouteMap();
        break;
      case 'playback':
        this.initializePlaybackMap();
        break;
      case 'health':
        break;
      case 'liveusers':
        this.initializeLiveUsersMap();
        break;
      case 'timeline':
        this.loadLocationTimeLine();
        setTimeout(() => {
          this.initializeTimelineMapView();
        }, 500);
        break;
         case 'permissions':
      this.loadGetPermissionReport();
      break;
    }
  }

  private async initializeRouteMap(): Promise<void> {
    console.log("Initializing route map")

    setTimeout(async () => {
      if (this.map) {
        this.destroyExistingMap();
      }

      // Create map
      this.map = L.map('trackingMap').setView([this.latestLocation.lat, this.latestLocation.lng], 12);

      // Add tile layer
      L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(this.map);

      // Get road route and draw it
      await this.drawRoadRoute();

      // Add markers for all locations
      // if (this.debugFlag == true) {
      this.addLocationMarkers();
      // }

      // Fit map to show the route
      this.fitMapToBounds();

      this.isMapLoading = false;
    }, 500);
  }

  private async initializeLiveMap(): Promise<void> {
    console.log("line 425")
    if (!this.isToday()) {
      this.switchTab('route');
      return;
    }
    setTimeout(async () => {
      if (this.map) {
        this.destroyExistingMap();
      }

      // Create map
      this.map = L.map('trackingMap').setView([this.latestLocation.lat, this.latestLocation.lng], 12);

      // Add tile layer
      L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(this.map);

      // Get road route and draw it
      await this.drawRoadRoute();

      // Add markers for all locations
      // if (this.debugFlag == true) {
      this.addLocationMarkers();
      // }

      // Create live tracking marker
      if (this.locationMarkers.length > 0) {
        const lastPoint = this.locationMarkers[this.locationMarkers.length - 1];


        this.previousPosition = [lastPoint.lat, lastPoint.lng];
      }

      // Start live tracking interval
      if (this.liveTrackingInterval) {
        clearInterval(this.liveTrackingInterval);
      }

      this.liveTrackingInterval = setInterval(() => {
        this.fetchAndUpdateLiveLocation();
      }, 10000); // Update every 10 seconds

      // Fit map to show the route
      this.fitMapToBounds();

      this.isMapLoading = false;
    }, 500);
  }

  private fetchAndUpdateLiveLocation(): void {
    const userIdToUse = this.selectedUserId || this.payload.user_id;

    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationProcess/getDailyReportCalculated")
      .subscribe((result => {
        if (result.route.points.length > 0) {
          const newLocationMarkers = result.route.points;
          const latestPoint = newLocationMarkers[newLocationMarkers.length - 1];
          const newPosition: [number, number] = [latestPoint.lat, latestPoint.lng];

          // Check if position has changed
          if (this.previousPosition &&
            (this.previousPosition[0] !== newPosition[0] ||
              this.previousPosition[1] !== newPosition[1])) {

            // Animate marker to new position
            this.animateMarkerMovement(newPosition);

            // Update route if there are new points
            if (newLocationMarkers.length > this.locationMarkers.length) {
              this.locationMarkers = newLocationMarkers;
              this.updateLiveRoute();
            }
          }

          // Update total distance if changed
          if (result.route.distance_km) {
            this.total_distance = result.route.distance_km;
          }
        }
      }));
  }

  private animateMarkerMovement(newPosition: [number, number]): void {
    if (!this.currentLiveMarker || !this.previousPosition || this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    const startPosition = this.previousPosition;
    const duration = 9000; // 9 seconds (leaving 1 second buffer before next update)
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in-out interpolation
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const lat = startPosition[0] + (newPosition[0] - startPosition[0]) * easeProgress;
      const lng = startPosition[1] + (newPosition[1] - startPosition[1]) * easeProgress;

      this.currentLiveMarker.setLatLng([lat, lng]);

      // Pan map to follow marker (optional)
      if (progress === 1) {
        this.map.panTo([lat, lng], { animate: true, duration: 0.5 });
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.previousPosition = newPosition;
        this.isAnimating = false;
      }
    };

    requestAnimationFrame(animate);
  }

  private updateLiveRoute(): void {
    if (!this.roadRoute || !this.map) return;

    // Generate new interpolated route
    const waypoints: [number, number][] = this.locationMarkers.map(
      (marker): [number, number] => [marker.lat, marker.lng]
    );

    const newRouteCoordinates = this.interpolateRoute(waypoints);

    // Update the existing route
    this.roadRoute.setLatLngs(newRouteCoordinates);
    this.roadRouteCoordinates = newRouteCoordinates;

    // Update end marker position - FIXED VERSION
    const lastIndex = this.locationMarkers.length - 1;
    const endMarkerIcon = L.icon({
      iconUrl: 'assets/mapIcon/person1.png',
      iconSize: [45, 45],
      iconAnchor: [22, 22],
      popupAnchor: [0, -20]
    });

    // Safer way to remove old end marker
    this.map.eachLayer((layer: any) => {
      // Check if layer exists and has the necessary properties
      if (layer &&
        layer.options &&
        layer.options.icon &&
        layer.options.icon.options &&
        layer.options.icon.options.iconUrl === 'assets/mapIcon/person1.png') {
        this.map.removeLayer(layer);
      }
    });

    // Add new end marker
    L.marker([this.locationMarkers[lastIndex].lat, this.locationMarkers[lastIndex].lng], {
      icon: endMarkerIcon
    }).addTo(this.map);
  }

  // UPDATED PLAYBACK MAP WITH TRACKPLAYER
  private async initializePlaybackMap(): Promise<void> {
    if (!this.locationMarkers.length) return;

    this.isMapLoading = true;
    setTimeout(async () => {
      this.destroyExistingMap();

      // Create map
      this.map = L.map('trackingMap').setView([this.locationMarkers[0].lat, this.locationMarkers[0].lng], 12);

      // Add tile layer
      L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(this.map);

     

      // Add location markers
      this.addLocationMarkers();

      // Initialize TrackPlayer
      this.initializeTrackPlayer();

      // Fit map to show all points
      this.fitMapToBounds();

      this.isMapLoading = false;
    }, 500);
  }

  // NEW TRACKPLAYER METHODS
  private initializeTrackPlayer(): void {
    // Prepare track points with datetime and distance info
    this.trackPlayerPoints = this.locationMarkers.map((marker, index) => ({
      lat: marker.lat,
      lng: marker.lng,
      dateTime: moment(marker.timestamp || marker.date_created).format('DD MMM YYYY, hh:mm a') + 
                ` (${marker.total_distance_from_start || '0'} KM)`
    }));

    // Remove existing track player if it exists
    if (this.trackPlayer) {
      this.trackPlayer.remove();
    }

    // Create TrackPlayer instance
    this.trackPlayer = new L.TrackPlayer(this.trackPlayerPoints, {
      markerIcon: L.icon({
        iconUrl: 'assets/mapIcon/person.png',
        iconSize: [45, 45],
        iconAnchor: [22, 22],
        popupAnchor: [0, -20]
      }),
      speed: 1000, // Default speed in ms
      markerRotation: true, // Enable rotation based on direction
      panTo: true // Pan map to follow marker
    }).addTo(this.map);

    // Initialize playback control
    this.playbackControl = {
      speed: this.trackPlayer.options.speed,
      progress: 0,
      status: 'stopped',
      start: () => this.startPlayback(),
      pause: () => this.pausePlayback()
    };

    // Set up TrackPlayer event listeners
    this.setupTrackPlayerEvents();
  }

  private setupTrackPlayerEvents(): void {
    // Track player started
    this.trackPlayer.on('start', () => {
      this.playbackStatus = 'playing';
      this.startProgressInterval();
    });

    // Track player paused
    this.trackPlayer.on('pause', () => {
      this.playbackStatus = 'paused';
      this.stopProgressInterval();
    });

    // Track player finished
    this.trackPlayer.on('finished', () => {
      this.playbackStatus = 'stopped';
      this.playbackProgress = 100;
      this.stopProgressInterval();
    });

    // Track player progress update
    this.trackPlayer.on('progress', (progress, location, index) => {
      this.playbackProgress = progress * 100;
      
      // Update datetime display based on progress
      if (index < this.locationMarkers.length) {
       const ts = this.locationMarkers[index].timestamp || this.locationMarkers[index].date_created;
    this.playbackDateTime = this.convertToIST(ts);

      }
      
      // Update any additional UI elements if needed
      this.dateTimeKM = location.dateTime;
    });
  }

private convertToIST(timestamp: string | number): string {
  const ts = Number(timestamp);           // ✅ ensure it's a number
  if (isNaN(ts)) return '';               // optional: handle invalid input
  return moment.unix(ts).utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss");
}


  // Replace existing startPlayback method
  startPlayback(): void {
    if (!this.trackPlayer) {
      console.warn('TrackPlayer not initialized');
      return;
    }

    // Start from current progress position
    if (this.playbackProgress > 0 && this.playbackProgress < 100) {
      this.trackPlayer.setProgress(this.playbackProgress / 100);
    }

    this.trackPlayer.start();
    this.playbackStatus = 'playing';
  }

  // Replace existing pausePlayback method
  pausePlayback(): void {
    if (!this.trackPlayer) return;
    
    this.trackPlayer.pause();
    this.playbackStatus = 'paused';
  }

  // Replace existing updateProgress method
  updateProgress(event: any): void {
    this.playbackProgress = parseFloat(event.target.value);
    
    if (this.trackPlayer) {
      this.trackPlayer.setProgress(this.playbackProgress / 100);
      
      // Update datetime based on progress
      const markerIndex = Math.floor((this.playbackProgress / 100) * (this.locationMarkers.length - 1));
      if (markerIndex < this.locationMarkers.length) {
        // this.playbackDateTime = moment(this.locationMarkers[markerIndex].timestamp || this.locationMarkers[markerIndex].date_created);

         const ts = this.locationMarkers[markerIndex].timestamp || this.locationMarkers[markerIndex].date_created;
    this.playbackDateTime = this.convertToIST(ts);
      }
    }
  }

  // Helper methods for progress interval
  private startProgressInterval(): void {
    this.stopProgressInterval(); // Clear any existing interval
    
    this.trackPlayerInterval = setInterval(() => {
      // Progress is automatically updated by TrackPlayer events
      // This interval can be used for any additional UI updates if needed
    }, 100);
  }

  private stopProgressInterval(): void {
    if (this.trackPlayerInterval) {
      clearInterval(this.trackPlayerInterval);
      this.trackPlayerInterval = null;
    }
  }

  // Add formatLabel method for speed control
  formatLabel(value: number): string {
    if (this.trackPlayer) {
      this.trackPlayer.setSpeed(value);
    }
    return `${value}`;
  }

 

  // Add these properties to your MapComponent class
  private routeArrows: any[] = [];

  // Enhanced drawRoadRoute method
  private async drawRoadRoute(): Promise<void> {
    // Remove existing route if it exists
    if (this.roadRoute) {
      this.map.removeLayer(this.roadRoute);
    }

    // Remove existing arrows if they exist
    if (this.routeArrows && this.routeArrows.length > 0) {
      this.routeArrows.forEach(arrow => this.map.removeLayer(arrow));
      this.routeArrows = [];
    }
    console.log(this.locationMarkers,"line 881")

    if (this.locationMarkers.length > 1) {
      const waypoints: [number, number][] = this.locationMarkers.map(
        (marker): [number, number] => [marker.lat, marker.lng]
      );

      // Create interpolated points for smoother route
      this.roadRouteCoordinates = waypoints;

      // Create enhanced polyline with better styling
      this.roadRoute = L.polyline(this.roadRouteCoordinates, {
        color: '#013c6dff',
        weight: 3,
        opacity: 0.9,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);

      // Add direction arrows
      this.addDirectionArrows();

      this.addStartPointLocationMarker();

      this.addEndPointLocationMarker();
      this.addHomeLocation()

      console.log('Enhanced route created with', this.roadRouteCoordinates.length, 'points');
    }
  }

  // Interpolate points between waypoints for smoother route
  private interpolateRoute(waypoints: [number, number][]): [number, number][] {
    const interpolatedPoints: [number, number][] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      // Add the start point
      interpolatedPoints.push(start);

      // Calculate distance between points
      const distance = this.calculateDistance(start, end);

      // Add interpolated points based on distance (more points for longer segments)
      const numInterpolatedPoints = Math.max(2, Math.floor(distance * 10)); // 10 points per km

      for (let j = 1; j < numInterpolatedPoints; j++) {
        const ratio = j / numInterpolatedPoints;
        const lat = start[0] + (end[0] - start[0]) * ratio;
        const lng = start[1] + (end[1] - start[1]) * ratio;
        interpolatedPoints.push([lat, lng]);
      }
    }

    // Add the final point
    interpolatedPoints.push(waypoints[waypoints.length - 1]);

    return interpolatedPoints;
  }

  // Add direction arrows along the route
  private addDirectionArrows(): void {
    if (!this.routeArrows) {
      this.routeArrows = [];
    }

    const arrowSpacing = Math.max(5, Math.floor(this.roadRouteCoordinates.length / 15)); // Dynamic spacing
    const arrowSize = 15;

    for (let i = 0; i < this.roadRouteCoordinates.length - arrowSpacing; i += arrowSpacing) {
      const startPoint = this.roadRouteCoordinates[i];
      const endPoint = this.roadRouteCoordinates[Math.min(i + arrowSpacing, this.roadRouteCoordinates.length - 1)];

      // Calculate bearing/angle for arrow direction
      const bearing = this.calculateRouteBearing(startPoint[0], startPoint[1], endPoint[0], endPoint[1]);

      // Create arrow marker
      const arrowIcon = L.divIcon({
        html: this.createArrowSVG(bearing),
        className: 'route-arrow',
        iconSize: [arrowSize, arrowSize],
        iconAnchor: [arrowSize / 2, arrowSize / 2]
      });

      const arrowMarker = L.marker([startPoint[0], startPoint[1]], {
        icon: arrowIcon,
        interactive: false
      }).addTo(this.map);

      this.routeArrows.push(arrowMarker);
    }
  }

  // Create SVG arrow pointing in the specified direction
  private createArrowSVG(bearing: number): string {
    return `
    <div style="transform: rotate(${bearing}deg); display: flex; align-items: center; justify-content: center;">
      <svg width="20" height="20" viewBox="0 0 24 24" style="filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));">
        <path d="M12 2 L20 10 L16 10 L16 22 L8 22 L8 10 L4 10 Z" 
              fill="#c40000ff" 
              stroke="red" 
              stroke-width="0.5"
              opacity="0.9"/>
      </svg>
    </div>
  `;
  }

  // Calculate bearing between two points (renamed to avoid conflict)
  private calculateRouteBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360

    return bearing;
  }

  

  // Enhanced version of your existing calculateDistance method
  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

private addLocationMarkers(): void {
  if (!this.checkin || this.checkin.length === 0) return;

  this.checkin.forEach((location, index) => {
    const markerColor = this.getMarkerColor(location.dr_type_name);

    const icon = L.divIcon({
      html: `<div style="background-color: ${markerColor}; color: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">${index + 1}</div>`,
      className: 'custom-numbered-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    // Find matching timeline data for this checkin
    const timelineData = this.findTimelineDataForCheckin(location);

    L.marker([location.start_lat, location.start_lng], { icon })
      .addTo(this.map)
      .bindPopup(this.createMarkerPopup(location, timelineData));
  });
}

private findTimelineDataForCheckin(checkin: any): any {
  if (!this.timelineCheckin || this.timelineCheckin.length === 0) return null;
  
  // Find timeline entry that matches this checkin by datetime or id
  return this.timelineCheckin.find(timeline => 
    timeline.type === 'checkin' && 
    (timeline.datetime === checkin.visit_start || 
     (timeline.details && timeline.details.checkin_id === checkin.id))
  );
}
  private addStartPointLocationMarker(): void {
    console.log("line 678")
    const icon = L.icon({
      iconUrl: 'assets/mapIcon/map-pin.png', // replace with your image path
      iconSize: [45, 45], // size of the icon
      iconAnchor: [22, 22], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -20] // adjust popup position
    });

    L.marker([this.locationMarkers[0].lat, this.locationMarkers[0].lng], { icon })
      .addTo(this.map);
  }
   private addHomeLocation(): void {
    console.log("line 678")
    const icon = L.icon({
      iconUrl: 'assets/mapIcon/home-address.png', // replace with your image path
      iconSize: [45, 45], // size of the icon
      iconAnchor: [22, 22], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -20] // adjust popup position
    });

    L.marker([this.baseLat, this.baseLng], { icon })
      .addTo(this.map);
  }

  private addEndPointLocationMarker(): void {
    const lastIndex = this.locationMarkers.length - 1;
    console.log("line 678")
    const icon = L.icon({
      iconUrl: 'assets/mapIcon/person1.png', // replace with your image path
      iconSize: [45, 45], // size of the icon
      iconAnchor: [22, 22], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -20] // adjust popup position
    });

    L.marker([this.locationMarkers[lastIndex].lat, this.locationMarkers[lastIndex].lng], { icon })
      .addTo(this.map);
  }

private getMarkerColor(type: string): string {
  const colorMap = {
    'Retailer': '#4CAF50',
    'Enquiry': '#2196F3',
    'Stockist': '#FF9800',
    'Distributor': '#9C27B0',
    'Dealer': '#00BCD4',
    'Contractor': '#FF5722',
    'Doctor': '#E91E63'
  };
  return colorMap[type] || '#757575';
}

private createMarkerPopup(checkin: any, timelineData: any = null): string {
  return `
    <div style="min-width: 300px; max-width: 400px; font-family: Arial, sans-serif;">
      <!-- Header Section -->
      <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 12px; border-radius: 8px 8px 0 0;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <i class="material-icons" style="font-size: 24px;">where_to_vote</i>
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${checkin.dr_name || 'Check-in Location'}</h3>
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
          <i class="material-icons" style="font-size: 14px; vertical-align: middle;">badge</i>
          ID: ${checkin.id}
        </div>
      </div>

      <!-- Main Content -->
      <div style="display: grid; gap: 10px;">
        
        <!-- Contact & Type Info -->
        <div style="background: #f5f5f5; padding: 10px; border-radius: 6px;">
          ${checkin.mobile ? `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <i class="material-icons" style="font-size: 18px; color: #4CAF50;">phone</i>
              <span style="font-size: 14px;"><strong>Mobile:</strong> ${checkin.mobile}</span>
            </div>
          ` : ''}
          ${checkin.dr_type_name ? `
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="material-icons" style="font-size: 18px; color: #FF9800;">category</i>
              <span style="font-size: 14px;"><strong>Type:</strong> ${checkin.dr_type_name}</span>
            </div>
          ` : ''}
        </div>

        <!-- Visit Timing with Distance from Timeline -->
        <div style="background: #e8f5e9; padding: 10px; border-radius: 6px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <i class="material-icons" style="font-size: 18px; color: #4CAF50;">login</i>
            <span style="font-size: 14px;"><strong>Check-in:</strong> ${moment(checkin.visit_start).format('DD MMM YYYY, hh:mm A')}</span>
          </div>
          ${checkin.visit_end ? `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <i class="material-icons" style="font-size: 18px; color: #f44336;">logout</i>
              <span style="font-size: 14px;"><strong>Check-out:</strong> ${moment(checkin.visit_end).format('DD MMM YYYY, hh:mm A')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; background: #fff; padding: 6px; border-radius: 4px; margin-bottom: 6px;">
              <i class="material-icons" style="font-size: 18px; color: #2196F3;">schedule</i>
              <span style="font-size: 14px;"><strong>Duration:</strong> ${this.calculateDuration(checkin.visit_start, checkin.visit_end)}</span>
            </div>
          ` : `
            <div style="background: #fff3e0; padding: 6px; border-radius: 4px; font-size: 13px; color: #f57c00; margin-bottom: 6px;">
              <i class="material-icons" style="font-size: 16px; vertical-align: middle;">info</i>
              Still checked in
            </div>
          `}
          
          ${timelineData && timelineData.distance_from_previous ? `
            <div style="border-top: 1px solid #c8e6c9; padding-top: 8px; margin-top: 4px;">
              <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #2e7d32;">
                <i class="material-icons" style="font-size: 16px; vertical-align: middle;">directions</i>
                Travel Information:
              </div>
              <div style="display: flex; align-items: center; gap: 8px; background: #fff; padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                <i class="material-icons" style="font-size: 16px; color: #4CAF50;">directions_car</i>
                <span style="font-size: 13px;"><strong>Distance:</strong> ${timelineData.distance_from_previous.formatted}</span>
              </div>
              ${timelineData.distance_from_previous.duration_formatted ? `
                <div style="display: flex; align-items: center; gap: 8px; background: #fff; padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                  <i class="material-icons" style="font-size: 16px; color: #4CAF50;">schedule</i>
                  <span style="font-size: 13px;"><strong>Travel Time:</strong> ${timelineData.distance_from_previous.duration_formatted}</span>
                </div>
              ` : ''}
              ${timelineData.distance_from_previous.speed_kmh ? `
                <div style="display: flex; align-items: center; gap: 8px; background: #fff; padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                  <i class="material-icons" style="font-size: 16px; color: #4CAF50;">speed</i>
                  <span style="font-size: 13px;"><strong>Avg Speed:</strong> ${timelineData.distance_from_previous.speed_kmh.toFixed(1)} km/h</span>
                </div>
              ` : ''}
              ${timelineData.distance_from_previous.segment ? `
                <div style="display: flex; align-items: center; gap: 8px; background: #fff; padding: 6px; border-radius: 4px;">
                  <i class="material-icons" style="font-size: 16px; color: #4CAF50;">route</i>
                  <span style="font-size: 13px;"><strong>Segment:</strong> ${timelineData.distance_from_previous.segment}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Address -->
        ${checkin.start_address ? `
          <div style="background: #fff3e0; padding: 10px; border-radius: 6px;">
            <div style="display: flex; align-items: flex-start; gap: 8px;">
              <i class="material-icons" style="font-size: 18px; color: #FF9800; margin-top: 2px;">location_on</i>
              <span style="font-size: 13px; line-height: 1.5; flex: 1;">${checkin.start_address}</span>
            </div>
          </div>
        ` : ''}

        <!-- Activities -->
        ${(checkin.order_flag || checkin.followup_flag || checkin.doc_flag || checkin.popgift_flag) ? `
          <div style="background: #f3e5f5; padding: 10px; border-radius: 6px;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #7B1FA2;">
              <i class="material-icons" style="font-size: 16px; vertical-align: middle;">assignment</i>
              Activities:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${checkin.order_flag ? '<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;"><i class="material-icons" style="font-size: 12px; vertical-align: middle;">shopping_cart</i> Order</span>' : ''}
              ${checkin.followup_flag ? '<span style="background: #2196F3; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;"><i class="material-icons" style="font-size: 12px; vertical-align: middle;">phone_in_talk</i> Follow-up</span>' : ''}
              ${checkin.doc_flag ? '<span style="background: #FF9800; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;"><i class="material-icons" style="font-size: 12px; vertical-align: middle;">description</i> Document</span>' : ''}
              ${checkin.popgift_flag ? '<span style="background: #E91E63; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;"><i class="material-icons" style="font-size: 12px; vertical-align: middle;">card_giftcard</i> Gift</span>' : ''}
            </div>
          </div>
        ` : ''}

        <!-- Coordinates -->
        <div style="background: #fafafa; padding: 8px; border-radius: 6px; font-size: 12px; color: #666;">
          <i class="material-icons" style="font-size: 14px; vertical-align: middle;">my_location</i>
          ${checkin.start_lat.toFixed(6)}, ${checkin.start_lng.toFixed(6)}
        </div>

      </div>
    </div>
  `;
}

// Helper function to calculate duration between two datetime strings
public calculateDuration(start: string, end: string): string {
  const startTime = moment(start);
  const endTime = moment(end);
  const duration = moment.duration(endTime.diff(startTime));
  
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}

// Helper function to format seconds to readable time
private formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}

  findCheckinById(checkinId: string): any {
    if (!this.checkin || !checkinId) return null;
    return this.checkin.find(c => c.id === checkinId);
  }


  private fitMapToBounds(): void {
    if (this.locationMarkers.length > 0) {
      const coords: [number, number][] = this.locationMarkers.map(
        (loc): [number, number] => [loc.lat, loc.lng]
      );
      const group = new L.featureGroup(coords.map(coord => L.marker(coord)));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  // Update destroyExistingMap to clean up TrackPlayer
  private destroyExistingMap(): void {
    // Stop and remove TrackPlayer
    if (this.trackPlayer) {
      this.trackPlayer.pause();
      this.trackPlayer.remove();
      this.trackPlayer = null;
    }
    
    // Clear interval
    this.stopProgressInterval();
    
    // Remove routing control if exists
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
    
    // Remove map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  toggleSpeedControl() {
    this.showSpeedControl = !this.showSpeedControl
  }

  playbackDelay = 1000; // default delay in ms

  // Replace existing updateSpeed method
  updateSpeed(event: any): void {
    console.log(event.target.value, "line 953")
    const sliderValue = parseInt(event.target.value, 10);
    this.playbackDelay = sliderValue;

    // Map slider [300–5000] → speed multiplier [5x–0.3x]
    const minDelay = 30;
    const maxDelay = 500;
    const minSpeed = 0.3;
    const maxSpeed = 5;

    const normalized = (sliderValue - minDelay) / (maxDelay - minDelay);
    this.playbackSpeed = maxSpeed - normalized * (maxSpeed - minSpeed);

    // Update TrackPlayer speed if it exists
    if (this.trackPlayer) {
      this.trackPlayer.setSpeed(sliderValue);
    }

    console.log('Delay (ms):', this.playbackDelay, 'Speed:', this.playbackSpeed);

    // If playback is currently running, restart with new speed
    if (this.playbackStatus === 'playing') {
      this.pausePlayback();
      setTimeout(() => {
        this.startPlayback();
      }, 100);
    }
  }

  // Initialize playback control with reasonable defaults
  private initializePlaybackControl(): void {
    this.playbackControl = {
      speed: 500, // Faster default for smoother road following
      progress: 0,
      status: 'stopped',
      start: () => this.startPlayback(),
      pause: () => this.pausePlayback()
    };

    this.playbackSpeed = 500; // 500ms intervals for smooth movement
  }

  // Preset speed controls
  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;

    if (this.playbackStatus === 'playing') {
      this.pausePlayback();
      setTimeout(() => {
        this.startPlayback();
      }, 100);
    }
  }

  private renderBatteryChart(): void {
    console.log('Battery chart data ready:', this.batteryData);
  }

  onDateChange(): void {
    this.isMapLoading = true;
    this.locationMarkers = [];

    // Clear live tracking if switching away from today
    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
      this.liveTrackingInterval = null;
    }

    console.log(this.selectedDate, "Date changed");
    this.loadLocationData();
    this.UserInformation();
    this.UserInformationDetail();
    this.loadGetDayActivityTimeline()
    this.loadGetPermissionReport()

    // Reset playback state
    this.roadRouteCoordinates = [];
    this.currentPlaybackIndex = 0;
  }

  refreshData(): void {
    // this.isLoading = true;
    this.isMapLoading = true;
    this.locationMarkers = []
    // Reset route data
    this.roadRouteCoordinates = [];
    this.currentPlaybackIndex = 0;

    setTimeout(() => {
      this.initializeData();
      if (this.activeTab === 'live' || this.activeTab === 'playback') {
        this.switchTab(this.activeTab);
      }
    }, 1000);
  }

  getMarkerClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'Checkin': 'checkin',
      'Checkout': 'checkout',
      'Attendence Start': 'attendance',
      'Current Position': 'current',
      'Checkpoint': 'checkpoint',
      'Background': 'background'
    };
    return classMap[type] || 'background';
  }

  getMarkerIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'Checkin': 'where_to_vote',
      'Checkout': 'pin_drop',
      'Attendence Start': 'play_arrow',
      'Current Position': 'my_location',
      'Checkpoint': 'place',
      'Background': 'person_pin_circle'
    };
    return iconMap[type] || 'place';
  }

  formatLocationTypeName(type: string): string {
    return type.replace('_', ' ');
  }



  getHealthScoreClass(score: number | string): string {
    const numericScore = Number(score);
    if (numericScore >= 80) return 'score-good';
    if (numericScore >= 50) return 'score-medium';
    return 'score-poor';
  }

  getCheckinTime(record: LocationData): string | null {
    return record.timestamp;
  }

  getCheckoutTime(record: LocationData): string | null {
    return record.visit_end || null;
  }

  // Update clearIntervals method
  private clearIntervals(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
    }
    // Clear live tracking interval
    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
      this.liveTrackingInterval = null;
    }
    // Clear TrackPlayer interval
    this.stopProgressInterval();
  }

  // Reset playback to beginning
  resetPlayback(): void {
    if (!this.trackPlayer) {
      // If no TrackPlayer, use old method
      this.pausePlayback();
      this.playbackProgress = 0;
      this.currentPlaybackIndex = 0;

      if (this.playbackMarker && this.roadRouteCoordinates.length > 0) {
        const startPoint = this.roadRouteCoordinates[0];
        this.playbackMarker.setLatLng([startPoint[0], startPoint[1]]);
        this.playbackDateTime = moment(this.locationMarkers[0].timestamp);
      }
      return;
    }

    // Use TrackPlayer reset
    this.pausePlayback();
    this.playbackProgress = 0;
    this.trackPlayer.setProgress(0);
    
    if (this.locationMarkers.length > 0) {
      this.playbackDateTime = moment(this.locationMarkers[0].timestamp || this.locationMarkers[0].date_created);
    }
  }

  // Jump to specific location marker
  jumpToMarker(markerIndex: number): void {
    if (markerIndex < 0 || markerIndex >= this.locationMarkers.length) return;

    const targetMarker = this.locationMarkers[markerIndex];

    // Calculate approximate progress based on marker position
    const progressRatio = markerIndex / (this.locationMarkers.length - 1);
    this.playbackProgress = progressRatio * 100;

    // If TrackPlayer exists, use it
    if (this.trackPlayer) {
      this.trackPlayer.setProgress(progressRatio);
    } else {
      // Find closest point on road route
      if (this.roadRouteCoordinates.length > 0) {
        this.currentPlaybackIndex = Math.floor(progressRatio * (this.roadRouteCoordinates.length - 1));

        if (this.playbackMarker) {
          const routePoint = this.roadRouteCoordinates[this.currentPlaybackIndex];
          this.playbackMarker.setLatLng([routePoint[0], routePoint[1]]);
        }
      }
    }

    // Update datetime
    this.playbackDateTime = moment(targetMarker.timestamp || targetMarker.date_created);

    // Pan map to location
    this.map.panTo([targetMarker.lat, targetMarker.lng], {
      animate: true,
      duration: 1
    });
  }

  // Get current playback location info
  getCurrentPlaybackInfo(): any {
    if (this.roadRouteCoordinates.length === 0 || this.currentPlaybackIndex >= this.roadRouteCoordinates.length) {
      return null;
    }

    const currentPoint = this.roadRouteCoordinates[this.currentPlaybackIndex];
    const progressRatio = this.playbackProgress / 100;

    // Find nearest location marker
    let nearestMarkerIndex = Math.floor(progressRatio * (this.locationMarkers.length - 1));
    nearestMarkerIndex = Math.min(nearestMarkerIndex, this.locationMarkers.length - 1);

    return {
      coordinates: currentPoint,
      progress: this.playbackProgress,
      timestamp: this.playbackDateTime,
      nearestMarker: this.locationMarkers[nearestMarkerIndex],
      routeIndex: this.currentPlaybackIndex
    };
  }

  // Add method to export tracking data
  exportTrackingData(): any {
    return {
      employee: this.employeeData,
      locations: this.locationMarkers,
      route: this.roadRouteCoordinates,
      totalDistance: this.totalDistance,
      trackingAccuracy: this.trackingAccuracy,
      date: this.selectedDate,
      exportedAt: moment().toISOString()
    };
  }

  // Add method to get route statistics
  getRouteStatistics(): any {
    if (this.roadRouteCoordinates.length < 2) return null;

    let totalRouteDistance = 0;
    for (let i = 1; i < this.roadRouteCoordinates.length; i++) {
      const prev = this.roadRouteCoordinates[i - 1];
      const curr = this.roadRouteCoordinates[i];

      // Use the helper method for distance calculation
      totalRouteDistance += this.calculateDistance(prev, curr);
    }

    return {
      totalPoints: this.roadRouteCoordinates.length,
      calculatedDistance: totalRouteDistance.toFixed(2) + ' km',
      reportedDistance: this.totalDistance + ' km',
      averageSpeed: this.calculateAverageSpeed(),
      duration: this.calculateTotalDuration()
    };
  }

  private calculateAverageSpeed(): string {
    if (this.locationMarkers.length < 2) return '0 km/h';

    const startTime = moment(this.locationMarkers[0].timestamp || this.locationMarkers[0].date_created);
    const endTime = moment(this.locationMarkers[this.locationMarkers.length - 1].timestamp || this.locationMarkers[this.locationMarkers.length - 1].date_created);
    const durationHours = endTime.diff(startTime, 'hours', true);

    if (durationHours === 0) return '0 km/h';

    const avgSpeed = parseFloat(this.totalDistance) / durationHours;
    return avgSpeed.toFixed(1) + ' km/h';
  }

  private calculateTotalDuration(): string {
    if (this.locationMarkers.length < 2) return '0 minutes';

    const startTime = moment(this.locationMarkers[0].timestamp || this.locationMarkers[0].date_created);
    const endTime = moment(this.locationMarkers[this.locationMarkers.length - 1].timestamp || this.locationMarkers[this.locationMarkers.length - 1].date_created);
    const duration = moment.duration(endTime.diff(startTime));

    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  }

  // Add this method to load users list
  searchTerm: string = '';

  loadUsersList(): void {
    this.isLoadingUsers = true;

    const payload = { search: this.searchTerm || '' };

    this.service.post_rqst(payload, "CustomerNetwork/salesUserList")
      .subscribe(
        (result) => {
          this.userList = result['all_sales_user'] || [];
          this.isLoadingUsers = false;
        },
        (error) => {
          console.error('Error loading users:', error);
          this.isLoadingUsers = false;
        }
      );
  }

  loadLiveLocationData(): void {
    const userIdToUse = this.selectedUserId || this.payload.user_id;

    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationTimeline/getLiveLocation")
      .subscribe(
        (result) => {
          this.userLocationsData = result['locations'] || [];
        },
        (error) => {
          console.error('Error loading users:', error);
          this.isLoadingUsers = false;
        }
      );
  }

  loadLocationTimeLine(): void {
    const userIdToUse = this.selectedUserId || this.payload.user_id;
    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationTimeline/generateDailyTimeline")
      .subscribe(
        (result) => {
          this.timelineData = result || {};
          this.timelineEvents = result['timeline'] || [];
          this.timelineInsights = result['insights'] || {};
          this.timeline_gaps = result['analytics'].timeline_gaps || [];

          let visitCounter = 1;
          this.timelineEvents.forEach(event => {
            if (event.type === 'visit') {
              event.visit_count = visitCounter++;
            }
          });
        },
        (error) => {
          console.error('Error loading timeline:', error);
        }
      );
  }

  loadGetDayActivityTimeline(): void {
    const userIdToUse = this.selectedUserId || this.payload.user_id;
    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationTimeline/getDayActivityTimeline")
      .subscribe(
        (result) => {
          this.timelineCheckin = result['timeline'] || [];
          this.summaryTimelineCheckin = result['distances'] || {};
          console.log(this.timelineCheckin, "this.timelineCheckin")
        },
        (error) => {
          console.error('Error loading timeline:', error);
        }
      );
  }
  loadGetPermissionReport(): void {
  const userIdToUse = this.selectedUserId || this.payload.user_id;
  let header = {
    'date': this.selectedDate,
    'user_id': userIdToUse
  };

  this.service.post_rqst(header, "BackgroundLocationReport/getReport")
    .subscribe(
      (result) => {
        this.permissionsData = result || {};
       this.permissionsList = result.health_issues.issue_periods || [];
       if(this.permissionsList.length > 0){
       this.showPermissionsDisclaimer=true
       }
    
        this.groupPermissionsByHour();
        this.calculateHourlyStats();
        console.log('Permissions data:', this.permissionsData);
      },
      (error) => {
        console.error('Error loading permissions report:', error);
      }
    );
}

groupPermissionsByHour(): void {
  this.groupedPermissions = {};
  
  this.permissionsList.forEach(permission => {
    if (permission.timestamp) {
      const hour = new Date(permission.timestamp).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!this.groupedPermissions[hourKey]) {
        this.groupedPermissions[hourKey] = [];
      }
      
      this.groupedPermissions[hourKey].push(permission);
    }
  });
  
  // Set first hour as selected if none selected
  const hours = Object.keys(this.groupedPermissions);
  if (hours.length > 0 && !this.selectedHour) {
    this.selectedHour = hours[0];
  }
}

calculateHourlyStats(): void {
  this.hourlyStats = {};
  
  Object.keys(this.groupedPermissions).forEach(hour => {
    const permissions = this.groupedPermissions[hour];
    const granted = permissions.filter(p => p.status === 'granted').length;
    const denied = permissions.filter(p => p.status === 'denied').length;
    
    this.hourlyStats[hour] = {
      total: permissions.length,
      granted: granted,
      denied: denied,
      grantedPercentage: permissions.length > 0 ? Math.round((granted / permissions.length) * 100) : 0
    };
  });
}



getSelectedHourPermissions(): any[] {
  return this.groupedPermissions[this.selectedHour] || [];
}



getHoursList(): string[] {
  return Object.keys(this.groupedPermissions).sort();
}



getGrantedCount(): number {
  return this.permissionsList.filter(p => p.status === 'granted').length;
}

getDeniedCount(): number {
  return this.permissionsList.filter(p => p.status === 'denied').length;
}

getPermissionIcon(permissionName: string): string {
  const iconMap: any = {
    'location': 'location_on',
    'camera': 'camera_alt',
    'microphone': 'mic',
    'storage': 'storage',
    'phone': 'phone',
    'contacts': 'contacts',
    'sms': 'sms',
    'calendar': 'event',
    'background_location': 'my_location',
    'notification': 'notifications',
    'battery_optimization': 'battery_std'
  };
  
  const key = permissionName.toLowerCase().replace(/[^a-z]/g, '_');
  return iconMap[key] || 'security';
}

formatPermissionName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

getPermissionDescription(permissionName: string): string {
  const descriptions: any = {
    'location': 'Required for tracking user location',
    'background_location': 'Allows location tracking when app is closed',
    'camera': 'Needed for taking photos and scanning',
    'storage': 'Required to save data and images locally',
    'notification': 'Used to send important alerts and updates',
    'battery_optimization': 'Prevents system from stopping the app'
  };
  
  const key = permissionName.toLowerCase().replace(/[^a-z]/g, '_');
  return descriptions[key] || 'This permission is required for app functionality';
}












formatIssueText(issue: string): string {
   return issue.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  // return ;
}






// Enhanced methods for modern design

getHourlyStatuses(hour: string): {
  total: number, 
  granted: number, 
  denied: number, 
  avgBattery: number,
  totalIssues: number,
  criticalIssues: number,
  batteryStatus: string
} {
  const permissions = this.groupedPermissions[hour] || [];
  const granted = permissions.filter(p => p.status === 'granted').length;
  const denied = permissions.filter(p => p.status === 'denied').length;
  
  // Calculate average battery level
  const totalBattery = permissions.reduce((sum, p) => sum + (p.battery_level || 0), 0);
  const avgBattery = permissions.length > 0 ? Math.round(totalBattery / permissions.length) : 0;
  
  // Calculate issues
  const totalIssues = permissions.reduce((sum, p) => sum + (p.issues.length || 0), 0);
  const criticalIssues = permissions.filter(p => this.isCritical(p)).length;
  
  // Determine battery status class
  let batteryStatus = 'good';
  if (avgBattery <= 20) batteryStatus = 'critical';
  else if (avgBattery <= 50) batteryStatus = 'warning';
  
  return {
    total: permissions.length,
    granted,
    denied,
    avgBattery,
    totalIssues,
    criticalIssues,
    batteryStatus
  };
}

// Enhanced battery colors with modern palette
getBatteryColor(level: number): string {
  if (level <= 15) return '#ef4444'; // Modern red
  if (level <= 30) return '#f59e0b'; // Modern amber
  if (level <= 50) return '#eab308'; // Modern yellow
  if (level <= 80) return '#22c55e'; // Modern green
  return '#10b981'; // Modern emerald
}

// Enhanced battery icons
getBatteryIcon(level: number): string {
  if (level <= 15) return 'battery_alert';
  if (level <= 30) return 'battery_2_bar';
  if (level <= 50) return 'battery_3_bar';
  if (level <= 80) return 'battery_5_bar';
  return 'battery_full';
}

// Enhanced issue colors for modern design
getIssueColor(issue: string): string {
  const colorMap: any = {
    'POWER_SAVE_ON': 'orange',
    'LOW_BATTERY': 'red',
    'LOCATION_OFF': 'red',
    'GPS_OFF': 'red',
    'BACKGROUND_RESTRICTED': 'orange',
    'WIFI_DISABLED': 'orange',
    'INTERNET_OFF': 'orange'
  };
  return colorMap[issue] || 'gray';
}

// Enhanced issue icons with more modern alternatives
getIssueIcon(issue: string): string {
  const iconMap: any = {
    'POWER_SAVE_ON': 'power_settings_new',
    'LOW_BATTERY': 'battery_alert',
    'LOCATION_OFF': 'location_disabled',
    'GPS_OFF': 'gps_off',
    'BACKGROUND_RESTRICTED': 'block',
    'WIFI_DISABLED': 'wifi_off',
    'INTERNET_OFF': 'signal_cellular_connected_no_internet_0_bar'
  };
  return iconMap[issue] || 'error_outline';
}

// Enhanced critical detection
isCritical(record: any): boolean {
  // Critical if battery is very low
  if (record.battery_level <= 15) {
    return true;
  }

  // Critical if location/GPS issues exist
  if (record.issues && Array.isArray(record.issues)) {
    const criticalIssues = ['LOCATION_OFF', 'GPS_OFF', 'LOW_BATTERY'];
    return record.issues.some(issue => criticalIssues.includes(issue));
  }

  return false;
}

// Smooth hour selection with animation support
selectHour(hour: string): void {
  this.selectedHour = hour;
  
  // Optional: Add smooth scroll to details panel
  setTimeout(() => {
    const detailsPanel = document.querySelector('.permissions-details');
    if (detailsPanel) {
      detailsPanel.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 100);
}


  // Add this method to handle user selection change
  onUserChange(): void {
    if (this.selectedUserId) {
      this.isMapLoading = true
      console.log('Selected user ID:', this.selectedUserId);

      // Update the payload with selected user
      // this.payload.user_id = this.selectedUserId;
      this.userId = this.selectedUserId;

      // Reload data for selected user
      this.loadLocationData();
      this.UserInformation();
        this.UserInformationDetail();
      this.loadGetDayActivityTimeline()
       this.loadGetPermissionReport()

      // Refresh the current tab
      if (this.activeTab === 'summary') {
        this.loadAttendanceSummary();
      }
    }
  }

  toggleRoadChange() {
    console.log(this.snapToRoad, "line  1401")
    if (this.snapToRoad == true) {
      this.getRouteEstimated()
    } else {
      this.loadLocationData()
    }
  }

  private loadLocationData(): void {
    this.isMapLoading = true;
    this.locationMarkers = []
    this.missingPermissions = [];
    this.missingPermissionsCount = 0;
    this.snapToRoad = false
    // Use selected user ID or default from payload
    const userIdToUse = this.selectedUserId || this.payload.user_id;

    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationProcess/getDailyReportCalculated")
      .subscribe((result => {
        this.locationMarkers = result.route.points
        this.total_distance = result.route.distance_km
        this.checkinKM = result.route.checkin_to_checkin_km

        this.oldFlag = result.old_data
        console.log(this.oldFlag, "this.oldFlag")

        if (this.locationMarkers.length > 0) {
          setTimeout(() => {
            // Switch to appropriate tab based on date
            if (this.isToday()) {
              this.switchTab('live');
            } else {
              this.switchTab('route');
            }
            this.isLoading = false;
          }, 1000);
        } else {
          this.isMapLoading = false;
        }

        this.latestLocation = {
          lat: this.locationMarkers[0].lat,
          lng: this.locationMarkers[0].lng,
          gps: 'Sector 21, Faridabad',
          time: moment().toISOString(),
          total_checkin: this.locationData.length
        };

        this.calculateTotalDistance();
      }));

    this.isLoading = false;
  }

  private UserInformation(): void {
    this.isMapLoading = true;
    this.locationMarkers = []
    this.missingPermissions = [];
    this.missingPermissionsCount = 0;
    this.snapToRoad = false
    // Use selected user ID or default from payload
    const userIdToUse = this.selectedUserId || this.payload.user_id;

    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationProcess/getDailyReportAdditionalDetails")
      .subscribe((result => {
        this.employeeData = result.user;
        this.summarizeData = result.device_health;
        this.checkin = result.checkins
        this.attendanceData = result.attendance

     if(this.attendanceData){
  let stopTime = this.attendanceData.stop_time;
if (!stopTime || stopTime === '00:00:00') {

    if (this.isToday()) {
      // Use current time if it's today
      stopTime = moment().format('HH:mm:ss');
    } else {
      // Use 11:55 PM if it's not today
      stopTime = '23:55:00';
    }
  }
  
  // Calculate the difference using moment duration
  const startMoment = moment(this.attendanceData.start_time, 'HH:mm:ss');
  const stopMoment = moment(stopTime, 'HH:mm:ss');
  const duration = moment.duration(stopMoment.diff(startMoment));
  
  // Format as "Xh Ym" or "X hours Y minutes"
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  
  this.activeTime = `${hours}h ${minutes}m`;
  
}

        this.calculateMissingPermissions()
        if (this.summarizeData) {
          try {
            this.summarizeData.device_issues_array = this.summarizeData.device_issues ? JSON.parse(this.summarizeData.device_issues) : [];
          } catch (e) {
            console.error("Could not parse device_issues", e);
            this.summarizeData.device_issues_array = [this.summarizeData.device_issues];
          }
          try {
            this.summarizeData.recommendations_array = this.summarizeData.recommendations ? JSON.parse(this.summarizeData.recommendations) : [];
          } catch (e) {
            console.error("Could not parse recommendations", e);
            this.summarizeData.recommendations_array = [this.summarizeData.recommendations];
          }
        }
        this.debugFlag = result.debug;

        if(result.route){
 this.locationMarkers = result.route.points
        this.total_distance = result.route.distance_km
        }
       

        if (this.locationMarkers.length > 0) {
          setTimeout(() => {
            this.switchTab('live');
            this.isLoading = false;
          }, 1000);
        } else {
          this.isMapLoading = false;
        }

        this.latestLocation = {
          lat: this.locationMarkers[0].lat,
          lng: this.locationMarkers[0].lng,
          gps: 'Sector 21, Faridabad',
          time: moment().toISOString(),
          total_checkin: this.locationData.length
        };

        this.calculateTotalDistance();
      }));

    this.isLoading = false;
  }

  private UserInformationDetail(): void {
   
    
    // Use selected user ID or default from payload
    const userIdToUse = this.selectedUserId || this.payload.user_id;

    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "Attendance/attendanceSummary")
      .subscribe((result => {

        // Assign new sales & performance data
        this.TC = result.TC;
        this.PC = result.PC;
        this.secondary_sale_amount = result.secondary_sale_amount;
        this.New_Counter = result.New_Counter;
        this.New_counter_TC = result.New_counter_TC;
        this.New_counter_PC = result.New_counter_PC;
        this.counter_primary_Value = result.counter_primary_Value;
        this.counter_secondary_Value = result.counter_secondary_Value;
        this.baseLat = result.base_lat;
        this.baseLng= result.base_lng;
        this.attendanceVariation = result.base_km_diff
;

       

       

       
       
      }));

    
  }

  parseDateTime(dateTimeStr: string): Date {
    return new Date(dateTimeStr.replace(" ", "T"));
    // replace space with 'T' to make it ISO compatible
  }

  getRouteEstimated() {
    console.log("line 1402")
    this.isMapLoading = true;
    this.locationMarkers = []
    // Use selected user ID or default from payload
    const userIdToUse = this.selectedUserId || this.payload.user_id;

    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationProcess/getDailyReportSnapped")
      .subscribe((result => {
        this.locationMarkers = result.route.points
        this.total_distance = result.route.distance_km
        if (this.locationMarkers.length > 0) {
          setTimeout(() => {
            this.switchTab('route');
            this.isLoading = false;
          }, 1000);
        }
      }));
  }

  private calculateMissingPermissions(): void {
    this.missingPermissions = [];

    if (!this.summarizeData) {
      this.missingPermissionsCount = 0;
      return;
    }

    // Permissions that should be enabled (true/1)
    if (!this.summarizeData.has_background_permission) {
      this.missingPermissions.push('Background Permission Not Granted');
    }
    if (!this.summarizeData.fine_location) {
      this.missingPermissions.push('Fine Location Access Not Granted');
    }
    if (!this.summarizeData.is_location_enabled) {
      this.missingPermissions.push('Location Services are Disabled');
    }
    if (!this.summarizeData.is_gps_enabled) {
      this.missingPermissions.push('GPS is Disabled');
    }

    // Settings that should be disabled (false/0)
    if (this.summarizeData.is_battery_optimized) {
      this.missingPermissions.push('App is Battery Optimized (should be unrestricted)');
    }
    if (this.summarizeData.is_power_save_mode) {
      this.missingPermissions.push('Power Saving Mode is On');
    }

    this.missingPermissionsCount = this.missingPermissions.length;

    console.log('Missing Permissions:', this.missingPermissions);
    console.log('Missing Permissions Count:', this.missingPermissionsCount);
  }

  showAlert: boolean = false;
  showMeterAlert: boolean = false;

  showMissingPermissions(): void {
    if (this.missingPermissionsCount > 0) {
      this.showAlert = true;
    }
  }

  closeAlert(): void {
    this.showAlert = false;
  }

  showMeterDistance(): void {
    this.showMeterAlert = true;
  }

  closeMeterAlert(): void {
    this.showMeterAlert = false;
  }

  resolveIssues(): void {
    // Implement resolution logic here
    console.log('Resolving issues...');
    this.closeAlert();
  }

  onFullscreenToggle(): void {
    // Give the DOM a moment to update with the new class and for the map container to resize.
    // This ensures Leaflet recalculates its size based on the new container dimensions.
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize(true); // pass true for animation
      }
    }, 300); // A delay helps to run this after CSS transitions.
  }

  // Add these properties first
  autoRefreshLiveUsers: boolean = false;
  isLoadingLiveUsers: boolean = false;
  liveUsersMap: any;

  // Live Users Methods
  private initializeLiveUsersMap(): void {
    setTimeout(() => {
      if (this.liveUsersMap) {
        this.liveUsersMap.remove();
        this.liveUsersMap = null;
      }

      // Create map centered on Faridabad
      this.liveUsersMap = L.map('liveUsersMap').setView([28.395975, 77.316355], 13);

      // Add tile layer
      L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(this.liveUsersMap);

      // Load live users data
      this.loadLiveUsersData();
    }, 100);
  }

  loadLiveUsersData(): void {
    this.isLoadingLiveUsers = true;
    
    const userIdToUse = this.selectedUserId || this.payload.user_id;
    let header = {
      'date': this.selectedDate,
      'user_id': userIdToUse
    };

    this.service.post_rqst(header, "BackgroundLocationTimeline/getLiveLocation")
      .subscribe(
        (result) => {
          this.liveUsersData = result['locations'] || [];
          this.updateLiveUsersOnMap();
          this.isLoadingLiveUsers = false;
        },
        (error) => {
          console.error('Error loading live users:', error);
          this.isLoadingLiveUsers = false;
        }
      );
  }

  updateLiveUsersOnMap(): void {
    if (!this.liveUsersMap) return;

    // Clear existing markers
    this.liveUsersMarkers.forEach(marker => {
      this.liveUsersMap.removeLayer(marker);
    });
    this.liveUsersMarkers = [];

    // Add markers for each user
    this.liveUsersData.forEach(userData => {
      if (!userData.location) return;

      const isSelected = this.selectedLiveUsers.size === 0 || 
                        this.selectedLiveUsers.has(userData.user.id.toString());
      
      if (!isSelected) return;

      // Create custom icon based on user status
      const iconHtml = this.createUserMarkerHtml(userData);
      const icon = L.divIcon({
        className: 'live-user-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      // Create marker
      const marker = L.marker([userData.location.lat, userData.location.lng], { icon })
        .addTo(this.liveUsersMap);

      // Add popup with user details
      const popupContent = this.createUserPopupContent(userData);
      marker.bindPopup(popupContent);

      // Add accuracy circle if available
      if (userData.location.accuracy) {
        const circle = L.circle([userData.location.lat, userData.location.lng], {
          radius: userData.location.accuracy,
          color: this.getStatusColor(userData.status),
          fillColor: this.getStatusColor(userData.status),
          fillOpacity: 0.1,
          weight: 1
        }).addTo(this.liveUsersMap);
        
        this.liveUsersMarkers.push(circle);
      }

      this.liveUsersMarkers.push(marker);
    });

    // Fit map to show all markers
    if (this.liveUsersMarkers.length > 0) {
      const group = new L.featureGroup(this.liveUsersMarkers);
      this.liveUsersMap.fitBounds(group.getBounds().pad(0.1));
    }
  }

  createUserMarkerHtml(userData: any): string {
    const color = this.getStatusColor(userData.status);
    const isMoving = userData.movement.is_moving;
    
    return `
      <div style="
        background: ${color};
        color: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <i class="material-icons" style="font-size: 20px;">
          ${isMoving ? 'directions_walk' : 'person_pin'}
        </i>
        ${userData.device.battery_level < 20 ? 
          '<span style="position: absolute; top: -5px; right: -5px; background: red; width: 10px; height: 10px; border-radius: 50%;"></span>' 
          : ''}
      </div>
    `;
  }

  createUserPopupContent(userData: any): string {
    return `
      <div style="min-width: 250px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">
          ${userData.user.name || 'Unknown User'}
        </h4>
        <div style="display: grid; gap: 5px; font-size: 14px;">
          <div><strong>ID:</strong> ${userData.user.employee_id || 'N/A'}</div>
          <div><strong>Status:</strong> 
            <span style="
              background: ${this.getStatusColor(userData.status)};
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
            ">${userData.status}</span>
          </div>
          <div><strong>Activity:</strong> ${userData.movement.activity}</div>
          <div><strong>Speed:</strong> ${userData.movement.speed || 0} km/h</div>
          <div><strong>Battery:</strong> ${userData.device.battery_level}%</div>
          <div><strong>Accuracy:</strong> ${userData.location.accuracy}m</div>
          <div><strong>Last Update:</strong> ${userData.device.last_update}</div>
          ${userData.attendance.status ? 
            `<div><strong>Attendance:</strong> ${userData.attendance.status}</div>` 
            : ''}
        </div>
      </div>
    `;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'stationary': '#4CAF50',
      'idle': '#FF9800',
      'moving': '#2196F3',
      'offline': '#9E9E9E',
      'unknown': '#795548'
    };
    return colors[status] || '#795548';
  }

  toggleUserSelection(userId: string): void {
    if (this.selectedLiveUsers.has(userId)) {
      this.selectedLiveUsers.delete(userId);
    } else {
      this.selectedLiveUsers.add(userId);
    }
    this.updateLiveUsersOnMap();
  }

  getActiveUsersCount(): number {
    return this.liveUsersData.filter(u => u.movement.is_moving).length;
  }

  centerMapOnUsers(): void {
    if (this.liveUsersMarkers.length > 0 && this.liveUsersMap) {
      const group = new L.featureGroup(this.liveUsersMarkers);
      this.liveUsersMap.fitBounds(group.getBounds().pad(0.1));
    }
  }

  refreshLiveUsers(): void {
    this.loadLiveUsersData();
  }

  toggleAutoRefresh(): void {
    if (this.autoRefreshLiveUsers) {
      this.liveUsersUpdateInterval = setInterval(() => {
        this.loadLiveUsersData();
      }, 30000); // Refresh every 30 seconds
    } else {
      if (this.liveUsersUpdateInterval) {
        clearInterval(this.liveUsersUpdateInterval);
        this.liveUsersUpdateInterval = null;
      }
    }
  }

  getTimelineIcon(type: string): string {
    const icons: any = {
      'attendance_start': 'play_circle_filled',
      'attendance_stop': 'stop_circle',
      'travel': 'directions_car',
      'stop': 'store',
      'visit': 'person_pin_circle'
    };
    return icons[type] || 'place';
  }

  getTimelineEventClass(type: string): string {
    const classes: any = {
      'attendance_start': 'event-start',
      'attendance_stop': 'event-stop',
      'travel': 'event-travel',
      'stop': 'event-visit',
      'visit': 'event-checkin',
      'checkout': 'event-checkout'
    };
    return classes[type] || 'event-default';
  }

  hasTimelineGap(index: number): boolean {
    if (!this.timeline_gaps || index >= this.timelineEvents.length - 1) return false;
    
    const currentEvent = this.timelineEvents[index];
    const nextEvent = this.timelineEvents[index + 1];
    
    return this.timeline_gaps.some(gap => 
      gap.start === currentEvent.time || gap.start === currentEvent.end_time
    );
  }

  getGapDuration(index: number): number {
    if (!this.timeline_gaps) return 0;
    
    const currentEvent = this.timelineEvents[index];
    const gap = this.timeline_gaps.find(g => 
      g.start === currentEvent.time || g.start === currentEvent.end_time
    );
    
    return gap ? gap.duration_minutes : 0;
  }

  private initializeTimelineMapView(): void {
    if (!this.timelineEvents || this.timelineEvents.length === 0) return;

    // Destroy existing map if it exists
    if (this.timelineMapView) {
      this.timelineMapView.remove();
      this.timelineMapView = null;
    }

    // Get first location for center
    let centerLat = 28.395975;
    let centerLng = 77.316355;
    
    const firstLocationEvent = this.timelineEvents.find(e => e.location);
    if (firstLocationEvent && firstLocationEvent.location) {
      centerLat = firstLocationEvent.location.lat;
      centerLng = firstLocationEvent.location.lng;
    }

    // Create map
    this.timelineMapView = L.map('timelineMapView').setView([centerLat, centerLng], 12);

    // Add tile layer
    L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(this.timelineMapView);

    const markers: any[] = [];
    
    // Add markers for important events
    this.timelineEvents.forEach((event, index) => {
      // Show start, stop, location_stop, and checkin events
      if (event.type === 'attendance_start' ||
          event.type === 'attendance_stop' ||
          event.type === 'stop' ||
          event.type === 'visit' ||
          event.type === 'checkout') {
        
        if (event.location) {
          const marker = this.createTimelineEventMarker(event, index);
          if (marker) {
            markers.push(marker);
          }
        }
      }
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      this.timelineMapView.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createTimelineEventMarker(event: any, index: number): any {
    if (!event.location) return null;

    let iconColor = '#757575';
    let iconName = 'place';
    let markerTitle = event.title;
    
    if (event.type === 'attendance_start') {
      iconColor = '#4CAF50';
      iconName = 'play_circle_filled';
      markerTitle = 'Day Start';
    } else if (event.type === 'attendance_stop') {
      iconColor = '#f44336';
      iconName = 'stop_circle';
      markerTitle = 'Day End';
    } else if (event.type === 'stop') {
      iconColor = '#9C27B0';
      iconName = 'store';
      markerTitle = 'Stoppage';
    } else if (event.type === 'visit') {
      iconColor = '#00BCD4';
      iconName = 'where_to_vote';
      markerTitle = 'Check In';
    } else if (event.type === 'checkout') {
      iconColor = '#FF5722';
      iconName = 'exit_to_app';
      markerTitle = 'Check Out';
    }
    
    const icon = L.divIcon({
      className: 'timeline-marker-div',
      html: `
        <div style="
          background: ${iconColor};
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          position: relative;
        ">
          <i class="material-icons" style="font-size: 22px;">${iconName}</i>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([event.location.lat, event.location.lng], { icon })
      .addTo(this.timelineMapView);

    // Enhanced popup content
    const popupContent = `
      <div style="min-width: 280px; max-width: 350px;">
        <h3 style="margin: 0 0 10px 0; color: ${iconColor};">${event.title}</h3>
        <div style="display: grid; gap: 10px; font-size: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="material-icons" style="font-size: 18px; color: #666;">access_time</i>
            <span><strong>Time:</strong> ${event.time} ${event.end_time ? '- ' + event.end_time : ''}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="material-icons" style="font-size: 18px; color: #666;">label</i>
            <span><strong>Type:</strong> ${markerTitle}</span>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <i class="material-icons" style="font-size: 18px; color: #666;">description</i>
            <span><strong>Description:</strong> ${event.description}</span>
          </div>
          ${event.location.address ? `
            <div style="display: flex; align-items: flex-start; gap: 8px;">
              <i class="material-icons" style="font-size: 18px; color: #666;">location_on</i>
              <span><strong>Address:</strong> ${event.location.address}</span>
            </div>
          ` : ''}
          ${event.duration_minutes ? `
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="material-icons" style="font-size: 18px; color: #666;">timer</i>
              <span><strong>Duration:</strong> ${event.duration_minutes} minutes</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    return marker;
  }

  toggleTimelineMap(): void {
    this.showTimelineMap = !this.showTimelineMap;
    
    if (this.showTimelineMap) {
      setTimeout(() => {
        this.initializeTimelineMapView();
      }, 100);
    } else {
      // Destroy map when hiding
      if (this.timelineMapView) {
        this.timelineMapView.remove();
        this.timelineMapView = null;
      }
    }
  }

  getTotalDistance(): number {
    if(this.attendanceData){
      const stop = this.attendanceData.stop_meter_reading || 0;
      const start = this.attendanceData.start_meter_reading || 0;
      const result = stop - start;
      return result < 0 ? 0 : parseFloat(result.toFixed(2));
    }else{
      return 0
    }
  }

  goToImage(image) {
    // const dialogRef = this.dialogs.open(ImageModuleComponent, {
    //   panelClass: 'Image-modal',
    //   data: {
    //     'image': image,
    //     'type': 'base64'
    //   }
    // });
    // dialogRef.afterClosed().subscribe(result => {
    // });
  }

  showList(){
    if(this.userListing==true){
      this.userListing=false
    }else{
      this.userListing=true
    }
  }

  selectUser(user: any) {
    this.selectedUserId = user.id;
    this.searchTerm = `${user.name} - ${user.employee_id}`;
    this.onUserChange()
  }

downloadPermissionsReport() {
  const userIdToUse = this.selectedUserId || this.payload.user_id;

  // Convert selectedDate (e.g. "2025-09-15") to "15_09_2025"
  let date = new Date(this.selectedDate);
  let day = String(date.getDate()).padStart(2, '0');
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let year = date.getFullYear();

  let formattedDate = `${day}_${month}_${year}`;

  let filename = formattedDate + '_' + userIdToUse;
  console.log(filename);

  window.open(this.downurl + 'background_location/device_health_' + filename + '.csv');
}

toggleFullScreen(isFullScreen: boolean): void {
  if (isFullScreen) {
    // Add full-screen CSS class
    this.renderer.addClass(this.document.body, 'fullscreen-map');

    // Request REAL fullscreen (Chrome F11 style)
    const elem = this.document.documentElement; // <html>

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }

  } else {
    // Remove CSS class
    this.renderer.removeClass(this.document.body, 'fullscreen-map');

    // Exit REAL fullscreen
    if (this.document.exitFullscreen) {
      this.document.exitFullscreen();
    } else if ((this.document as any).webkitExitFullscreen) {
      (this.document as any).webkitExitFullscreen();
    } else if ((this.document as any).msExitFullscreen) {
      (this.document as any).msExitFullscreen();
    }
  }
}



  
}