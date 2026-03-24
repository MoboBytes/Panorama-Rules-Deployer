// src/pages/PanoramaPage.tsx

import { useState } from "react";
import { Button } from "@mui/material";
import { Box } from "@mui/system";
import { IPChart } from "../components/IPChart";
import "../styles/PanoramaPage.css";
import { getZoneByIp } from "../services/PanoramaZoneControllerClient";
import type { ZoneByIpResult } from "../services/PanoramaZoneControllerClient";

type ChartDetails = {
  firewallHostname: string;
  firewallSerialNumber: string;
  zone: string;
  deviceGroup: string;
};

const emptyDetails: ChartDetails = {
  firewallHostname: "",
  firewallSerialNumber: "",
  zone: "",
  deviceGroup: "",
};

export default function PanoramaPage() {
  // Source IP + details
  const [sourceIp, setSourceIp] = useState("");
  const [sourceDetails, setSourceDetails] = useState<ChartDetails>(emptyDetails);

  // Destination IP + details
  const [destIp, setDestIp] = useState("");
  const [destDetails, setDestDetails] = useState<ChartDetails>(emptyDetails);

  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true);

    try {
      // Clear previous results
      setSourceDetails(emptyDetails);
      setDestDetails(emptyDetails);

      // Source IP lookup (if provided)
      const sIp = sourceIp.trim();
      if (sIp) {
        try {
          const result: ZoneByIpResult = await getZoneByIp(sIp);
          setSourceDetails({
            firewallHostname: result.deviceHostname,
            firewallSerialNumber: result.deviceSerial,
            zone: result.zone,
            deviceGroup: "", // backend doesn’t provide this yet
          });
        } catch {
          // You can optionally surface an error in UI
        }
      }

      // Destination IP lookup (if provided)
      const dIp = destIp.trim();
      if (dIp) {
        try {
          const result: ZoneByIpResult = await getZoneByIp(dIp);
          setDestDetails({
            firewallHostname: result.deviceHostname,
            firewallSerialNumber: result.deviceSerial,
            zone: result.zone,
            deviceGroup: "",
          });
        } catch {
          // Optional: surface error
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appTitle">
      <h1 className="AppTitle">Panorama IP Zone Mapper</h1>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row", // two columns: label | right side
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
            deviceGroup={sourceDetails.deviceGroup}
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
            deviceGroup={destDetails.deviceGroup}
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
          disabled={loading}
        >
          {loading ? "Looking up..." : "Lookup Zones"}
        </Button>
      </Box>
    </div>
  );
}