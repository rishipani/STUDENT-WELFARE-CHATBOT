import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from "@/components/layout/nav-bar";
import FileSummarize from "@/components/dashboard/file-summarize";
import ChatBot from "@/components/dashboard/chat-bot";
import GroupChat from "@/components/dashboard/group-chat";
import ImageGen from "@/components/dashboard/image-gen";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container mx-auto p-6">
        <Tabs defaultValue="summarize" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="summarize">File Summarization</TabsTrigger>
            <TabsTrigger value="chat">AI Chatbot</TabsTrigger>
            <TabsTrigger value="group">Group Discussions</TabsTrigger>
            <TabsTrigger value="image">Image Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="summarize">
            <FileSummarize />
          </TabsContent>

          <TabsContent value="chat">
            <ChatBot />
          </TabsContent>

          <TabsContent value="group">
            <GroupChat />
          </TabsContent>

          <TabsContent value="image">
            <ImageGen />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
