import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "helpdesk_it",
  port: 3306,
});

export default db;
export { db };