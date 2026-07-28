module.exports = {
  apps: [
    {
      name: 'analytics-dashboard-api',
      cwd: `${__dirname}/server`,
      script: './dist/src/server.js',
      interpreter: '/usr/bin/node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      kill_timeout: 10_000,
      listen_timeout: 10_000,
      time: true,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
    },
  ],
};
