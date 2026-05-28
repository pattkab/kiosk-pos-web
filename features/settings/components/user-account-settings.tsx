"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ImagePlus, LifeBuoy, PhoneCall, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATAR_PRESETS, getProfileInitials } from "@/lib/avatar-presets";
import { SUPPORT_CONTACT } from "@/lib/support";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  useCurrentProfile,
  useUpdateCurrentProfile,
} from "@/hooks/use-profile";
import {
  userProfileSchema,
  type UserProfileValues,
} from "@/validators/profile";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension) return extension;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "png";
}

export function UserAccountSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();
  const profile = useCurrentProfile();
  const updateProfile = useUpdateCurrentProfile();
  const form = useForm<UserProfileValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      avatar_url: "",
    },
  });

  useEffect(() => {
    if (!profile.data) return;
    form.reset({
      full_name: profile.data.full_name ?? "",
      phone: profile.data.phone ?? "",
      avatar_url: profile.data.avatar_url ?? "",
    });
  }, [form, profile.data]);

  const avatarUrl = form.watch("avatar_url") ?? "";
  const fullName = form.watch("full_name");
  const initials = getProfileInitials(fullName, profile.data?.email);
  const displayName = fullName || profile.data?.email || "User";

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !profile.data) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Profile photos must be 2 MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      const extension = getFileExtension(file);
      const fileName =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `${crypto.randomUUID()}.${extension}`
          : `${Date.now()}.${extension}`;
      const filePath = `${profile.data.auth_user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      form.setValue("avatar_url", `${publicUrl}?v=${Date.now()}`, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Profile photo uploaded");
    } catch (error: any) {
      toast.error(error.message ?? "Profile photo upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>User account</CardTitle>
          <CardDescription>
            Update your profile photo, avatar, and personal details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading account...
            </div>
          ) : profile.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {profile.error.message}
            </div>
          ) : (
            <form
              className="grid gap-6"
              onSubmit={form.handleSubmit((values) =>
                updateProfile.mutate(values),
              )}
            >
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="flex flex-col items-center gap-4 rounded-md border bg-muted/20 p-5">
                  <Avatar className="h-28 w-28 border bg-background shadow-sm">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <div className="grid w-full gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload photo"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      disabled={!avatarUrl}
                      onClick={() =>
                        form.setValue("avatar_url", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <X className="mr-2 h-4 w-4" />
                      Use initials
                    </Button>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    JPG, PNG, WebP, or GIF up to 2 MB.
                  </p>
                </div>

                <div className="grid content-start gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Name</Label>
                    <Input
                      id="full_name"
                      autoComplete="name"
                      {...form.register("full_name")}
                    />
                    {form.formState.errors.full_name ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.full_name.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.data?.email ?? ""}
                      readOnly
                      className="bg-muted/40"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      autoComplete="tel"
                      placeholder="+256..."
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <Label>Avatar</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                      {AVATAR_PRESETS.map((preset) => {
                        const selected = avatarUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`Use ${preset.label} avatar`}
                            className={cn(
                              "relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border bg-background p-3 text-sm font-medium transition hover:bg-accent",
                              selected &&
                                "border-primary bg-primary/5 text-primary ring-1 ring-primary",
                            )}
                            onClick={() =>
                              form.setValue("avatar_url", preset.url, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          >
                            {selected ? (
                              <Check className="absolute right-2 top-2 h-4 w-4" />
                            ) : null}
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={preset.url} alt="" />
                              <AvatarFallback>{preset.label[0]}</AvatarFallback>
                            </Avatar>
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.errors.avatar_url ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.avatar_url.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    isUploading ||
                    updateProfile.isPending ||
                    !form.formState.isDirty
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfile.isPending ? "Saving..." : "Save account"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Support
          </CardTitle>
          <CardDescription>
            Get help with account access, setup, billing, or POS operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Provided by</p>
            <p className="font-semibold">{SUPPORT_CONTACT.company}</p>
          </div>
          <Button asChild variant="outline">
            <a href={`tel:${SUPPORT_CONTACT.phoneE164}`}>
              <PhoneCall className="mr-2 h-4 w-4" />
              {SUPPORT_CONTACT.phoneDisplay}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
