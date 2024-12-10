const mongoose = require('mongoose');

module.exports.dbConnect = async () => {
  try {
    if (process.env.mode === 'pro') {
      await mongoose.connect(process.env.DB_PRO_URL, { useNewUrlParser: true });
      console.log("production database connect....");
    } else {
      await mongoose.connect(process.env.DB_LOCAL_URL, { useNewUrlParser: true });
      console.log("local database connect....");
    }
  } catch (error) {
    console.log(error.message);
  }
};
