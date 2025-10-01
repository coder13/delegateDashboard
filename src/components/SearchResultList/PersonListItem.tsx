import { Avatar, ListItemAvatar, ListItemText } from '@mui/material';

function stringToColor(string: string): string {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

function stringAvatar(name: string) {
  const parts = name.split(' ');
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0],
  };
}

interface PersonListItemProps {
  name: string;
  wcaId?: string;
  avatar?: {
    thumbUrl: string;
  };
}

function PersonListItem({ name, wcaId, avatar }: PersonListItemProps) {
  return (
    <>
      <ListItemAvatar>
        {avatar ? (
          <Avatar alt={name} src={avatar.thumbUrl} />
        ) : (
          <Avatar {...stringAvatar(name)} />
        )}
      </ListItemAvatar>
      <ListItemText primary={name} secondary={wcaId} />
    </>
  );
}

export default PersonListItem;
