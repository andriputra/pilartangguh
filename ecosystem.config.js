module.exports = {
  apps: [
    {
      name: "pilartangguh",
      cwd: "/opt/pilartangguh/app",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
        // 0.0.0.0 karena Caddy jalan di container (validity-caddy) dan mengakses host
        // lewat IP bridge docker; akses luar diblokir UFW (lihat docs/DEPLOY.md §4).
        HOSTNAME: "0.0.0.0",
      },
      out_file: "/opt/pilartangguh/logs/out.log",
      error_file: "/opt/pilartangguh/logs/error.log",
      time: true,
    },
    {
      // YouTube RSS poller — jalan tiap 30 menit lalu exit (batch job).
      // cwd = checkout sumber (punya node_modules + .env), bukan folder standalone.
      name: "pilartangguh-poller",
      cwd: "/opt/pilartangguh/src",
      script: "scripts/poll-youtube.mjs",
      cron_restart: "*/30 * * * *",
      autorestart: false,
      watch: false,
      out_file: "/opt/pilartangguh/logs/poller-out.log",
      error_file: "/opt/pilartangguh/logs/poller-error.log",
      time: true,
    },
  ],
};
