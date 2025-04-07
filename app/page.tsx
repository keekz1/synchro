
import{Poppins} from "next/font/google";
import{cn} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";

const font = Poppins({
  subsets:["latin"],
  weight:["600"]

})
export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at top, #38bdf8, #1e40af)",
      }}
    >
<div className="space-y-6 text-center">
  <h1 className={cn(
  "text-6xl font-semibold text-white drop-shadow-md",
  font.className,
  )}>
🔐Auth
  </h1>
  <p className="text-white text-lg">
    A simple authentications service
  </p>
  <div>
    <LoginButton >
    <Button variant="secondary" size="lg">
       Sign in
     </Button>
    </LoginButton>

  
  </div>

</div>
    </main>
  );
}
