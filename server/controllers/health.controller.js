/**
 * Health Check Controller for SpeechEngine Backend
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SpeechEngine Backend API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
};
