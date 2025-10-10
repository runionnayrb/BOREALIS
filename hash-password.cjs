const bcrypt = require('bcrypt');

bcrypt.hash('password123', 10).then(hash => {
  console.log(hash);
  process.exit(0);
});
