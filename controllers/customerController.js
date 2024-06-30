const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbConnection')
const jwt = require('jsonwebtoken');
const { JWT_SECRETKEY } = process.env;
const transporter = require('../config/nodemailer')


const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, email, password } = req.body;

    // try {
         const sql = "SELECT * FROM customers WHERE email = ?";
        db.query(sql, [req.body.email], async (err, data) => {
           // if (err) return res.status(500).json({ error: 'Database error' });
            if (data.length > 0) {
                return res.status(409).json({ message: "User already registered" });
            }

             const hashedPassword = await bcrypt.hash(req.body.password, 10);

             const sql1 = 'INSERT INTO customers (firstname, lastname, email, password) VALUES (?, ?, ?, ?)';
            db.query(
                sql1, [req.body.firstname, req.body.lastname, req.body.email, hashedPassword],
                (err, data) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    return res.status(201).json({ message: 'User registered successfully' });
                }
            );
        });
    // } catch (error) {
    //     console.error(error);
    //     return res.status(500).json({ error: 'Database error' });
    // }
};

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
         const sql = "SELECT * FROM customers WHERE email = ?";
        db.query(sql, [req.body.email], (err, data) => {
            if (err) return res.json("Login Failed");
            if (!data.length) {
                return res.status(401).json({ error: 'User not found' });
            }

            bcrypt.compare(password, data[0].password, (err, isMatch) => {
                if (err) {
                    return res.status(500).json({ error: 'Error comparing passwords' });
                }
                if (isMatch) {
                    jwt.sign(
                        { id: data[0].id },
                        JWT_SECRETKEY,
                        { expiresIn: '5m' },
                        (err, token) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error in signing token' });
                            }
                            return res.status(200).json({
                                token,
                                msg: "Login successful",
                                user: data[0]
                            });
                        }
                    );
                } else {
                    return res.status(401).json({ error: 'Incorrect password' });
                }
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
};

const sendResetPasswordmail = async (req, res) => {



    const { email } = req.body;

    const sql = "SELECT * FROM customers WHERE email = ?";
    db.query(sql, [req.body.email], async (err, data) => {
        if (err) return res.json("Database error", err);
        if (!data.length) {
            return res.status(401).json({ error: 'User not found' });
        }

        const secret = data[0].id + process.env.JWT_SECRETKEY;
        console.log(data[0].name);
        const token = jwt.sign({ customer_id: data[0].id }, secret, { expiresIn: '5m' });
        const link = `http://localhost:4500/forgotpassword/${data[0].id}/${token}`;

        console.log("Link:====>", link);

        var mailOptions = {
            from: process.env.EMAIL_USER,
            to: data[0].email,
            subject: "Reset Password",
            text: "Link for Password Reset",
            html: `<h3>Hii ${data[0].firstname}, Please copy this link <a href="${link}"> and reset your password</a></h3>`
        };

        try {[ ]
            let info = await transporter.sendMail(mailOptions);
            console.log("Email sent: " + info.response);
            return res.status(200).json({
                message: 'Email sent successfully',
                link: link
            });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to send email' });
        }
    });
};


const resetPassword = (req, res) => {
    const { password, confirm_password } = req.body;
    const { id, token } = req.query;
    try {
        const sql = "SELECT * FROM customers WHERE id = ?";
        db.query(sql, [id], async (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (data.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const customer_id = data[0].id;
            const new_secret = customer_id + process.env.JWT_SECRETKEY;

            try {
                const decodedCustomerId = jwt.verify(token, new_secret);

                if (password && confirm_password) {
                    if (password !== confirm_password) {
                        return res.status(400).json({
                            success: false,
                            msg: "New Password and Confirm Password don't match",
                        });
                    } else {
                        const newHashPassword = await bcrypt.hash(password, 10);


                        db.query(
                            'UPDATE customers SET password = ? WHERE id = ?',
                            [newHashPassword, customer_id],
                            async (updateErr, updateResult) => {
                                if (updateErr) {
                                    return res.status(500).json({ error: 'Failed to update password' });
                                } else {
                                    return res.status(200).json({
                                        success: true,
                                        msg: "Password reset successfully",
                                    });
                                }
                            }
                        );
                    }
                } else {
                    return res.status(400).json({ error: 'Password and Confirm Password are required' });
                }
            } catch (jwtError) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        }
        );
    } catch (catchErr) {
        return res.status(500).json({ error: 'Failed to reset password' });
    }
}

module.exports = {
    register,
    login,
    sendResetPasswordmail,
    resetPassword
}
