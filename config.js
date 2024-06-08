const mongoose = require('mongoose');

async function mongooseConnect() {
    await mongoose.connect(`mongodb+srv://shubhsemwal12:${encodeURIComponent('Semwal@12')}@cluster0.cbza67r.mongodb.net/pintmernclone?retryWrites=true&w=majority&appName=Cluster0`, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000
    }).then(() => {
        console.log("CONNECTED");
    }).catch((err) => console.log(err, `not connect`));
}

exports.mongooseConnect = mongooseConnect;
