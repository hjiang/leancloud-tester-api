import express from 'express';
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import { Pool } from 'pg';

const app = express();
const connectionString = process.env.PG_URI || 'postgres://localhost/leancloud_tests';
const pgPool = new Pool({ connectionString });

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/tests/', async (_, res) => {
  const results = await pgPool.query(
    `WITH ranked_results AS (SELECT *, row_number() OVER
      (PARTITION BY test_name ORDER BY id DESC) as rn FROM results)
      SELECT * from ranked_results where rn = 1;`);
  const jsonResponse = results.rows.map(row => {
    return {
      id: row.id,
      name: row.test_name,
      passed: row.is_successful,
      updatedAt: row.created_at
    }
  });
  res.json(jsonResponse);
});

app.get('/api/tests/:name/results/', async (req, res) => {
  const results = await pgPool.query(
    `SELECT * FROM results WHERE test_name = $1 ORDER BY id DESC LIMIT 100;`,
    [req.params.name]
  );
  const jsonResponse = results.rows.map(row => { 
    return {
      id: row.id,
      passed: row.is_successful,
      finishedAt: row.created_at,
      info: row.info
    };
  });
  res.json(jsonResponse);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});
