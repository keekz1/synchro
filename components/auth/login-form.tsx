 "use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { login } from "@/actions/login";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export const LoginForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success,setSuccess] = useState<string | undefined>("");
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error") === "OAuthAccountLinked"
  ? "Email already in use with different provider !" : "";
  const [isPending, startTransition] = useTransition();
const [showTwoFactor, setShowTwoFactor] = useState(false);
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
  
    startTransition(() => {
      login(values)
        .then((data) => {
if(data?.error){
  form.reset();
  setError(data.error);
}

if(data?.success){
  setSuccess(data.success);
}

if(data?.twoFactor){

  setShowTwoFactor(true);




}

        })

        .catch(() =>setError("Something went wrong"));
    });
  }
  
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

{showTwoFactor && (
   <FormField
   control={form.control}
   name="code"
   render={({ field }) => (
     <FormItem>
       <FormLabel>Two Factor Code</FormLabel>
       <FormControl>
         <Input
           {...field}
           disabled={isPending}
           placeholder="123456"
                    />
       </FormControl>
       <FormMessage />
     </FormItem>
   )}
 />


)}
          {!showTwoFactor && (
            <>
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
                  <Button 
                  size="sm"
                  variant="link"
                  asChild
                  className="px-0 font-normal">
                    <Link href="/auth/reset">
                    Forgot password?
                    </Link>
                  </Button>
                  <FormMessage />
                </FormItem>
            )}
            />
            </>

)}
          </div>
          <FormError message={error || urlError} />
          <FormSuccess message={success} />
          <Button disabled={isPending} type="submit" className="w-full">
{showTwoFactor? "Confirm": "Login"}


          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
