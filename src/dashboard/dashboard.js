async function fetchData() {
  const [recent, models] = await Promise.all([
    fetch('/api/recent').then(r => r.json()),
    fetch('/api/models').then(r => r.json()),
  ]);

  document.getElementById('total').textContent = recent.length;
  document.getElementById('modelCount').textContent = models.models?.length || 0;

  if (recent.length > 0) {
    const avgMs = recent.reduce((a, r) => a + (r.latency_ms || 0), 0) / recent.length;
    document.getElementById('avgLatency').textContent = Math.round(avgMs) + 'ms';

    const counts = {};
    recent.forEach(r => counts[r.model_id] = (counts[r.model_id] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topModel').textContent = top ? top[0] : '—';

    const tbody = document.getElementById('recentBody');
    tbody.innerHTML = recent.map(r => `
      <tr>
        <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
        <td>${r.model_id}</td>
        <td><span class="tag">${r.task_type || '?'}</span></td>
        <td>${r.latency_ms ? r.latency_ms + 'ms' : '—'}</td>
        <td>${r.toks_per_sec ? r.toks_per_sec + ' t/s' : '—'}</td>
      </tr>`).join('');
  }
}

fetchData();
setInterval(fetchData, 5000);
