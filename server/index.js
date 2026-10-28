import path from 'node:path';
import { pathToFileURL } from 'node:url';
import app from './app.js';

export default app;

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`CampusConnect API running at http://localhost:${port}`));
}
