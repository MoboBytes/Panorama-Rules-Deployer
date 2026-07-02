import * as React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />
const checkedIcon = <CheckBoxIcon fontSize="small" />

const names = [
  'Oliver Hansen',
  'Van Henry',
  'April Tucker',
  'Ralph Hubbard',
  'Omar Alexander',
  'Carlos Abbott',
  'Miriam Wagner',
  'Bradley Wilkerson',
  'Virginia Andrews',
  'Kelly Snyder',
]

export default function MultipleSelectCheckmarks() {
  const [personName, setPersonName] = React.useState<string[]>([])

  return (
    <Autocomplete
      multiple
      id="tags-outlined"
      options={names}
      value={personName}
      onChange={(_, newValue) => setPersonName(newValue)}
      disableCloseOnSelect
      renderTags={(value, getTagProps) => (
        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            width: '100%',
            gap: 6,
          }}
        >
          {value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option}
              label={option}
              size="small"
            />
          ))}
        </div>
      )}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props
        return (
          <li key={key} {...rest}>
            <span style={{ marginRight: 8 }}>
              {selected ? checkedIcon : icon}
            </span>
            {option}
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField {...params} label="Tag" placeholder="Search tags…" />
      )}
      sx={{
        m: 1,
        minWidth: 240,
        width: 'fit-content',
        maxWidth: '100%',
        '& .MuiAutocomplete-inputRoot': {
          display: 'flex',
          alignItems: 'flex-start',
          flexWrap: 'wrap !important',
        },
        '& .MuiAutocomplete-tag': {
          margin: 0,
        },
        '& .MuiAutocomplete-input': {
          width: '100% !important',
          minWidth: '100px',
        },
      }}
    />
  )
}