import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const userFileRouter: FileRouter = {
  avatarUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    return { uploadedKey: file.key };
  }),
};

export type UserFileRouter = typeof userFileRouter;
