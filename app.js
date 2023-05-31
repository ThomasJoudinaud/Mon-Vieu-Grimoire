const express = require('express')
const cors = require('cors')
const mongoose = require("mongoose")
const bookRoutes = require("./routes/book")
const userRoutes = require("./routes/user")
const path = require("path")
const rateLimit = require("express-rate-limit")
const app = express()

mongoose.connect('mongodb+srv://thomas:opc@cluster0.j0vxr04.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content', 'Accept', 'Content-Type', 'Authorization'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 10*16*1000,
  max: 100,
  message: "Vous avez atteint le nombre de requête maximale."
})

app.use("/api/books", bookRoutes)
app.use("/api/auth", limiter, userRoutes)
app.use("/images", express.static(path.join(__dirname, 'images')))

module.exports = app