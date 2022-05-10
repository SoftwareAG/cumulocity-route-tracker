/**
 * Copyright (c) 2020 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 import {
  AfterViewInit,
  ApplicationRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Injector,
  Input,
  isDevMode,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import * as moment_ from 'moment';
declare global {
  interface Window {
    L: any;
    h337: any;
  }
}

import 'leaflet2/dist/leaflet.js';
const L: any = window.L;
const moment = moment_;
import 'leaflet-extra-markers/dist/js/leaflet.extra-markers.min.js';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import "leaflet-routing-machine";
import { MovingMarkerService } from './services/movingMarker.service';
import { AppIdService } from './services/app-id.service';
import { IFetchOptions, IManagedObject, Realtime } from '@c8y/client';
import { GpRouteTrackerService } from './services/gp-route-tracker.service';
import { C8Y_DEVICE_GROUP, C8Y_DEVICE_SUBGROUP } from './tokens';
import * as turf from '@turf/turf'
import { delay } from 'rxjs/operators';
import { FetchClient } from '@c8y/ngx-components/api';

@Component({
  selector: 'lib-gp-route-tracker',
  templateUrl: './gp-route-tracker.component.html',
  styleUrls: ['./gp-route-tracker.component.css']
})
export class GpRouteTrackerComponent implements OnInit, AfterViewInit {

  @Input() set config(newConfig: any) {
    this.inputConfig = newConfig;
    if (this.map) {
      this.initializeMap(false);
    }
  }
  get config(): any {
    return this.inputConfig;
  }
  @ViewChild('routeTrakerRef', { static: true }) protected mapDivRef: ElementRef;
  @ViewChild('routeTrakerInfoRef', { static: true })

  protected mapInfosDivRef: ElementRef;
  protected mapDiv: HTMLDivElement;
  protected mapInfosDiv: HTMLDivElement;
  protected map: any;
  protected initialMinZoom = 3;
  protected allDeviceList = [];
  protected allSubscriptions: any = [];
  protected allMarkers: any = {};
  protected featureGroup = [];
  protected layerControl = L.control.layers([], [], {});
  private allGoefences: any = [];
  private geoCoordinatesForSmartRules: any = [];
  protected onRouteSelected: any;
  initialMaxZoom = 14;
  isBusy = false;
  realtime = true;
  deviceId = '';
  isClusterMap = false;
  measurementType: any;
  markerColor = '';
  markerFontColor = '#ffffff';
  inputConfig: any;
  width: number;
  height: number;
  mapLoaded = false;
  defaultBounds = null;
  // popupDetailCompRef: ComponentRef<GPDataPointMapPopupComponent> = null;
  dashboardField = null;
  tabGroupField = null;
  routeStartPoint = null;
  routeEndPoint = null;
  appId = null;
  LAYER_OSM = {
    id: 'openstreetmap',
    name: 'Open Street Map',
    enabled: true,
    layer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxNativeZoom: 19, // max zoom where base layer tiles will be retrieved... this avoids errors when zooming more
      maxZoom: 28, // but, it can be zoomed closer :)
      attribution: 'Open Street Map',
    }),
  };

  constructor(private movingMarkerService: MovingMarkerService, private appIdService: AppIdService,
    private realTimeService: Realtime, private routeTrackerService: GpRouteTrackerService, private fetchClient: FetchClient) { 
      this.onRouteSelected = (evt: any) => this.__doRenderGeofencesOnMap(evt);
    }

  ngOnInit(): void {
    this.initializeMap(true);
  }

  public ngAfterViewInit(): void {
    this.initMapHandlers();
  }

  refresh() {
    this.initializeMap(false);
  }

  toggleRealTime() {
    this.realtime = !this.realtime;
    if (this.realtime) {
      this.initializeMap(false);
    } else {
      this.clearSubscriptions();
    }
  }

  /**
   * Intialzie map and load confiuration parameter. if it is not first call then clear all subscriptions
   */
   protected initializeMap(isFirstCall): void {
    this.mapDiv = this.mapDivRef.nativeElement;
    this.mapInfosDiv = this.mapInfosDivRef.nativeElement;

  //  this.deviceId = '61564408'; // '21236'; //'1215'; // '2202' ;// '23121787';
    this.measurementType = {
      name: 'T', // 'PM25',
      type: 'temperature_measurement',
    };
    this.markerColor = '#797bfc';
    this.markerFontColor = '#fff';
    /*  this.routeStartPoint = [13.051430, 77.593498];
    this.routeEndPoint = [13.098720, 77.593002]; 
 */
       
    if (this.inputConfig) {
      if (this.inputConfig.device) {
        this.deviceId = this.inputConfig.device.id;
      }
      this.routeStartPoint = [parseFloat(this.inputConfig.startLat), parseFloat(this.inputConfig.startLng)];
      this.routeEndPoint = [parseFloat(this.inputConfig.endLat), parseFloat(this.inputConfig.endLng)];
      /* this.measurementType = this.inputConfig.measurementType;
      this.markerColor = this.inputConfig.markerColor;
      this.markerFontColor = this.inputConfig.markerFontColor;
      this.dashboardField = this.inputConfig.dashboardField;
      this.tabGroupField = this.inputConfig.tabGroupField;
      this.isClusterMap = this.inputConfig.isClusterMap;
      if (
        this.inputConfig.outdoorZoom !== null &&
        this.inputConfig.outdoorZoom !== undefined
      ) {
        this.initialMaxZoom = this.inputConfig.outdoorZoom;
      } */
    }

    if (!isFirstCall) {
      this.clearMapAndSubscriptions();
    }
    if (this.mapLoaded) {
      return;
    }
    this.mapLoaded = true;
    this.updateMapSize(null, null);
    this.renderMap();
    this.renderAllDevicesForGroup(this.deviceId);
  }

  /**
   * Initialize Leaflet Map handlers
   */
  protected initMapHandlers(): void {
    this.map.invalidateSize();
    this.movingMarkerService.initializeMovingMarker(L);
  }

  protected updateMapSize(w: number, h: number): void {
    if (w > 0 && h > 0) {
      this.width = w - 20;
      this.height = h - this.mapInfosDiv.offsetHeight - 10; // 10px from styling :/
    } else {
      this.width = this.mapDiv.parentElement.offsetWidth - 20;
      this.height =
        this.mapDiv.parentElement.offsetHeight -
        this.mapInfosDiv.offsetHeight -
        10; // 10px from styling :/
    }
  }

  /**
   * Clear map, all variables and subscriptions
   */
  private clearMapAndSubscriptions() {
    this.map.remove();
    this.allMarkers = {};
    this.layerControl = L.control.layers([], [], {
      hideSingleBase: false,
      sortLayers: true,
      sortFunction(a, b) {
        return a.options.name - b.options.name;
      },
    });

    this.featureGroup = [];
    this.allDeviceList = [];
    this.mapLoaded = false;
    this.clearSubscriptions();
  }

  /**
   * Clear all Realtime subscriptions
   */
  private clearSubscriptions() {
    if (this.allSubscriptions) {
      this.allSubscriptions.forEach((s) => {
        if (s.type === 'Measurements' || s.type === 'Realtime') {
          this.realTimeService.unsubscribe(s.subs);
        } else {
          s.subs.unsubscribe();
        }
      });
    }
  }

  /**
   * Render the map (establish center and base layer)
   */
  protected renderMap(): void {
    // Create Leaflet Map in fixed DIV - zoom level is hardcoded for simplicity and will be overriden with fitBounds
    const initBounds = new L.LatLngBounds([0, 0], [0, 0]);
    this.map = L.map(this.mapDiv, {
      zoomControl: true,
      zoomAnimation: false,
      trackResize: true,
      boxZoom: true,
    }).setView(
      [initBounds.getCenter().lat, initBounds.getCenter().lng],
      this.initialMinZoom
    );
    this.map.addLayer(this.LAYER_OSM.layer);

    let routeControl = L.Routing.control({
      waypoints: [
        L.latLng(this.routeStartPoint),
        L.latLng(this.routeEndPoint)
      ],
      lineOptions: {
        styles: [{ color: "blue", weight: 3 }]
      },
      show: false,
      hide: true,
      addWaypoints: false,
      routeWhileDragging: true,
      draggableWaypoints: true,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: function () {
        return null;
      }
    }).addTo(this.map);

    routeControl.on('routeselected', this.onRouteSelected);
  //  this.__doRenderGeofencesOnMap();
  }

  onResized(event: ResizedEvent) {
    this.updateMapSize(event.newWidth, event.newHeight);
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * Render all devices for given group id
   */
   protected renderAllDevicesForGroup(deviceId): void {
    let deviceList: any = null;
    const t0 = performance.now();
    if (deviceId) {
      this.routeTrackerService
        .getTargetObject(deviceId) // this.config.device.id
        .then((mo) => {
          if (
            mo &&
            mo.type &&
            (mo.type.localeCompare(C8Y_DEVICE_GROUP) === 0 ||
              mo.type.localeCompare(C8Y_DEVICE_SUBGROUP) === 0)
          ) {
            // GET child devices
            this.routeTrackerService
              .getChildDevices(deviceId, 1, deviceList) // this.config.device.id
              .then((deviceFound) => {
                deviceList = deviceFound.data;
                this.allDeviceList.push.apply(this.allDeviceList, deviceList);
                this.addDevicesToMap(this.allDeviceList);
              })
              .catch((err) => {
                if (isDevMode()) {
                  console.log(
                    '+-+- ERROR FOUND WHILE GETTING CHILD DEVICES... ',
                    err
                  );
                }
              });
          } else {
            this.allDeviceList.push(mo);
            this.addDevicesToMap(this.allDeviceList);
          }
        })
        .catch((err) => {
          if (isDevMode()) {
            console.log(
              '+-+- ERROR while getting context object details for dashboard ',
              err
            );
          }
        });
    } else {
      if (this.allDeviceList.length > 0) {
        this.addDevicesToMap(this.allDeviceList);
      } else {
        this.addLayerToMap(null);
      }
    }
  }

    /**
   * render single device on map based on its position
   */
     private addSingleDeviceToMap(device: any): void {
 
      if (
        device &&
        device.c8y_Position &&
        device.c8y_Position.lat &&
        device.c8y_Position.lng
      ) {
       
        // check if this marker has already been created... and has an altitude as well to indicate its floor
        // if no position is given, no update is done
        if (device && device.c8y_Position) {
          if (this.allMarkers[device.id]) {
            this.updateMarkerPosition(device);
          } else {
            let mapBounds = null;
            if (!device.c8y_Position.alt) {
              device.c8y_Position.alt = 0;
            }
            const aMarker = this.createMarker(device);
            this.allMarkers[device.id] = aMarker;
            if (!mapBounds) {
              mapBounds = new L.LatLngBounds(
                aMarker.getLatLng(),
                aMarker.getLatLng()
              );
            } else {
              mapBounds.extend(aMarker.getLatLng());
            }
            let fgOnLvl = this.featureGroup.find(
              (i) => i.name === device.c8y_Position.alt
            );
            const markers = L.markerClusterGroup();
            if (!fgOnLvl) {
              if (this.isClusterMap) {
                markers.addLayer(aMarker);
                fgOnLvl = {
                  name: Number(device.c8y_Position.alt),
                  layer: L.featureGroup([markers]),
                };
                L.setOptions(fgOnLvl.layer, { name: device.c8y_Position.alt });
              } else {
                fgOnLvl = {
                  name: Number(device.c8y_Position.alt),
                  layer: L.featureGroup([aMarker]),
                };
                L.setOptions(fgOnLvl.layer, { name: device.c8y_Position.alt });
              }
              this.featureGroup.push(fgOnLvl);
            } else {
              if (this.isClusterMap) {
                markers.addLayer(aMarker);
                fgOnLvl.layer.addLayer(markers);
              } else {
                fgOnLvl.layer.addLayer(aMarker);
              }
            }
            this.addLayerToMap(mapBounds);
          }
        }
  
         // REALTIME ------------------------------------------------------------------------
        // tslint:disable-next-line: deprecation
        const manaogedObjectChannel = `/managedobjects/${device.id}`;
        const detailSubs = this.realTimeService.subscribe(
          manaogedObjectChannel,
          (resp) => {
            
            const data = (resp.data ? resp.data.data : {});
            this.updateMarkerPosition(data);
          }
        );
        if (this.realtime) {
          this.allSubscriptions.push({
            id: device.id,
            subs: detailSubs,
            type: 'Realtime',
          });
        } else {
          this.realTimeService.unsubscribe(detailSubs);
        }
      }
    }
  
    /**
     * Render multpile devices on map
     */
    private async addDevicesToMap(deviceList: any[]): Promise<void> {
      // if there is a single device in the group, treat it as a single device
      if (deviceList && deviceList.length === 1) {
        this.addSingleDeviceToMap(deviceList[0]);
      } else {
        const categoryFeatureGroups = [];
        let mapBounds = this.defaultBounds;
        const markers = L.markerClusterGroup();
        deviceList.forEach((imo) => {
          if (imo.c8y_Position && !imo.c8y_Position.alt) {
            imo.c8y_Position.alt = 0;
          }
          if (!imo.type) {
            imo.type = 'default';
          }
          if (imo.c8y_Position && imo.c8y_Position.lat && imo.c8y_Position.lng) {
            if (this.allMarkers[imo.id]) {
              this.updateMarkerPosition(imo);
            } else {
              // create a marker per device found...
              try {
                const aMarker = this.createMarker(imo);
                this.allMarkers[imo.id] = aMarker;
                if (!mapBounds) {
                  mapBounds = new L.LatLngBounds(
                    aMarker.getLatLng(),
                    aMarker.getLatLng()
                  );
                } else {
                  mapBounds.extend(aMarker.getLatLng());
                }
                if (this.isClusterMap) {
                  markers.addLayer(aMarker);
                  categoryFeatureGroups.push(markers);
                } else {
                  categoryFeatureGroups.push(aMarker);
                }
                const manaogedObjectChannel = `/managedobjects/${imo.id}`;
                const detailSubs = this.realTimeService.subscribe(
                  manaogedObjectChannel,
                  (resp) => {
                    const mobj = (resp.data ? resp.data.data : {});
                    this.updateMarkerPosition(mobj);
                });
                if (this.realtime) {
                  this.allSubscriptions.push({
                    id: imo.id,
                    subs: detailSubs,
                    type: 'Realtime',
                  });
                } else {
                    this.realTimeService.unsubscribe(detailSubs);
                }
              } catch (error) {
                if (isDevMode()) {
                  console.log(
                    '+-+-+- error while creating and adding marker to map\n ',
                    [error, imo]
                  );
                }
              }
            }
          } else {
            if (isDevMode()) {
              console.log('+-+- device without location\n', imo);
            }
          }
        });
        if (categoryFeatureGroups.length > 0) {
          let fgOnLvl = this.featureGroup.find((i) => i.name === 0);
          if (!fgOnLvl) {
            fgOnLvl = { name: 0, layer: L.featureGroup(categoryFeatureGroups) };
            L.setOptions(fgOnLvl.layer, { name: 0 });
            this.featureGroup.push(fgOnLvl);
          } else {
            categoryFeatureGroups.forEach((layer) => {
              fgOnLvl.layer.addLayer(layer);
            });
          }
        }
        this.addLayerToMap(mapBounds);
      }
    }
  
    /**
     * This method is used to create marker for given device
     */
    private createMarker(mo: IManagedObject) {
      // add floor plan, stored in the position's altitude, as option in the marker for later comparisons...
      const iconMarker = L.ExtraMarkers.icon({
        icon: 'fa-truck',
        iconColor: 'yellow', // this.markerFontColor,
        extraClasses: 'fa-rt',
        markerColor: '#1776bf', //this.markerColor,
        shape: 'square',
        svg: 'false',
        prefix: 'fa',
      });
      const iconOpts = {
        title: mo.name,
        id: mo.id,
        icon: iconMarker,
        draggable: false,
      };
      const markerLatLng = L.latLng(mo.c8y_Position);
      const mkr = L.Marker.movingMarker(
        [markerLatLng, markerLatLng],
        [1000],
        iconOpts
      );
      const mpp = L.popup({ className: 'lt-popup' });
      const elem = [
        { label: 'Name:', value: mo.name },
        { label: 'ID:', value: mo.id },
        { label: 'Type:', value: mo.type },
      ];
      let tabGroup = null;
      let dashboardId = null;
      if (this.dashboardField) {
        dashboardId = this.getNavigationFields(this.dashboardField, mo);
      }
      if (this.tabGroupField) {
        tabGroup = this.getNavigationFields(this.tabGroupField, mo);
      }
      let deviceListDashboard = [];
      deviceListDashboard = mo.deviceListDynamicDashboards;
      const markerData = {
        elem,
        dashboardId,
        tabGroup,
      };
      let ppContent = '';
      if (dashboardId) {
     //   this.createNavigationPopupForMarker(null, mpp, markerData);
      } else {
        ppContent = this.getPopupContent(elem);
      }
      mkr
        .bindPopup(mpp)
        .on('popupopen', ($event) => {
          if (ppContent) {
            mpp.setContent(ppContent);
          }
        })
        .on('click', (e) => {
        })
        .on('popupclose', ($event) => {});
      return mkr;
    }

    /**
     * Render geofence on map
     */
    private async __doRenderGeofencesOnMap(e: any) {
      let route = e.route;
      // Do something with the route here
      // console.log(route.coordinates);
      
      if(route && route.coordinates) {
        route.coordinates.forEach(element => {
          this.allGoefences.push([element.lat, element.lng]);
        });
      }
      const bufferLine: any = {
        "type": "Feature",
        "properties": {
          "color": "blue"
        },
        "geometry": {
          "type": "LineString",
          "coordinates": this.allGoefences
        }
      }
      const geoFencesByLevels = [];
      const polygonGeometry = turf.buffer(bufferLine, 50, {
        units: 'meters'
      });
      if(polygonGeometry &&  polygonGeometry.geometry && polygonGeometry.geometry.coordinates) {
        polygonGeometry.geometry.coordinates.forEach(element => {
          element.forEach(cord => {
            this.geoCoordinatesForSmartRules.push( {
              lat: cord[0], 
              lng: cord[1]
            });
          });
          
        });
      }
      const geoFence = new L.Polygon(polygonGeometry.geometry.coordinates, {
        color: 'blue', weight: 1, className: 'lt-gf-base'
      });
      geoFencesByLevels.push(geoFence);
      const fgOnLvl = { name: 'GeoFence', floor: 0, layer: L.featureGroup(geoFencesByLevels) };
      fgOnLvl.layer.bringToFront();
      this.layerControl.addOverlay(fgOnLvl.layer, fgOnLvl.name);
      this.layerControl.addTo(this.map);

      this.manageSmartRule();
      /* if (this.floorPlanData && this.floorPlanData.length > 0) {
          if (isDevMode()) { console.log('+-+- ADDITION FOUND ', this.floorPlanData); }
          this.floorPlanData.forEach((bfp) => {
              if (bfp.levels && bfp.levels.length > 0) {
                  bfp.levels.forEach(level => {
                      const geoFencesByLevels = [];
                      let fgOnLvl = this.allGoefences.find((i) => (i.floor === Number(level.level)));
                      if (level.geofences && level.geofences.length > 0) {
                          level.geofences.forEach(geofences => {
                              const geoCoord = geofences.coordinates.map((coord => ({...coord, alt: Number(level.level)})));
                              const geoFence = new L.Polygon(geoCoord, {
                                  color: 'blue', weight: 1, className: 'lt-gf-base'
                              });
                              geoFencesByLevels.push(geoFence);
                          });
                      }
                      if (!fgOnLvl) {
                          fgOnLvl = { name: 'GeoFence', floor: Number(level.level), layer: L.featureGroup(geoFencesByLevels) };
                          this.allGoefences.push(fgOnLvl);
                      } else {
                          geoFencesByLevels.forEach((geofence) => {
                              fgOnLvl.layer.addLayer(geofence);
                          });
                      }
                  });
              }
          });
          if (this.allGoefences && this.allGoefences.length > 0) {
              this.loadOverlay();
          }
      } else {
          if (isDevMode()) { console.log('+-+- GEOFENCES NOT RENDERED IN DASHBOARDS NOT ASSIGED TO A GROUP/DEVICE...'); }
      } */
  } 
  
    /**
     * Attached Navigation popup with component resolver.
     */
  /*   private createNavigationPopupForMarker(layer: any, popup: any, data?: any) {
      const compFactory = this.resolver.resolveComponentFactory(
        GPDataPointMapPopupComponent
      );
      this.popupDetailCompRef = compFactory.create(this.injector);
      if (this.appRef.attachView) {
        // since 2.3.0
        this.appRef.attachView(this.popupDetailCompRef.hostView);
      } else {
        // tslint:disable-next-line: no-string-literal
        this.appRef['registerChangeDetector'](
          this.popupDetailCompRef.changeDetectorRef
        );
      }
  
      const div = document.createElement('div');
      div.appendChild(this.popupDetailCompRef.location.nativeElement);
      popup.setContent(div);
      if (data) {
        this.popupDetailCompRef.instance.editData = data;
      }
    } */
  
    /**
     * Findout navigation property in device object
     */
    private getNavigationFields(dashboardField, deviceObj) {
      let navigationField = null;
      const dashboardFields = dashboardField.split('.');
      const dashboardFieldObj = deviceObj[dashboardFields[0]];
      if (
        dashboardFieldObj &&
        Array.isArray(dashboardFieldObj) &&
        dashboardFields.length === 2
      ) {
        if (dashboardFieldObj.length > 0) {
          const deviceWithAppId = dashboardFieldObj.find(
            (dashboard) => dashboard.appId === this.appId
          );
          if (deviceWithAppId) {
            navigationField = deviceWithAppId[dashboardFields[1]];
          } else {
            navigationField = dashboardFieldObj[0][dashboardFields[1]];
          }
        }
      } else if (dashboardFieldObj && dashboardFields.length === 2) {
        navigationField = dashboardFieldObj[dashboardFields[1]];
      } else {
        navigationField = dashboardFieldObj;
      }
      return navigationField;
    }
  
    /**
     * Create popup content for device marker where dashboard link is not provided
     */
    private getPopupContent(elems): string {
      let ppContent = '';
      for (const elem of elems) {
        ppContent =
          ppContent +
          `<div class='lt-popup-row'><label class=''>${elem.label}</label><div class=''>${elem.value}</div></div>`;
      }
      return ppContent;
    }
  
    /**
     * Update marker position based on realtime device movement
     */
    private updateMarkerPosition(data: IManagedObject) {
      // this.allMarkers[data.id].setLatLng(new L.latLng(data.c8y_Position.lat, data.c8y_Position.lng));
      const newPosLatLng = new L.latLng(
        data.c8y_Position.lat,
        data.c8y_Position.lng
      );
      this.allMarkers[data.id].moveTo(newPosLatLng, 2000);
      const markerBound = new L.LatLngBounds(newPosLatLng, newPosLatLng);
      const mapBounds = this.map.getBounds();
      mapBounds.extend(markerBound);
      this.map.flyToBounds(mapBounds, { maxZoom: this.initialMaxZoom });
      const markers = L.markerClusterGroup();
      markers.refreshClusters(this.allMarkers[data.id]);
    }
  
    /**
     * THis method is used to load all layers(marker, geofence, heatmap, etc) on map based on given configuration
     */
    private addLayerToMap(mapBounds: any) {
      if (this.map) {
        let initLayerSet = false;
        this.featureGroup.forEach((fg, idx) => {
          // this will set the layer to be shown initially. Should not show levels without devices initially...
          // the feature group will contain devices and plans as layers.
          if (!initLayerSet && this.featureGroup.length === 1) {
            fg.layer.addTo(this.map);
            initLayerSet = true;
          }
          if (this.featureGroup.length > 1) {
            this.layerControl.addBaseLayer(fg.layer, fg.name);
          }
        });
        if (!mapBounds) {
          mapBounds = new L.LatLngBounds([0, 0], [0, 0]);
        }
        this.map.flyToBounds(mapBounds, { maxZoom: this.initialMaxZoom });
        if (this.featureGroup && this.featureGroup.length > 1) {
          this.layerControl.addTo(this.map);
        }
        this.isBusy = false;
//        this.getMeasurements();
        this.allDeviceList = [];
      }
    }
 
    /**
     * Create smart rule for given geofence details
     */
     private async creatSmartRule() {
      const data = {
          'type': 'c8y_SmartRule',
          'name': `Route Tracker Geofence - ${this.deviceId}`,
          'enabled': true,
          'config': {
              'geofence': this.geoCoordinatesForSmartRules,
              'triggerAlarmOn': 'leaving',
              'alarmType': 'c8y_GeofenceAlarm',
              'alarmSeverity': 'MAJOR',
              'alarmText': 'Geofence Violation'
          },
          'ruleTemplateName': 'onGeofenceCreateAlarm',
          'enabledSources': [
              this.deviceId
          ]
      };
      const options: IFetchOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      };
      const response = (await (await this.fetchClient.fetch('/service/smartrule/smartrules', options)).json()); // Fetch API Response
      if (response && response.id) {
          localStorage.setItem('routeTrackerSmartRuleId', response.id);
      }
  }

  
    /**
     * Update exisitng smart rule for given geofence details
     */
     private async updateSmartRule(id) {
      const data = {
          'id': id,
        //  'type': 'c8y_SmartRule',
        'name': `Route Tracker Geofence - ${this.deviceId}`,
        'enabled': true,
        'config': {
            'geofence': this.geoCoordinatesForSmartRules,
            'triggerAlarmOn': 'leaving',
            'alarmType': 'c8y_GeofenceAlarm',
            'alarmSeverity': 'MAJOR',
            'alarmText': 'Geofence Violation'
        },
        'ruleTemplateName': 'onGeofenceCreateAlarm',
        'enabledSources': [
            this.deviceId
        ]
      };
      const options: IFetchOptions = {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      };
      const response = (await (await this.fetchClient.fetch(`/service/smartrule/smartrules/${id}`, options)).json());
      /* if (response && response.id) {
          smartRuleConfig.smartRuleId = response.id;
      }
      return geofence; */
  }
  private async manageSmartRule() {
    const smartRuleName = `Route Tracker Geofence - ${this.deviceId}`;
    const options: IFetchOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    (await (await this.fetchClient.fetch('/service/smartrule/smartrules', options))).json()
    .then(async (smartRulesList) => {
    //   const sessionSmartRuleId = localStorage.getItem('routeTrackerSmartRuleId');
       const smartRuleRecord = smartRulesList.rules.find((rule) => rule.name === smartRuleName);
     //  console.log('smartRuleRecord', smartRuleRecord);
        if(smartRuleRecord) {
          this.updateSmartRule(smartRuleRecord.id);
        } else {
          this.creatSmartRule();
        }
    });
  }
}
