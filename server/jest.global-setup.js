const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "test.db");
const absoluteDbUrl = `file:${dbPath}`;
const envPath = path.join(__dirname, ".env");

module.exports = async function () {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = absoluteDbUrl;

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // Temporarily swap .env so Prisma CLI and Prisma Client use the test database
  let originalEnv = "";
  if (fs.existsSync(envPath)) {
    originalEnv = fs.readFileSync(envPath, "utf-8");
    fs.writeFileSync(
      envPath,
      `PORT=8000\nDATABASE_URL="${absoluteDbUrl}"\n`
    );
  }

  try {
    execSync("npx prisma db push --skip-generate --force-reset", {
      stdio: "inherit",
    });

    execSync("npx ts-node prisma/seed.ts", {
      stdio: "inherit",
    });
  } finally {
    if (originalEnv) {
      fs.writeFileSync(envPath, originalEnv);
    }
  }
};
