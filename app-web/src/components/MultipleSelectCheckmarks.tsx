import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export type TagOption = {
  name: string;
  location?: string;
  deviceGroup?: string;
  color?: string;
};

type MultipleSelectCheckmarksProps = {
  options: TagOption[];
  disabled?: boolean;
};

export default function MultipleSelectCheckmarks({
  options,
  disabled = false,
}: MultipleSelectCheckmarksProps) {
  const [selectedTags, setSelectedTags] = React.useState<TagOption[]>([]);

  return (
    <Autocomplete
      multiple
      id="tags-outlined"
      options={options}
      value={selectedTags}
      onChange={(_, newValue) => setSelectedTags(newValue)}
      disableCloseOnSelect
      disabled={disabled}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) =>
        option.name === value.name &&
        option.location === value.location &&
        option.deviceGroup === value.deviceGroup
      }
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={`${option.name}-${option.location ?? ""}-${option.deviceGroup ?? ""}`}
            label={option.name}
            size="small"
          />
        ))
      }
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        return (
          <li
            key={`${option.name}-${option.location ?? ""}-${option.deviceGroup ?? ""}`}
            {...rest}
          >
            <span style={{ marginRight: 8 }}>
              {selected ? checkedIcon : icon}
            </span>
            {option.name}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Enter Tags"
          placeholder={disabled ? "Select a device group first" : "Search tags…"}
        />
      )}
      fullWidth
      sx={{
        width: "100%",
        "& .MuiAutocomplete-inputRoot": {
          width: "100%",
          alignItems: "center",
          flexWrap: "wrap",
          minHeight: 52,
        },
        "& .MuiAutocomplete-tag": {
          margin: "2px",
          maxWidth: "calc(100% - 8px)",
        },
        "& .MuiAutocomplete-input": {
          minWidth: "120px",
        },
      }}
    />
  );
}