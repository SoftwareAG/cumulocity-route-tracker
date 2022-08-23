# Cumulocity Route Tracker Widget
## Overview

This widget will display route, geofence along with realtime device status and also one can enable the smart rule which gets trigged when smart rule violation happens.",

## Representation

![RouteTrackermain](https://user-images.githubusercontent.com/24636020/186117425-55a2c67b-1dbf-47ba-b50f-5331e07c580a.PNG)

## Supported Product Versions

###  Route Tracker  widget - Cumulocity/Application builder version:

|APPLICATION BUILDER | CUMULOCITY | AMBER RCA  WIDGET |
|--------------------|------------|-------------------|
| 1.3.x              | >= 1011.x.x| 2.x.x             |


## Installation

### Runtime Widget Deployment?

* This widget support runtime deployment. Download [Runtime Binary](https://github.com/SoftwareAG/cumulocity-route-tracker/releases/download/2.0.0/route-tracker-runtime-widget-2.0.0.zip) and use application builder to install your runtime widget.

### Installation of widget through Appbuilder 

**Prerequisites:**
  
* Git
  
* NodeJS (release builds are currently built with `v14.18.0`)
  
* NPM (Included with NodeJS)
  
**External dependencies:**

```

 "@angular/cdk": "^11.2.13",

 "@angular/core": "~11.1.2",

"@c8y/ngx-components": "1011.0.12",

"@c8y/ng1-modules": "1011.0.12",

"@c8y/style": "1011.0.12",

angular-resize-event": "^2.1.0"

"fontawesome": "4.7.2"

"leaflet-extra-markers": "^1.2.1"

"leaflet2": "npm:leaflet@^1.6.0"

"leaflet.markercluster": "^1.4.1

"moment": "^2.26.0",

```

**Installation Steps For App Builder:**

**Note:** If you are new to App Builder or not yet downloaded/clone app builder code then please follow [App builder documentation(Build Instructions)](https://github.com/SoftwareAG/cumulocity-app-builder) before proceeding further.

1. Grab the Route Tracker Widget binary file **[Latest Release Binary](https://github.com/SoftwareAG/cumulocity-route-tracker/releases/download/2.0.0/gp-route-tracker-2.0.0.tgz)**

3. Install the Binary file in app builder.

```
npm i <binary  file  path>/gp-route-tracker-2.0.0.tgz
```
4. Open index.less located at /cumulocity-app-builder/ui-assets/

5. Update index.less file with below theme. Import at first line in file/begining of file(Please ignore this step if it already exist).

```
@import '~@c8y/style/main.less';
@import '~@c8y/style/extend.less';
```
6. Import GpRouteTrackerModule in app.module.ts and also place the imported Module under `@NgModule`.

```

import {GpRouteTrackerModule} from 'gp-route-tracker';

@NgModule({

  imports: [

    GpRouteTrackerModule    

      ]

  })

```

7.  Congratulation! Installation is now completed. Now you can run app builder locally or build and deploy it into your tenant.
  
```
//Start App Builder
npm run start
// Build App
npm run build
// Deploy App
npm run deploy
```
## Build Instructions
  
**Note:** It is only necessary to follow these instructions if you are modifying/extending this widget, otherwise see the [Installation Guide](#Installation).
  
**Prerequisites:**
  
* Git
  
* NodeJS (release builds are currently built with `v14.18.0`)
  
* NPM (Included with NodeJS)

**Instructions**

1. Clone the repository:
```
git clone https://github.com/SoftwareAG/cumulocity-route-tracker.git
```
2. Change directory:

  ```cd cumulocity-route-tracker```

3. run npm i command to install all library files specified in source code

  ```npm i ``` 

4. run npm run buildMinor command to create a binary file under dist folder

  ```npm run buildMinor ``` 

5. (Optional) Local development server:
  
  ```npm start```

6. Build the app:

  ```npm run build```

7. Deploy the app:
  ```npm run deploy```

## QuickStart
This guide will teach you how to add widget in your existing or new dashboard.

1. Open the Application Builder from the app switcher (Next to your username in the top right)

2. Click Add application

3. Enter the application details and click Save

4. Select Add dashboard

5. Click Blank Dashboard

6. Enter the dashboard details and click Save

7. Select the dashboard from the navigation

8. Check for your widget and test it out.



Congratulations! BoonLogic Amber setting widget is configured.


## User Guide

![RouteTrackerConfiguration](https://user-images.githubusercontent.com/24636020/186117674-10d25550-ad94-4551-867a-12abd50bd847.PNG)

1. Takes device name, geofence radius, start and end address/latitude and longitude, icon name color, marker color and smart rule configuration as input.

2. If configured Smart rule with provided name doesnt exist then a new rule get created and if the rule with provided name exists then it updates the existing rule.
**Note** Make sure for different devices and for differnt configuration a uinique smart rule name need to be provided else it overrides if the rule with name exists.

To check the smart rules please navigate to Application switcher -> Cockpit -> Configuration -> Global smart rule.
------------------------------
  
  
**This widget is provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.**
  
_____________________
  
For more information you can Ask a Question in the **[TECHcommunity Forums](https://tech.forums.softwareag.com/tags/c/forum/1/Cumulocity-IoT)**.
  
  
You can find additional information in the **[Software AG TECHcommunity](https://tech.forums.softwareag.com/tag/Cumulocity-IoT)**.