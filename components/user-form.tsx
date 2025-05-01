"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, X, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadProfilePicture } from "@/app/actions/upload";
import { userFormSchema, type UserFormValues } from "@/lib/validations/user";

interface UserFormProps {
  user?: any;
  onUserSubmit: (user: any) => Promise<void>;
  onCancel?: () => void;
}

export function UserForm({ user, onUserSubmit, onCancel }: UserFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(!user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(Date.now()); // Used to force form re-render
  const [profilePicture, setProfilePicture] = useState<string | null>(
    user?.profilePicture || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create form with default values
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "user",
      status: user?.status || "active",
      profilePicture: user?.profilePicture || "",
      ...(user ? {} : { password: "" }), // Only include password field for new users
    },
  });

  // Reset form when user prop changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active",
        password: "",
        confirmPassword: "",
      });
      // Only show password fields for new users by default
      setShowPassword(!user);
      // Set profile picture if user has one
      setProfilePicture(user.profilePicture || null);
      // Force form re-render to ensure all fields are updated
      setFormKey(Date.now());
    }
  }, [user, form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file
      const result = await uploadProfilePicture(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Set the profile picture URL
      setProfilePicture(result.url);

      toast({
        title: "Image uploaded",
        description: "Profile picture has been uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: UserFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Remove confirmPassword from the submitted data
      const { confirmPassword, ...submitData } = values;

      // If password is empty and we're editing, don't include it in the update
      const dataToSubmit =
        user && !submitData.password
          ? {
              id: user.id,
              ...submitData,
              password: undefined,
              // Include the profile picture URL
              profilePicture: profilePicture,
              // Preserve these fields if they exist in the original user object
              tasksAssigned: user.tasksAssigned,
              tasksCompleted: user.tasksCompleted,
            }
          : user
          ? {
              id: user.id,
              ...submitData,
              // Include the profile picture URL
              profilePicture: profilePicture,
              // Preserve these fields if they exist in the original user object
              tasksAssigned: user.tasksAssigned,
              tasksCompleted: user.tasksCompleted,
            }
          : {
              ...submitData,
              // Include the profile picture URL
              profilePicture: profilePicture,
            };

      // Call the onUserSubmit function provided by the parent component
      await onUserSubmit(dataToSubmit);

      // If we're adding a new user, reset the form
      if (!user) {
        form.reset({
          name: "",
          email: "",
          role: "user",
          status: "active",
          password: "",
          confirmPassword: "",
        });
        setProfilePicture(null);
      }

      toast({
        title: user ? "User updated" : "User created",
        description: user
          ? "User profile has been updated successfully"
          : "New user has been created successfully",
      });
    } catch (error) {
      console.error("Error submitting user:", error);
      toast({
        title: "Error",
        description: "Failed to save user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (onCancel) {
      onCancel();
    }
    form.reset();
    setProfilePicture(user?.profilePicture || null);
  };

  return (
    <Form {...form} key={formKey}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
              <AvatarImage
                src={profilePicture || "/placeholder.svg?height=200&width=200"}
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.name?.charAt(0) || form.watch("name")?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md border border-background"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="transition-all duration-200"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {profilePicture ? "Change Picture" : "Upload Picture"}
                </>
              )}
            </Button>

            {profilePicture && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveProfilePicture}
                disabled={isUploading}
                className="transition-all duration-200"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name">Name</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...field}
                  aria-describedby="name-description"
                />
              </FormControl>
              <FormDescription id="name-description">
                Enter the user's full name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email">Email</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  placeholder="john@example.com"
                  type="email"
                  {...field}
                  aria-describedby="email-description"
                />
              </FormControl>
              <FormDescription id="email-description">
                Enter the user's email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="role">Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Determines user permissions</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="status">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Active users can log in</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showPassword && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      {...field}
                      aria-describedby="password-description"
                    />
                  </FormControl>
                  <FormDescription id="password-description">
                    {user
                      ? "Leave blank to keep current password"
                      : "Minimum 6 characters"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirmPassword">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...field}
                      aria-describedby="confirm-password-description"
                    />
                  </FormControl>
                  <FormDescription id="confirm-password-description">
                    Re-enter the password to confirm
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {user && !showPassword && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPassword(true)}
          >
            Change Password
          </Button>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {user ? "Updating..." : "Creating..."}
              </>
            ) : user ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
