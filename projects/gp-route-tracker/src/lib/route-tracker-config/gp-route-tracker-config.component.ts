import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { SmartRuleInterface } from '../interfaces/smartRule.interface';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { Observer } from 'rxjs';
import { LocationSearchService } from './../services/locationSearch.service';
import { LocationResult } from './../interfaces/locationSearch.model';
import * as turf from '@turf/turf'

const L: any = window.L;

@Component({
  selector: 'app-route-tracker-config',
  templateUrl: './gp-route-tracker-config.component.html',
  styleUrls: ['./gp-route-tracker-config.component.css']
})
export class GpRouteTrackerConfigComponent implements OnInit {
  @Input() config: any = {};
  smartRuleConfig: SmartRuleInterface = {};
  protected layerControl = L.control.layers([], [], {});
  private allGoefences: any = [];
  protected map: any;

  smartRuleTriggerOptions = [
    { value: 'entering', viewValue: 'On entering' },
    { value: 'leaving', viewValue: 'On leaving' },
    { value: 'both', viewValue: 'On entering and leaving' }
  ];
  smartRuleSeverityOptions = ['WARNING', 'MINOR', 'MAJOR', 'CRITICAL'];
  userSelectedColor = [];
  result;
  value = '';
  routeEndvalue = '';
  suggestions$: Observable<any[]>;
  routeEndSuggestions$: Observable<any[]>;
  isLoading = false;
  routeStartPlace = '';
  routeEndPlace = '';
  routeStartLatCoord;
  routeStartLngCoord;
  routeEndLatCoord;
  routeEndLngCoord;
  // locationSearchAPI = 'https://open.mapquestapi.com/nominatim/v1/search.php?key=MgOKczqMYTkXK5jiMgEYGvjnTHf562mA&format=json&q=';
  constructor(private http: HttpClient, private locationSearchAPI: LocationSearchService) { }
  ngOnInit(): void {
    if (this.config && this.config.smartRuleConfig) {
      this.smartRuleConfig = this.config.smartRuleConfig;
    }
    this.suggestions$ = new Observable((observer: Observer<any>) => {

      this.locationSearchAPI.searchGeoLocation(this.value).subscribe((res: any) => {
        console.log(res);
        observer.next(res);
      });
    });
    this.routeEndSuggestions$ = new Observable((observer: Observer<any>) => {

      this.locationSearchAPI.searchGeoLocation(this.routeEndvalue).subscribe((res: any) => {
        console.log(res);
        observer.next(res);
      });
    });

  }
  updateSmartRule() {
    this.config.smartRuleConfig = this.smartRuleConfig;
  }
  // Update the colors input from color picker
  colorUpdate(colorSelected) {
    this.config.iconColor = colorSelected
  }
  // Update the colors input from color input box
  colorUpdateByTyping(colorTyped) {
    console.log('typed', colorTyped);
    this.config.iconColor = colorTyped
  }

  calledthis(address) {
    console.log('Address  =>  ', this.config.address, address);
  }
  changeTypeaheadLoading(e: boolean): void {
    this.isLoading = e;
  }
  /**
     * Change map coordinates based on location search API output
     */
  displayFn(searchResult: LocationResult) {
    console.log('searchResult', searchResult)
    if (searchResult) {
      this.config.startLat = searchResult.lat;
      this.config.startLng = searchResult.lon;
      this.routeStartLatCoord = searchResult.lat;
      this.routeStartLngCoord = searchResult.lon;
      this.config.routeStartPlace = searchResult.display_name;
    }
  }
  displayFunc(searchResult: LocationResult) {
    console.log('searchResult', searchResult)
    if (searchResult) {
      this.config.endLat = searchResult.lat;
      this.config.endLng = searchResult.lon;
      this.routeEndLatCoord = searchResult.lat;
      this.routeEndLngCoord = searchResult.lon;
      this.config.routeEndPlace = searchResult.display_name;
      this.__doRenderGeofencesOnMap();
    }
  }
  onRouteStartSelect(event: TypeaheadMatch): void {
    this.displayFn(event.item);
  }
  onRouteEndSelect(event: TypeaheadMatch): void {
    this.displayFunc(event.item);
  }

  /**
     * Render geofence on map
     */
  private async __doRenderGeofencesOnMap(e?: any) {
    // let route = e.route;
    // Do something with the route here
    // console.log(route.coordinates);

    // if(route && route.coordinates) {
    //   route.coordinates.forEach(element => {
    //     this.allGoefences.push([element.lat, element.lng]);
    //   });
    // }
    this.allGoefences.push([this.routeStartLatCoord, this.routeStartLngCoord]);
    this.allGoefences.push([this.routeEndLngCoord, this.routeEndLngCoord]);

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
    // if(polygonGeometry &&  polygonGeometry.geometry && polygonGeometry.geometry.coordinates) {
    //   polygonGeometry.geometry.coordinates.forEach(element => {
    //     element.forEach(cord => {
    //       this.geoCoordinatesForSmartRules.push( {
    //         lat: cord[0], 
    //         lng: cord[1]
    //       });
    //     });

    //   });
    // }
    const geoFence = new L.Polygon(polygonGeometry.geometry.coordinates, {
      color: 'blue', weight: 1, className: 'lt-gf-base'
    });
    geoFencesByLevels.push(geoFence);
    const fgOnLvl = { name: 'GeoFence', floor: 0, layer: L.featureGroup(geoFencesByLevels) };
    fgOnLvl.layer.bringToFront();
    this.layerControl.addOverlay(fgOnLvl.layer, fgOnLvl.name);
    this.layerControl.addTo(this.map);
    console.log('geoFence =>    =>  ', this.allGoefences, geoFence);
  }
}
