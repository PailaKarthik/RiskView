const notFoundHandler = (req, res) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    status: 404,
    message: error.message,
  });
};

module.exports = notFoundHandler;
