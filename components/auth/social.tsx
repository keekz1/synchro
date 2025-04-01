"use client";

import {FcGoogle} from "react-icons/fc";
import {FaGithub} from "react-icons/fa";
import {Button} from "@/components/ui/button";

export const Social = () => {
    return (
      <div className="flex items-center gap-x-4 justify-center w-full">
        <Button
          size="lg"
          variant="outline"
          className="flex-grow"
          onClick={() => {}}
        >
          <FcGoogle className="h-5 w-5" />
        </Button>
  
        <Button
          size="lg"
          variant="outline"
          className="flex-grow"
          onClick={() => {}}
        >
          <FaGithub className="h-5 w-5" />
        </Button>
      </div>
    );
  };
  