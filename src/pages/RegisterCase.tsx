import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, X } from "lucide-react";
import { z } from "zod";

// Validation Schema
const caseSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(0).max(150).optional(),
  gender: z.string().optional(),
  description: z.string().optional(),
  lastSeenLocation: z.string().optional(),
  contactInfo: z.string().optional(),
  additionalDetails: z.string().optional(),
});

export default function RegisterCase() {
  // 🟢 Add this
  supabase.auth.getSession().then(({ data }) => {
    console.log("DEBUG SESSION:", data);
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "",
    description: "",
    lastSeenLocation: "",
    lastSeenDate: "",
    contactInfo: "",
    additionalDetails: "",
    isPublic: false,
  });

  // --------------------------
  // 📸 HANDLE PHOTO SELECT
  // --------------------------
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be under 5MB");
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --------------------------
  // 📌 HANDLE FORM SUBMIT
  // --------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Validate fields
      const validated = caseSchema.parse({
        fullName: formData.fullName,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        description: formData.description || undefined,
        lastSeenLocation: formData.lastSeenLocation || undefined,
        contactInfo: formData.contactInfo || undefined,
        additionalDetails: formData.additionalDetails || undefined,
      });

      let photoUrl = null;

      // --------------------------
      // 📤 Upload Photo to Supabase
      // --------------------------
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("case-photos")
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("case-photos").getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // --------------------------
      // ⚡ Call Python API (Face Capture + Train Model)
      // --------------------------
      
      // --------------------------
      // 📝 Insert Case Into Supabase
      // --------------------------
      const { error: insertError } = await supabase.from("cases").insert({
        user_id: user.id,
        full_name: validated.fullName,
        age: validated.age,
        gender: validated.gender,
        description: validated.description,
        last_seen_location: validated.lastSeenLocation,
        last_seen_date: formData.lastSeenDate || null,
        contact_info: validated.contactInfo,
        additional_details: validated.additionalDetails,
        is_public: formData.isPublic,
        status: "active",
        photo_url: photoUrl,
      });

      if (insertError) {
        console.error("INSERT ERROR:", insertError);
        toast.error(insertError.message);
        return;
      }

      toast.success("Case registered successfully");
      navigate("/dashboard/cases");
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Failed to register case");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------
  // 📌 UI SECTION
  // --------------------------
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Register Missing Person</CardTitle>
            <CardDescription>
              Fill in the details below to create a new case.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* PHOTO UPLOAD */}
              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="flex items-start gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        className="w-32 h-32 rounded-lg object-cover border"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* BASIC DETAILS */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) =>
                      setFormData({ ...formData, gender: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Last Seen Date</Label>
                  <Input
                    type="date"
                    value={formData.lastSeenDate}
                    onChange={(e) =>
                      setFormData({ ...formData, lastSeenDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* EXTRA DETAILS */}
              <div className="space-y-2">
                <Label>Last Seen Location</Label>
                <Input
                  value={formData.lastSeenLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, lastSeenLocation: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Information</Label>
                <Input
                  value={formData.contactInfo}
                  onChange={(e) =>
                    setFormData({ ...formData, contactInfo: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Details</Label>
                <Textarea
                  rows={4}
                  value={formData.additionalDetails}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalDetails: e.target.value,
                    })
                  }
                />
              </div>

              {/* PUBLIC/PRIVATE SWITCH */}
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="font-semibold">Case Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.isPublic
                          ? "Visible to all authorized departments"
                          : "Only you can view this case"}
                      </p>
                    </div>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(val) =>
                        setFormData({ ...formData, isPublic: val })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* BUTTONS */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Case"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
