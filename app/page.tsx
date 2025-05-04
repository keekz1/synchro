import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";
import Link from "next/link";  

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

export default function Home() {
  return (
    <main className="h-screen w-full flex flex-col justify-between items-center bg-[radial-gradient(ellipse_at_top,_#99f6e4,_#134e4a)] from-teal-300 to-teal-900">
      
      <div className="flex-grow flex flex-col gap-y-10 items-center justify-center">
        <div className="space-y-6 text-center">
          <h1 className={cn("text-6xl font-semibold text-white drop-shadow-md", font.className)}>
            🙋‍♂️Synchro
          </h1>
          <p className="text-white text-lg">Connect with like-minded people</p>
          <div>
            <LoginButton>
              <Button variant="secondary" size="lg">
                Sign in
              </Button>
            </LoginButton>
          </div>
        </div>
      </div>

       <footer className="mb-4 text-white text-sm">
        <Link href="/policy" className="underline hover:text-teal-200">
          Privacy Policy
        </Link>
      </footer>
    </main>
  );
}
