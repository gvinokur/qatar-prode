import { generateDataUrl, getImageDimensions, validateImageDimensions } from '../../app/components/friend-groups/image-picker-utils';

// Mock global URL.createObjectURL for jsdom
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onload: null as any,
  onerror: null as any,
  result: 'data:image/png;base64,MOCKDATA'
};

global.FileReader = jest.fn(() => mockFileReader) as any;

// Mock Image constructor
const mockImage = {
  onload: null as any,
  onerror: null as any,
  width: 200,
  height: 100,
  src: ''
};

global.Image = jest.fn(() => mockImage) as any;

describe('ImagePicker Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
    mockImage.onload = null;
    mockImage.onerror = null;
    mockImage.width = 200;
    mockImage.height = 100;
    mockImage.src = '';
  });

  describe('generateDataUrl', () => {
    it('generates data URL from file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const callback = jest.fn();
      
      generateDataUrl(file, callback);
      
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
      
      // Simulate FileReader completion
      mockFileReader.onload();
      
      expect(callback).toHaveBeenCalledWith('data:image/png;base64,MOCKDATA');
    });
  });

  describe('getImageDimensions', () => {
    it('returns image dimensions successfully', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      
      const promise = getImageDimensions(imageUrl);
      
      // Simulate image load
      mockImage.onload();
      
      const result = await promise;
      expect(result).toEqual({ width: 200, height: 100 });
      expect(mockImage.src).toBe(imageUrl);
    });

    it('handles image load error', async () => {
      const imageUrl = 'data:image/png;base64,INVALID';
      
      const promise = getImageDimensions(imageUrl);
      
      // Simulate image error
      mockImage.onerror(new Error('Image load failed'));
      
      await expect(promise).rejects.toThrow('Could not load image to get dimensions');
    });

    it('handles different image dimensions', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 800;
      mockImage.height = 600;
      
      const promise = getImageDimensions(imageUrl);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toEqual({ width: 800, height: 600 });
    });
  });

  describe('validateImageDimensions', () => {
    it('returns null for valid aspect ratio', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 200;
      mockImage.height = 200; // 1:1 ratio
      
      const promise = validateImageDimensions(imageUrl, 1, 0.1);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toBeNull();
    });

    it('returns error for aspect ratio too wide', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 300;
      mockImage.height = 100; // 3:1 ratio, too wide for 1:1 with 10% tolerance
      
      const promise = validateImageDimensions(imageUrl, 1, 0.1);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toContain('La imagen no tiene la proporción esperada');
      expect(result).toContain('1:1');
      expect(result).toContain('300px');
    });

    it('returns error for aspect ratio too tall', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 100;
      mockImage.height = 300; // 1:3 ratio, too tall for 1:1 with 10% tolerance
      
      const promise = validateImageDimensions(imageUrl, 1, 0.1);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toContain('La imagen no tiene la proporción esperada');
      expect(result).toContain('1:1');
      expect(result).toContain('100px');
    });

    it('accepts aspect ratio within tolerance', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 220;
      mockImage.height = 200; // 1.1:1 ratio, within 10% tolerance of 1:1
      
      const promise = validateImageDimensions(imageUrl, 1, 0.1);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toBeNull();
    });

    it('handles 2:1 aspect ratio validation', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 400;
      mockImage.height = 200; // 2:1 ratio
      
      const promise = validateImageDimensions(imageUrl, 2, 0.1);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toBeNull();
    });

    it('handles 2:1 aspect ratio with tolerance', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 420;
      mockImage.height = 200; // 2.1:1 ratio, within 10% tolerance of 2:1
      
      const promise = validateImageDimensions(imageUrl, 2, 0.1);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toBeNull();
    });

    it('returns error for 2:1 aspect ratio outside tolerance', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 500;
      mockImage.height = 200; // 2.5:1 ratio, outside 10% tolerance of 2:1
      
      const promise = validateImageDimensions(imageUrl, 2, 0.1);
      mockImage.onload();
      
      const result = await promise;
      expect(result).toContain('La imagen no tiene la proporción esperada');
      expect(result).toContain('2:1');
      expect(result).toContain('250px');
    });

    it('handles image load error gracefully', async () => {
      const imageUrl = 'data:image/png;base64,INVALID';
      
      const promise = validateImageDimensions(imageUrl, 1, 0.1);
      mockImage.onerror(new Error('Image load failed'));
      
      const result = await promise;
      expect(result).toBe('No se pudo cargar la imagen para validar sus dimensiones.');
    });

    it('handles zero tolerance', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 201;
      mockImage.height = 200; // Slightly off from 1:1
      
      const promise = validateImageDimensions(imageUrl, 1, 0); // Zero tolerance
      mockImage.onload();
      
      const result = await promise;
      expect(result).toContain('La imagen no tiene la proporción esperada');
    });

    it('handles very small tolerance', async () => {
      const imageUrl = 'data:image/png;base64,MOCKDATA';
      mockImage.width = 200;
      mockImage.height = 200; // Perfect 1:1
      
      const promise = validateImageDimensions(imageUrl, 1, 0.01); // 1% tolerance
      mockImage.onload();
      
      const result = await promise;
      expect(result).toBeNull();
    });
  });
}); 