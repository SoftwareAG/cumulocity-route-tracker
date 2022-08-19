import { NgModule } from '@angular/core';
import { CommonModule, CoreModule, HOOK_COMPONENTS } from '@c8y/ngx-components';
import { GpRouteTrackerComponent } from './gp-route-tracker.component';
import { GpRouteTrackerConfigComponent } from './route-tracker-config/gp-route-tracker-config.component';
import * as preview from './preview-image';
import { AngularResizedEventModule } from 'angular-resize-event';
import { MovingMarkerService } from './services/movingMarker.service';
import { AppIdService } from './services/app-id.service';
import { GpRouteTrackerService } from './services/gp-route-tracker.service';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { LocationSearchService } from './services/locationSearch.service';
import {NgSelectModule} from "@ng-select/ng-select";
import {FormsModule} from "@angular/forms";
import {IconSelectorComponent} from "./icon-selector/icon-selector.component";
import { ColorPickerComponent } from './color-picker/color-picker-component';
import { ColorSliderComponent } from './color-picker/color-slider/color-slider-component';
import { ColorPaletteComponent } from './color-picker/color-palette/color-palette-component';

@NgModule({
  declarations: [GpRouteTrackerComponent, GpRouteTrackerConfigComponent,IconSelectorComponent,ColorPickerComponent,ColorSliderComponent,ColorPaletteComponent],
  imports: [
  CoreModule,
  CommonModule,
  FormsModule,
  AngularResizedEventModule,
  NgSelectModule,
  TypeaheadModule.forRoot()
  ],
  exports: [GpRouteTrackerComponent,GpRouteTrackerConfigComponent,IconSelectorComponent,ColorPickerComponent],
  entryComponents: [GpRouteTrackerComponent,GpRouteTrackerConfigComponent,IconSelectorComponent,ColorPickerComponent,ColorSliderComponent,ColorPaletteComponent,],
  providers: [
    MovingMarkerService,
    AppIdService,
    GpRouteTrackerService,
    LocationSearchService,
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: {
        id: 'route-tracker-widget',
        label: 'Route Tracker',
        previewImage: preview.previewImage,
        description:
          'The Route Tracker widget will display route along with realtime device status.',
        component: GpRouteTrackerComponent,
        configComponent: GpRouteTrackerConfigComponent,
        data: {
          ng1: {
            options: {
              noDeviceTarget: false,
              noNewWidgets: false,
              deviceTargetNotRequired: false,
              groupsSelectable: true,
            },
          },
        },
      },
    },
  ]
})
export class GpRouteTrackerModule { }
