const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

exports.signup = (req, res, next) => {
    const { email, password } = req.body
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Adresse e-mail invalide' })
    }
    bcrypt.hash(password, 10)
        .then(hash => {
            const user = new User({
                email: email,
                password: hash
    });
    user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé' }))
        .catch(error => res.status(400).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}


exports.login = (req, res, next) => {
    User.findOne({email: req.body.email})
        .then(user => {
            if (user === null) {
                res.status(401).json({message: "Utilisateur/Mot de passe incorrect"})
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            res.status(401).json({message: "Utilisateur/Mot de passe incorrect"})
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id},
                                    "TOKEN_KEY",
                                    {expiresIn: "12h"}
                                )
                            })
                        }
                    })
                    .catch(error => res.status(500).json({error}))
            }
        })
        .catch(error => res.status(500).json({error}))
}