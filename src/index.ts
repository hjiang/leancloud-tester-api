import express from 'express';
import https from 'https';
import fs from 'fs';
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
var cors = require('cors')
import { Pool } from 'pg';

const app = express();
const connectionString = process.env.PG_URI || 'postgres://localhost/leancloud_tests';
const pgPool = new Pool({ connectionString });

app.options('*', cors())
app.use(cors())

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/tests/', async (_, res) => {
  const results = await pgPool.query(
    `SELECT * from latest_results;`);
  const jsonResponse = results.rows.map(row => {
    return {
      id: row.result_id,
      name: row.test_name,
      passed: row.is_successful,
      updatedAt: row.time
    }
  });
  res.json(jsonResponse);
});

const getRecentDowntimes = async (name: string, limit: number) => {
  const dbResult = await pgPool.query(`
    SELECT * FROM downtimes WHERE test_name= $1 ORDER BY id DESC LIMIT $2;`,
    [name, limit]);
  return dbResult.rows.map(row => {
    return {
      id: row.id,
      startResultId: row.start_result_id,
      startTime: row.start_time,
      endResultId: row.end_result_id,
      endTime: row.end_time
    };
  });
};

app.get('/api/tests/:name/downtimes/latest', async (req, res) => {
  res.json(await getRecentDowntimes(req.params.name, 1));
});

app.get('/api/tests/:name/downtimes/', async (req, res) => {
  res.json(await getRecentDowntimes(req.params.name, 100));
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

app.get('/api/tests/:name/failures/', async (req, res) => {
  const results = await pgPool.query(
    `SELECT * FROM results WHERE test_name = $1 AND is_successful = false
    ORDER BY id DESC LIMIT 100;`,
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

const port = process.env.HTTP_PORT || 4000;
app.listen(port, () => {
  console.log(`HTTP listening on port ${port}`)
});

if (process.env.SSL_KEY && process.env.SSL_CERT) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT)
  };
  const httpsPort = process.env.HTTPS_PORT || 4040;
  https.createServer(options, app).listen(httpsPort, () => {
    console.log(`HTTPS listening on port ${httpsPort}`);
  });
}
