import { List } from '@mui/material';
import SearchResultListItem from './SearchResultListItem';

function SearchResultList({ searchResults, selected, onSelect }) {
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
