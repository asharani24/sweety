import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../AuthContext';
import ReadingForm from '../components/ReadingForm';
import { slotLabel, todayStr } from '../utils';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [readings, setReadings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/readings', { params: { date: selectedDate } })
      .then(({ data }) => setReadings(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [selectedDate, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);

  function handleSaved(saved) {
    setEditing(null);
    setSelectedDate(saved.date);
    reload();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this reading?')) return;
    try {
      await api.delete(`/readings/${id}`);
      if (editing?.id === id) setEditing(null);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Sweety</h1>
        <div>
          <span className="muted">Hello, {user.name} </span>
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      </div>

      <ReadingForm
        key={editing ? `edit-${editing.id}` : `new-${selectedDate}`}
        initialDate={selectedDate}
        editing={editing}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />

      <div className="card">
        <div className="header">
          <h3>Readings</h3>
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
        {error && <p className="error">{error}</p>}
        {readings.length === 0 ? (
          <p className="muted">No readings for this date yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Slot</th><th>Value (mg/dl)</th><th></th></tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id}>
                  <td>{slotLabel(r.slot)}</td>
                  <td>{r.value}</td>
                  <td>
                    <button className="secondary" onClick={() => setEditing(r)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}