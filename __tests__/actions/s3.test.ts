import { createS3Client, deleteThemeLogoFromS3, getS3KeyFromURL } from '../../app/actions/s3';
import { Theme } from '../../app/db/tables-definition';

// Set environment variables before importing the module
process.env.AWS_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

// Mock the s3Client
jest.mock('nodejs-s3-typescript', () => ({
  s3Client: jest.fn(),
}));

// Import the mocked s3Client
const mockS3Client = require('nodejs-s3-typescript').s3Client;

// Mock environment variables
const originalEnv = process.env;

describe('S3 Actions', () => {
  const mockTheme: Theme = {
    primary_color: '#ff0000',
    secondary_color: '#00ff00',
    logo: 'https://s3.amazonaws.com/bucket/logo.png',
    s3_logo_key: 'logos/logo.png',
    is_s3_logo: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the s3Client constructor
    mockS3Client.mockImplementation(() => ({
      deleteFile: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn().mockResolvedValue({ location: 'https://s3.amazonaws.com/bucket/file.jpg', key: 'file.jpg' })
    }));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createS3Client', () => {
    it('creates S3 client with correct configuration', () => {
      const client = createS3Client('test-directory');

      expect(mockS3Client).toHaveBeenCalledWith({
        bucketName: undefined,
        region: undefined,
        accessKeyId: undefined,
        secretAccessKey: undefined,
        dirName: 'test-directory'
      });
      expect(client).toBeDefined();
    });

    it('uses different directory names', () => {
      createS3Client('tournament-logos');
      createS3Client('user-avatars');

      expect(mockS3Client).toHaveBeenCalledTimes(2);
      expect(mockS3Client).toHaveBeenNthCalledWith(1, expect.objectContaining({
        dirName: 'tournament-logos'
      }));
      expect(mockS3Client).toHaveBeenNthCalledWith(2, expect.objectContaining({
        dirName: 'user-avatars'
      }));
    });

    it('handles missing environment variables gracefully', () => {
      delete process.env.AWS_BUCKET_NAME;
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const client = createS3Client('test-directory');

      expect(mockS3Client).toHaveBeenCalledWith({
        bucketName: undefined,
        region: undefined,
        accessKeyId: undefined,
        secretAccessKey: undefined,
        dirName: 'test-directory'
      });
      expect(client).toBeDefined();
    });
  });

  describe('deleteThemeLogoFromS3', () => {
    it('deletes logo when theme has s3_logo_key', async () => {
      const mockDeleteFile = jest.fn().mockResolvedValue(undefined);
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile
      }));

      await deleteThemeLogoFromS3(mockTheme);

      expect(mockS3Client).toHaveBeenCalledWith(expect.objectContaining({
        dirName: 'prode-group-files'
      }));
      expect(mockDeleteFile).toHaveBeenCalledWith('prode-group-files/logos/logo.png');
    });

    it('deletes logo when theme has logo URL but no s3_logo_key', async () => {
      const themeWithoutKey: Theme = {
        ...mockTheme,
        s3_logo_key: undefined
      };
      const mockDeleteFile = jest.fn().mockResolvedValue(undefined);
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile
      }));

      await deleteThemeLogoFromS3(themeWithoutKey);

      expect(mockDeleteFile).toHaveBeenCalledWith('prode-group-files/logo.png');
    });

    it('does nothing when theme is undefined', async () => {
      const mockDeleteFile = jest.fn();
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile
      }));

      await deleteThemeLogoFromS3(undefined);

      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('does nothing when theme has no logo or s3_logo_key', async () => {
      const themeWithoutLogo: Theme = {
        primary_color: '#ff0000',
        secondary_color: '#00ff00'
      };
      const mockDeleteFile = jest.fn();
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile
      }));

      await deleteThemeLogoFromS3(themeWithoutLogo);

      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('does nothing when logo URL is empty', async () => {
      const themeWithEmptyLogo: Theme = {
        ...mockTheme,
        logo: '',
        s3_logo_key: undefined
      };
      const mockDeleteFile = jest.fn();
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile
      }));

      await deleteThemeLogoFromS3(themeWithEmptyLogo);

      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('handles S3 delete errors gracefully', async () => {
      const mockDeleteFile = jest.fn().mockRejectedValue(new Error('S3 delete failed'));
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile
      }));

      await expect(deleteThemeLogoFromS3(mockTheme))
        .rejects.toThrow('S3 delete failed');
    });

    it('prioritizes s3_logo_key over logo URL', async () => {
      const themeWithBoth: Theme = {
        ...mockTheme,
        logo: 'https://s3.amazonaws.com/bucket/different-logo.png',
        s3_logo_key: 'logos/preferred-logo.png'
      };
      const mockDeleteFile = jest.fn().mockResolvedValue(undefined);
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile
      }));

      await deleteThemeLogoFromS3(themeWithBoth);

      expect(mockDeleteFile).toHaveBeenCalledWith('prode-group-files/logos/preferred-logo.png');
    });
  });

  describe('getS3KeyFromURL', () => {
    it('extracts key from S3 URL', () => {
      const url = 'https://s3.amazonaws.com/bucket/logos/logo.png';
      const result = getS3KeyFromURL(url);

      expect(result).toBe('logo.png');
    });

    it('extracts key from URL with trailing slash', () => {
      const url = 'https://s3.amazonaws.com/bucket/logos/logo.png/';
      const result = getS3KeyFromURL(url);

      expect(result).toBe('logo.png');
    });

    it('extracts key from URL with query parameters', () => {
      const url = 'https://s3.amazonaws.com/bucket/logos/logo.png?version=123';
      const result = getS3KeyFromURL(url);

      expect(result).toBe('logo.png?version=123');
    });

    it('extracts key from URL with hash', () => {
      const url = 'https://s3.amazonaws.com/bucket/logos/logo.png#section';
      const result = getS3KeyFromURL(url);

      expect(result).toBe('logo.png#section');
    });

    it('returns null for empty URL', () => {
      const result = getS3KeyFromURL('');

      expect(result).toBeNull();
    });

    it('returns bucket name for URL without filename', () => {
      const result = getS3KeyFromURL('https://s3.amazonaws.com/bucket/');

      expect(result).toBe('bucket');
    });

    it('returns bucket name for URL with only domain', () => {
      const result = getS3KeyFromURL('https://s3.amazonaws.com/bucket');

      expect(result).toBe('bucket');
    });

    it('handles URLs with multiple path segments', () => {
      const url = 'https://s3.amazonaws.com/bucket/folder1/folder2/folder3/file.jpg';
      const result = getS3KeyFromURL(url);

      expect(result).toBe('file.jpg');
    });

    it('handles URLs with dots in path', () => {
      const url = 'https://s3.amazonaws.com/bucket/folder.name/file.name.jpg';
      const result = getS3KeyFromURL(url);

      expect(result).toBe('file.name.jpg');
    });

    it('handles URLs with special characters', () => {
      const url = 'https://s3.amazonaws.com/bucket/logos/logo%20with%20spaces.png';
      const result = getS3KeyFromURL(url);

      expect(result).toBe('logo%20with%20spaces.png');
    });
  });
}); 