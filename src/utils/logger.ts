import { createLogger as create, format, transports, addColors, Logger } from 'winston';

const customFormat = format.printf(({level, message, label, timestamp}) => {
    return `${timestamp.substring(11,23)}\t[${level}]\t${label}\t${message}`;
})

const customColors = {
    error: 'bold white redBG',
    warn: 'inverse yellow',
    info: 'green'
}

const createLogger = (label: string): Logger  => create({
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.label({label: label}),
        customFormat,
    ),
    transports: [
        new transports.Console()
    ]
});

addColors(customColors);

export default createLogger