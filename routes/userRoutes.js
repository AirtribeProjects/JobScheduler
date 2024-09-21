const express = require('express');
const router = express.Router();
const userController = require('../Controller/userController');
//const verifyToken = require('../middleware/authJWT');


// Route for user registration
router.post('/register', userController.registerUser);

// Route for user login
router.post('/login', userController.loginUser);

//Route for get user profile
//router.get('/profile', verifyToken, userController.getProfile);

module.exports = router;