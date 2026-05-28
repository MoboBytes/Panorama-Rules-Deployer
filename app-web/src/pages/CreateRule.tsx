// src/pages/CreateARule.tsx

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import "../styles/CreateRule.css";
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import IP2Zone from "../components/IP2Zone";

export default function CreateARule() {
  const [trafficMode, setTrafficMode] = useState("automatic");
  const [ruleName, setRuleName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="create-rule">
      <div className="create-rule__header">
        <h1 className="AppTitle">Create Firewall Pre-Rule</h1>
      </div>

      <div className="create-rule__body">
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
            />
          </Box>
        </div>

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

        {trafficMode === "automatic" && (
          <div className="IP2ZoneWrapper">
            <IP2Zone />
          </div>
        )}
      </div>
    </div>
  );
}