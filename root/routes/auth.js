import express from 'express';
import crypto from 'crypto';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import axios from 'axios';
import { IsAuthenticated } from '../helpers/auth.js'

// These parameters are just recommended by the library creators.
const passwordSaltIterations = 310000;
const passwordByteLength = 32;
const passwordDigest = 'sha256'; // No idea what this is.

export function AuthRouter(mod_db) {

    // We create and return this object that contains all the routes we set up right here, hence using "router.get" and not "app.get".
    // Let's us segreagate route code into different files based on type.
    const router = express.Router();

    // Setup session middleware
    const sessionMiddleware = session({
        secret: "jknefcohs08utw49ujf9ugrg90", // Random right now, change later
        resave: false, // Session only saved once, then make a new cookie
        saveUninitialized: false,
        // Added mongo storage for persistent sessions on front end - no longer getting logged out every time I refesh the page!
        store: MongoStore.create({
            client: mod_db.mongoClient,
            dbName: mod_db.dbName
        })
    });

    router.use(sessionMiddleware)

    // ? Not required?
    router.use(passport.initialize());
    // Tells passport to look for session information in express
    router.use(passport.authenticate('session'));

    // Placement is key, "next" points to routes that comes after this in the module/file.
    // We're just checking if we have user data from the session, and if we do, passing it along to the varous routes that follow.
    router.use((req, res, next) => {
        if(req.user) {
            res.locals.user = req.user;
        }
        next();
    });

    // This will get called every time the login form is submitted, which is where the verify params will come from.
    passport.use(
        new LocalStrategy(
            // Verification
            async (username, password, callback) => {
                // console.log(`Passport verification, username <${username}>, password <${password}>`);

                // Find user in database
                const foundUser = await mod_db.GetUserByName(username).catch(err => {
                    if(err) {
                        return callback("Username could not be found in database", null);
                    }
                });

                // Even if we don't get an error, we might still just get no user found.
                if(!foundUser) {
                    return callback("Username could not be found in database", null);
                }

                // Generate password hash
                // Need to be put in promise, or was firing after main function already finished.
                const passCorrect = await new Promise((resolve, reject) => {
                    crypto.pbkdf2(password, foundUser.salt, passwordSaltIterations, passwordByteLength, passwordDigest, (err, hashPass) => {
                        const hashPassHexStr = hashPass.toString('hex');
                        // console.log(`Comparing passwords, foundUser.password <${foundUser.password}>, hashPass <${hashPassHexStr}>, match <${foundUser.password === hashPassHexStr}>`);
                        
                        // Compare generated hash to found user's hash.
                        resolve(foundUser.password === hashPassHexStr);
                    });
                });

                if(!passCorrect) {
                    return callback("Incorrect password", null);
                }

                // console.log(`Passport verification, foundUser:`, foundUser);
                return callback(null, foundUser);
            }
        )
    );

    // Serialze - save the cookie
    passport.serializeUser((user, callback) => {
        // console.log(`passport serializeUser user`, user);
        return callback(null, { 
            id:user.id,
            username: user.username
        });
    });

    // Deserialize - pull information to verify password
    passport.deserializeUser((user, callback) => {
        // console.log(`passport deserializeUser user`, user);
        return callback(null, user);
    });

    router.get('/register', (req, res) => {
        res.render('auth/pg_register', { user: res.locals.user });
    });

    router.get('/login', (req, res) => {
        res.render('auth/pg_login', { user: res.locals.user });
    });

    router.get('/logout', (req, res, next) => {
        req.logout(err => {
            if(err) {
                next(err);
                return;
            }
            res.redirect('/');
        });
    });

    router.post('/register', async (req, res) => {

        // Capture information from client
        const data = req.body;
        // console.log(`Registered route called with body data:`, data);        

        // Images grabbed from users are just local image names, not sent to server or saved to databse, just use random cat gifs for now.
        // If no image supplied, a generic grey avatar will be used
        // ? This conflicts with the instruction that all fields must be filled out, but whatever.
        if(data['profileImage']) {
            data['profileImage'] = await axios.get('https://thecatapi.com/api/images/get?format=src&type=gif').then(resp => resp.request?.res.responseUrl);
        }
        
        // Creat this object to help the password serialization randomization process
        const salt = crypto.randomBytes(16).toString('hex');

        // Create a new promise so as to await the password serialization, which is given to use through a callback.
        const hashedPass = await new Promise((resolve, reject) => {
            crypto.pbkdf2(data['password'], salt, passwordSaltIterations, passwordByteLength, passwordDigest, (err, hashPass) => {
                resolve(hashPass);
            });
        });
        delete data['password'];

        // Register the user.
        const user = await mod_db.RegisterUser(data, hashedPass.toString('hex'), salt);
        // console.log(`Registered user and logging into passport: id <${user.insertedId.toString()}>, username <${data.username}>`);

        // Passport adds the req.login function, handling session storage - very convenient.
        await new Promise((resolve, reject) => {
            // console.log(`Post register with req:`, req);
            req.login({ id: user.insertedId.toString(), username: data['username'] }, (err) => {
                if(err) {
                    console.err(err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });

        // Once the user has been logged in, send them back to the main route, which will now have their login details to use.
        res.send(!!user.insertedId);
    });

    router.post('/login', async (req, res, next) => {
        // console.log(`Post login with req.body:`, req.body);

        // This will use evrything that's been created near the top, passing the client data into the verification system, deserializing the cookie.
        // This returns a route callback, which we'll call immediately after with our route params. 
        const RouteCB = passport.authenticate('local', async(err, user) => {
            // console.log(`Login using passport.authenticate to get user:`, user);

            // If something went wrong, go back to the login form and exit function.
            if(err || !user) {
                res.redirect('/login');
                return;
            }

            await new Promise((resolve, reject) => {
                // console.log(`Post login with req:`, req);
                req.login({ id: user._id.toString(), username: user.username }, (err) => {
                    if(err) {
                        console.err(err);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });

            res.redirect('/');
        });

        RouteCB(req, res, next);        
    });

    // EDITING -------------------------------

    router.get('/modifyAccount', IsAuthenticated, async (req, res) => {
        console.log(`Route get /modifyAccount <${res.locals.user?.id}>`);

        // Get the user to pass into the edit form used to originally create it.
        const doc_User = await mod_db.GetUserById(res.locals.user?.id);
        // console.log("- user document:", doc_User);
        delete doc_User['profileImage'];
        delete doc_User['password'];
        delete doc_User['salt'];

        res.render('auth/pg_modAccount', {
            user: res.locals.user,
            doc_User: doc_User
        });
    });

    router.patch('/modifyAccount', IsAuthenticated, async (req, res) => {
        console.log(`Route patch /modifyAccount <${res.locals.user?.id}>, req.body:`, req.body);

        const data = req.body;

        // Images grabbed from users are just local image names, not sent to server or saved to databse, just use random cat gifs for now.
        // If no image supplied, a generic grey avatar will be used
        // ? This conflicts with the instruction that all fields must be filled out, but whatever.
        if(data['profileImage']) {
            data['profileImage'] = await axios.get('https://thecatapi.com/api/images/get?format=src&type=gif').then(resp => resp.request?.res.responseUrl);
        }

        // * Account modification means a new password as well.

        // Creat this object to help the password serialization randomization process
        const salt = crypto.randomBytes(16).toString('hex');

        // Create a new promise so as to await the password serialization, which is given to use through a callback.
        const hashedPass = await new Promise((resolve, reject) => {
            crypto.pbkdf2(data['password'], salt, passwordSaltIterations, passwordByteLength, passwordDigest, (err, hashPass) => {
                resolve(hashPass);
            });
        });
        delete data['password'];

        const updateConfirm =  await mod_db.UpdateUser(data, hashedPass.toString('hex'), salt, res.locals.user?.id);
        // console.log(`- updateConfirm:`, updateConfirm);

        // Using "acknowledged", because the upadate con be "successful" even with nothing changed.
        res.send(updateConfirm.acknowledged);

        // * Test confirmed: if the name changes, it changes when loading he associated articles as well.
    });

    // DELETION -------------------------------

    router.delete('/deleteAccount', IsAuthenticated, async (req, res) => {
        console.log(`Route delete deleteAccount <${res.locals.user?.id}>`);

        const deleteConfirmed = await mod_db.DeleteUser(res.locals.user?.id);
        console.log(`Deleted user:`, deleteConfirmed);

        deleteConfirmed && req.session.destroy();
        res.send(deleteConfirmed);
    });

    return router;
}