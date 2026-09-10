/**
 * Health Check Controller
 * GET /api/health
 */
export const getHealth = (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SpeechEngine API is running',
  });
};

export default { getHealth };
