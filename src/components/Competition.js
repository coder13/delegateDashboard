import React, { useState, useEffect } from 'react';
import { getWcif } from '../lib/wcaAPI.js'
import { updateIn } from '../lib/utils';
import { sortWcifEvents } from '../lib/events';
import { validateWcif } from '../lib/wcif-validation';

const Competition = ({ match }) => {
  const [wcif, setWcif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    getWcif(match.params.competitionId)
      /* Sort events, so that we don't need to remember about this everywhere. */
      .then(wcif => updateIn(wcif, ['events'], sortWcifEvents))
      .then(wcif => {
        setWcif(wcif);
        setErrors(validateWcif(wcif));
      })
      .catch(error => setErrors([error.message]))
      .finally(() => setLoading(false));
  }, [match.params.competitionId]);

  if (loading) {
    return (<div><p>Loading...</p></div>)
  }

  console.log(errors);

  if (errors.length) {
    return (
      <div>
        Errors!
        <ul>
          {errors.map(err => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      </div>
    )
  }

  console.log(wcif);

  return (
    <div>
      {wcif.name}
    </div>
  );
}

export default Competition;