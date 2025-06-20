// Set environment variables before any imports
process.env.AWS_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Theme } from '../../app/db/tables-definition';
import { s3Client } from 'nodejs-s3-typescript';

// Mock the s3Client
vi.mock('nodejs-s3-typescript', () => ({
  s3Client: vi.fn(),
}));

// Get the mocked s3Client
const mockS3Client = vi.mocked(s3Client);

// Mock environment variables
const originalEnv = { ...process.env };

const importS3Actions = async () => {
  return await import('../../app/actions/s3');
};

describe('S3 Actions', () => {
  const mockTheme: Theme = {
    primary_color: '#ff0000',
    secondary_color: '#00ff00',
    logo: 'https://s3.amazonaws.com/bucket/logo.png',
    s3_logo_key: 'logos/logo.png',
    is_s3_logo: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.AWS_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    mockS3Client.mockImplementation(() => ({
      deleteFile: vi.fn().mockResolvedValue(undefined),
      uploadFile: vi.fn().mockResolvedValue({ location: 'https://s3.amazonaws.com/bucket/file.jpg', key: 'file.jpg' }),
      config: {
        bucketName: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        dirName: 'test-directory'
      }
    } as any));
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('createS3Client', () => {
    it('creates S3 client with correct configuration', async () => {
      const { createS3Client } = await importS3Actions();
      const client = createS3Client('test-directory');
      expect(mockS3Client).toHaveBeenCalledWith({
        bucketName: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        dirName: 'test-directory'
      });
      expect(client).toBeDefined();
    });

    it('uses different directory names', async () => {
      const { createS3Client } = await importS3Actions();
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
  });

  describe('deleteThemeLogoFromS3', () => {
    it('deletes logo when theme has s3_logo_key', async () => {
      const mockDeleteFile = vi.fn().mockResolvedValue(undefined);
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile,
        uploadFile: vi.fn(),
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          dirName: 'prode-group-files'
        }
      } as any));
      const { deleteThemeLogoFromS3 } = await importS3Actions();
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
      const mockDeleteFile = vi.fn().mockResolvedValue(undefined);
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile,
        uploadFile: vi.fn(),
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          dirName: 'prode-group-files'
        }
      } as any));
      const { deleteThemeLogoFromS3 } = await importS3Actions();
      await deleteThemeLogoFromS3(themeWithoutKey);
      expect(mockDeleteFile).toHaveBeenCalledWith('prode-group-files/logo.png');
    });

    it('does nothing when theme is undefined', async () => {
      const mockDeleteFile = vi.fn();
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile,
        uploadFile: vi.fn(),
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          dirName: 'prode-group-files'
        }
      } as any));
      const { deleteThemeLogoFromS3 } = await importS3Actions();
      await deleteThemeLogoFromS3(undefined);
      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('does nothing when theme has no logo or s3_logo_key', async () => {
      const themeWithoutLogo: Theme = {
        primary_color: '#ff0000',
        secondary_color: '#00ff00'
      };
      const mockDeleteFile = vi.fn();
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile,
        uploadFile: vi.fn(),
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          dirName: 'prode-group-files'
        }
      } as any));
      const { deleteThemeLogoFromS3 } = await importS3Actions();
      await deleteThemeLogoFromS3(themeWithoutLogo);
      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('does nothing when logo URL is empty', async () => {
      const themeWithEmptyLogo: Theme = {
        ...mockTheme,
        logo: '',
        s3_logo_key: undefined
      };
      const mockDeleteFile = vi.fn();
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile,
        uploadFile: vi.fn(),
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          dirName: 'prode-group-files'
        }
      } as any));
      const { deleteThemeLogoFromS3 } = await importS3Actions();
      await deleteThemeLogoFromS3(themeWithEmptyLogo);
      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('handles S3 delete errors gracefully', async () => {
      const mockDeleteFile = vi.fn().mockRejectedValue(new Error('S3 delete failed'));
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile,
        uploadFile: vi.fn(),
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          dirName: 'prode-group-files'
        }
      } as any));
      const { deleteThemeLogoFromS3 } = await importS3Actions();
      await expect(deleteThemeLogoFromS3(mockTheme))
        .rejects.toThrow('S3 delete failed');
    });

    it('prioritizes s3_logo_key over logo URL', async () => {
      const themeWithBoth: Theme = {
        ...mockTheme,
        logo: 'https://s3.amazonaws.com/bucket/different-logo.png',
        s3_logo_key: 'logos/preferred-logo.png'
      };
      const mockDeleteFile = vi.fn().mockResolvedValue(undefined);
      mockS3Client.mockImplementation(() => ({
        deleteFile: mockDeleteFile,
        uploadFile: vi.fn(),
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          dirName: 'prode-group-files'
        }
      } as any));
      const { deleteThemeLogoFromS3 } = await importS3Actions();
      await deleteThemeLogoFromS3(themeWithBoth);
      expect(mockDeleteFile).toHaveBeenCalledWith('prode-group-files/logos/preferred-logo.png');
    });
  });

  describe('getS3KeyFromURL', () => {
    it('extracts key from S3 URL', async () => {
      const { getS3KeyFromURL } = await importS3Actions();
      const url = 'https://s3.amazonaws.com/bucket/logos/logo.png';
      expect(getS3KeyFromURL(url)).toBe('logo.png');
    });

    it('extracts key from URL with trailing slash', async () => {
      const { getS3KeyFromURL } = await importS3Actions();
      const url = 'https://s3.amazonaws.com/bucket/logos/logo.png/';
      expect(getS3KeyFromURL(url)).toBe('logo.png');
    });

    it('returns null for URL with no path', async () => {
      const { getS3KeyFromURL } = await importS3Actions();
      const url = 'https://s3.amazonaws.com/';
      expect(getS3KeyFromURL(url)).toBeNull();
    });

    it('handles URLs with query parameters', async () => {
      const { getS3KeyFromURL } = await importS3Actions();
      const url = 'https://s3.amazonaws.com/bucket/logos/logo.png?versionId=123';
      expect(getS3KeyFromURL(url)).toBe('logo.png');
    });

    it('handles simple paths without a full URL', async () => {
      const { getS3KeyFromURL } = await importS3Actions();
      const url = 'prode-group-files/logos/logo.png';
      expect(getS3KeyFromURL(url)).toBe('logo.png');
    });

    it('returns null for an empty string', async () => {
      const { getS3KeyFromURL } = await importS3Actions();
      const url = '';
      expect(getS3KeyFromURL(url)).toBeNull();
    });

    it('returns null for an invalid URL that is not a simple path', async () => {
      const { getS3KeyFromURL } = await importS3Actions();
      const url = 'not a url';
      expect(getS3KeyFromURL(url)).toBeNull();
    });
  });
}); 