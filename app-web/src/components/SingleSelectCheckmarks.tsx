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
  value?: TagOption | null;
  onChange?: (value: TagOption | null) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  placeholder?: string;
};

export default function SingleSelectTag({
  options,
  value,
  onChange,
  disabled = false,
  id = "single-select-tag",
  label = "Enter Group Tag",
  placeholder = "Search group tags…",
}: SingleSelectTagProps) {
  const [internalSelectedTag, setInternalSelectedTag] =
    React.useState<TagOption | null>(null);

  const selectedTag = value !== undefined ? value : internalSelectedTag;

  const handleChange = (_: React.SyntheticEvent, newValue: TagOption | null) => {
    if (value === undefined) {
      setInternalSelectedTag(newValue);
    }

    onChange?.(newValue);
  };

  return (
    <Autocomplete
      id={id}
      options={options}
      value={selectedTag}
      onChange={handleChange}
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
          label={label}
          placeholder={disabled ? "Unavailable" : placeholder}
        />
      )}
      fullWidth
    />
  );
}