import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, API_BASE_URL } from '../services/api';
import { DashboardStats, ScrapedPost } from '../types';

export interface ThreatAlert {
  id: string;
  message: string;
  flagged: number;
  critical: number;
  timestamp: string;
  post?: ScrapedPost;
}

interface NexusContextType {
  // Scraper & Input Form state
  pastedUrl: string;
  setPastedUrl: (url: string) => void;
  batchLimit: number;
  setBatchLimit: (limit: number) => void;
  isScraping: boolean;

  // Live Terminal Logs
  liveLogs: string[];
  addLog: (msg: string) => void;
  clearLogs: () => void;

  // Monitored Scraped Vehicles & Telemetry
  scrapedVehicles: ScrapedPost[];
  setScrapedVehicles: React.Dispatch<React.SetStateAction<ScrapedPost[]>>;
  stats: DashboardStats;
  refreshStats: () => Promise<void>;

  // Alerts
  alerts: ThreatAlert[];
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;

  // Backend & WebSocket Connectivity
  isBackendOnline: boolean;
  isWsLive: boolean;
  backendError: string | null;
  checkBackendHealth: () => Promise<boolean>;

  // Cross-Workspace Navigation Bridge
  selectedVehicleForForensics: ScrapedPost | null;
  selectVehicleForForensics: (v: ScrapedPost | null) => void;

  // PII Encryption / Masking Toggle
  piiMasked: boolean;
  togglePiiMasked: () => void;

  // Scan Listing Modal
  scanModalOpen: boolean;
  setScanModalOpen: (open: boolean) => void;
  openScanModal: () => void;

  // Database Reset / Purge Action
  purgeDatabase: () => Promise<void>;

  // Pipeline Execution & Hydration
  executeScrape: (customUrl?: string, customLimit?: number) => Promise<any>;
  hydrateFromSupabase: () => Promise<void>;
}

const EMPTY_STATS: DashboardStats = {
  total_posts_monitored: 0,
  flagged_suspicious: 0,
  verified_ncp_units: 0,
  active_investigations: 0,
  critical_risk_units: 0,
  analyst_on_duty: 'Zainab',
  role_level: 1,
};

