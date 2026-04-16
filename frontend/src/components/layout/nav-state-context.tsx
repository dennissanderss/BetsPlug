"use client";

/**
 * Shared mobile-nav state for the authed shell.
 *
 * Lets the Header's hamburger button control the Sidebar's drawer
 * without prop-drilling through the layout. Only used on mobile;
 * desktop sidebar is always visible and doesn't read this state.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

type NavState = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
};

const NavStateContext = createContext<NavState | null>(null);

export function NavStateProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen((v) => !v);
  return (
    <NavStateContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile }}>
      {children}
    </NavStateContext.Provider>
  );
}

/** Safe fallback: if a component is rendered outside the provider we
 *  return no-op state so the shell can't crash. */
export function useNavState(): NavState {
  const ctx = useContext(NavStateContext);
  if (ctx) return ctx;
  return {
    mobileOpen: false,
    setMobileOpen: () => {},
    toggleMobile: () => {},
  };
}
