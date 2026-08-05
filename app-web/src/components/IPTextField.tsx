import { useEffect, useState } from "react";
import * as ipaddr from "ipaddr.js";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import "../styles/components/IPTextField.css";

type IpValidationResult = {
  isValid: boolean;
  isIp: boolean;
  isSubnet: boolean;
  normalizedValue: string;
  errorMessage: string;
};

type IPTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onErrorChange?: (errorMessage: string) => void;
  title?: string;
  label?: string;
};

function validateIpv4IpOrSubnet(value: string): IpValidationResult {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return {
      isValid: false,
      isIp: false,
      isSubnet: false,
      normalizedValue,
      errorMessage: "An IPv4 address or IPv4 subnet is required.",
    };
  }

  if (normalizedValue.includes(" ")) {
    return {
      isValid: false,
      isIp: false,
      isSubnet: false,
      normalizedValue,
      errorMessage: "Spaces are not allowed.",
    };
  }

  if (!normalizedValue.includes("/")) {
    if (!ipaddr.isValid(normalizedValue)) {
      return {
        isValid: false,
        isIp: false,
        isSubnet: false,
        normalizedValue,
        errorMessage: "Invalid IPv4 address.",
      };
    }

    const parsed = ipaddr.parse(normalizedValue);

    if (parsed.kind() !== "ipv4") {
      return {
        isValid: false,
        isIp: false,
        isSubnet: false,
        normalizedValue,
        errorMessage: "Only IPv4 addresses are allowed.",
      };
    }

    return {
      isValid: true,
      isIp: true,
      isSubnet: false,
      normalizedValue,
      errorMessage: "",
    };
  }

  const parts = normalizedValue.split("/");

  if (parts.length !== 2) {
    return {
      isValid: false,
      isIp: false,
      isSubnet: false,
      normalizedValue,
      errorMessage: "Invalid IPv4 subnet format.",
    };
  }

  const [ipPart, prefixPart] = parts;

  if (!ipPart || !prefixPart) {
    return {
      isValid: false,
      isIp: false,
      isSubnet: false,
      normalizedValue,
      errorMessage: "Invalid IPv4 subnet format.",
    };
  }

  if (!ipaddr.isValid(ipPart)) {
    return {
      isValid: false,
      isIp: false,
      isSubnet: false,
      normalizedValue,
      errorMessage: "Invalid IPv4 subnet address.",
    };
  }

  const parsedIp = ipaddr.parse(ipPart);

  if (parsedIp.kind() !== "ipv4") {
    return {
      isValid: false,
      isIp: false,
      isSubnet: false,
      normalizedValue,
      errorMessage: "Only IPv4 subnet addresses are allowed.",
    };
  }

  const prefix = Number(prefixPart);

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return {
      isValid: false,
      isIp: false,
      isSubnet: false,
      normalizedValue,
      errorMessage: "IPv4 subnet prefix must be between 0 and 32.",
    };
  }

  return {
    isValid: true,
    isIp: false,
    isSubnet: true,
    normalizedValue,
    errorMessage: "",
  };
}

export default function IPTextField({
  value,
  onChange,
  onErrorChange,
  title = "IPv4 Address",
  label = "Enter IPv4 Address or Subnet",
}: IPTextFieldProps) {
  
  const [touched, setTouched] = useState(false);

  const validationResult = validateIpv4IpOrSubnet(value);
  const errorMessage = validationResult.errorMessage;
  const showError = touched && errorMessage !== "";

  useEffect(() => {
    onErrorChange?.(touched ? errorMessage : "");
  }, [errorMessage, touched, onErrorChange]);

  const handleChange = (inputValue: string) => {
    const cleanedValue = inputValue.replace(/\s+/g, "");
    onChange(cleanedValue);
  };

  return (
    <div className="ip-text-field">
      <div className="ip-text-field__header">
        <p className="ip-text-field__title">
          {title}
          {showError && <span className="ip-text-field__asterisk"> *</span>}
        </p>
      </div>

      <Box className="ip-text-field__input-wrap">
        <TextField
          fullWidth
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className="ip-text-field__input"
          label={label}
          variant="outlined"
          error={showError}
          helperText={showError ? errorMessage : ""}
        />
      </Box>
    </div>
  );
}