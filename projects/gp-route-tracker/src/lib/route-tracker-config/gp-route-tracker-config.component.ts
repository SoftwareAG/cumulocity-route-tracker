import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-route-tracker-config',
  templateUrl: './gp-route-tracker-config.component.html',
  styleUrls: ['./gp-route-tracker-config.component.css']
})
export class GpRouteTrackerConfigComponent implements OnInit {
  @Input() config: any = {};
  constructor() { }

  ngOnInit(): void {
  }

}
