import { z } from "zod";

export const GENDER_TYPES = [
  "male",
  "female",
  "non_binary",
  "prefer_not_to_say",
] as const;

export const DATE_FORMAT_TYPES = [
  "MM_DD_YYYY",
  "DD_MM_YYYY",
  "YYYY_MM_DD",
] as const;

export const userCreateSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean().default(false),
  image: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  nickname: z.string().max(50).nullable().optional(),
  gender: z.enum(GENDER_TYPES).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  address: z.string().nullable().optional(),
  language: z.string().max(10).default("en"),
  timezone: z.string().max(100).default("UTC"),
  currency: z.string().max(10).default("USD"),
  dateFormat: z.enum(DATE_FORMAT_TYPES).default("DD_MM_YYYY"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nickname: z.string().max(50).nullable().optional(),
  image: z.string().nullable().optional(),
  imageKey: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nonoptional(),
  gender: z.enum(GENDER_TYPES).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  address: z.string().nullable().optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
  currency: z.string().max(10).optional(),
  dateFormat: z.enum(DATE_FORMAT_TYPES).optional(),
});

export const userUpdateSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean().default(false),
  image: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const newUserSchema = userCreateSchema;

export const updateUserSchema = userUpdateSchema
  .pick({
    name: true,
    image: true,
    phone: true,
  })
  .partial();

export type NewUserInput = z.infer<typeof newUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  imageKey: string | null;
  phone: string | null;
  nickname: string | null;
  gender: "male" | "female" | "non_binary" | "prefer_not_to_say" | null;
  dateOfBirth: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  language: string;
  timezone: string;
  currency: string;
  dateFormat: "MM_DD_YYYY" | "DD_MM_YYYY" | "YYYY_MM_DD";
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};
