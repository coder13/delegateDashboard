import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import Link, { LinkProps as MUILinkProps } from '@mui/material/Link';

type MaterialLinkProps = Omit<MUILinkProps, 'component'> & RouterLinkProps;

const MaterialLink = (props: MaterialLinkProps) => {
  return <Link {...props} component={RouterLink} />;
};

export default MaterialLink;
