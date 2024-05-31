'use server'

import {
  addParticipantToGroup,
  createProdeGroup, deleteAllParticipantsFromGroup, deleteProdeGroup, findProdeGroupById,
  findProdeGroupsByOwner,
  findProdeGroupsByParticipant, updateProdeGroup
} from "../db/prode-group-repository";
import {getLoggedInUser} from "./user-actions";
import { z } from "zod";
import { s3Client } from "nodejs-s3-typescript";
import {ProdeGroup} from "../db/tables-definition";

//S3 Config
const s3Config = {
  bucketName: process.env.AWS_BUCKET_NAME as string,
  region: process.env.AWS_REGION as string,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
}
export async function createDbGroup( groupName: string) {
  const user = await getLoggedInUser()
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const prodeGroup = await createProdeGroup({
    name: groupName,
    owner_user_id: user.id
  })

  return prodeGroup;
}

export async function getGroupsForUser() {
  const user = await getLoggedInUser()
  if(!user) {
    return
  }
  const userGroups = await findProdeGroupsByOwner(user.id)
  const participantGroups = await findProdeGroupsByParticipant(user.id)

  return ({
    userGroups,
    participantGroups
  })
}

export async function deleteGroup(groupId: string) {
  const user = await getLoggedInUser()
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const group = await findProdeGroupById(groupId)
  //Only support deletion  of the group if the user in the session is the same as the owner
  if(user && user.id === group.owner_user_id) {
    await deleteAllParticipantsFromGroup(groupId)
    await deleteProdeGroup(groupId);
  }
}

export async function joinGroup(groupId: string) {
  const user = await getLoggedInUser();
  if(!user) {
    throw 'Should not call this action from a logged out page'
  }
  const group = await findProdeGroupById(groupId)

  await addParticipantToGroup(group, user)

  return group
}

const MAX_FILE_SIZE = 5000000;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// VALIDATE IMAGE WITH ZOD
const imageSchema = z.object({
  image: z
    .any()
    .refine((file: File) => {
      if (file.size === 0 || file.name === undefined) return false;
      else return true;
    }, "Please update or add new image.")

    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`),
});

async function deleteCurrentGroupFile(group: ProdeGroup) {
  if(group.theme?.logo) {
    const regex = new RegExp('([^/]+)/?$')
    const result = regex.exec(group.theme.logo) || []
    console.log('keyMatches', result)
    if(result?.length > 1) {
      const s3 = new s3Client({
        ...s3Config,
        dirName: 'prode-group-files'
      });
      s3.deleteFile(`prode-group-files/${result[1]}`)
    }
  }
}

export async function updateTheme(groupId: string, formData: any) {
  const currentGroup = await findProdeGroupById(groupId)
  const data = Object.fromEntries(formData)
  let imageUrl: string | undefined = currentGroup.theme?.logo
  if (data.logo) {
    const validatedFields = imageSchema.safeParse({
      image: data.logo
    })
    console.log(validatedFields)
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Invalid Image",
      };
    }
    try {
      const s3 = new s3Client({
        ...s3Config,
        dirName: 'prode-group-files'
      });
      await deleteCurrentGroupFile(currentGroup)
      const res = await s3.uploadFile(Buffer.from(await data.logo.arrayBuffer()));
      console.log(res)
      imageUrl = res.location
    } catch (e) {
      console.log(e)
      return "Image Upload failed"
    }
  }


  return updateProdeGroup(groupId, {
    theme: JSON.stringify({
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      logo: imageUrl
    })
  })
}
