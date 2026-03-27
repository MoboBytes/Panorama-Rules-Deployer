import { useEffect, useState } from "react";
import { Button, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { IPChart } from "../components/IPChart";
import "../styles/PanoramaPage.css";
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
};

const emptyDetails: ChartDetails = {
  firewallHostname: "",
  firewallSerialNumber: "",
  zone: "",
};

export default function PanoramaPage() {
  // Source IP + details
  const [sourceIp, setSourceIp] = useState("");
  const [sourceDetails, setSourceDetails] = useState<ChartDetails>(emptyDetails);

  // Destination IP + details
  const [destIp, setDestIp] = useState("");
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
        setCacheStatusMessage("Collecting Panorama device, VR, and zone-interface data...");
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
          `Data ready. ${status.totalDevices} devices, ${status.totalVirtualRouters} VRs, ${status.totalInterfaceZoneMappings} interface-zone mappings loaded.`
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
        setCacheStatusMessage("Collecting Panorama device, VR, and zone-interface data...");
        const result = await buildPanoramaCache();
        setHasCache(true);
        setCacheStatusMessage(
          result.message ||
            `Data ready. ${result.totalDevices} devices, ${result.totalVirtualRouters} VRs, ${result.totalInterfaceZoneMappings} interface-zone mappings loaded.`
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

      const sIp = sourceIp.trim();
      if (sIp) {
        try {
          const result: ZoneByIpResult = await getZoneByIp(sIp);
          setSourceDetails({
            firewallHostname: result.deviceHostname,
            firewallSerialNumber: result.deviceSerial,
            zone: result.zone,
          });
        } catch {
          setSourceDetails(emptyDetails);
        }
      }

      const dIp = destIp.trim();
      if (dIp) {
        try {
          const result: ZoneByIpResult = await getZoneByIp(dIp);
          setDestDetails({
            firewallHostname: result.deviceHostname,
            firewallSerialNumber: result.deviceSerial,
            zone: result.zone,
          });
        } catch {
          setDestDetails(emptyDetails);
        }
      }
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="appTitle">
      <h1 className="AppTitle">Panorama IP Zone Mapper</h1>

      {/* Cache Button + Status Text */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mt: 4,
          mb: 4,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color={hasCache ? "error" : "primary"}
          onClick={handleCacheAction}
          disabled={cacheLoading}
        >
          {cacheLoading ? "Collecting..." : hasCache ? "Clear Data" : "Collect Data"}
        </Button>

        <Box
          sx={{
            minWidth: "320px",
            maxWidth: "700px",
          }}
        >
          <Typography variant="body2">{cacheStatusMessage}</Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          ml: -4,
        }}
      >
        {/* Source IP */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <IPChart
            onIpChange={setSourceIp}
            IPAddress={sourceIp}
            ChartTitle="Source IP:"
            firewallHostname={sourceDetails.firewallHostname}
            firewallSerialNumber={sourceDetails.firewallSerialNumber}
            zone={sourceDetails.zone}
          />
        </Box>

        {/* Destination IP */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <IPChart
            onIpChange={setDestIp}
            IPAddress={destIp}
            ChartTitle="Destination IP:"
            firewallHostname={destDetails.firewallHostname}
            firewallSerialNumber={destDetails.firewallSerialNumber}
            zone={destDetails.zone}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 4,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleLookup}
          disabled={lookupLoading || cacheLoading || !hasCache}
        >
          {lookupLoading ? "Looking up..." : "Lookup Zones"}
        </Button>
      </Box>
    </div>
  );
}