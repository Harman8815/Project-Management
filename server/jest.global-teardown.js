const fs = require("fs");
const path = require("path");

module.exports = async function () {
  const dbPath = path.join(__dirname, "test.db");
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const walPath = path.join(__dirname, "test.db-wal");
  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }

  const shmPath = path.join(__dirname, "test.db-shm");
  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }
};
