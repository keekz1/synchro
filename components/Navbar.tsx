"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/auth/user-button";
import { Button } from "@/components/ui/button";
import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const role = useCurrentRole();

  const toggleNav = () => {
    setIsNavVisible(!isNavVisible);
    setIsMenuOpen(false);
  };

  const isSettingsPage = ["/settings", "/server", "/client", "/admin"].includes(pathname);

  return (
    <div ref={navRef} className="relative">
      {/* Main */}
      <AnimatePresence>
        {isNavVisible && (
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: "spring", damping: 20 }}
            className={`${
              isSettingsPage ? "bg-secondary" : "bg-white"
            } backdrop-blur-sm text-black p-2 fixed top-0 left-0 right-0 z-40 shadow-lg max-h-[60px]`}
          >
            <div className="container mx-auto flex justify-between items-center h-full">
              <Link href="/" className="text-xl font-bold hover:text-gray-600 transition-colors">
                Synchro
              </Link>

               <div className="hidden md:flex space-x-6">
                <NavLink href="/" text="Home" />
                <NavLink href="/map" text="Map" />
                <NavLink href="/profile" text="Profile" />
                {role === UserRole.HR && (
                  <NavLink href="/hr-dashboard" text="HR Dashboard" />
                )}
                 <NavLink href="/collab" text="Collab" />
                <NavLink href="/self-growth" text="Personal growth" />
                <NavLink href="/⚙️settings" text="Settings" />

              </div>

              {/* Phone  */}
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-black focus:outline-none transition-transform hover:scale-110"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Arrow  */}
      <motion.button
        onClick={toggleNav}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed z-50 bg-white/80 hover:bg-gray-200 text-black p-3 rounded-full shadow-lg transition-all ${
          isNavVisible ? "top-20 right-4" : "top-4 right-4"
        }`}
        aria-label={isNavVisible ? "Hide navbar" : "Show navbar"}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isNavVisible ? (
            <path strokeWidth={2} d="M5 15l7-7 7 7" />
          ) : (
            <path strokeWidth={2} d="M19 9l-7 7-7-7" />
          )}
        </svg>
      </motion.button>

      {/* phone Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden fixed z-30 bg-white/95 backdrop-blur-sm w-full pt-4 pb-4"
            style={{ top: isNavVisible ? '64px' : '4px' }}
          >
            <div className="flex flex-col space-y-3 px-4">
              <MobileNavLink href="/" text="Home" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink href="/map" text="Map" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink href="/profile" text="Profile" onClick={() => setIsMenuOpen(false)} />
              {role === UserRole.HR && (
                <MobileNavLink href="/hr-dashboard" text="HR Dashboard" onClick={() => setIsMenuOpen(false)} />
              )}
               <MobileNavLink href="/collab" text="Collab" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink href="/self-growth" text="Personal Development" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink href="/settings" text="⚙️Settings" onClick={() => setIsMenuOpen(false)} />

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* settings nav */}
      {isSettingsPage && (
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed left-0 right-0 z-30 bg-secondary backdrop-blur-sm p-2 shadow-lg top-16"
        >
          <div className="flex justify-between items-center w-full max-w-full p-4">
            <div className="flex gap-2">
              <SettingsButton href="/server" label="Server Side view" active={pathname?.startsWith("/server")} />
              <SettingsButton href="/client" label="Client" active={pathname?.startsWith("/client")} />
             {/* <SettingsButton href="/admin" label="Admin" active={pathname?.startsWith("/admin")} /> */}
              <SettingsButton href="/settings" label="Settings" active={pathname === "/settings"} />
            </div>
            <div className="flex justify-end">
              <UserButton />
            </div>
          </div>
        </motion.nav>
      )}
    </div>
  );
}

 
const NavLink = ({ href, text }: { href: string; text: string }) => (
  <Link
    href={href}
    className="hover:text-gray-600 transition-colors duration-200 relative group text-black"
  >
    {text}
    <span className="absolute left-0 bottom-0 h-0.5 bg-black w-0 group-hover:w-full transition-all duration-300" />
  </Link>
);

const MobileNavLink = ({
  href,
  text,
  onClick,
}: {
  href: string;
  text: string;
  onClick: () => void;
}) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Link
      href={href}
      className="block text-black text-lg py-3 px-4 hover:bg-gray-200/50 rounded-lg transition-colors"
      onClick={onClick}
    >

      {text}
    </Link>
  </motion.div>
);

const SettingsButton = ({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) => (
  <Button asChild variant={active ? "default" : "outline"} >
    <Link href={href}>{label}</Link>
  </Button>
);
