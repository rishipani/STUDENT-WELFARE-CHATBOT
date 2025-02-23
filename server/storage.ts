import { User, InsertUser, Chat } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveChat(userId: number, message: string, response: string): Promise<Chat>;
  getUserChats(userId: number): Promise<Chat[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<number, Chat>;
  currentId: number;
  chatId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.currentId = 1;
    this.chatId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, isOnline: true };
    this.users.set(id, user);
    return user;
  }

  async saveChat(userId: number, message: string, response: string): Promise<Chat> {
    const id = this.chatId++;
    const chat: Chat = {
      id,
      userId,
      message,
      response,
      createdAt: new Date(),
    };
    this.chats.set(id, chat);
    return chat;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      (chat) => chat.userId === userId,
    );
  }
}

export const storage = new MemStorage();
