import {Theme} from "../db/tables-definition";

const cloudfront_url = 'https://d2lko4t609k5jd.cloudfront.net/'

export function getThemeLogoUrl(theme?: Theme | null): string | null {
  if(!theme) {
    return null;
  }
  if(theme.is_s3_logo && theme.s3_logo_key) {
    return cloudfront_url +  theme.s3_logo_key;
  }
  if(theme.logo) {
    return theme.logo;
  }
  return null;
}
