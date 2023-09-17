import { FormControl, FormHelperText, FormLabel, ListItemText, MenuItem, Select, Typography } from "@mui/material";
import Assignments from "../config/assignments";

interface AssignmentPickerProps {
  value: string;
  setValue: (value: string) => void;
}

export default function AssignmentPicker({
  value,
  setValue,
}: AssignmentPickerProps) {
  return (
    <FormControl margin="none" fullWidth>
      <FormLabel>Assignment</FormLabel>
      <Select
        className="paintingAssignment"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        renderValue={(value) => {
          const assignment = Assignments.find((a) => a.id === value);
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ListItemText>{assignment?.name}</ListItemText>
            </div>
          );
        }}>
        {Assignments.map((assignment) => (
          <MenuItem key={assignment.id} value={assignment.id}>
            <ListItemText>{assignment.name}</ListItemText>
            {assignment.key && <Typography>{assignment.key.toUpperCase()}</Typography>}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>Or press the respective key</FormHelperText>
    </FormControl>
  );
}
