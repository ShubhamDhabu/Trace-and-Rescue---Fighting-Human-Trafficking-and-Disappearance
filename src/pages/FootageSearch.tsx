import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, FileVideo, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function FootageSearch() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [backendResult, setBackendResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be under 500MB");
      return;
    }

    const valid = ["video/mp4", "video/avi", "video/mov", "video/mkv"];
    if (!valid.includes(file.type)) {
      toast.error("Invalid video format");
      return;
    }

    setVideoFile(file);
  };

  // ---------------------------
  // 🔥 Upload to Python Backend
  // ---------------------------
  const sendToBackend = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/upload-footage", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      setBackendResult(data);

      toast.success("Video sent to backend successfully!");
    } catch (err) {
      toast.error("Failed to send to Python backend");
    }
  };

  // ---------------------------
  // 🔥 Upload to Supabase
  // ---------------------------
  const uploadToSupabase = async () => {
    if (!videoFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const extension = videoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${extension}`;

      const { error } = await supabase.storage
        .from("cctv-footage")
        .upload(path, videoFile);

      if (error) throw error;

      setUploadProgress(100);
      toast.success("Uploaded to Supabase!");

      // optionally send to backend after uploading
      await sendToBackend(videoFile);

    } catch (e) {
      toast.error("Supabase upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold">CCTV Footage Upload & Analysis</h2>
        <p className="text-muted-foreground">
          Upload CCTV footage to analyze for missing persons.
        </p>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Upload recorded CCTV footage. Your backend will analyze the video.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Upload CCTV Footage</CardTitle>
            <CardDescription>MP4, AVI, MOV, MKV allowed</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!videoFile ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium">Click to upload a video</h3>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <FileVideo className="h-10 w-10 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{videoFile.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setVideoFile(null)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isUploading && (
                  <>
                    <div className="text-sm flex justify-between">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full bg-primary"
                      ></div>
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  disabled={isUploading}
                  onClick={uploadToSupabase}
                >
                  Upload & Analyze
                </Button>
              </div>
            )}

            {/* Backend Results */}
            {backendResult && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">Backend Response</h4>
                  <pre className="text-sm bg-background p-4 rounded border">
                    {JSON.stringify(backendResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
