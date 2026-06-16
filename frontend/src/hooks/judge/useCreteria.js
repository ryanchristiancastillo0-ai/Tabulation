import { useState, useEffect } from 'react';


export const useCriteriaGenerator = () => {
  const [criteria, setCriteria] = useState([]);
  const [newCriterion, setNewCriterion] = useState({ name: '', percentage: '' });
  const [error, setError] = useState('');

  // Load existing criteria from localStorage or DB on mount
  useEffect(() => {
    const saved = localStorage.getItem('contest_criteria');
    if (saved) setCriteria(JSON.parse(saved));
  }, []);

  const addCriterion = () => {
    if (!newCriterion.name || !newCriterion.percentage) {
      return setError("Please fill in both fields.");
    }

    const currentTotal = criteria.reduce((sum, c) => sum + Number(c.percentage), 0);
    const nextTotal = currentTotal + Number(newCriterion.percentage);

    if (nextTotal > 100) {
      return setError(`Total exceeds 100% (Current: ${currentTotal}%)`);
    }

    const updated = [...criteria, { ...newCriterion, id: Date.now() }];
    setCriteria(updated);
    localStorage.setItem('contest_criteria', JSON.stringify(updated));
    setNewCriterion({ name: '', percentage: '' });
    setError('');
  };

  const removeCriterion = (id) => {
    const updated = criteria.filter(c => c.id !== id);
    setCriteria(updated);
    localStorage.setItem('contest_criteria', JSON.stringify(updated));
  };

  const totalPercentage = criteria.reduce((sum, c) => sum + Number(c.percentage), 0);

  return { criteria, newCriterion, setNewCriterion, addCriterion, removeCriterion, totalPercentage, error };
};