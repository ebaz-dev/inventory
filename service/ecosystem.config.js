const { PORTS, ENVS } = require("@ebazdev/core");

module.exports = {
  apps: [
    {
      name: "inventory",
      script: "./build/index.js",
      instances: 1,
      exec_mode: "cluster",
      env_development: {
        NODE_ENV: "development",
        PORT: PORTS.DEV.Inventory,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID
          ? `inventory-service-${process.env.PM2_INSTANCE_ID}`
          : "inventory-service",
        ...ENVS.DEV,
      },
      env_stag: {
        NODE_ENV: "stag",
        PORT: PORTS.STAG.Inventory,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID
          ? `inventory-service-${process.env.PM2_INSTANCE_ID}`
          : "inventory-service",
        ...ENVS.STAG,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORTS.DEV.Inventory,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID
          ? `inventory-service-${process.env.PM2_INSTANCE_ID}`
          : "inventory-service",
        ...ENVS.PROD,
      },
    },
  ],
};
