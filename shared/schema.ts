import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  fullName: text("full_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  backgroundUrl: text("background_url"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  isOnline: boolean("is_online").default(false),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  query: text("query").notNull(),
  result: text("result"),
  type: text("type").notNull(), // 'summary', 'chat', 'image'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  fullName: true,
  bio: true,
  avatarUrl: true,
  backgroundUrl: true,
  linkedinUrl: true,
  githubUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type SearchHistory = typeof searchHistory.$inferSelect;