const User = require("../Models/userModel");
const userUtils = require("../Utils/userUtils")
const jwt = require("jsonwebtoken");
const { registerUser,loginUser} = require('../services/userServices');
require('dotenv').config();

// Controller functions for user related actions

const userController = {
    /**
    * Registers a new user with the provided username, email, and password.
    */
    registerUser: async(req,res) => {
       
        try {
            const userInfo = req.body;

            const { userName, emailId, password } = req.body;

            if (userUtils.validateUserDetails(userInfo).status == true) {
                let existingUser = await User.findOne({ emailId });
                if (existingUser) {
                  return res.status(400).json({ message: 'User already exists' });
                }
                await registerUser(userInfo);
                res.status(201).json({ message: 'User registered successfully' });
            } else {
                let message = userUtils.validateUserDetails(userInfo).message;
                return res.status(400).send(message);
            }
        } catch (error) {
            res.status(500).json({ message: 'Error occured while user creation' + error });
        }
    },
    /*
        Logs in user with the provided correct username and password.
    */
    loginUser: async(req,res) => {

        try {
            const {userName,password} = req.body;
            if(userUtils.validateLoginDetails(req.body).status == true) {
                const user = await User.findOne({userName});
                if(!user){
                    res.status(401).json({message: 'Invalid User name'});
                }
                const isPassowrdValid = await loginUser(password,user.password);
                if(!isPassowrdValid) {
                    res.status(401).json({message: 'Incorrect Password'});
                }
               const payload = {userId: user.id,role:user.role};
                // Generate JWT token
                const token = jwt.sign(payload, process.env.SECRET_KEY);
                res.status(200).json({ userId: user.id, token });
            } else {
                let message = userValidator.validateLoginDetails(req.body).message;
                return res.status(400).send(message);
            }
        } catch (error){
            res.status(500).json({ message: 'Error occured while user login' + error });
        }
    },
    /*
    get user profile of the loged in user
    */
    getProfile : async (req, res) => {
        try {
          const user = await getProfile(req.user.userId);
          res.json(user);
        } catch (err) {
          console.error(err.message);
          res.status(500).send('Server error');
        }
      }
}

module.exports = userController;