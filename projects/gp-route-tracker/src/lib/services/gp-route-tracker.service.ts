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
import { Injectable } from '@angular/core';
import { IManagedObject, InventoryService, IResultList } from '@c8y/client';

@Injectable()
export class GpRouteTrackerService {
  constructor(private invSvc: InventoryService) {}

  /**
   * Retrieve the details for the specified managed object as a Promise
   *
   * @param deviceId Id of the managed object
   */
  getTargetObject(deviceId: string): any {
    return new Promise((resolve, reject) => {
      this.invSvc.detail(deviceId).then((resp) => {
        if (resp.res.status === 200) {
          resolve(resp.data);
        } else {
          reject(resp);
        }
      });
    });
  }

  /**
   * This service will recursively get all the child devices for the given device id and return a promise with the result list.
   *
   * @param id ID of the managed object to check for child devices
   * @param pageToGet Number of the page passed to the API
   * @param allDevices Child Devices already found
   */
  getChildDevices(
    id: string,
    pageToGet: number,
    allDevices: { data: any[]; res: any }
  ): Promise<IResultList<IManagedObject>> {
    const inventoryFilter = {
      pageSize: 50,
      withTotalPages: true,
      currentPage: pageToGet,
    };
    if (!allDevices) {
      allDevices = { data: [], res: null };
    }
    return new Promise((resolve, reject) => {
      this.invSvc.childAssetsList(id, inventoryFilter).then((resp) => {
        if (resp.res.status === 200) {
          if (resp.data && resp.data.length >= 0) {
            allDevices.data.push.apply(allDevices.data, resp.data);
            // suppose that if # of devices is less that the page size, then all devices have already been retrieved
            if (resp.data.length < inventoryFilter.pageSize) {
              resolve(allDevices);
            } else {
              this.getChildDevices(id, resp.paging.nextPage, allDevices)
                .then((np) => {
                  resolve(allDevices);
                })
                .catch((err) => reject(err));
            }
          }
        } else {
          reject(resp);
        }
      });
    });
  }
}
