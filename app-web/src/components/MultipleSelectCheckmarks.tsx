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
  value?: TagOption[];
  onChange?: (value: TagOption[]) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export default function MultipleSelectCheckmarks({
  options,
  value,
  onChange,
  disabled = false,
  label = "Enter Tags",
  placeholder = "Search tags…",
}: MultipleSelectCheckmarksProps) {
  const [internalSelectedTags, setInternalSelectedTags] = React.useState<
    TagOption[]
  >([]);

  const selectedValues = value !== undefined ? value : internalSelectedTags;

  const handleChange = (
    _: React.SyntheticEvent,
    newValue: TagOption[]
  ) => {
    if (value === undefined) {
      setInternalSelectedTags(newValue);
    }

    onChange?.(newValue);
  };

  return (
    <Autocomplete
      multiple
      id="tags-outlined"
      options={options}
      value={selectedValues}
      onChange={handleChange}
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
          label={selectedValues.length > 0 ? "" : label}
          placeholder={
            disabled
              ? "Select a device group first"
              : selectedValues.length > 0
              ? ""
              : placeholder
          }
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