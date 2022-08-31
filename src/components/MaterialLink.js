import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';

const MaterialLink = (props) => {
  return <Link {...props} component={RouterLink} />;
};

export default MaterialLink;
