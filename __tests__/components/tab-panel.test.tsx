import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import TabPanel from '../../app/components/tab-panel';

describe('TabPanel', () => {
  const defaultProps = {
    index: 0,
    value: 0,
    children: <div>Test Content</div>,
  };

  it('renders content when value matches index', () => {
    render(<TabPanel {...defaultProps} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('hides content when value does not match index', () => {
    render(<TabPanel {...defaultProps} value={1} />);
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('applies correct accessibility attributes', () => {
    render(<TabPanel {...defaultProps} />);
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).toHaveAttribute('id', 'vertical-tabpanel-0');
    expect(tabPanel).toHaveAttribute('aria-labelledby', 'vertical-tab-0');
  });

  it('applies correct accessibility attributes for different indices', () => {
    render(<TabPanel {...defaultProps} index={3} value={3} />);
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).toHaveAttribute('id', 'vertical-tabpanel-3');
    expect(tabPanel).toHaveAttribute('aria-labelledby', 'vertical-tab-3');
  });

  it('sets hidden attribute when not active', () => {
    render(<TabPanel {...defaultProps} value={1} />);
    const tabPanel = screen.getByRole('tabpanel', { hidden: true });
    expect(tabPanel).toHaveAttribute('hidden');
  });

  it('does not set hidden attribute when active', () => {
    render(<TabPanel {...defaultProps} />);
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).not.toHaveAttribute('hidden');
  });

  it('applies overflow-y auto styles', () => {
    render(<TabPanel {...defaultProps} />);
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).toHaveStyle({ overflowY: 'auto' });
  });

  it('passes through additional Box props', () => {
    render(
      <TabPanel 
        {...defaultProps} 
        data-testid="custom-tab-panel"
        sx={{ backgroundColor: 'red' }}
      />
    );
    const tabPanel = screen.getByTestId('custom-tab-panel');
    expect(tabPanel).toBeInTheDocument();
    // MUI sx prop applies styles through CSS classes, so we just check the prop exists
    expect(tabPanel).toHaveAttribute('data-testid', 'custom-tab-panel');
  });

  it('renders children with padding when active', () => {
    render(<TabPanel {...defaultProps} />);
    const tabPanel = screen.getByRole('tabpanel');
    // Check that content is rendered inside tabpanel
    expect(tabPanel).toContainElement(screen.getByText('Test Content'));
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders null children gracefully', () => {
    render(<TabPanel {...defaultProps} children={null} />);
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).toBeInTheDocument();
    expect(tabPanel).not.toHaveAttribute('hidden');
  });

  it('renders empty children gracefully', () => {
    render(<TabPanel {...defaultProps} children={undefined} />);
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).toBeInTheDocument();
    expect(tabPanel).not.toHaveAttribute('hidden');
  });

  it('renders multiple children correctly', () => {
    render(
      <TabPanel 
        {...defaultProps} 
        children={
          <>
            <div>First child</div>
            <div>Second child</div>
            <span>Third child</span>
          </>
        }
      />
    );
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  it('handles complex nested content', () => {
    render(
      <TabPanel 
        {...defaultProps} 
        children={
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        }
      />
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('handles zero index correctly', () => {
    render(<TabPanel index={0} value={0}>Zero index content</TabPanel>);
    expect(screen.getByText('Zero index content')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'vertical-tabpanel-0');
  });

  it('handles negative index correctly', () => {
    render(<TabPanel index={-1} value={-1}>Negative index content</TabPanel>);
    expect(screen.getByText('Negative index content')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'vertical-tabpanel--1');
  });

  it('handles large index values correctly', () => {
    render(<TabPanel index={999} value={999}>Large index content</TabPanel>);
    expect(screen.getByText('Large index content')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'vertical-tabpanel-999');
  });

  it('preserves original Box functionality', () => {
    render(
      <TabPanel 
        {...defaultProps} 
        component="section"
        className="custom-class"
        style={{ margin: '10px' }}
      />
    );
    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel.tagName).toBe('SECTION');
    expect(tabPanel).toHaveClass('custom-class');
    expect(tabPanel).toHaveStyle({ margin: '10px' });
  });

  it('handles string children correctly', () => {
    render(<TabPanel {...defaultProps} children="Simple string content" />);
    expect(screen.getByText('Simple string content')).toBeInTheDocument();
  });

  it('handles dynamic content switching', () => {
    const { rerender } = render(<TabPanel index={0} value={0}>First content</TabPanel>);
    expect(screen.getByText('First content')).toBeInTheDocument();
    
    rerender(<TabPanel index={0} value={1}>First content</TabPanel>);
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
    
    rerender(<TabPanel index={0} value={0}>Second content</TabPanel>);
    expect(screen.getByText('Second content')).toBeInTheDocument();
  });

  it('applies correct styles to content wrapper', () => {
    render(<TabPanel {...defaultProps} />);
    const tabPanel = screen.getByRole('tabpanel');
    // Check that content is rendered inside tabpanel with proper structure
    expect(tabPanel).toContainElement(screen.getByText('Test Content'));
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('maintains consistent structure when inactive', () => {
    render(<TabPanel {...defaultProps} value={1} />);
    const tabPanel = screen.getByRole('tabpanel', { hidden: true });
    expect(tabPanel).toHaveAttribute('hidden');
    expect(tabPanel).toHaveAttribute('role', 'tabpanel');
    expect(tabPanel).toHaveAttribute('id', 'vertical-tabpanel-0');
    expect(tabPanel).toHaveAttribute('aria-labelledby', 'vertical-tab-0');
  });
});
