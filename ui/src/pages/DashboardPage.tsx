import { useCallback, useEffect } from "react";
import { SystemService } from "../services/system.service";
import { useAppState } from "../store/useAppState";

const DashboardPage = () => {
  const { setSystemStats, loading, setLoading, systemStats } = useAppState();

  const load = useCallback(async () => {
    setLoading(true);
    const sysStats = await SystemService.getSystemStatus();
    setSystemStats(sysStats);
    console.log("[DEBUG] stats", systemStats);
    setLoading(false);
  }, [setSystemStats, setLoading, systemStats]);

  useEffect(() => {
    load();
  }, [load]);
  return <main>{!loading && <h2>Domain Controller Statistics</h2>}</main>;
};

export default DashboardPage;
