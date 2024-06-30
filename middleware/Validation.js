const { check } = require('express-validator')

exports.signUpValidation = [
  check('firstname', 'First Name is required').not().isEmpty(),
  check('lastname', 'Last Name is required').not().isEmpty(),
  check('email', 'Please enter a valid email').isEmail(),
  check('password', 'Password is required and should be at least 5 characters').isLength({ min: 5 })
];

exports.loginValidation = [
  
  check('email','Please enter a valid email').isEmail(),
   
  check('password','Password is required').isLength({ min:5 }),
]


 