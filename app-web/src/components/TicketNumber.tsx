import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import "../styles/components/TicketNumber.css";

type TicketNumberProps = {
  value: string;
  onChange: (value: string) => void;
  onErrorChange?: (errorMessage: string) => void;
  title?: string;
  label?: string;
};

function getTicketNumberError(value: string): string {
  if (!value) {
    return "Ticket number is required.";
  }

  if (value.includes(" ")) {
    return "Ticket number cannot contain spaces.";
  }

  if (!/^\d+$/.test(value)) {
    return "Ticket number must contain numbers only.";
  }

  if (value.length < 7) {
    return "Ticket number must be at least 7 digits.";
  }

  return "";
}

export default function TicketNumber({
  value,
  onChange,
  onErrorChange,
  title = "Ticket Number",
  label = "Enter Ticket Number #",
}: TicketNumberProps) {
  const [touched, setTouched] = useState(false);

  const errorMessage = getTicketNumberError(value);
  const showError = touched && errorMessage !== "";

  useEffect(() => {
    onErrorChange?.(touched ? errorMessage : "");
  }, [errorMessage, touched, onErrorChange]);

  const handleChange = (inputValue: string) => {
    const cleanedValue = inputValue.replace(/\s+/g, "").replace(/\D+/g, "");
    onChange(cleanedValue);
  };

  return (
    <div className="ticket-number">
      <div className="ticket-number__header">
        <p className="ticket-number__title">
          {title}
          {showError && <span className="ticket-number__asterisk"> *</span>}
        </p>
      </div>

      <Box className="ticket-number__input-wrap">
        <TextField
          fullWidth
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className="ticket-number__input"
          label={label}
          variant="outlined"
          error={showError}
          helperText={showError ? errorMessage : ""}
        />
      </Box>
    </div>
  );
}