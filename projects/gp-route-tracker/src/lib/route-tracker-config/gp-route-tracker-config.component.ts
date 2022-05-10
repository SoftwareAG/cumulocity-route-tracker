import { Component, Input, OnInit } from '@angular/core';
import { SmartRuleInterface } from '../interfaces/smartRule.interface';

@Component({
  selector: 'app-route-tracker-config',
  templateUrl: './gp-route-tracker-config.component.html',
  styleUrls: ['./gp-route-tracker-config.component.css']
})
export class GpRouteTrackerConfigComponent implements OnInit {
  @Input() config: any = {};
  smartRuleConfig: SmartRuleInterface = {};
  smartRuleTriggerOptions = [
    { value: 'entering', viewValue: 'On entering' },
    { value: 'leaving', viewValue: 'On leaving' },
    { value: 'both', viewValue: 'On entering and leaving' }
];
  smartRuleSeverityOptions = ['WARNING', 'MINOR', 'MAJOR', 'CRITICAL'];
  constructor() { }


  ngOnInit(): void {
    if(this.config && this.config.smartRuleConfig) {
      this.smartRuleConfig = this.config.smartRuleConfig;
    }
  }

  updateSmartRule() {
    this.config.smartRuleConfig = this.smartRuleConfig;

  }
}
