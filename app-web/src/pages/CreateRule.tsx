// src/pages/LoginPage.tsx

import { useState } from "react";
import Box from "@mui/material/Box";
import "../styles/CreateRule.css";
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import IP2Zone from "../components/IP2Zone";

export default function LoginPage() {
  const [trafficMode, setTrafficMode] = useState("automatic");

  return (
    <div>
      <div>
        <h1 className="AppTitle">Create Firewall Pre-Rule</h1>
      </div>

      <div>
        <p className="IPSubtitle">
          How do you want to define the traffic for this rule?
        </p>

        <Box>
          <FormControl>
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

      {trafficMode === "automatic" && (
        <div className="IP2ZoneWrapper">
          <IP2Zone />
        </div>
      )}
    </div>
  );
}