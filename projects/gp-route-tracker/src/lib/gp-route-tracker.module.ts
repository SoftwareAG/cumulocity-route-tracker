/**
 * Copyright (c) 2020 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { IconSelectorComponent } from './icon-selector/icon-selector.component';

@NgModule({
  declarations: [GpRouteTrackerComponent, GpRouteTrackerConfigComponent, IconSelectorComponent],
  imports: [
    CoreModule,
    CommonModule,
    FormsModule,
    AngularResizedEventModule,
    NgSelectModule,
    TypeaheadModule.forRoot(),
  ],
  exports: [GpRouteTrackerComponent, GpRouteTrackerConfigComponent, IconSelectorComponent],
  entryComponents: [GpRouteTrackerComponent, GpRouteTrackerConfigComponent, IconSelectorComponent],
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
  ],
})
export class GpRouteTrackerModule {}
