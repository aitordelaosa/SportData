const { mongo } = require('./env');

function dbUri() {
  return mongo.uri;
}

module.exports = {
  dbUri,
};
