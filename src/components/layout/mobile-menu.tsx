"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Trophy, Users, Shield, LogIn, LogOut } from "lucide-react";

import { signOut } from "@/lib/auth-client";

interface MobileMenuProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function MobileMenu({ isAuthenticated, isAdmin }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleSignOut = async () => {
    await signOut();
    closeMenu();
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="text-muted hover:text-primary flex items-center justify-center rounded-md p-2 transition-colors md:hidden"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMenu}
        />

        {/* Drawer Panel */}
        <div
          className={`bg-surface absolute top-0 right-0 h-full w-80 max-w-[85vw] transform shadow-xl transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="border-primary-light flex items-center justify-between border-b p-4">
            <span className="font-display text-primary text-xl font-semibold uppercase">
              Menu
            </span>
            <button
              onClick={closeMenu}
              className="text-muted hover:text-primary rounded-full p-2 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col p-4">
            <Link
              href="/competitions"
              onClick={closeMenu}
              className="text-muted hover:text-primary hover:bg-primary-light flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors"
            >
              <Trophy className="text-primary h-5 w-5" />
              Competitions
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/teams"
                  onClick={closeMenu}
                  className="text-muted hover:text-primary hover:bg-primary-light flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors"
                >
                  <Users className="text-accent h-5 w-5" />
                  Teams
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="text-primary hover:bg-primary-light flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors"
                  >
                    <Shield className="h-5 w-5" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Divider */}
          <div className="border-primary-light mx-4 border-t" />

          {/* Auth Section */}
          <div className="p-4">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="hover:bg-primary-light flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/"
                onClick={closeMenu}
                className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-white transition-colors"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
