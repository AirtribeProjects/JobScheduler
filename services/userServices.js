const User = require("../Models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const registerUser = async(userInfo) => {
    const hashedPassword = await bcrypt.hash(userInfo.password,10);
    const role = userInfo.role ? userInfo.role : 'user';
    const newUser = new User({
        userName: userInfo.userName,
        emailId: userInfo.emailId,
        password: hashedPassword,
        role: userInfo.role || 'user', 
        created_at: Date.now(),
        updated_at: Date.now(),
    });

    await newUser.save();
    const userData = {
        newUser: {
          id: newUser.id,
        },
      };
      const jwtToken = jwt.sign(userData,process.env.SECRET_KEY,{expiresIn:'2h'}) ;
      return jwtToken;
}

const loginUser = (password, userPassword) => {
    const isPassowrdValid = bcrypt.compareSync(password,userPassword);
    return isPassowrdValid;
}

module.exports = {registerUser, loginUser};