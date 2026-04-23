// src/pages/LoginPage.tsx

import Box from "@mui/material/Box";
import "../styles/CreateRule.css";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";

export default function LoginPage() {
  
  

  return (
    <div>
        <div> 
            <h1 className="AppTitle">Create Firewall Pre-Rule</h1>
        </div>
        <div>
            <p className="IPSubtitle">How do you want to define the traffic for this rule?</p>
            <Box>
                <FormControl >
                    <RadioGroup
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue="female"
                        name="radio-buttons-group"
                        className ="AnswerBoxes"
                    >
                        <FormControlLabel className = "RadioButtons" value="female" control={<Radio />} label="Automatic" />
                        <FormControlLabel className = "RadioButtons" value="male" control={<Radio />} label="Manual" />
                    </RadioGroup>
                </FormControl>
            </Box>
        </div>
    </div>
  );
}