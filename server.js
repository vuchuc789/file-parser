const express = require('express');
const cors = require('cors');
const {
  fileFeatureExtract,
  s3FilesFeatureExtract,
} = require('./file-feature-extractor');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.text({ type: 'application/json' }));

app.post('/file-feature', async (req, res) => {
  try {
    const parsedBody = JSON.parse(req.body);
    const { uri } = parsedBody;
    const fileFeature = await fileFeatureExtract(uri, parsedBody);

    res.status(200).json(fileFeature);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.post('/s3-file-feature', async (req, res) => {
  try {
    const parsedBody = JSON.parse(req.body);
    const { uri } = parsedBody;

    const fileFeatures = await s3FilesFeatureExtract(uri, parsedBody);

    res.status(200).json(fileFeatures);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.all('*', (req, res) => {
  res.status(404).json({ error: '404 not found' });
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
