const { mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
        userName: { type: String, required: true, unique: true },
        emailId: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
    }, { timestamps: true });
    

// Create a model
const User = mongoose.model('User', userSchema);
module.exports = User;