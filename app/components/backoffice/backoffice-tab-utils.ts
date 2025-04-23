import {ActionTab, LabelledTab} from "./backoffice-tabs";

export function createTab(label: string, component: React.ReactNode): LabelledTab {
  return {
    type: 'labelledTab',
    label,
    component
  }
}

export function createActionTab(action: React.ReactNode): ActionTab {
  return {
    type: 'actionTab',
    action
  }
}
