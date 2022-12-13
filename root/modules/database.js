import { MongoClient, ObjectId } from 'mongodb';

const uri = "mongodb+srv://admin:admin@cluster0.xgp80kf.mongodb.net/?retryWrites=true&w=majority";
export const dbName = "potatoBlog";

export const mongoClient = new MongoClient(uri);

const collections = {
    users: null,
    articles: null
}

export async function Connect() {
    // Connect to database
    await mongoClient.connect();

    // Acquire databse object
    const db = mongoClient.db(dbName);

    // Get just the existing names.
    let collNames = await db.listCollections({}, { nameOnly: true }).toArray();
    collNames = collNames.map(({name}) => name);
    // console.log(`collNames total:`, collNames);

    // Filtering by collection names could make the upcoming name check just a little bit shorter.
    collNames.filter(name => collections[name] != undefined);
    // console.log(`collNames filtered:`, collNames);

    // Go through my set of collection names
    for(const nameKey in collections) {
        collections[nameKey] = await db.collection(nameKey);
    }
    // console.log(`collections:`, collections);

    console.log(`Database connected.`);
}

export async function IsObjectId(stringId) {
    return await ObjectId.isValid(stringId);
}

// USERS

export async function RegisterUser(reqData, hashedPassword, salt) {
    return await collections.users.insertOne({...reqData, password:hashedPassword, salt});
}

export async function UpdateUser(reqData, hashedPassword, salt, userId) {
    const userObjectId = new ObjectId(userId);
    return await collections.users.updateOne({ _id: userObjectId }, { $set: { ...reqData, password:hashedPassword, salt }});
}

export async function GetUserById(userId) {
    const objectId = new ObjectId(userId);
    return await collections.users.findOne({ _id: objectId });
}
export async function GetUserByName(username) {
    return await collections.users.findOne({ username });

}

export async function DeleteUser(userId) {
    const objectId = new ObjectId(userId);

    const deleteConfirm = await collections.users.deleteOne({ _id: objectId });
    // Strip userId from authorId field of each article. They can never be removed or deleted.
    const updateConfirm =  await collections.articles.updateMany({ authorId: objectId }, { $set: {authorId: null} });
    console.log(deleteConfirm);
    console.log(updateConfirm);

    // Might not change any articles.
    return deleteConfirm.deletedCount == 1 && updateConfirm.acknowledged;
}

// ARTICLES

export async function AddNewArticle(reqData, authorId) {
    const authorObjectId = new ObjectId(authorId);
    return await collections.articles.insertOne({...reqData, authorId:authorObjectId});
}

export async function UpdateArticle(reqData, articleId) {
    const articleObjectId = new ObjectId(articleId);
    return await collections.articles.updateOne({ _id: articleObjectId }, { $set: reqData });
}

// Common aggregation objects

// Use this to grab the user information from the given author id attached to each article
const aggLookup = {
    $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "author"
    }
};

// This breaks down the user array - only 1 entry anyway.
const aggUnwind = {
    $unwind: {
        path: "$author",
        preserveNullAndEmptyArrays: true
    }
};

// Exclude all of the following fields
const aggProject = {
    $project: {
        "_id": 1,
        "headline": 1,
        "subHead": 1,
        "image": 1,
        "content": 1,
        "authorId": 1,
        "author.firstName": 1,
        "author.lastName": 1,
        "author.profileImage": 1,
        // Get formated date from the _id
        "creationDate": {
            $dateToString: {
                format: "%Y-%m-%d", 
                date: { $toDate: "$_id" }
            }
        }
    }
};

export async function GetArticles() {
    return await collections.articles.aggregate([aggLookup, aggUnwind, aggProject]).toArray();
}
export async function GetArticle(articleId) {
    const objectId = new ObjectId(articleId);

    // Add in filtration for the one article I need.
    const aggMatch = {
        $match: {
            _id: objectId
        }
    };

    // Always only looking for one element, so just pass back index 0.
    const docArr = await collections.articles.aggregate([aggMatch, aggLookup, aggUnwind, aggProject]).toArray();
    return docArr[0];
}

export async function DeleteArticle(articleId) {
    const objectId = new ObjectId(articleId);
    return await collections.articles.deleteOne({ _id: objectId });
}