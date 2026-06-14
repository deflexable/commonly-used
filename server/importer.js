import { resolve } from 'path';
import { pathToFileURL } from 'url';

export default (path) => import(pathToFileURL(resolve(process.cwd(), path)).href);