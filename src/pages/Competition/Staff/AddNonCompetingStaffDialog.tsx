import PersonSearchField, { User } from '../../../components/PersonSearchField';
import RoleSelect from '../../../components/RoleSelect';
import { addPerson } from '../../../store/actions';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider } from '@mui/material';
import { Role } from '@wca/helpers/lib/models/role';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

export default function AddNonCompetingStaffDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    setSelectedUser(null);
  }, [open]);

  const save = useCallback(() => {
    if (!selectedUser) {
      return;
    }

    console.log(roles);
    dispatch(
      addPerson({
        name: selectedUser?.name,
        wcaUserId: selectedUser?.id,
        registrantId: selectedUser?.id,
        countryIso2: selectedUser?.country_iso2 || 'XX',
        registration: {
          wcaRegistrationId: 0,
          status: 'accepted',
          isCompeting: false,
          eventIds: [],
          administrativeNotes: 'Added with Delegate Dashboard',
        } as any,
        wcaId: selectedUser.wca_id,
        roles,
        extensions: [],
      } as any)
    );
    onClose();
  }, [roles, selectedUser]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Non-Competing Staff</DialogTitle>
      <DialogContent sx={{ minHeight: '40em' }}>
        <PersonSearchField value={selectedUser} setValue={setSelectedUser} />
        <Divider />
        {selectedUser && (
          <>
            <div>
              <p>name: {selectedUser.name}</p>
              <p>wcaUserId: {selectedUser.id}</p>
              <p>wcaId: {selectedUser.wca_id}</p>
              <p>countryIso2: {selectedUser.country_iso2}</p>
            </div>
            <RoleSelect roles={roles} setRoles={(r) => setRoles(r)} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={save} disabled={!selectedUser}>
          Add
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
