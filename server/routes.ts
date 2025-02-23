import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const CHAT_SYSTEM_PROMPT = `As a professional AI tutor, your responses should follow these guidelines:

1. Provide clear, concise explanations using proper academic language
2. Include relevant examples to illustrate concepts
3. Structure responses in well-organized paragraphs
4. End with a thought-provoking follow-up question
5. Maintain a professional, encouraging tone
6. Avoid using any special formatting or markdown

Focus on helping students develop a deep understanding of the subject matter.`;

// Add WebSocket types and session management
interface ChatUser {
  ws: WebSocket;
  username: string;
  sessionId: string;
}

interface ChatSession {
  users: Map<string, ChatUser>;
  messages: Array<{
    username: string;
    message: string;
    timestamp: Date;
  }>;
}

const chatSessions = new Map<string, ChatSession>();

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    verifyClient: (info, done) => {
      // Get session from the cookie
      const cookies = info.req.headers.cookie;
      if (!cookies) {
        done(false, 401, 'Unauthorized');
        return;
      }

      // Parse connect.sid from cookies
      const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('connect.sid='));
      if (!sessionCookie) {
        done(false, 401, 'Unauthorized');
        return;
      }

      done(true);
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentUser: ChatUser | null = null;

    ws.on('message', (rawData: string) => {
      try {
        const data = JSON.parse(rawData.toString());

        switch (data.type) {
          case 'join':
            // Handle user joining a session
            const { sessionId, username } = data;
            if (!chatSessions.has(sessionId)) {
              chatSessions.set(sessionId, {
                users: new Map(),
                messages: []
              });
            }

            const session = chatSessions.get(sessionId)!;
            currentUser = { ws, username, sessionId };
            session.users.set(username, currentUser);

            // Notify others in the session
            broadcastToSession(sessionId, {
              type: 'userJoined',
              username,
              timestamp: new Date(),
              usersCount: session.users.size
            });

            // Send session history to the new user
            ws.send(JSON.stringify({
              type: 'history',
              messages: session.messages
            }));
            break;

          case 'message':
            if (!currentUser) return;

            const messageData = {
              type: 'message',
              username: currentUser.username,
              message: data.message,
              timestamp: new Date()
            };

            const userSession = chatSessions.get(currentUser.sessionId)!;
            userSession.messages.push(messageData);

            broadcastToSession(currentUser.sessionId, messageData);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (currentUser) {
        const session = chatSessions.get(currentUser.sessionId);
        if (session) {
          session.users.delete(currentUser.username);

          // Remove empty sessions
          if (session.users.size === 0) {
            chatSessions.delete(currentUser.sessionId);
          } else {
            // Notify others that user left
            broadcastToSession(currentUser.sessionId, {
              type: 'userLeft',
              username: currentUser.username,
              timestamp: new Date(),
              usersCount: session.users.size
            });
          }
        }
      }
    });
  });

  function broadcastToSession(sessionId: string, data: any) {
    const session = chatSessions.get(sessionId);
    if (!session) return;

    const message = JSON.stringify(data);
    for (const user of session.users.values()) {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(message);
      }
    }
  }

  // Add cleanup to the summarize endpoint
  app.post("/api/summarize", upload.single("file"), async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const content = req.file.buffer.toString();
      if (content.length === 0) {
        return res.status(400).json({ error: "File is empty" });
      }

      const prompt = `Please provide a clear and professional summary of this text in about 3-4 paragraphs. Focus on the main ideas and key points. Present the information in a clean format without any special characters, markdown, or formatting symbols. Here's the text to summarize:\n\n${content}`;

      const result = await model.generateContent(prompt);
      const summary = result.response.text()
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '') // Remove italics
        .replace(/`/g, '') // Remove code blocks
        .replace(/#/g, '') // Remove headers
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple line breaks
        .trim();

      res.json({ summary });
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get chat history for context
      const previousChats = await storage.getUserChats(req.user!.id);
      const lastChats = previousChats.slice(-3); // Get last 3 messages for context

      // Build chat context
      let chatContext = CHAT_SYSTEM_PROMPT + "\n\nPrevious conversation:\n";

      lastChats.forEach(chat => {
        chatContext += `\nStudent: ${chat.message}\nTutor: ${chat.response}\n`;
      });

      chatContext += `\nStudent: ${message}\nTutor: Let me help you with that.`;

      const result = await model.generateContent(chatContext);

      const response = result.response.text()
        .replace(/\*\*/g, '') // Remove any asterisks
        .replace(/\*(?!\*)/g, '') // Remove single asterisks
        .replace(/`/g, '') // Remove backticks
        .trim();

      const chat = await storage.saveChat(req.user!.id, message, response);
      res.json(chat);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.get("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const chats = await storage.getUserChats(req.user!.id);
      res.json(chats);
    } catch (error) {
      console.error("Get chats error:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  return httpServer;
}