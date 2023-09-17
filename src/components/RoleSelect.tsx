import { Autocomplete, TextField } from "@mui/material";

const options = [
//   {
//   value: 'trainee-delegate',
//   label: 'Trainee Delegate'
// }, {
//   value: 'delegate',
//   label: 'Delegate'
// }, {
//   value: 'organizer',
//   label: 'Organizer'
// }, 
{
  value: 'data-entry',
  label: 'Data Entry'
}]

export default function RoleSelect ({ roles, setRoles }: {
  roles: string[],
  setRoles: (roles: string[]) => void;
}) {
  return (
    <Autocomplete
      multiple
      id="role-select"
      options={options}
      value={options.filter((option) => roles.includes(option.value))}
      onChange={(_, value) => {
        setRoles(value.map((option) => option.value))
      }}
      getOptionLabel={(option) => option.label}
      defaultValue={[]}
      renderInput={(params) => (
        <TextField {...params} label="Roles" />
      )}
    />
  )
}