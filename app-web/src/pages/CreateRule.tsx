import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import "../styles/pages/CreateRule.css";
import "../styles/components/IP2Zone.css";
import IP2Zone from "../components/IP2Zone";
import MultipleSelectCheckmarks from "../components/MultipleSelectCheckmarks";

export default function CreateARule() {
  const [trafficMode, setTrafficMode] = useState("automatic");
  const [ruleName, setRuleName] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [description, setDescription] = useState("");

  const [deviceGroups, setDeviceGroups] = useState<string[]>([]);
  const [selectedDeviceGroup, setSelectedDeviceGroup] = useState("");

  const handleDeviceGroupChange = (event: SelectChangeEvent) => {
    setSelectedDeviceGroup(event.target.value);
  };

  const handleLookupComplete = (groups: string[]) => {
    setDeviceGroups(groups);

    if (groups.length === 1) {
      setSelectedDeviceGroup(groups[0]);
    } else {
      setSelectedDeviceGroup("");
    }
  };

  const isDeviceGroupEnabled = deviceGroups.length > 0;

  return (
    <div className="create-rule">
      <header className="panorama-hero">
        <p className="panorama-hero__eyebrow">Firewall Policy</p>
        <h1 className="panorama-hero__title">Create Firewall Pre-Rule</h1>
        <p className="panorama-hero__subtitle">
          Build a new Panorama pre-rule using automatic IP-to-zone discovery.
        </p>
      </header>

      <div className="create-rule__body">

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">
              How do you want to define the traffic for this rule?
            </p>
          </div>

          <Box className="create-rule__radio-wrap">
            <FormControl fullWidth>
              <RadioGroup
                aria-labelledby="traffic-mode-radio-group"
                name="traffic-mode-radio-group"
                value={trafficMode}
                onChange={(e) => setTrafficMode(e.target.value)}
                className="AnswerBoxes"
              >
                <FormControlLabel
                  className="RadioButtons"
                  value="automatic"
                  control={<Radio />}
                  label="Automatic"
                />
                <FormControlLabel
                  className="RadioButtons"
                  value="manual"
                  control={<Radio />}
                  label="Manual"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Ticket Number</p>
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              className="create-rule__input"
              label="Enter ticket number"
              variant="outlined"
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Rule Name</p>
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="create-rule__input"
              label="Enter rule name"
              variant="outlined"
              disabled={trafficMode !== "manual"}
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Description</p>
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="create-rule__input"
              label="Enter description"
              variant="outlined"
              disabled={trafficMode !== "manual"}
            />
          </Box>
        </div>

        {trafficMode === "automatic" && (
          <>
            <div className="IP2ZoneWrapper">
              <IP2Zone onLookupComplete={handleLookupComplete} />
            </div>

            <div className="create-rule__device-group">
              <div className="create-rule__section">
                <div className="create-rule__section-header">
                  <p className="IPSubtitle">Device Group</p>
                </div>

                <Box
                  className={`create-rule__input-wrap ${
                    !isDeviceGroupEnabled
                      ? "create-rule__input-wrap--disabled"
                      : ""
                  }`}
                >
                  <FormControl fullWidth disabled={!isDeviceGroupEnabled}>
                    <InputLabel id="device-group-select-label">
                      Select Device Group
                    </InputLabel>
                    <Select
                      labelId="device-group-select-label"
                      id="device-group-select"
                      value={selectedDeviceGroup}
                      label="Select Device Group"
                      onChange={handleDeviceGroupChange}
                      className="create-rule__input"
                    >
                      {deviceGroups.map((group) => (
                        <MenuItem key={group} value={group}>
                          {group}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </div>
            </div>

            <div className="create-rule__section">
              <div className="create-rule__section-header">
                <p className="IPSubtitle">Tags</p>
              </div>

              <Box className="create-rule__input-wrap create-rule__multi-select">
                <MultipleSelectCheckmarks />
              </Box>
            </div>
          </>
        )}
      </div>
    </div>
  );
}