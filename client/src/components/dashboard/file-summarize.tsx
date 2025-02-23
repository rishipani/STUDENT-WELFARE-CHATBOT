import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function FileSummarize() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const summarizeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to summarize file");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "File has been summarized successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setFile(null);
    },
  });

  return (
    <Card className="card neon-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-glow">File Summarization</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex gap-4">
            <Input
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
                file:text-sm file:font-medium file:bg-primary file:text-primary-foreground 
                hover:file:bg-primary/90 neon-border"
            />
            <Button
              onClick={() => file && summarizeMutation.mutate(file)}
              disabled={!file || summarizeMutation.isPending}
              className="min-w-[120px] relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {summarizeMutation.isPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Summarize
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {summarizeMutation.data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-lg bg-secondary/50 p-6 backdrop-blur-sm neon-border"
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {summarizeMutation.data.summary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CardContent>
    </Card>
  );
}