import { Box, TextField, Typography } from '@mui/material';

type IPChartProps = {
  //Inputs
  onIpChange: (value: string) => void;
  ChartTitle: string;
  //Outputs
  IPAddress: string;
  firewallHostname: string;
  firewallSerialNumber: string;
  zone: string;
  deviceGroup: string;
};

export const IPChart: React.FC<IPChartProps> = ({ 
  onIpChange, IPAddress,ChartTitle, firewallHostname, firewallSerialNumber, zone, deviceGroup }) => {
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',   // two columns: label | right side
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      {/* Left column: label */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 75, // roughly match the input box height
        }}
      >
        <Typography variant="h6">{ChartTitle}</Typography>
      </Box>

      {/* Right column: IP input box on top, details box below */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,       // space between input box and details box
        }}
      >
        {/* Top: IP input box (unchanged styling) */}
        <Box
          component="form"
          sx={{
            width: 275,
            height: 75,
            borderRadius: 5,
            bgcolor: '#cccccc',
            '&:hover': {
              bgcolor: '#a5d6a7',
            },
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            id="outlined-helperText"
            label="IPv4 Address"
            onChange = {(e) => onIpChange(e.target.value)}
            value={IPAddress}
            sx={{
              width: '90%',
              margin: '10px',
              bgcolor: 'white',
              borderRadius: 1,

              // Label styles
              '& .MuiInputLabel-root': {
                bgcolor: 'white',
                px: 0.5,
              },
              '& .MuiInputLabel-shrink': {
                bgcolor: 'white',
                color: 'grey',
                px: 0.5,
                borderRadius: 1,
                border: '1px solid #cccccc',
              },

              // Border styles
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#cccccc',
                },
                '&:hover fieldset': {
                  borderColor: '#cccccc',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#cccccc',
                },
              },
            }}
          />
        </Box>

        {/* Bottom: gray details box, perfectly aligned with input box */}
        <Box
          sx={{
            width: 250,          // same width as input box
            borderRadius: 5,
            bgcolor: '#cccccc',
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {[
            { label: 'Firewall Hostname:', value: firewallHostname },
            { label: 'Firewall Serial Number:', value: firewallSerialNumber },
            { label: 'Zone:', value: zone },
            { label: 'Device Group:', value: deviceGroup },
          ].map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                {label}
              </Typography>
              <Box
                sx={{
                  width: '90%',
                  minHeight: 36,
                  maxHeight: 72,
                  borderRadius: 1,
                  bgcolor: 'white',
                  border: '1px solid #cccccc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  px: 1,
                  py: 0.5,
                  mx: 'auto',            // center within gray box

                  // vertical scrolling
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: value ? 'black' : 'grey.700' }}
                >
                  {value || ''}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
    
  );
};