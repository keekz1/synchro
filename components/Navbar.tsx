"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-hide navbar after 5 seconds of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      setIsNavVisible(true);
      timer = setTimeout(() => setIsNavVisible(false), 5000);
    };

    // Set up event listeners
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Initial timer
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNav = () => setIsNavVisible(!isNavVisible);

  return (
    <div ref={navRef}>
      {/* Main Navigation Bar */}
      <AnimatePresence>
        {isNavVisible && (
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-gray-800/95 backdrop-blur-sm text-white p-4 fixed top-0 left-0 right-0 z-50 shadow-lg"
          >
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold hover:text-gray-300 transition-colors">
                YourApp
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-6">
                <NavLink href="/" text="Home" />
                <NavLink href="/map" text="Map" />
                <NavLink href="/profile" text="Profile" />
                <NavLink href="/collab" text="Collab" />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="md:hidden text-white focus:outline-none transition-transform hover:scale-110"
                aria-label="Toggle menu"
              >
                <motion.div animate={isMenuOpen ? "open" : "closed"}>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMenuOpen ? (
                      <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </motion.div>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Navbar Toggle Button */}
      <motion.button
        onClick={toggleNav}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed z-50 bg-gray-700/80 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg transition-all ${
          isNavVisible ? "top-16 right-4" : "top-4 right-4"
        }`}
        aria-label={isNavVisible ? "Hide navbar" : "Show navbar"}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isNavVisible ? (
            <path strokeWidth={2} d="M5 15l7-7 7 7" />
          ) : (
            <path strokeWidth={2} d="M19 9l-7 7-7-7" />
          )}
        </svg>
      </motion.button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25 }}
            className="md:hidden fixed inset-0 z-40 bg-gray-800/95 backdrop-blur-sm mt-16 pt-4"
          >
            <div className="flex flex-col space-y-2 px-4">
              <MobileNavLink href="/" text="Home" onClick={toggleMenu} />
              <MobileNavLink href="/map" text="Map" onClick={toggleMenu} />
              <MobileNavLink href="/profile" text="Profile" onClick={toggleMenu} />
              <MobileNavLink href="/collab" text="Collab" onClick={toggleMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable NavLink component for desktop
const NavLink = ({ href, text }: { href: string; text: string }) => (
  <Link
    href={href}
    className="hover:text-gray-300 transition-colors duration-200 relative group"
  >
    {text}
    <span className="absolute left-0 bottom-0 h-0.5 bg-white w-0 group-hover:w-full transition-all duration-300" />
  </Link>
);

// Reusable MobileNavLink component
const MobileNavLink = ({ 
  href, 
  text, 
  onClick 
}: { 
  href: string; 
  text: string; 
  onClick: () => void 
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Link
      href={href}
      className="block text-white text-lg py-3 px-4 hover:bg-gray-700/50 rounded-lg transition-colors"
      onClick={onClick}
    >
      {text}
    </Link>
  </motion.div>
);