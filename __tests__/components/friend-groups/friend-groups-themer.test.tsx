import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ProdeGroupThemer from '../../../app/components/friend-groups/friend-groups-themer';
import { ProdeGroup } from '../../../app/db/tables-definition';
import { renderWithTheme } from '../../utils/test-utils';

// Mock the dependencies
vi.mock('../../../app/actions/prode-group-actions', () => ({
  updateTheme: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn()
  }))
}));

vi.mock('../../../app/utils/theme-utils', () => ({
  getThemeLogoUrl: vi.fn()
}));

vi.mock('../../../app/components/friend-groups/image-picker', () => ({
  __esModule: true,
  default: vi.fn(({ onChange, defaultValue, id, ...props }) => (
    <input
      data-testid="image-picker"
      type="file"
      accept="image/*"
      onChange={onChange}
      {...props}
    />
  ))
}));

const mockGroup: ProdeGroup = {
  id: 'group1',
  name: 'Test Group',
  owner_user_id: 'owner1',
  theme: {
    primary_color: '#ff0000',
    secondary_color: '#00ff00'
  }
};

const mockGroupWithoutTheme: ProdeGroup = {
  id: 'group2',
  name: 'Test Group 2',
  owner_user_id: 'owner2',
  theme: undefined
};

describe('ProdeGroupThemer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with correct title', () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    expect(screen.getByText('Customiza el look de tu grupo')).toBeInTheDocument();
  });

  it('displays the group name in the text field', () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const nameField = screen.getByLabelText('Nombre del grupo');
    expect(nameField).toHaveValue('Test Group');
  });

  it('displays existing theme colors when group has theme', () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    // MuiColorInput fields should be present
    const colorInputs = screen.getAllByRole('textbox');
    expect(colorInputs).toHaveLength(3); // name field + 2 color fields
  });

  it('handles group without theme gracefully', () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroupWithoutTheme} />);
    
    const nameField = screen.getByLabelText('Nombre del grupo');
    expect(nameField).toHaveValue('Test Group 2');
    
    // Should still render color inputs with empty values
    const colorInputs = screen.getAllByRole('textbox');
    expect(colorInputs).toHaveLength(3);
  });

  it('renders the image picker component', () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    expect(screen.getByTestId('image-picker')).toBeInTheDocument();
  });

  it('renders the save button', () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const saveButton = screen.getByRole('button', { name: 'Guardar' });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveAttribute('type', 'submit');
  });

  it('allows editing the group name', async () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const nameField = screen.getByLabelText('Nombre del grupo');
    
    fireEvent.change(nameField, { target: { value: 'New Group Name' } });
    
    await waitFor(() => {
      expect(nameField).toHaveValue('New Group Name');
    });
  });

  it('submits the form with updated data', async () => {
    const { updateTheme } = await import('../../../app/actions/prode-group-actions');
    const { useRouter } = await import('next/navigation');
    
    const mockRefresh = vi.fn();
    (useRouter as any).mockReturnValue({ refresh: mockRefresh });
    (updateTheme as any).mockResolvedValue(undefined);
    
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const nameField = screen.getByLabelText('Nombre del grupo');
    const saveButton = screen.getByRole('button', { name: 'Guardar' });
    
    // Update the name
    fireEvent.change(nameField, { target: { value: 'Updated Group Name' } });
    
    // Submit the form
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(updateTheme).toHaveBeenCalledWith('group1', expect.any(FormData));
    });
    
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows loading state during form submission', async () => {
    const { updateTheme } = await import('../../../app/actions/prode-group-actions');
    
    // Mock a delayed response
    (updateTheme as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const saveButton = screen.getByRole('button', { name: 'Guardar' });
    
    fireEvent.click(saveButton);
    
    // Button should show loading state
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it('handles file selection for image picker', async () => {
    renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const imageInput = screen.getByTestId('image-picker');
    
    // Just test that the image picker is present and has correct attributes
    expect(imageInput).toBeInTheDocument();
    expect(imageInput).toHaveAttribute('type', 'file');
    expect(imageInput).toHaveAttribute('accept', 'image/*');
  });

  it('has proper form structure', () => {
    const { container } = renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    
    const nameField = screen.getByLabelText('Nombre del grupo');
    expect(nameField).toBeInTheDocument();
  });

  it('renders within a card container', () => {
    const { container } = renderWithTheme(<ProdeGroupThemer group={mockGroup} />);
    
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
    
    const cardHeader = container.querySelector('.MuiCardHeader-root');
    expect(cardHeader).toBeInTheDocument();
    
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
    
    const cardActions = container.querySelector('.MuiCardActions-root');
    expect(cardActions).toBeInTheDocument();
  });
});
