"use client";

import {FcGoogle} from "react-icons/fc";
import {FaGithub} from "react-icons/fa";
import {Button} from "@/components/ui/button";
import {signIn} from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const Social = () =>{

const onClick = (provider: "google" | "github") => {

  signIn(provider,{
    callbackUrl: DEFAULT_LOGIN_REDIRECT,



  })

}



    return (
      <div className="flex items-center gap-x-4 justify-center w-full">
        <Button
          size="lg"
          variant="outline"
          className="flex-grow"
          onClick={() => onClick("google")}
        >
          <FcGoogle className="h-5 w-5" />
        </Button>
  
        <Button
          size="lg"
          variant="outline"
          className="flex-grow"
          onClick={() => onClick("github")}
        >
          <FaGithub className="h-5 w-5" />
        </Button>
      </div>
    );
  };
  