const NexusContext = createContext<NexusContextType | undefined>(undefined);

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Target URL & Limit
  const [pastedUrl, setPastedUrlState] = useState<string>(() => {
    return localStorage.getItem('nexus_pasted_url') || 'https://www.facebook.com/groups/chaman.quetta.ncp.cars';
  });

  const [batchLimit, setBatchLimitState] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_batch_limit');
    return saved ? parseInt(saved, 10) : 15;
  });

  const setPastedUrl = (url: string) => {
    setPastedUrlState(url);
    localStorage.setItem('nexus_pasted_url', url);
  };

  const setBatchLimit = (limit: number) => {
    setBatchLimitState(limit);
    localStorage.setItem('nexus_batch_limit', String(limit));
  };

  // 2. Live Terminal Logs
  const [liveLogs, setLiveLogs] = useState<string[]>(() => {
    return [
      `[${new Date().toLocaleTimeString()}] NEXUS SENTINEL OSINT Intelligence Platform Initialized.`,
      `[${new Date().toLocaleTimeString()}] Subsystems active: Playwright Headless Chromium, PaddleOCR Watermarks, LightGBM Engine.`,
      `[${new Date().toLocaleTimeString()}] Status: Awaiting Live OSINT Ingestion.`,
    ];
  });

  const addLog = useCallback((msg: string) => {
    const formatted = msg.startsWith('[') ? msg : `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLiveLogs((prev) => [formatted, ...prev.slice(0, 150)]);
  }, []);

  const clearLogs = () => {
    setLiveLogs([`[${new Date().toLocaleTimeString()}] Terminal log console cleared by analyst.`]);
  };

  // 3. Zero-Seeded Monitored Vehicles (NEVER fake cars)
  const [scrapedVehicles, setScrapedVehicles] = useState<ScrapedPost[]>([]);

  // 4. Platform Stats & Threat Alerts (Zero counts on boot)
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // 5. Backend Status & WebSocket Connectivity
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [isWsLive, setIsWsLive] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 6. PII Masking State
  const [piiMasked, setPiiMasked] = useState<boolean>(true);
  const togglePiiMasked = () => setPiiMasked((prev) => !prev);

  // 7. Manual Scan Modal
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false);

  // 8. Forensics Selection Bridge
  const [selectedVehicleForForensics, setSelectedVehicleForForensics] = useState<ScrapedPost | null>(null);
  const selectVehicleForForensics = (v: ScrapedPost | null) => {
    setSelectedVehicleForForensics(v);
  };

  // WebSocket Connection Management
  useEffect(() => {
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsWsLive(true);
          addLog('[WS_STREAM] Real-time telemetry pipe active.');
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'SCRAPER_LOG') {
              addLog(data.message);
            } else if (data.type === 'THREAT_ALERT' && data.alert) {
              const freshAlert: ThreatAlert = {
                id: data.alert.id || `alert-${Date.now()}`,
                message: data.alert.message || 'CRITICAL NCP ALERT',
                flagged: 1,
                critical: 1,
                timestamp: new Date().toLocaleTimeString(),
                post: data.alert.post,
              };
              setAlerts((prev) => [freshAlert, ...prev.slice(0, 19)]);
            }
          } catch {
            // raw text line
            if (typeof event.data === 'string' && event.data !== 'pong') {
              addLog(event.data);
            }
          }
        };

        socket.onclose = () => {
          setIsWsLive(false);
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        };

        socket.onerror = () => {
          setIsWsLive(false);
          socket?.close();
        };
      } catch {
        setIsWsLive(false);
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [addLog]);

  // Health Check
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      const health = await api.checkHealth();
      const online = health.status === 'online';
      setIsBackendOnline(online);
      setBackendError(online ? null : 'Backend offline — run: python -m uvicorn backend.main:app --reload');
      return online;
    } catch {
      setIsBackendOnline(false);
      setBackendError('Backend offline — run: python -m uvicorn backend.main:app --reload');
      return false;
    }
  }, []);

  // Hydration
  const hydrateFromSupabase = useCallback(async () => {
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) return;

      const dashboardData = await api.getDashboardData();
      if (dashboardData?.stats) {
        setStats(dashboardData.stats);
      } else {
        setStats(EMPTY_STATS);
      }

      if (dashboardData?.listings) {
        setScrapedVehicles(dashboardData.listings);
      } else {
        setScrapedVehicles([]);
      }

      if (dashboardData?.alerts) {
        setAlerts(dashboardData.alerts);
      } else {
        setAlerts([]);
      }
    } catch (err: any) {
      console.warn('[NEXUS CONTEXT] Hydration notice:', err.message);
    }
  }, [checkBackendHealth]);

  const refreshStats = async () => {
    await hydrateFromSupabase();
  };

  useEffect(() => {
    hydrateFromSupabase();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [hydrateFromSupabase, checkBackendHealth]);

  // Purge / Reset Database cleanly
  const purgeDatabase = async () => {
    addLog('>>> Purge Database requested. Delivering wipe command to backend...');
    try {
      await api.resetDatabase();
      setScrapedVehicles([]);
      setStats(EMPTY_STATS);
      setAlerts([]);
      addLog('[DATABASE] All ingested listings, phone nodes, and sellers purged. Telemetry reset to 0.');
    } catch (err: any) {
      addLog(`[DATABASE ERROR] Purge command failed: ${err.message}`);
    }
  };

  // Real Playwright Scraper Execution
  const executeScrape = async (customUrl?: string, customLimit?: number) => {
    const targetUrl = (customUrl || pastedUrl).trim();
    const limit = customLimit || batchLimit;

    if (!targetUrl) throw new Error('Target URL cannot be empty.');

    setIsScraping(true);
    setBackendError(null);
    addLog(`>>> Initiating Playwright headless Chromium scrape for: ${targetUrl} (Limit: ${limit})`);

    try {
      const result = await api.executeScraper(targetUrl, limit);

      if (result.logs && Array.isArray(result.logs)) {
        result.logs.forEach((l) => addLog(l));
      }

      if (result.status === 'empty' || !result.listings || result.listings.length === 0) {
        addLog(`[SCRAPER] ${result.message || 'No public posts extracted.'}`);
        return result;
      }

      const freshListings = result.listings || [];
      setScrapedVehicles((prev) => {
        const map = new Map<string, ScrapedPost>();
        freshListings.forEach((p) => {
          const key = p.message_hash || p.id;
          map.set(key, p);
        });
        prev.forEach((p) => {
          const key = p.message_hash || p.id;
          if (!map.has(key)) map.set(key, p);
        });
        return Array.from(map.values());
      });

      // Update stats based on real findings
      await hydrateFromSupabase();

      addLog(`[SCRAPER COMPLETE] ${freshListings.length} vehicles analyzed and persisted.`);
      return result;
    } catch (err: any) {
      addLog(`[SCRAPER ERROR] Playwright pipeline failed: ${err.message}`);
      throw err;
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <NexusContext.Provider
      value={{
        pastedUrl,
        setPastedUrl,
        batchLimit,
        setBatchLimit,
        isScraping,
        liveLogs,
        addLog,
        clearLogs,
        scrapedVehicles,
        setScrapedVehicles,
        stats,
        refreshStats,
        alerts,
        dismissAlert,
        clearAllAlerts,
        isBackendOnline,
        isWsLive,
        backendError,
        checkBackendHealth,
        selectedVehicleForForensics,
        selectVehicleForForensics,
        piiMasked,
        togglePiiMasked,
        scanModalOpen,
        setScanModalOpen,
        openScanModal: () => setScanModalOpen(true),
        purgeDatabase,
        executeScrape,
        hydrateFromSupabase,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = (): NexusContextType => {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};
