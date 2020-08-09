const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

//DATABASE Connection
mongoose
  .connect(process.env.DATABASE_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('Database connected Successfully...');
  });

app.listen(3000, () => {
  console.log('Listening on port 3000...');
});
