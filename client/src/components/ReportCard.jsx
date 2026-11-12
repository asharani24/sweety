import { formatRange, slotLabel } from '../utils';

export default function ReportCard({ title, report, showReadings }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {!report ? (
        <p className="muted">Loading...</p>
      ) : (
        <>
          <p className="muted">{formatRange(report.range)}</p>
          {report.count === 0 ? (
            <p className="muted">No readings for this period yet. Add your first reading!</p>
          ) : (
            <>
              <div className="stat"><span>Highest</span><strong>{report.highest} mg/dl</strong></div>
              <div className="stat"><span>Lowest</span><strong>{report.lowest} mg/dl</strong></div>
              <div className="stat"><span>Average</span><strong>{report.average.toFixed(1)} mg/dl</strong></div>
              <div className="stat"><span>Readings</span><strong>{report.count}</strong></div>
              {showReadings && (
                <table>
                  <tbody>
                    {report.readings.map((r) => (
                      <tr key={r.id}>
                        <td>{slotLabel(r.slot)}</td>
                        <td>{r.value} mg/dl</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}