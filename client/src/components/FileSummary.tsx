
import React, { useState } from 'react';
import { FileQA } from './FileQA';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';

interface FileSummaryProps {
  content: string;
}

export function FileSummary({ content }: FileSummaryProps) {
  return (
    <Card className="p-4">
      <Tabs defaultValue="qa">
        <TabsList>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="qa">
          <FileQA fileContent={content} />
        </TabsContent>
        
        <TabsContent value="content">
          <pre className="whitespace-pre-wrap">{content}</pre>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
