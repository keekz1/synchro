"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSchema } from "@/schemas";
import { UserRole } from "@prisma/client";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTransition, useState, useEffect } from "react";
import { FormSuccess } from "@/components/form-success";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { settings } from "@/actions/settings";
import { Pencil } from "lucide-react";

const SettingsPage = () => {
  const user = useCurrentUser();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const { update } = useSession();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      password: undefined,
      newPassword: undefined,
      name: user?.name || undefined,
      email: user?.email || undefined,
      role: user?.role || UserRole.USER,
      isTwoFactorEnabled: user?.isTwoFactorEnabled || false,
    },
  });

  useEffect(() => {
    form.reset({
      password: undefined,
      newPassword: undefined,
      name: user?.name || undefined,
      email: user?.email || undefined,
      role: user?.role || UserRole.USER,
      isTwoFactorEnabled: user?.isTwoFactorEnabled || false,
    });
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) setError(data.error);
          if (data.success) {
            update();
            setSuccess(data.success);
            setIsEditing(false);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
<div className="h-screen w-full flex flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_#99f6e4,_#134e4a)] from-teal-300 to-teal-900">
<Card className="w-full max-w-[90%] md:max-w-[600px] mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <p className="text-2xl font-semibold">⚙️ Settings</p>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              className="space-y-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John Doe"
                            disabled={!isEditing || isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  {user?.isOAuth === false && (
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="john.doe@example.com"
                              type="email"
                              disabled={!isEditing || isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Role Field */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          disabled={!isEditing || isPending}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={UserRole.USER}>User</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 2FA Field */}
                  {user?.isOAuth === false && (
                    <FormField
                      control={form.control}
                      name="isTwoFactorEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Two Factor Authentication</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              disabled={!isEditing || isPending}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Password Fields */}
                {user?.isOAuth === false && isEditing && (
                  <>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="******"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="******"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <FormError message={error} />
              <FormSuccess message={success} />

              {isEditing && (
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;