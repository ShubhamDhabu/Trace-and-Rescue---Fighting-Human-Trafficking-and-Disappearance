import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AlertCircle, Video, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export default function LiveSearch() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [detected, setDetected] = useState<any>(null);

  // Load all active cases
  useEffect(() => {
    const fetchCases = async () => {
      const { data } = await supabase
        .from("cases")
        .select("*")
        .eq("status", "active");

      if (data) setCases(data);
    };

    fetchCases();
  }, []);

  // 🔍 Poll backend every 3 seconds for detection
  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(async () => {
      const res = await fetch("http://localhost:8000/get-found-person");
      const data = await res.json();

      if (data.found) {
        console.log("FOUND PERSON:", data);

        setDetected(data);
        setIsSearching(false); // stop loader
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSearching]);

  // Start Process
  const startSearch = async () => {
    if (!selectedCaseId || !selectedName) {
      alert("Please select a missing person first");
      return;
    }

    setDetected(null);
    setIsSearching(true);

    try {
      // 1️⃣ Send Name for capturing face
      await fetch(
        `http://localhost:8000/capture-face?name=${encodeURIComponent(
          selectedName
        )}`,
        { method: "POST" }
      );

      // 2️⃣ Train model
      await fetch("http://localhost:8000/train-model", {
        method: "POST",
      });

      // 3️⃣ Start recognition with case_id + name
      await fetch(
        `http://localhost:8000/recognize?case_id=${selectedCaseId}&name=${encodeURIComponent(
          selectedName
        )}`,
        {
          method: "POST",
        }
      );
    } catch (err) {
      console.error("❌ Error:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold">Live CCTV Search</h2>
        <p className="text-muted-foreground">
          Real-time face recognition using your Python backend.
        </p>

        {/* INFO ALERT */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Flow: Select Person → Capture → Train → Recognize → Detect →
            Display Result
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Select Missing Person</CardTitle>
            <CardDescription>Choose a case to search in CCTV</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* SELECT CASE */}
            <Select
              onValueChange={(val) => {
                const [id, name] = val.split("|");
                setSelectedCaseId(id);
                setSelectedName(name);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a person" />
              </SelectTrigger>

              <SelectContent>
                {cases.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={`${c.id}|${c.full_name}`}
                  >
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* CCTV PREVIEW BOX */}
            <div className="aspect-video bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
              {!isSearching ? (
                <Video className="h-16 w-16 text-muted-foreground" />
              ) : (
                <div className="text-center">
                  <Video className="h-16 w-16 text-primary animate-pulse mx-auto" />
                  <p className="mt-2 text-lg font-medium">
                    Analyzing Live CCTV Feed...
                  </p>
                </div>
              )}
            </div>

            {/* START BUTTON */}
            <Button onClick={startSearch} className="w-full">
              <Play className="mr-2 h-4 w-4" /> Start CCTV Search
            </Button>
          </CardContent>
        </Card>

        {/* RESULT CARD */}
        {detected && (
          <Card className="border-green-500 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-600 text-xl">
                🎉 Missing Person FOUND
              </CardTitle>
              <CardDescription>
                The person was detected in live CCTV.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-lg font-semibold">
                Name: {detected.name}
              </p>
              <p className="text-md text-muted-foreground">
                Location: {detected.location}
              </p>
              <p>{detected.message}</p>

              <img
                src={detected.image_url}
                alt="Detected Snapshot"
                className="rounded-lg border w-full max-w-sm"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
