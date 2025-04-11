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
import { useTransition, useState ,useEffect} from "react";
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
      name: undefined,
      email: undefined,
      role: undefined,
      isTwoFactorEnabled: false,
    },
  });

  // Reset form whenever user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        password: undefined,
        newPassword: undefined,
        name: user.name || undefined,
        email: user.email || undefined,
        role: user.role || undefined,
        isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
      });
    }
  }, [user, form.reset]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(() => {
      settings(values)
        .then(async (data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            await update(); // This will trigger a re-render with fresh data
            setSuccess(data.success);
            setIsEditing(false);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <div className="mt-20 flex justify-center px-4 h-screen w-full flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_#38bdf8,_#1e40af)] from-sky-400 to-blue-800">
      <Card className="w-full max-w-[90%] md:max-w-[600px] mx-auto">
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-2xl font-semibold">⚙️ Settings</p>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <Input {...field} disabled={isPending} />
                        )}
                      />
                    ) : (
                      <p className="text-sm">{user?.name}</p>
                    )}
                  </div>

                  <div className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    {/* Email */}
    <div>
      <p className="text-sm text-muted-foreground">Email</p>
      {isEditing && user?.isOAuth === false ? (
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <Input {...field} disabled={isPending} />
          )}
        />
      ) : (
        <p className="text-sm truncate">{user?.email}</p> // Truncate the email if it overflows
      )}
    </div>
  </div>
</div>


                  {/* Role */}
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                              <SelectItem value={UserRole.USER}>User</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <p className="text-sm capitalize">
                        {user?.role?.toLowerCase()}
                      </p>
                    )}
                  </div>

                  {/* 2FA */}
                  <div>
                    <p className="text-sm text-muted-foreground">2FA</p>
                    {isEditing && user?.isOAuth === false ? (
                      <FormField
                        control={form.control}
                        name="isTwoFactorEnabled"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false} // Handle undefined
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    ) : (
                      <p className="text-sm">
                        {user?.isTwoFactorEnabled ? "Enabled" : "Disabled"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Fields */}
                {user?.isOAuth === false && isEditing && (
                  <div className="space-y-4">
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
                              placeholder="••••••"
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
                              placeholder="••••••"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <FormError message={error} />
              <FormSuccess message={success} />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
