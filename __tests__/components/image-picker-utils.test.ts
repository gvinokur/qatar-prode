jest.mock('../../app/components/friend-groups/image-picker-utils', () => {
  const original = jest.requireActual('../../app/components/friend-groups/image-picker-utils');
  return {
    ...original,
    getImageDimensions: jest.fn(() => Promise.resolve({ width: 200, height: 100 })),
    validateImageDimensions: jest.fn(() => Promise.resolve(null)),
  };
});

import * as utils from '../../app/components/friend-groups/image-picker-utils';
import { validateFile } from '../../app/components/friend-groups/image-validate-file';

// Mock global URL.createObjectURL for jsdom
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onload: null as any,
  result: 'data:image/png;base64,MOCKDATA'
};

global.FileReader = jest.fn(() => mockFileReader) as any;

describe('ImagePicker Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (utils.validateImageDimensions as jest.Mock).mockImplementation(() => Promise.resolve(null));
  });

  describe('generateDataUrl', () => {
    it('generates data URL from file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const callback = jest.fn();
      
      utils.generateDataUrl(file, callback);
      
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
      
      // Simulate FileReader completion
      mockFileReader.onload();
      
      expect(callback).toHaveBeenCalledWith('data:image/png;base64,MOCKDATA');
    });
  });

  describe('validateFile', () => {
    it('returns null for valid file', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = await validateFile(file, 5, ['image/png'], 1, 0.1);
      expect(result).toBeNull();
    });

    it('returns error for file too large', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      
      const result = await validateFile(file, 5, ['image/png'], 1, 0.1);
      expect(result).toContain('El archivo es demasiado grande');
    });

    it('returns error for invalid file type', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = await validateFile(file, 5, ['image/png'], 1, 0.1);
      expect(result).toContain('Tipo de archivo no permitido');
    });

    it('calls validateImageDimensions for valid file', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      await validateFile(file, 5, ['image/png'], 1, 0.1);
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it('returns error from validateImageDimensions', async () => {
      (utils.validateImageDimensions as jest.Mock).mockImplementationOnce(() => Promise.resolve('aspect error'));
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = await validateFile(file, 5, ['image/png'], 1, 0.1);
      expect(result).toBe('aspect error');
    });
  });
}); 