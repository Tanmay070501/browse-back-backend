import winston from "winston"

const customFormat = winston.format.printf(({level, message}) => {
    return `${level.toUpperCase()}: ${message}`
})

export const logger = winston.createLogger({
    level: "info",
    format: customFormat,
    transports: [
        new winston.transports.Console()
    ]
})