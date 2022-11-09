import {Box} from "@mui/material";

const GroupSelector = () => (
  <Box>
    {[ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(group => (
      <span key={group}>
        <a href={`/predictions/groups/group-${group}`}>Group {group.toUpperCase()}</a>
      </span>
      ))}
    <span >
        <a href={`/predictions/playoffs`}>Playoffs</a>
      </span>
  </Box>
)

export default GroupSelector;
