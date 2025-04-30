const express = require('express');
const app = express();
const port = 3000;

const router = express.Router();
router.get('/api/health', (req, res) => {
  res.send('OK');
});

app.use(router);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});