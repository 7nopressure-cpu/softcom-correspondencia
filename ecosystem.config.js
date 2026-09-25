module.exports = {
  apps: [
    {
      name: 'softcom-backend',
      cwd: './backend',
      script: './dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'softcom-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      instances: 1,
      autorestart: true
    }
  ]
};
