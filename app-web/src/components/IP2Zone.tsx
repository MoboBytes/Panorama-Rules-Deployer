import { useEffect, useState } from "react";
import { Button, Typography } from "@mui/material";
import { IPChart } from "./IPChart";
import "../styles/components/IPChart.css";
import "../styles/components/IP2Zone.css";
import {
  buildPanoramaCache,
  clearPanoramaCache,
  getPanoramaCacheStatus,
  getZoneByIp,
} from "../services/PanoramaZoneControllerClient";
import type {
  PanoramaCacheStatus,
  ZoneByIpResult,
} from "../services/PanoramaZoneControllerClient";

type ChartDetails = {
  firewallHostname: string;
  firewallSerialNumber: string;
  zone: string;
  firewallGroup: string;
};

type IP2ZoneProps = {
  onLookupComplete?: (deviceGroups: string[]) => void;
};

const emptyDetails: ChartDetails = {
  firewallHostname: "",
  firewallSerialNumber: "",
  zone: "",
  firewallGroup: "",
};

export default function IP2Zone({ onLookupComplete }: IP2ZoneProps) {
  const [sourceIp, setSourceIp] = useState("");
  const [sourceIpName, setSourceIpName] = useState("");
  const [sourceDetails, setSourceDetails] = useState<ChartDetails>(emptyDetails);

  const [destIp, setDestIp] = useState("");
  const [destIpName, setDestIpName] = useState("");
  const [destDetails, setDestDetails] = useState<ChartDetails>(emptyDetails);

  const [lookupLoading, setLookupLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);

  const [hasCache, setHasCache] = useState(false);
  const [cacheStatusMessage, setCacheStatusMessage] = useState(
    "No data collected yet."
  );

  const loadCacheStatus = async () => {
    try {
      const status: PanoramaCacheStatus = await getPanoramaCacheStatus();

      setHasCache(status.hasMetadataCache);

      if (status.isCacheBuilding) {
        setCacheStatusMessage(
          "Collecting Panorama device, device-group, VR, and zone-interface data..."
        );
        return;
      }

      if (!status.hasValidSession) {
        setCacheStatusMessage("No Panorama session found. Please log in first.");
        return;
      }

      if (status.lastError) {
        setCacheStatusMessage(`Cache error: ${status.lastError}`);
        return;
      }

      if (status.hasMetadataCache) {
        setCacheStatusMessage(
          `Data ready. ${status.totalDevices} devices, ${status.totalDevicesWithDeviceGroup} with device groups, ${status.totalVirtualRouters} VRs, ${status.totalInterfaceZoneMappings} interface-zone mappings loaded.`
        );
      } else {
        setCacheStatusMessage("No data collected yet.");
      }
    } catch (error) {
      setCacheStatusMessage(
        error instanceof Error ? error.message : "Failed to get cache status."
      );
    }
  };

  useEffect(() => {
    loadCacheStatus();
  }, []);

  const handleCacheAction = async () => {
    setCacheLoading(true);

    try {
      if (hasCache) {
        const result = await clearPanoramaCache();
        setHasCache(false);
        setCacheStatusMessage(result.message || "Cache cleared.");
      } else {
        setCacheStatusMessage(
          "Collecting Panorama device, device-group, VR, and zone-interface data..."
        );
        const result = await buildPanoramaCache();
        setHasCache(true);
        setCacheStatusMessage(
          result.message ||
            `Data ready. ${result.totalDevices} devices, ${result.totalDevicesWithDeviceGroup} with device groups, ${result.totalVirtualRouters} VRs, ${result.totalInterfaceZoneMappings} interface-zone mappings loaded.`
        );
      }
    } catch (error) {
      setCacheStatusMessage(
        error instanceof Error ? error.message : "Cache action failed."
      );
    } finally {
      setCacheLoading(false);
      await loadCacheStatus();
    }
  };

  const handleLookup = async () => {
    setLookupLoading(true);

    try {
      setSourceDetails(emptyDetails);
      setDestDetails(emptyDetails);
      onLookupComplete?.([]);

      let resolvedSourceGroup = "";
      let resolvedDestGroup = "";

      const sIp = sourceIp.trim();
      if (sIp) {
        try {
          const result: ZoneByIpResult = await getZoneByIp(sIp);
          resolvedSourceGroup = result.deviceGroup;
          setSourceDetails({
            firewallHostname: result.deviceHostname,
            firewallSerialNumber: result.deviceSerial,
            zone: result.zone,
            firewallGroup: result.deviceGroup,
          });
        } catch {
          setSourceDetails(emptyDetails);
        }
      }

      const dIp = destIp.trim();
      if (dIp) {
        try {
          const result: ZoneByIpResult = await getZoneByIp(dIp);
          resolvedDestGroup = result.deviceGroup;
          setDestDetails({
            firewallHostname: result.deviceHostname,
            firewallSerialNumber: result.deviceSerial,
            zone: result.zone,
            firewallGroup: result.deviceGroup,
          });
        } catch {
          setDestDetails(emptyDetails);
        }
      }

      const groups = Array.from(
        new Set([resolvedSourceGroup, resolvedDestGroup].filter(Boolean))
      );

      onLookupComplete?.(groups);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="panorama-page">
      <div className="panorama-shell">
        <header className="panorama-hero">
          <p className="panorama-hero__eyebrow">Network Discovery</p>
          <h1 className="panorama-hero__title">Panorama IP Zone Mapper</h1>
          <p className="panorama-hero__subtitle">
            Map source and destination IP addresses to firewall zones using
            Panorama metadata.
          </p>
        </header>

        <section className="panorama-status-card">
          <div className="panorama-status-card__left">
            <Button
              variant="contained"
              onClick={handleCacheAction}
              disabled={cacheLoading}
              className="panorama-primary-btn"
            >
              {cacheLoading
                ? "Collecting..."
                : hasCache
                ? "Clear Data"
                : "Collect Data"}
            </Button>
          </div>

          <div className="panorama-status-card__right">
            <Typography className="panorama-status-text">
              {cacheStatusMessage}
            </Typography>
          </div>
        </section>

        <section className="panorama-chart-grid">
          <div className="panorama-chart-card">
            <IPChart
              onIpChange={setSourceIp}
              onIpNameChange={setSourceIpName}
              IPAddress={sourceIp}
              IPName={sourceIpName}
              ChartTitle="Source IP:"
              firewallHostname={sourceDetails.firewallHostname}
              firewallSerialNumber={sourceDetails.firewallSerialNumber}
              zone={sourceDetails.zone}
              firewallGroup={sourceDetails.firewallGroup}
            />
          </div>

          <div className="panorama-chart-card">
            <IPChart
              onIpChange={setDestIp}
              onIpNameChange={setDestIpName}
              IPAddress={destIp}
              IPName={destIpName}
              ChartTitle="Destination IP:"
              firewallHostname={destDetails.firewallHostname}
              firewallSerialNumber={destDetails.firewallSerialNumber}
              zone={destDetails.zone}
              firewallGroup={destDetails.firewallGroup}
            />
          </div>
        </section>

        <div className="panorama-lookup-action">
          <Button
            variant="contained"
            onClick={handleLookup}
            disabled={lookupLoading || cacheLoading || !hasCache}
            className="panorama-lookup-btn"
          >
            {lookupLoading ? "Looking up..." : "Lookup Zones"}
          </Button>
        </div>
      </div>
    </div>
  );
}