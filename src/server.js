require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(["8.8.8.8"]);
const app = require('./app');
const { connectDatabase } = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
