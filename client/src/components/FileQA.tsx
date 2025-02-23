
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface FileQAProps {
  fileContent: string;
}

export function FileQA({ fileContent }: FileQAProps) {
  const [question, setQuestion] = useState('');
  const [qaPairs, setQaPairs] = useState<{q: string, a: string}[]>([]);

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    
    // Simple keyword-based answering for now
    const relevantParts = fileContent.split('\n')
      .filter(line => line.toLowerCase().includes(question.toLowerCase()));
    
    const answer = relevantParts.length > 0 
      ? relevantParts.join('\n')
      : "No relevant information found in the file.";

    setQaPairs([...qaPairs, { q: question, a: answer }]);
    setQuestion('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the file..."
          className="flex-1"
        />
        <Button onClick={handleAskQuestion}>Ask</Button>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {qaPairs.map((qa, idx) => (
            <Card key={idx} className="p-4">
              <p className="font-medium">Q: {qa.q}</p>
              <p className="mt-2 text-muted-foreground">A: {qa.a}</p>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
