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
        HOSTNAME: "127.0.0.1",
      },
      out_file: "/opt/pilartangguh/logs/out.log",
      error_file: "/opt/pilartangguh/logs/error.log",
      time: true,
    },
  ],
};
