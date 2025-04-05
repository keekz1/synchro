"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    // Hide navbar after 5 seconds
    const timer = setTimeout(() => {
      setIsNavVisible(false);
    }, 5000);

    return () => clearTimeout(timer); // Clean up timer
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNav = () => setIsNavVisible(!isNavVisible);

  return (
    <>
      {/* Fixed Navigation Bar */}
      {isNavVisible && (
        <nav className="bg-gray-800 text-white p-4 fixed top-0 left-0 right-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              YourApp
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
              <Link href="/map" className="hover:text-gray-300">
                Map
              </Link>
              <Link href="/profile" className="hover:text-gray-300">
                Profile
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-white focus:outline-none"
              aria-label="Toggle menu"
            >
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
            </button>
          </div>
        </nav>
      )}

      {/* Navbar Toggle Button */}
      <button
        onClick={toggleNav}
        className={`fixed z-50 bg-gray-700 text-white p-1.5 rounded-full ${
          isNavVisible ? "top-14 right-3" : "top-3 right-3"
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
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-gray-800 mt-16 p-4">
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="text-white text-lg py-2 px-4 hover:bg-gray-700 rounded"
              onClick={() => {
                toggleMenu();
                setIsNavVisible(false);
              }}
            >
              Home
            </Link>
            <Link
              href="/map"
              className="text-white text-lg py-2 px-4 hover:bg-gray-700 rounded"
              onClick={() => {
                toggleMenu();
                setIsNavVisible(false);
              }}
            >
              Map
            </Link>
            <Link
              href="/profile"
              className="text-white text-lg py-2 px-4 hover:bg-gray-700 rounded"
              onClick={() => {
                toggleMenu();
                setIsNavVisible(false);
              }}
            >
              Profile
            </Link>
          </div>
        </div>
      )}
    </>
  );
}