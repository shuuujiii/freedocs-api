const { StatusCodes, getReasonPhrase } = require('http-status-codes');

function errorHandler() {
    this.handleError = async (error, res) => {
        console.log(error)
        if (error.isOperational) {
            return res.status(error.httpCode || StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ message: error.description })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'unhandled error!!' })

        // await logger.logError(error);
        // await fireMonitoringMetric(error);
        // await crashIfUntrustedErrorOrSendResponse(error, responseStream);
    };
}
module.exports.handler = new errorHandler();
