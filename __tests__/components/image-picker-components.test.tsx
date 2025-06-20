import { vi, describe, it, expect } from 'vitest';
// Mock the utility functions
vi.mock('../../app/components/friend-groups/image-picker-utils', () => ({
  getImageDimensions: vi.fn(() => Promise.resolve({ width: 200, height: 100 })),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageCard, ImagePreview, NoImagePreview } from '../../app/components/friend-groups/image-picker-components';

// Mock global URL.createObjectURL for jsdom
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

describe('ImagePicker Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NoImagePreview', () => {
    const baseProps = {
      onClick: vi.fn(),
      noImageText: 'No image selected',
      aspectRatio: 1,
      previewWidth: 200,
    };

    it('renders with default props', () => {
      render(<NoImagePreview {...baseProps} />);
      expect(screen.getByText('No image selected')).toBeInTheDocument();
      expect(screen.getByTestId('CropOriginalIcon')).toBeInTheDocument();
    });

    it('renders with custom aspect ratio', () => {
      render(<NoImagePreview {...baseProps} aspectRatio={2} />);
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      render(<NoImagePreview {...baseProps} />);
      const container = screen.getByText('No image selected').closest('div');
      fireEvent.click(container!);
      expect(baseProps.onClick).toHaveBeenCalled();
    });

    it('renders with custom preview width', () => {
      render(<NoImagePreview {...baseProps} previewWidth={300} />);
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });
  });

  describe('ImagePreview', () => {
    const baseProps = {
      dataUrl: 'data:image/png;base64,MOCKDATA',
      onClick: vi.fn(),
      onRemove: vi.fn(),
      aspectRatio: 1,
      previewWidth: 200,
      previewBackgroundColor: '#f0f0f0',
    };

    it('renders image with correct src', async () => {
      await act(async () => {
        render(<ImagePreview {...baseProps} />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
      const img = screen.getByAltText('preview');
      expect(img).toHaveAttribute('src', 'data:image/png;base64,MOCKDATA');
    });

    it('calls onClick when image container is clicked', async () => {
      await act(async () => {
        render(<ImagePreview {...baseProps} />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
      const img = screen.getByAltText('preview');
      const container = img.closest('div');
      fireEvent.click(container!);
      expect(baseProps.onClick).toHaveBeenCalled();
    });

    it('calls onRemove when delete button is clicked', async () => {
      await act(async () => {
        render(<ImagePreview {...baseProps} />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
      const deleteBtn = screen.getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteBtn!);
      expect(baseProps.onRemove).toHaveBeenCalled();
    });

    it('prevents event propagation when delete button is clicked', async () => {
      await act(async () => {
        render(<ImagePreview {...baseProps} />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
      const deleteBtn = screen.getByTestId('DeleteIcon').closest('button');
      const mockEvent = { stopPropagation: vi.fn() };
      // Simulate the click event with the event object
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'stopPropagation', { value: mockEvent.stopPropagation });
      fireEvent(deleteBtn!, clickEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('renders with custom aspect ratio', async () => {
      await act(async () => {
        render(<ImagePreview {...baseProps} aspectRatio={2} />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
    });

    it('renders with custom background color', async () => {
      await act(async () => {
        render(<ImagePreview {...baseProps} previewBackgroundColor="#ff0000" />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
    });

    it('renders with custom preview width', async () => {
      await act(async () => {
        render(<ImagePreview {...baseProps} previewWidth={300} />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
    });
  });

  describe('ImageCard', () => {
    const mockFileInput = {
      current: {
        click: vi.fn(),
      } as unknown as HTMLInputElement,
    };

    const baseProps = {
      dataUrl: '',
      fileInput: mockFileInput,
      error: undefined,
      onRemove: vi.fn(),
      buttonText: 'Select Image',
      noImageText: 'No image selected',
      aspectRatio: 1,
      previewWidth: 200,
      previewBackgroundColor: '#f0f0f0',
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders NoImagePreview when no dataUrl is provided', () => {
      render(<ImageCard {...baseProps} />);
      expect(screen.getByText('No image selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select Image/i })).toBeInTheDocument();
    });

    it('renders ImagePreview when dataUrl is provided', async () => {
      await act(async () => {
        render(<ImageCard {...baseProps} dataUrl="data:image/png;base64,MOCKDATA" />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Select Image/i })).toBeInTheDocument();
    });

    it('shows error message when error is provided', () => {
      render(<ImageCard {...baseProps} error="Invalid file type" />);
      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });

    it('calls fileInput.click when button is clicked', () => {
      render(<ImageCard {...baseProps} />);
      const button = screen.getByRole('button', { name: /Select Image/i });
      fireEvent.click(button);
      expect(mockFileInput.current.click).toHaveBeenCalled();
    });

    it('calls fileInput.click when preview is clicked', async () => {
      await act(async () => {
        render(<ImageCard {...baseProps} dataUrl="data:image/png;base64,MOCKDATA" />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
      const img = screen.getByAltText('preview');
      const container = img.closest('div');
      fireEvent.click(container!);
      expect(mockFileInput.current.click).toHaveBeenCalled();
    });

    it('calls onRemove when delete button is clicked', async () => {
      await act(async () => {
        render(<ImageCard {...baseProps} dataUrl="data:image/png;base64,MOCKDATA" />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
      const deleteBtn = screen.getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteBtn!);
      expect(baseProps.onRemove).toHaveBeenCalled();
    });

    it('handles null fileInput gracefully', () => {
      const propsWithNullInput = { ...baseProps, fileInput: { current: null } };
      render(<ImageCard {...propsWithNullInput} />);
      const button = screen.getByRole('button', { name: /Select Image/i });
      // Should not throw error when clicked
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('renders with custom aspect ratio', () => {
      render(<ImageCard {...baseProps} aspectRatio={2} />);
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('renders with custom preview width', () => {
      render(<ImageCard {...baseProps} previewWidth={300} />);
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('renders with custom background color', async () => {
      await act(async () => {
        render(<ImageCard {...baseProps} dataUrl="data:image/png;base64,MOCKDATA" previewBackgroundColor="#ff0000" />);
      });
      await waitFor(() => {
        expect(screen.getByAltText('preview')).toBeInTheDocument();
      });
    });

    it('renders with custom button text', () => {
      render(<ImageCard {...baseProps} buttonText="Upload Photo" />);
      expect(screen.getByRole('button', { name: /Upload Photo/i })).toBeInTheDocument();
    });

    it('renders with custom no image text', () => {
      render(<ImageCard {...baseProps} noImageText="Please select an image" />);
      expect(screen.getByText('Please select an image')).toBeInTheDocument();
    });
  });
}); 