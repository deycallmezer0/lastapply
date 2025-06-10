import { pgTable, serial, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }),
  salary: varchar('salary', { length: 255 }),
  requirements: text('requirements'),
  url: text('url').notNull(),
  status: varchar('status', { length: 50 }).default('applied'),
  notes: text('notes'),
  appliedAt: timestamp('applied_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const resumes = pgTable('resumes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: varchar('file_size', { length: 50 }),
  fileType: varchar('file_type', { length: 100 }),
  minioPath: text('minio_path').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const applicationResumes = pgTable('application_resumes', {
  id: serial('id').primaryKey(),
  applicationId: serial('application_id').references(() => applications.id),
  resumeId: serial('resume_id').references(() => resumes.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type ApplicationResume = typeof applicationResumes.$inferSelect;