import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import SingleSelectTag from "../components/SingleSelectCheckmarks";
import type { TagOption } from "../components/SingleSelectCheckmarks";

type LogPositionValue = {
  logStart: "yes" | "no";
  logEnd: "yes" | "no";
};

type LogProfileStartEndProps = {
  tagOptions: TagOption[];
  selectedTag: TagOption | null;
  onTagChange: (value: TagOption | null) => void;
  selectedPositions: string[];
  onPositionChange: (value: string[]) => void;
  onLogPositionChange?: (value: LogPositionValue) => void;
  tagDisabled?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  helperText?: string;
  startLabel?: string;
  endLabel?: string;
};

export default function LogProfileStartEnd({
  tagOptions,
  selectedTag,
  onTagChange,
  selectedPositions,
  onPositionChange,
  onLogPositionChange,
  tagDisabled = false,
  searchLabel = "Log forwarding profile",
  searchPlaceholder = "Search log forwarding profiles…",
  helperText = "Select a log forwarding profile and choose Start, End, or both.",
  startLabel = "Log Start",
  endLabel = "Log End",
}: LogProfileStartEndProps) {
  const handlePositionChange = (
    event: React.MouseEvent<HTMLElement>,
    newSelected: string[],
  ) => {
    onPositionChange(newSelected);

    onLogPositionChange?.({
      logStart: newSelected.includes("start") ? "yes" : "no",
      logEnd: newSelected.includes("end") ? "yes" : "no",
    });
  };

  return (
    <Box className="log-profile-start-end">
      <Box className="log-profile-start-end__search">
        <Typography className="log-profile-start-end__helper">{helperText}</Typography>

        <SingleSelectTag
          id="log-forwarding-profile-search"
          options={tagOptions}
          value={selectedTag}
          onChange={onTagChange}
          disabled={tagDisabled}
          label={searchLabel}
          placeholder={searchPlaceholder}
        />
      </Box>

      <Box className="log-profile-start-end__position">
        <ToggleButtonGroup
          value={selectedPositions}
          onChange={handlePositionChange}
          aria-label="log position"
        >
          <ToggleButton value="start" aria-label={startLabel}>
            {startLabel}
          </ToggleButton>

          <ToggleButton value="end" aria-label={endLabel}>
            {endLabel}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}