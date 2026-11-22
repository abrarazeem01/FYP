import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NexusProvider } from './context/NexusContext';
import { TopStatusBar } from './components/TopStatusBar';
import { TacticalSidebar } from './components/TacticalSidebar';
import { ScanListingModal } from './components/ScanListingModal';
import { RopeThemeToggle } from './components/RopeThemeToggle';
import { FluidCursorTrail } from './components/FluidCursorTrail';
import { CinematicMotionBackground } from './components/CinematicMotionBackground';
import { CrystalCollisionBootSequence } from './components/CrystalCollisionBootSequence';
import { Spatial3DPrisms } from './components/Spatial3DPrisms';
import { TechnicalTickerMarquee } from './components/TechnicalTickerMarquee';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScraperPage } from './pages/ScraperPage';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { CasesPage } from './pages/CasesPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { EntityGraphPage } from './pages/EntityGraphPage';
import { ModelDiagnosticsPage } from './pages/ModelDiagnosticsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Verify2FAPage } from './pages/Verify2FAPage';

// Seamless Cinematic Page Transitions (Parallax + Soft Blur)
const pageVariants = {
  initial: {
    opacity: 0,
    y: 14,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.995,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full"
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scraper" element={<ScraperPage />} />
            <Route path="/analyzer" element={<AnalyzerPage />} />
            <Route path="/entity-graph" element={<EntityGraphPage />} />
            <Route path="/models" element={<ModelDiagnosticsPage />} />
            <Route path="/diagnostics" element={<ModelDiagnosticsPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-2fa" element={<Verify2FAPage />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { isAuthenticated, isBooting, setBooting } = useAuth();
  const location = useLocation();

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-2fa'].includes(
    location.pathname
  );

  // If user is not authenticated, show stealth editorial login directly
  if (!isAuthenticated && !isAuthRoute) {
    return (
      <div className="relative min-h-screen bg-[#060708] text-[#F4F6F8]">
        <CinematicMotionBackground intensity={0.4} />
        <Spatial3DPrisms intensity={0.35} />
        <FluidCursorTrail />
        <RopeThemeToggle />
        <LoginPage />
      </div>
    );
  }

  // If directly on an auth page
  if (isAuthRoute) {
    return (
      <div className="relative min-h-screen bg-[#060708] text-[#F4F6F8]">
        <CinematicMotionBackground intensity={0.35} />
        <Spatial3DPrisms intensity={0.3} />
        <FluidCursorTrail />
        <RopeThemeToggle />
        <AnimatedRoutes />
      </div>
    );
  }

  // Authenticated Enterprise Layout
  return (
    <div className="relative min-h-screen flex bg-[#060708] text-[#F4F6F8] selection:bg-[#D4FF00] selection:text-black">
      {/* 3D Crystal Collision Post-Login Boot Sequence */}
      <AnimatePresence>
        {isBooting && (
          <CrystalCollisionBootSequence onComplete={() => setBooting(false)} />
        )}
      </AnimatePresence>

      {/* 60fps Persistent Topographic & Dot-Matrix Motion Background */}
      <CinematicMotionBackground intensity={0.3} />

      {/* Spatial 3D Glassmorphic Prisms & Expanding Node-Matrix Pulse */}
      <Spatial3DPrisms intensity={0.35} />

      {/* 60fps Verlet/Spring Rope Tether & Kinetic Fluid Mouse Trail */}
      <FluidCursorTrail />

      {/* Interactive Hanging Pull-Rope Theme Switcher */}
      <RopeThemeToggle />

      {/* Global Manual Scan Listing Modal */}
      <ScanListingModal />

      {/* Single Ultra-Minimal Icon-Rail Navigation System */}
      <TacticalSidebar />

      {/* Main Content Stage (Offset by 74px rail) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10 pl-[74px]">
        {/* Sticky Utility Header */}
        <TopStatusBar />

        {/* Real-time Technical Telemetry Ticker Marquee */}
        <TechnicalTickerMarquee />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <AnimatedRoutes />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  useEffect(() => {
    // Lenis Inertial Smooth Scrolling Across All Pages
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NexusProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </NexusProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
