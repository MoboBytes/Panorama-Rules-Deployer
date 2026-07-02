import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export type TagOption = {
  name: string;
  location?: string;
  deviceGroup?: string;
  color?: string;
};

type SingleSelectTagProps = {
  options: TagOption[];
  disabled?: boolean;
};

export default function SingleSelectTag({
  options,
  disabled = false,
}: SingleSelectTagProps) {
  const [selectedTag, setSelectedTag] = React.useState<TagOption | null>(null);

  return (
    <Autocomplete
      id="group-tag-outlined"
      options={options}
      value={selectedTag}
      onChange={(_, newValue) => setSelectedTag(newValue)}
      disabled={disabled}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) =>
        option.name === value.name &&
        option.location === value.location &&
        option.deviceGroup === value.deviceGroup
      }
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        return (
          <li
            key={`${option.name}-${option.location ?? ""}-${option.deviceGroup ?? ""}`}
            {...rest}
          >
            {option.name}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Enter Group Tag"
          placeholder={disabled ? "Select a device group first" : "Search group tags…"}
        />
      )}
      fullWidth
      sx={{
        width: "100%",
        "& .MuiAutocomplete-inputRoot": {
          width: "100%",
          minHeight: 52,
          alignItems: "center",
        },
        "& .MuiAutocomplete-input": {
          minWidth: "120px",
        },
      }}
    />
  );
}