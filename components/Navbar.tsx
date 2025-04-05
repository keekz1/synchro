"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => {
    setIsNavVisible(!isNavVisible);
    setIsMenuOpen(false); // Close menu when toggling navbar
  };

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
            className="bg-gray-800/95 backdrop-blur-sm text-white p-4 fixed top-0 left-0 right-0 z-40 shadow-lg"
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

              {/* Mobile Menu Button - Removed X button functionality */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white focus:outline-none transition-transform hover:scale-110"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Arrow Button - Now closes both navbar and menu */}
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

      {/* Mobile Menu - Will close when arrow is clicked */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25 }}
            className="md:hidden fixed z-30 bg-gray-800/95 backdrop-blur-sm w-full pt-2 pb-4"
            style={{ top: isNavVisible ? '64px' : '4px' }}
          >
            <div className="flex flex-col space-y-2 px-4">
              <MobileNavLink href="/" text="Home" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink href="/map" text="Map" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink href="/profile" text="Profile" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink href="/collab" text="Collab" onClick={() => setIsMenuOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ... (keep the same NavLink and MobileNavLink components)
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