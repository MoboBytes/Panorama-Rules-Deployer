import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import "../styles/components/NameTextField.css";

type NameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onErrorChange?: (errorMessage: string) => void;
  title?: string;
  label?: string;
};

function getNameFieldError(value: string): string {
  if (!value) {
    return "Name is required.";
  }

  if (value.includes(" ")) {
    return "Name cannot contain spaces.";
  }

  if (value.length < 1) {
    return "Name must contain at least 1 character.";
  }

  return "";
}

export default function NameField({
  value,
  onChange,
  onErrorChange,
  title = "Name",
  label = "Enter Name",
}: NameFieldProps) {
  const [touched, setTouched] = useState(false);

  const errorMessage = getNameFieldError(value);
  const showError = touched && errorMessage !== "";

  useEffect(() => {
    onErrorChange?.(touched ? errorMessage : "");
  }, [errorMessage, touched, onErrorChange]);

  const handleChange = (inputValue: string) => {
    const cleanedValue = inputValue.replace(/\s+/g, "");
    onChange(cleanedValue);
  };

  return (
    <div className="name-field">
      <div className="name-field__header">
        <p className="name-field__title">
          {title}
          {showError && <span className="name-field__asterisk"> *</span>}
        </p>
      </div>

      <Box className="name-field__input-wrap">
        <TextField
          fullWidth
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className="name-field__input"
          label={label}
          variant="outlined"
          error={showError}
          helperText={showError ? errorMessage : ""}
        />
      </Box>
    </div>
  );
}