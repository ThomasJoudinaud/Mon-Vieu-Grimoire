const Book = require("../models/Book")
const fs = require("fs")
const sharp = require("sharp")


exports.addBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book)
    delete bookObject._id
    delete bookObject._userId
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId
    });
    if (req.file) {
      const imagePath = req.file.path
      const resizedImagePath = `images/resized_${req.file.filename}`
      await sharp(imagePath)
        .resize(500)
        .toFormat("webp")
        .toFile(resizedImagePath)
      fs.unlinkSync(imagePath)
      book.imageUrl = `${req.protocol}://${req.get('host')}/${resizedImagePath}`
    }
    await book.save()
    res.status(201).json({ message: "Livre créé" })
  } catch (error) {
    res.status(400).json({error})
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    const bookId = req.params.id
    const bookUpdates = req.file ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body }
    delete bookUpdates._userId
    const book = await Book.findOne({ _id: bookId })
    if (book.userId != req.auth.userId) {
      res.status(403).json({ message: 'Livre non trouvé' })
    } else {
      if (req.file) {
        const imagePathParts = book.imageUrl.split('/')
        const imageName = imagePathParts[imagePathParts.length - 1]
        const oldImagePath = `images/${imageName}`
        fs.unlinkSync(oldImagePath)
        const imagePath = req.file.path
        const resizedImagePath = `images/resized_${req.file.filename}`
        await sharp(imagePath)
          .resize(500)
          .toFile(resizedImagePath)
        fs.unlinkSync(imagePath)
        bookUpdates.imageUrl = `${req.protocol}://${req.get('host')}/${resizedImagePath}`
      }
      await Book.updateOne({ _id: bookId }, { ...bookUpdates, _id: bookId })
      res.status(200).json({ message: 'Livre modifié' })
    }
  } catch (error) {
    res.status(400).json({ error })
  }
}

exports.deleteBook = (req, res, next) => {
  Book.findOne({_id: req.params.id})
    .then(book => {
      console.log(book)
      if (book.userId != req.auth.userId) {
        res.status(401).json({message: "Non autorisé"})
      } else {
        const filename = book.imageUrl.split("/images/")[1]
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({_id: req.params.id})
            .then(() => res.status(200).json({message: "Livre supprimé"}))
            .catch(error => res.status(401).json({error}))
        })
      }
    })
    .catch(error => res.status(500).json({error}))
}

exports.getAllBook = (req, res, next) => {
  Book.find()
  .then(books => {
    res.status(200).json(books)})
  .catch(error => res.status(400).json({error}))
}

exports.getOneBook = (req, res, next) => {
  Book.findOne({_id: req.params.id})
  .then(book => res.status(200).json(book))
  .catch(error => res.status(404).json({error}))
}

exports.rateBook = (req, res, next) => {
  const userId = req.body.userId
  const rating = req.body.rating
  if ( userId === undefined) {
    res.status(401).json({message: "Vous devez être connecté pour noté un livre."})
  }
  Book.findOne({_id: req.params.id, "ratings.userId": userId})
    .then(existingRating => {
      if (existingRating) {
        res.status(400).json({message: "Vous avez déjà voté."})
      } else {
        Book.findOneAndUpdate({_id: req.params.id}, {$push: {ratings: {userId: userId, grade: rating}}}, {new: true})
          .then(moyenne => {
            const totalRating = moyenne.ratings.length
            const totalGrade = moyenne.ratings.reduce((sum, rating) => sum + rating.grade, 0)
            moyenne.averageRating = totalGrade / totalRating
            return moyenne.save()
          })
          .then(updateBook => res.status(200).json(updateBook))
          .catch(error => res.status(400).json({error}))
      }
    })
    .catch(error => res.status(500).json({error}))
}

exports.getBestRatingBooks = (req, res, next) => {
    Book.find()
      .sort({averageRating: -1})
      .limit(3)
      .then(bestRatedBook => res.status(200).json(bestRatedBook))
      .catch(error => res.status(400).json({error}))
}