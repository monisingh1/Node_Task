const express = require('express');
const {signUpValidation, loginValidation} = require('../middleware/Validation');
const userController = require('../controllers/customerController');
const router = express.Router();

router.post('/resetPassword', userController.resetPassword);
router.post('/sendMailToResetPassword',userController.sendResetPasswordmail);
router.post('/register', signUpValidation, userController.register);
router.post('/login', loginValidation, userController.login);

module.exports = router;