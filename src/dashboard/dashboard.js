async function fetchData() {
  try {
    const [recent, models, benchmarks, memory] = await Promise.all([
      fetch('/api/recent').then(r => r.json()),
      fetch('/api/models').then(r => r.json()),
      fetch('/api/benchmarks').then(r => r.json()),
      fetch('/api/memory').then(r => r.json()).catch(() => null)
    ]);

    // Update Top Level Stats
    document.getElementById('total').textContent = recent.length || 0;

    if (recent.length > 0) {
      const avgMs = recent.reduce((a, r) => a + (r.latency_ms || 0), 0) / recent.length;
      document.getElementById('avgLatency').textContent = Math.round(avgMs);

      const counts = {};
      recent.forEach(r => counts[r.model_id] = (counts[r.model_id] || 0) + 1);
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      document.getElementById('topModel').textContent = top ? top[0] : '—';

      const tbody = document.getElementById('recentBody');
      tbody.innerHTML = recent.map(r => `
        <tr>
          <td style="color: var(--text-muted)">${new Date(r.timestamp).toLocaleTimeString()}</td>
          <td style="font-weight: 500">${r.model_id}</td>
          <td><span class="tag">${r.task_type || 'unknown'}</span></td>
          <td>${r.latency_ms ? r.latency_ms + ' ms' : '—'}</td>
          <td class="text-green">${r.toks_per_sec ? r.toks_per_sec.toFixed(1) + ' t/s' : '—'}</td>
        </tr>`).join('');
    }

    // Update Benchmarks Table
    if (benchmarks && benchmarks.length > 0) {
      const tbodyBench = document.getElementById('benchmarksBody');
      tbodyBench.innerHTML = benchmarks.map(b => `
        <tr>
          <td style="font-weight: 500">${b.model_id}</td>
          <td class="text-green">${b.avg_toks_sec ? b.avg_toks_sec.toFixed(2) + ' t/s' : '—'}</td>
          <td style="color: var(--text-muted)">${b.request_count}</td>
        </tr>`).join('');
    }

    // Update Memory Visuals
    if (memory) {
      const pressure = memory.pressure_pct || 0;
      const memEl = document.getElementById('memPressure');
      const barEl = document.getElementById('memBar');

      memEl.textContent = pressure;
      barEl.style.width = `${Math.min(pressure, 100)}%`;
      barEl.setAttribute('aria-valuenow', pressure);
      document.getElementById('memAvail').textContent = memory.available_gb?.toFixed(1) || '—';

      // Update colors based on thresholds
      memEl.className = '';
      barEl.className = 'memory-bar';

      if (pressure > 85) {
        memEl.classList.add('text-red');
        barEl.classList.add('bg-red');
      } else if (pressure > 70) {
        memEl.classList.add('text-yellow');
        barEl.classList.add('bg-yellow');
      } else {
        memEl.classList.add('text-green');
        barEl.classList.add('bg-green');
      }
    }

  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
}

// Initial fetch and poll every 3 seconds
fetchData();
setInterval(fetchData, 3000);
