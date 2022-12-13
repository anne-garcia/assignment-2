import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

// "mod" for "module", just to make it clear I'm referencing the file's exports, not just any single function of class.
import * as mod_db from './modules/database.js';
import * as mod_auth from './routes/auth.js';
import * as mod_blog from './routes/blog.js';

// CONSTANTS ------------------------------

const port = process.env.PORT || 3000;
const app = express();

// SERVER LISTEN ------------------------------

app.listen(port, async () => {
    await mod_db.Connect();
    console.log(`Assignment 2 app listening on port ${port}!`);
});

// SETUP ------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'ejs');

// SEND CLIENT FOLDER ON EVERY REQUEST ------------------------------

app.use(express.static(path.join(__dirname, 'client')));

// ROUTES ------------------------------
// All the routes fetched from the given modules/files will use whatever path they establish themselves, despite the "/" denoted here.
// Important that AuthRouter comes first, since it handle the session that's subsequently used by all following routes.

app.use('/', mod_auth.AuthRouter(mod_db));
app.use('/', mod_blog.BlogRouter(mod_db));

// Invalid route
app.get('*', (req, res) => {
    res.render('main/pg_404', { user: res.locals.user });
});