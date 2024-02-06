const mongoose = require('mongoose');
const dotenv = require('dotenv');

// has to be the other process because its needs to be listening asthe errors occur
//or before
// all errors in the middleware are handled by the  global error handler and
// not the 'uncauhjt execption handler'

// unhandled rejections come from a rejecteion not being fulfiiled/not returning
// the promise object

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! 💥 Shuuting down ');
});

dotenv.config({ path: './config.env' });

const app = require('./app'); // why

// console.log(process.env);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    //console.log(con.connections);
    console.log('DB connected succesfuly');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App Running on port ${port}`);
});

// server.close allows the server to be closed after all resoonses are mnet if
// there is an unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 Shuuting down ');
  server.close(() => {
    process.exit(1);
  });
});

// listen to this term because heroku dynos restarting every 24hrs abruptly
//?? process.on
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefuly');

  server.close(() => {
    console.log('💥 process terminated.');
  });
});

// console.log(c);
