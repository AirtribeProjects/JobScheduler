const { mongoose } = require("mongoose")

const connectToDB = async () => {

    try {
        await mongoose.connect(process.env.MONGO_DB_URI, {});
        console.log("connected to db successfully")
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = connectToDB