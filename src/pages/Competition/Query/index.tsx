import useDebounce from '../../../hooks/useDebounce';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppSelector } from '../../../store';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Grid,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { blue, green, red, yellow } from '@mui/material/colors';
import { Box } from '@mui/system';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import jp from 'jsonpath';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const ColoredLabel = ({ text, color, label }: { text: string; color: string; label: string }) => (
  <>
    <span style={{ color: blue[800] }}>
      {text}
      {': '}
    </span>
    <span style={{ color }}>{label}</span>
  </>
);

function renderLabel(key: string, node: unknown): React.ReactNode {
  if (node && Array.isArray(node) && node.length === 0) {
    return <ColoredLabel text={key} color={blue[800]} label={JSON.stringify(node)} />;
  }

  // Checks if node is object and *not* null or undefined
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    const extraProps = [
      record.id && renderLabel('id', record.id),
      record.registrantId && renderLabel('registrantId', record.registrantId),
      record.name && renderLabel('name', record.name),
      record.activityId && renderLabel('activityId', record.activityId),
    ].filter((value): value is React.ReactNode => Boolean(value));

    return (
      <>
        <span style={{ color: blue[800] }}>
          {key}
          {!!extraProps?.length && ': '}
        </span>
        {!!extraProps?.length && (
          <span style={{ color: blue[800] }}>
            {'{ '}
            {extraProps.reduce((a, b) => (
              <>
                {a}, {b}
              </>
            ))}
            {' }'}
          </span>
        )}
      </>
    );
  } else {
    if (typeof node === 'string') {
      return <ColoredLabel text={key} color={green[800]} label={JSON.stringify(node)} />;
    } else if (typeof node === 'number') {
      return <ColoredLabel text={key} color={yellow[900]} label={JSON.stringify(node)} />;
    } else if (node === undefined || node === null) {
      return <ColoredLabel text={key} color={red[800]} label={JSON.stringify(node)} />;
    }

    return `${key}: ${JSON.stringify(node)}`;
  }
}

const treeItemSlots = {
  collapseIcon: ExpandMoreIcon,
  expandIcon: ChevronRightIcon,
};

const renderTree = (key: string, node: unknown, parent = ''): React.ReactNode => {
  // Checks if node is object and *not* null or undefined
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    return (
      <TreeItem
        key={parent + key}
        itemId={parent + key}
        label={renderLabel(key, node)}
        slots={treeItemSlots}>
        {Object.keys(record).map((_key) => renderTree(_key, record[_key], parent + key))}
      </TreeItem>
    );
  }

  return (
    <TreeItem
      key={parent + key}
      itemId={parent + key}
      label={renderLabel(key, node)}
      slots={treeItemSlots}
    />
  );
};
const QueryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useQuery();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [input, setInput] = useState<string>(queryParams.get('query') || '');
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wcif = useAppSelector((state) => state.wcif);
  const debouncedInput = useDebounce(input, 800);

  useEffect(() => {
    setInput(queryParams.get('query') || '');
  }, [queryParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setLoading(true);
    navigate({ ...location, search: e.target.value ? `?query=${e.target.value}` : '' });
  };

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'jq',
      },
    ]);
  }, [wcif, setBreadcrumbs]);

  useEffect(() => {
    if (!wcif) {
      return;
    }

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
        setError(e instanceof Error ? e : new Error('Failed to run query'));
      }

      setLoading(false);
    }, 1);
  }, [debouncedInput, wcif]);

  if (!wcif) {
    return null;
  }

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
      <Accordion>
        <AccordionSummary>Examples</AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItemButton
              component={Link}
              to={'?query=' + encodeURIComponent('events[*].rounds[*].id')}>
              <ListItemText primary="Get all round ids" />
            </ListItemButton>
          </List>
        </AccordionDetails>
      </Accordion>
      <br />
      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
        <TextField
          label="Query"
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
        <SimpleTreeView style={{}}>
          {debouncedInput
            ? renderTree(debouncedInput, results.length === 1 ? results[0] : results)
            : renderTree('wcif', wcif)}
        </SimpleTreeView>
      </Box>
    </Grid>
  );
};

export default QueryPage;
