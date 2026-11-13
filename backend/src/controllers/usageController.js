const UsageLog = require('../models/UsageLog');
const { isConnected } = require('../config/db');

const usageController = {
  async getMyStats(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;

      if (isConnected()) {
        const logs = await UsageLog.find({ userId });
        const totalTokens = logs.reduce(
          (sum, l) => sum + (l.tokenUsage?.totalTokens || 0),
          0
        );

        const providerBreakdown = logs.reduce((acc, l) => {
          acc[l.provider] = (acc[l.provider] || 0) + 1;
          return acc;
        }, {});

        return res.json({
          totalRequests: logs.length,
          totalTokens,
          providerBreakdown,
        });
      }

      return res.json({
        totalRequests: 0,
        totalTokens: 0,
        providerBreakdown: {},
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = usageController;

