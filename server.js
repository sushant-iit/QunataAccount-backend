const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

//Configuring dotenv File:
dotenv.config({ path: './config.env' });

//DATABASE Connection:
mongoose
  .connect(
    process.env.DATABASE_URL.replace(
      '<password>',
      process.env.DATABASE_PASSWORD
    ),
    {
      useCreateIndex: true,
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('Database connected Successfully...');
  });

//Starting the Server:
app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}...`);
});
