//S3 Config
import {s3Client} from "nodejs-s3-typescript";
import {Theme} from "../db/tables-definition";

const s3_config = {
  bucketName: process.env.AWS_BUCKET_NAME as string,
  region: process.env.AWS_REGION as string,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
}

export const createS3Client = (dirName: string) => new s3Client({
  ...s3_config,
  dirName
});

export const deleteThemeLogoFromS3 = async (theme?: Theme) => {
  if(theme?.logo || theme?.s3_logo_key) {
    const logoKey = theme.s3_logo_key || getS3KeyFromURL(theme.logo || '')
    if(logoKey) {
      const s3 = createS3Client('prode-group-files')
      await s3.deleteFile(`prode-group-files/${logoKey}`)
    }
  }
}

export const getS3KeyFromURL = (url: string): string | null => {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : null;
  } catch {
    // Fallback for cases where the URL might be a simple path
    if (url.includes('/')) {
      const parts = url.split('/').filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : null;
    }
    // If it's not a URL and not a path, return null
    return null;
  }
};
