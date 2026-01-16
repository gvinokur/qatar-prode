import {ActionTab, LabelledTab} from "./backoffice-tabs";

export function createTab(label: string, component: React.ReactNode, isDevOnly:boolean = false, isActive?: boolean): LabelledTab {
  return {
    type: 'labelledTab',
    label,
    component,
    isDevOnly,
    isActive
  }
}

export function createActionTab(action: React.ReactNode): ActionTab {
  return {
    type: 'actionTab',
    action
  }
}
