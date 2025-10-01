import { List } from '@mui/material';
import SearchResultListItem from './SearchResultListItem';

interface SearchResult {
  item: any;
}

interface SearchResultListProps {
  searchResults: SearchResult[];
  selected: number;
  onSelect: (item: any) => void;
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
