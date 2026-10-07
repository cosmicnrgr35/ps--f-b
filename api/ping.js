// Ping handler at url/api/ping

module.exports = function handler(req, res) {
  res.status(200).json({ message: 'Server Pinged!!!' })
}
