import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import DnsIcon from "@mui/icons-material/Dns";
import LanIcon from "@mui/icons-material/Lan";
import TagIcon from "@mui/icons-material/Tag";
import NameField from "./NameTextField";
import IPTextField from "./IPTextField";

type IPChartProps = {
  onIpChange: (value: string) => void;
  onIpNameChange: (value: string) => void;
  onIpErrorChange?: (errorMessage: string) => void;
  onIpNameErrorChange?: (errorMessage: string) => void;
  ChartTitle: string;
  IPAddress: string;
  IPName: string;
  firewallHostname: string;
  firewallSerialNumber: string;
  zone: string;
  firewallGroup: string;
};

export const IPChart: React.FC<IPChartProps> = ({
  onIpChange,
  onIpNameChange,
  onIpErrorChange,
  onIpNameErrorChange,
  IPAddress,
  IPName,
  ChartTitle,
  firewallHostname,
  firewallSerialNumber,
  zone,
  firewallGroup,
}) => {
  return (
    <Box className="ipchart">
      <Box className="ipchart__header">
        <Typography className="ipchart__title">{ChartTitle}</Typography>
      </Box>

      <IPTextField
        value={IPAddress}
        onChange={onIpChange}
        onErrorChange={onIpErrorChange}
        title="IPv4 Address"
        label="Enter IPv4 Address or Subnet"
      />

      <NameField
        value={IPName}
        onChange={onIpNameChange}
        onErrorChange={onIpNameErrorChange}
        title="IP Name"
        label="Enter IP Name"
      />

      <Box className="ipchart__details">
        <Box className="ipchart__detail-card">
          <List aria-label="Panorama lookup details">
            <ListItem>
              <DnsIcon className="ipchart__icon" />
              <ListItemText primary="Firewall Name:" />
              <Typography>{firewallHostname}</Typography>
            </ListItem>

            <Divider component="li" />

            <ListItem>
              <TagIcon className="ipchart__icon" />
              <ListItemText primary="Firewall Serial:" />
              <Typography>{firewallSerialNumber}</Typography>
            </ListItem>

            <Divider component="li" />

            <ListItem>
              <TagIcon className="ipchart__icon" />
              <ListItemText primary="Device Group:" />
              <Typography>{firewallGroup}</Typography>
            </ListItem>

            <Divider component="li" />

            <ListItem>
              <LanIcon className="ipchart__icon" />
              <ListItemText primary="Zone:" />
              <Typography>{zone}</Typography>
            </ListItem>
          </List>
        </Box>
      </Box>
    </Box>
  );
};