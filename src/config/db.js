const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(["8.8.8.8"]);


const connectDatabase = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB Atlas');
};

module.exports = { connectDatabase };
