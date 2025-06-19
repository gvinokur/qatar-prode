// Mock global URL.createObjectURL for jsdom
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

// Mock the utility functions
jest.mock('../../app/components/friend-groups/image-picker-utils', () => ({
  generateDataUrl: jest.fn((file, cb) => (cb as Function)('data:image/png;base64,MOCKDATA')),
  getImageDimensions: jest.fn(() => Promise.resolve({ width: 200, height: 200 })),
  validateImageDimensions: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../app/components/friend-groups/image-validate-file', () => ({
  validateFile: jest.fn(() => Promise.resolve(null)),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImagePicker from '../../app/components/friend-groups/image-picker';
import { generateDataUrl } from '../../app/components/friend-groups/image-picker-utils';
import { validateFile } from '../../app/components/friend-groups/image-validate-file';

// Helper to create a mock file
function createFile(name = 'test.png', size = 1024, type = 'image/png') {
  const file = new File(['a'.repeat(size)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('ImagePicker', () => {
  const baseProps = {
    id: 'test-image',
    name: 'testImage',
    onChange: jest.fn(),
    onBlur: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default behavior
    (validateFile as jest.Mock).mockImplementation(() => Promise.resolve(null));
    (generateDataUrl as jest.Mock).mockImplementation((file, cb) => (cb as Function)('data:image/png;base64,MOCKDATA'));
  });

  it('renders with no image by default', () => {
    render(<ImagePicker {...baseProps} />);
    expect(screen.getByText(/No image selected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Seleccionar/i })).toBeInTheDocument();
  });

  it('renders with a default image value', () => {
    render(<ImagePicker {...baseProps} defaultValue="data:image/png;base64,MOCKDATA" />);
    expect(screen.getByAltText('preview')).toBeInTheDocument();
  });

  it('calls onChange when a valid file is selected', async () => {
    render(<ImagePicker {...baseProps} />);
    const file = createFile();
    const input = screen.getByTestId('file-input');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(baseProps.onChange).toHaveBeenCalled();
    });
  });

  it('shows error for invalid file type', async () => {
    (validateFile as jest.Mock).mockImplementationOnce(() => Promise.resolve('Invalid file type'));
    render(<ImagePicker {...baseProps} />);
    const file = createFile('test.txt', 1024, 'text/plain');
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });
  });

  it('shows error for file too large', async () => {
    (validateFile as jest.Mock).mockImplementationOnce(() => Promise.resolve('File too large'));
    render(<ImagePicker {...baseProps} maxSizeInMB={0.0001} />);
    const file = createFile('big.png', 1000000, 'image/png');
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });
  });

  it('removes image and calls onChange with empty value', async () => {
    render(<ImagePicker {...baseProps} defaultValue="data:image/png;base64,MOCKDATA" />);
    const removeBtn = screen.getByTestId('DeleteIcon').closest('button');
    expect(removeBtn).toBeInTheDocument();
    userEvent.click(removeBtn!);
    await waitFor(() => {
      expect(baseProps.onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ value: null }) }));
      expect(screen.getByText(/No image selected/i)).toBeInTheDocument();
    });
  });

  it('shows aspect ratio recommendation if aspectRatio is not 1', () => {
    render(<ImagePicker {...baseProps} aspectRatio={2} />);
    expect(screen.getByText(/Proporción de imagen recomendada: 2:1/)).toBeInTheDocument();
  });

  it('handles clicking the preview to trigger file input', async () => {
    render(<ImagePicker {...baseProps} />);
    const preview = screen.getByText(/No image selected/i).closest('div[role="button"],div');
    expect(preview).toBeInTheDocument();
    // Simulate click (cannot fully test file dialog in jsdom)
    fireEvent.click(preview!);
    // No error should occur
  });

  it('handles onBlur event', () => {
    render(<ImagePicker {...baseProps} />);
    const input = screen.getByTestId('file-input');
    fireEvent.blur(input);
    expect(baseProps.onBlur).toHaveBeenCalled();
  });
}); 