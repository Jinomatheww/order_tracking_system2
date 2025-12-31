export default function StatusHistory({ history }) {
  return (
    <>
      <h3>Status History</h3>
      <ul>
        {history.map((h, i) => (
          <li key={i}>
            {h.status} — {h.updated_by} — {new Date(h.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </>
  );
}