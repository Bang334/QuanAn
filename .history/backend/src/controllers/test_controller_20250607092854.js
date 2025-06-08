// Simple test controller
exports.testEndpoint = (req, res) => {
  res.status(200).json({ message: 'Test endpoint is working!' });
}; 