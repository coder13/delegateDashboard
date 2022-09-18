import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import jp from 'jsonpath';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Grid,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import useDebounce from '../../hooks/useDebounce';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';

const renderTree = (key, node, parent) => {
  if (node && typeof node === 'object') {
    const extraProps = [
      node.id ? `id: ${node.id}` : '',
      node.registrantId ? `registrantId: ${node.registrantId}` : '',
      node.name ? `name: ${node.name}` : '',
      node.activityId ? `activityId: ${node.activityId}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <TreeItem
        key={parent + key}
        nodeId={parent + key}
        label={`${key}${extraProps ? ` (${extraProps})` : ''}`}>
        {Object.keys(node).map((_key) => renderTree(_key, node[_key], parent + key))}
      </TreeItem>
    );
  }

  return (
    <TreeItem key={parent + key} nodeId={parent + key} label={`${key}: ${JSON.stringify(node)}`} />
  );
};
const JQPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { q } = useParams();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [input, setInput] = useState(q || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wcif = useSelector((state) => state.wcif);
  const debouncedInput = useDebounce(input, 800);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setLoading(true);
    navigate({ ...location, search: e.target.value ? `?q=${e.target.value}` : '' });
  };

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'jq',
      },
    ]);
  }, [wcif, setBreadcrumbs]);

  useEffect(() => {
    if (!debouncedInput) {
      setResults([]);
      setLoading(false);
      return;
    }

    setTimeout(() => {
      try {
        setResults(jp.query(wcif, debouncedInput));
        setError(null);
      } catch (e) {
        setError(e);
      }

      setLoading(false);
    }, 1);
  }, [debouncedInput, wcif]);

  return (
    <Grid sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
      <Accordion>
        <AccordionSummary>How to</AccordionSummary>
        <AccordionDetails>
          <Typography>
            Doccumentation:{' '}
            <a href="https://www.npmjs.com/package/jsonpath" target="_blank" rel="noreferrer">
              jsonpath
            </a>
          </Typography>
          <dl>
            <dt>$</dt>
            <dd>The root object</dd>
          </dl>
          <dl>
            <dt>@</dt>
            <dd>The current object</dd>
          </dl>
          <dl>
            <dt>.</dt>
            <dd>Child member operator</dd>
          </dl>
          <dl>
            <dt>..</dt>
            <dd>TRecursive descendant operator;</dd>
          </dl>
          <dl>
            <dt>*</dt>
            <dd>Wildcard matching all objects/elements regardless their names</dd>
          </dl>
          <dl>
            <dt>[]</dt>
            <dd>Subscript operator</dd>
          </dl>
          <dl>
            <dt>[,]</dt>
            <dd>Union operator for alternate names or array indices as a set</dd>
          </dl>
          <dl>
            <dt>[start:end:step] </dt>
            <dd>Array slice operator borrowed from ES4 / Python</dd>
          </dl>
          <dl>
            <dt>?()</dt>
            <dd>Applies a filter (script) expression via static evaluation</dd>
          </dl>
          <dl>
            <dt>()</dt>
            <dd>Script expression via static evaluation</dd>
          </dl>
        </AccordionDetails>
      </Accordion>
      <br />
      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
        <TextField
          id="outlined-multiline-flexible"
          label="Multiline"
          variant="outlined"
          fullWidth
          autoFocus
          value={input}
          onChange={handleInputChange}
          placeholder="$.." // https://www.npmjs.com/package/jsonpath
        />
        {loading && <LinearProgress variant="query" />}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
          {error.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flex: 1, padding: 1 }}>
        <TreeView
          style={{}}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          defaultExpanded={[debouncedInput]}>
          {debouncedInput ? renderTree(debouncedInput, results) : renderTree('wcif', wcif)}
        </TreeView>
      </Box>
    </Grid>
  );
};

export default JQPage;
