const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let db = null;

const InitialServerAndClient = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Running"));
  } catch (error) {
    console.log(`${error.message}`);
    process.exit(1);
  }
};
InitialServerAndClient();
const validate = (password) => {
  return password.length > 4;
};
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const HashPassword = await bcrypt.hash(password, 10);
  const Query1 = `
  SELECT *
  FROM user
  WHERE username = '${username}';`;
  const dbUser = await db.get(Query1);

  if (dbUser === undefined) {
    const AddUser = `
        INSERT INTO 
        user (username, name, password, gender, location)
        VALUES ('${username}', '${name}', '${HashPassword}', '${gender}', '${location}')
        ;`;
    if (password.length > 4) {
      await db.run(AddUser);

      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const Query2 = `
  SELECT 
  *
  FROM 
  user
  WHERE username = '${username}';`;

  const checkUserExist = await db.get(Query2);
  if (checkUserExist === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparingPassword = await bcrypt.compare(
      password,
      checkUserExist.password
    );
    if (comparingPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const Query3 = `
  SELECT 
  *
  FROM 
  user
  WHERE username = '${username}';`;

  const checkUser = await db.get(Query3);
  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const checkOldPassword = await bcrypt.compare(
      oldPassword,
      checkUser.password
    );
    if (checkOldPassword === true) {
      if (newPassword.length > 4) {
        const Encrypted = await bcrypt.hash(newPassword, 10);
        const update = `
        UPDATE user 
        SET 
        password = '${Encrypted}'
        WHERE username = '${username}';`;

        await db.run(update);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
