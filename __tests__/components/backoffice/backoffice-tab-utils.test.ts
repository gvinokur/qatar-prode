import { describe, it, expect } from 'vitest';
import { createTab, createActionTab } from '../../../app/components/backoffice/backoffice-tab-utils';
import React from 'react';

describe('backoffice-tab-utils', () => {
  describe('createTab', () => {
    it('should create a labelled tab with all properties', () => {
      const component = React.createElement('div', null, 'Test Component');

      const tab = createTab('Test Label', component, true, true);

      expect(tab).toEqual({
        type: 'labelledTab',
        label: 'Test Label',
        component,
        isDevOnly: true,
        isActive: true,
      });
    });

    it('should create a labelled tab with default isDevOnly as false', () => {
      const component = React.createElement('div', null, 'Test Component');

      const tab = createTab('Test Label', component);

      expect(tab).toEqual({
        type: 'labelledTab',
        label: 'Test Label',
        component,
        isDevOnly: false,
        isActive: undefined,
      });
    });

    it('should create a labelled tab with isDevOnly true and undefined isActive', () => {
      const component = React.createElement('div', null, 'Test Component');

      const tab = createTab('Test Label', component, true);

      expect(tab).toEqual({
        type: 'labelledTab',
        label: 'Test Label',
        component,
        isDevOnly: true,
        isActive: undefined,
      });
    });

    it('should create an inactive tab', () => {
      const component = React.createElement('div', null, 'Test Component');

      const tab = createTab('Inactive Tab', component, false, false);

      expect(tab).toEqual({
        type: 'labelledTab',
        label: 'Inactive Tab',
        component,
        isDevOnly: false,
        isActive: false,
      });
    });
  });

  describe('createActionTab', () => {
    it('should create an action tab', () => {
      const action = React.createElement('button', null, 'Action Button');

      const tab = createActionTab(action);

      expect(tab).toEqual({
        type: 'actionTab',
        action,
      });
    });

    it('should create an action tab with different component', () => {
      const action = React.createElement('div', null, 'Action Content');

      const tab = createActionTab(action);

      expect(tab).toEqual({
        type: 'actionTab',
        action,
      });
      expect(tab.type).toBe('actionTab');
    });
  });
});
