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

export const getS3KeyFromURL = (url: string) => {
  const regex = new RegExp('([^/]+)/?$')
  const result = regex.exec(url) || []
  console.log('keyMatches', result)
  if(result?.length > 1) {
    return result[1]
  }
  return null
}
