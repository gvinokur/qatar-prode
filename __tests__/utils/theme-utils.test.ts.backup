import { getThemeLogoUrl } from '../../app/utils/theme-utils';
import { Theme } from '../../app/db/tables-definition';

describe('theme-utils', () => {
  describe('getThemeLogoUrl', () => {
    it('should return null when theme is null', () => {
      const result = getThemeLogoUrl(null);
      expect(result).toBeNull();
    });

    it('should return null when theme is undefined', () => {
      const result = getThemeLogoUrl(undefined);
      expect(result).toBeNull();
    });

    it('should return S3 logo URL when theme has is_s3_logo true and s3_logo_key', () => {
      const theme: Theme = {
        is_s3_logo: true,
        s3_logo_key: 'logos/test-logo.png',
        logo: 'https://example.com/logo.png',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBe('https://d2lko4t609k5jd.cloudfront.net/logos/test-logo.png');
    });

    it('should return regular logo URL when theme has logo but no S3 logo', () => {
      const theme: Theme = {
        is_s3_logo: false,
        logo: 'https://example.com/logo.png',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBe('https://example.com/logo.png');
    });

    it('should return regular logo URL when theme has logo and is_s3_logo is undefined', () => {
      const theme: Theme = {
        logo: 'https://example.com/logo.png',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBe('https://example.com/logo.png');
    });

    it('should return regular logo when theme has is_s3_logo true but no s3_logo_key', () => {
      const theme: Theme = {
        is_s3_logo: true,
        logo: 'https://example.com/logo.png',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBe('https://example.com/logo.png');
    });

    it('should return regular logo when theme has is_s3_logo true but empty s3_logo_key', () => {
      const theme: Theme = {
        is_s3_logo: true,
        s3_logo_key: '',
        logo: 'https://example.com/logo.png',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBe('https://example.com/logo.png');
    });

    it('should return null when theme has no logo and no S3 logo', () => {
      const theme: Theme = {
        is_s3_logo: false,
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBeNull();
    });

    it('should return null when theme has empty logo and no S3 logo', () => {
      const theme: Theme = {
        is_s3_logo: false,
        logo: '',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBeNull();
    });

    it('should prioritize S3 logo over regular logo when both are present', () => {
      const theme: Theme = {
        is_s3_logo: true,
        s3_logo_key: 'logos/s3-logo.png',
        logo: 'https://example.com/regular-logo.png',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      };
      
      const result = getThemeLogoUrl(theme);
      expect(result).toBe('https://d2lko4t609k5jd.cloudfront.net/logos/s3-logo.png');
    });
  });
}); 