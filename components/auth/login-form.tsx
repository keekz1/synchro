// components/auth/login-form.tsx
"use client"; // Explicitly mark this as a client-side component

import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  DEFAULT_LOGIN_REDIRECT,
  
} from "@/routes";

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { CardWrapper } from "./card-wrapper";
import { login } from "@/actions/login"; // Ensure login action returns user data
//import { getUserByEmail } from "@/data/user"; // Fetch userId based on email

export const LoginForm = () => {
  const [error, setError] = useState<string | undefined>(""); 
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

// components/auth/login-form.tsx
const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
  setError("");
  setSuccess("");

  startTransition(async () => {
    try {
      const result = await login(values);
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.success && result.user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        console.log('Stored user data:', result.user);
        
        // Redirect manually after storage
        window.location.href = DEFAULT_LOGIN_REDIRECT;
      }
    } catch  {
      setError("Something went wrong!");
    }
  });
};
  
  
  useEffect(() => {
    // Check if userId is stored in localStorage
    const storedUserId = localStorage.getItem("userId");
    console.log("Stored User ID from localStorage:", storedUserId);
  }, []);

  return (
    <CardWrapper
      headerLabel="Welcome back"
      backButtonLabel="Don't have an account?"
      backButtonHref="/auth/register"
      showSocial
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="john@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="******"
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button disabled={isPending} type="submit" className="w-full">
            Login
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
