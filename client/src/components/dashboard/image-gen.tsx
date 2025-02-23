import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon } from "lucide-react";

export default function ImageGen() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Image Generation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="Describe the image you want to generate..."
            className="min-h-[100px]"
          />
          
          <div className="flex justify-end">
            <Button>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate Image
            </Button>
          </div>

          <div className="text-center text-muted-foreground">
            <p>Image generation feature coming soon!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
