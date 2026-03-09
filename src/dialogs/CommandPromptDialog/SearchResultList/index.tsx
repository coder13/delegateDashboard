import type { SearchResultItem } from '../types';
import SearchResultListItem from './SearchResultListItem';
import { List } from '@mui/material';

interface SearchResult {
  item: SearchResultItem;
}

interface SearchResultListProps {
  searchResults: SearchResult[];
  selected: number;
  onSelect: (item: SearchResult['item']) => void;
}

function SearchResultList({ searchResults, selected, onSelect }: SearchResultListProps) {
  return (
    <List>
      {searchResults.map((result, index) => (
        <SearchResultListItem
          key={result.item.id}
          selected={index === selected}
          onClick={() => onSelect(result.item)}
          {...result.item}
        />
      ))}
    </List>
  );
}

export default SearchResultList;
