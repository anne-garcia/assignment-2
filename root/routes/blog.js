import express from 'express';
import axios from 'axios';
import { IsAuthenticated } from '../helpers/auth.js'

const potatoPics = [
    "https://cdn.mos.cms.futurecdn.net/iC7HBvohbJqExqvbKcV3pP.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/1200px-Patates.jpg",
    "https://i5.walmartimages.ca/images/Enlarge/094/507/6000200094507.jpg",
    "https://assets.bonappetit.com/photos/5b106867cb25b938fafaaaca/4:3/w_2912,h_2184,c_limit/perfect-baked-potato.jpg",
    "https://cdn-prod.medicalnewstoday.com/content/images/articles/280/280579/potatoes-can-be-healthful.jpg",
    "https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_1:1/k%2FPhoto%2FRecipe%20Ramp%20Up%2F2021-07-Loaded-Baked-Potato%2FLoaded_Baked_Potato2",
    "https://tmbidigitalassetsazure.blob.core.windows.net/rms3-prod/attachments/37/1200x1200/Cheese---Herb-Potato-Fans_exps67750_TH132104A06_28_7bC_RMS.jpg",
    "https://www.foodnetwork.com/content/dam/images/food/fullset/2003/9/29/0/ig1a07_roasted_potatoes.jpg",
    "https://static.onecms.io/wp-content/uploads/sites/19/2018/02/13/red-yukon-gold-potatoes-difference-2000.jpg",
    "https://ichef.bbci.co.uk/childrens-responsive-ichef-live/r/720/1x/cbbc/bp-potato-or-potaNO-quiz.jpg",
    "https://cdn.britannica.com/08/194708-050-56FF816A/potatoes.jpg",
    "https://imagesvc.meredithcorp.io/v3/mm/image?q=60&c=sc&rect=0%2C167%2C2000%2C1167&poi=%5B1000%2C599%5D&w=2000&h=1000&url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F44%2F2022%2F02%2F28%2Fare-sprouted-potatoes-ok-safe-to-eat.jpg",
    "https://hips.hearstapps.com/hmg-prod/images/delish-roasted-potatoes-vertical-1-1540492242.jpg",
    "https://stemgeneration.org/wp-content/uploads/2018/03/Potato_Battery_Main.jpg"
]

function GetRandomPotatoPic () {
    const randomIndex = Math.floor(Math.random() * potatoPics.length);
    return potatoPics[randomIndex];
}

export function BlogRouter(mod_db) {

    // We create and return this object that contains all the routes we set up right here, hence using "router.get" and not "app.get".
    // Let's us segreagate route code into different files based on type.
    const router = express.Router();

    // CREATION/VIEWING -------------------------------

    router.get('/', async (req, res) => {
        console.log(`Route get /`);

        const articles = await mod_db.GetArticles();
        // console.log(`Articles found`, articles);

        res.render('main/pg_home', {
            user: res.locals.user,
            docArr_articles: articles
        });
    });

    router.get('/articleCreate', IsAuthenticated, async (req, res) => {
        console.log(`Route get /articleCreate`);

        res.render('blog/pg_articleEdit', {
            user: res.locals.user,
            header: "Create",
            route: '/articleCreate',
            method: 'POST', // * CAPS REQ'D
            headline: "",
            subHead: "",
            content: ""
        });
    });

    router.post('/articleCreate', IsAuthenticated, async (req, res) => {
        console.log("Route post /articleCreate, req.body:", req.body);

        const data = req.body;
        delete data['articleId']; // Empty here anyway, passed up for Edit functionality
        
        // Images grabbed from users are just local image names, not sent to server or saved to databse, just use random cat gifs for now.
        // data['image'] = await axios.get('https://thecatapi.com/api/images/get?format=src&type=gif').then(resp => resp.request?.res.responseUrl);
        data['image'] = GetRandomPotatoPic();

        const addConfirm =  await mod_db.AddNewArticle(data, res.locals.user.id);
        // console.log(addconfirm);

        res.send(!!addConfirm.insertedId);
    });

    // Even though the home page has the articles, I think I still have to direct this route through a subfolder or it'll catch all the other router calls as "articleId".
    router.get('/articles/:articleId', async (req, res) => {
        console.log(`Route get /articles/:articleId <${req.params['articleId']}>`);

        const isValidId = await mod_db.IsObjectId(req.params['articleId']);

        if(!isValidId) {
            res.end();
            return;
        }

        const article = await mod_db.GetArticle(req.params['articleId']);
        // console.log(`Single article found`, article);

        res.render('blog/pg_articleDisplay', {
            user: res.locals.user,
            doc_Article: article            
        });
    });

    // EDITING -------------------------------

    router.get('/articleEdit/:articleId', IsAuthenticated, async (req, res) => {
        console.log(`Route get /articleEdit/:articleId <${req.params['articleId']}>`);
        
        const isValidId = await mod_db.IsObjectId(req.params['articleId']);

        if(!isValidId) {
            res.end();
            return;
        }

        // Get the article to pass into the edit form used to originally create it.
        const article = await mod_db.GetArticle(req.params['articleId']);
        //console.log("- article:", article);

        res.render('blog/pg_articleEdit', {
            user: res.locals.user,
            header: "Edit",
            route: `/articles/${req.params['articleId']}`,
            method: 'PATCH', // * CAPS REQ'D
            headline: article.headline,
            subHead: article.subHead,
            content: article.content
        });
    });

    router.patch('/articles/:articleId', IsAuthenticated, async (req, res) => {
        console.log(`Route patch /articles/:articleId <${req.params['articleId']}>, req.body:`, req.body);

        const isValidId = await mod_db.IsObjectId(req.params['articleId']);

        if(!isValidId) {
            res.end();
            return;
        }

        const data = req.body;

        // Images grabbed from users are just local image names, not sent to server or saved to databse, just use random cat gifs for now.
        // If an "image" (filename) exists, we'll presume it was "editted" and change it. Hence, new cat gif.
        if(data['image']) {
            // data['image'] = await axios.get('https://thecatapi.com/api/images/get?format=src&type=gif').then(resp => resp.request?.res.responseUrl);
            data['image'] = GetRandomPotatoPic();
        }
        // Otherwise remove the key, keep what's there.
        else {
            delete data['image'];
        }

        const updateConfirm =  await mod_db.UpdateArticle(data, req.params['articleId']);
        // console.log(`- updateConfirm:`, updateConfirm);

        // Using "acknowledged", because the upadate con be "successful" even with nothing changed.
        res.send(updateConfirm.acknowledged);
    });

    // DELETION -------------------------------

    router.delete('/articles/:articleId', IsAuthenticated, async (req, res) => {
        console.log(`Route delete /articles/:articleId <${req.params['articleId']}>`);

        const isValidId = await mod_db.IsObjectId(req.params['articleId']);

        if(!isValidId) {
            res.end();
            return;
        }

        const deleteConfirm = await mod_db.DeleteArticle(req.params['articleId']);
        // console.log(`Deleted article:`, deleteConfirm);

        res.send(deleteConfirm.deletedCount == 1);
    });


    return router;
}