import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingManageableCompetitions } from '../lib/wcaAPI.js'
import { sortBy } from '../lib/utils';

const CompetitionList = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUpcomingManageableCompetitions()
      .then(competitions => {
        setCompetitions(
          sortBy(competitions, competition => competition['start_date'])
        );
      })
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <ul>
        {competitions.map(comp => (
          <li key={comp.id}><Link to={`/competitions/${comp.id}`}>{comp.name}</Link></li>
        ))}
      </ul>
    </div>
  );
}

export default CompetitionList;
