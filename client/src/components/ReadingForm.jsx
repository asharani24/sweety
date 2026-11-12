import { useState } from 'react';
import api, { getErrorMessage } from '../api';
import { SLOTS, todayStr } from '../utils';

export default function ReadingForm({ initialDate, editing, onSaved, onCancel }) {
  const [date, setDate] = useState(editing?.date || initialDate);
  const [slot, setSlot] = useState(editing?.slot || 'morning');
  const [value, setValue] = useState(editing ? String(editing.value) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { date, slot, value };
      const { data } = editing
        ? await api.put(`/readings/${editing.id}`, body)
        : await api.post('/readings', body);
      onSaved(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h3>{editing ? 'Edit reading' : 'Add a reading'}</h3>
      <label>Date</label>
      <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
      <label>Time slot</label>
      <select value={slot} onChange={(e) => setSlot(e.target.value)}>
        {SLOTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <label>Glucose value (mg/dl)</label>
      <input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      {editing && (
        <button type="button" className="secondary" onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      )}
    </form>
  );
}