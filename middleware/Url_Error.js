const UrlNotFound = (req, res, next) => {
    const error = new Error("Vous vous êtes perdu quelque part dans une mauvaise URL. Retournez a la page d'accueil.");
    error.status = 404;
    next(error);
};

const UrlError = (error, req, res, next) => {
    res.status(error.status || 500).json({
        error: {
            message: error.message
        }
    });
};

module.exports = { UrlNotFound, UrlError };