function errorHandler(err, req, res, next) {
  // body-parser errors (malformed JSON, payload too large) carry a 4xx status
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'malformed JSON body' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'request body too large' } });
  }
  console.error(err);
  res.status(err.status || 500).json({
    error: { message: err.expose ? err.message : 'internal server error' },
  });
}

module.exports = errorHandler;
