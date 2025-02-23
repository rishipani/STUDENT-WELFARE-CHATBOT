import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Send, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  type: string;
  username: string;
  message: string;
  timestamp: Date;
}

export default function GroupChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(true);
  const [connected, setConnected] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectToSession = () => {
    if (!sessionId || !username) {
      toast({
        title: "Error",
        description: "Please enter both session ID and username",
        variant: "destructive",
      });
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        sessionId,
        username
      }));
      setConnected(true);
      setIsJoining(false);
      toast({
        title: "Connected",
        description: `Joined session ${sessionId}`,
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'history':
          setMessages(data.messages);
          break;
        case 'message':
        case 'userJoined':
        case 'userLeft':
          setMessages(prev => [...prev, data]);
          if (data.usersCount !== undefined) {
            setUsersCount(data.usersCount);
          }
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      toast({
        title: "Disconnected",
        description: "Lost connection to chat session",
        variant: "destructive",
      });
    };

    ws.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to connect to chat session",
        variant: "destructive",
      });
    };
  };

  const sendMessage = () => {
    if (!message.trim() || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'message',
      message: message.trim()
    }));
    setMessage("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Group Chat</CardTitle>
        {connected && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              {usersCount} online
            </span>
          </div>
        )}
      </CardHeader>

      <Dialog open={isJoining} onOpenChange={setIsJoining}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Chat Session</DialogTitle>
            <DialogDescription>
              Enter a session ID and username to join the discussion
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session ID</Label>
              <div className="flex gap-2">
                <Hash className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  placeholder="Enter session ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={connectToSession}
            >
              Join Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CardContent className="flex-1 flex flex-col pt-0">
        <ScrollArea 
          ref={scrollRef}
          className="flex-1 pr-4"
        >
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isSystem = msg.type === 'userJoined' || msg.type === 'userLeft';
              const isOwn = msg.username === username;

              if (isSystem) {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-muted-foreground my-2"
                  >
                    {msg.type === 'userJoined' 
                      ? `${msg.username} joined the session`
                      : `${msg.username} left the session`
                    }
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isOwn 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    } rounded-lg p-3`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium mb-1">{msg.username}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-right mt-1 opacity-70">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={!connected}
          />
          <Button
            onClick={sendMessage}
            disabled={!connected || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}