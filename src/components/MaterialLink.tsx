import Link, { LinkProps as MuiLinkProps } from '@mui/material/Link';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

type MaterialLinkProps = Omit<MuiLinkProps, 'component'> &
  Omit<RouterLinkProps, 'to'> & {
    to: RouterLinkProps['to'];
  };

const MaterialLink = (props: MaterialLinkProps) => {
  return <Link {...props} component={RouterLink} />;
};

export default MaterialLink;
