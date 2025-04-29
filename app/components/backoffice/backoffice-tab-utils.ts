import {ActionTab, LabelledTab} from "./backoffice-tabs";

export function createTab(label: string, component: React.ReactNode, isDevOnly:boolean = false): LabelledTab {
  return {
    type: 'labelledTab',
    label,
    component,
    isDevOnly
  }
}

export function createActionTab(action: React.ReactNode): ActionTab {
  return {
    type: 'actionTab',
    action
  }
}
