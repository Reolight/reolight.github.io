type SpacesMap = {
    [T in string]: Logger;
};

const INTERNAL_RADIX = "_logger_";

enum TimePrintType {
    None,
    Time,
    Timemark,
    Datetime,
}

export class Logger {
    /** change it to enable this logger */
    public static DEBUG: boolean = true;
    public static TIME_PRINT_TYPE: TimePrintType = TimePrintType.Time;
    private static internal_logger: Logger = new Logger(INTERNAL_RADIX, true);
    private static loggerMap: SpacesMap = {};
    private static maxSpaces: number = 0;
    private static allowedLoggers: { [T in string]: boolean } = {
        _logger_: true,
    };
    private static allowedShifts: number = -1;
    private radix: string;
    private spaces: string;
    private curShift: number = 0;

    private static recalcSpaces() {
        Object.getOwnPropertyNames(Logger.loggerMap).forEach((loggerName) => {
            const logger = Logger.loggerMap[loggerName];
            logger["spaces"] = Array(Logger.maxSpaces - logger["radix"].length)
                .fill(0)
                .reduce((sp) => sp + " ", "");
        });
    }

    private get allowed(): boolean {
        return (
            Logger.DEBUG &&
            Logger.allowedLoggers[this.radix] &&
            (Logger.allowedShifts < 0 || (Logger.allowedShifts >= 0 && this.curShift < Logger.allowedShifts))
        );
    }

    public static Mute(radix: string) {
        if (radix !== INTERNAL_RADIX && radix in Logger.allowedLoggers) {
            Logger.allowedLoggers[radix] = false;
            Logger.internal_logger.warn(radix, "muted");
        } else {
            Logger.internal_logger.error(`Logger not found: ${radix}`);
        }
    }

    public static Unmute(radix: string) {
        if (radix !== INTERNAL_RADIX && radix in Logger.allowedLoggers) {
            Logger.allowedLoggers[radix] = true;
            Logger.internal_logger.warn(radix, "unmuted");
        } else {
            Logger.internal_logger.error(`Logger not found: ${radix}`);
        }
    }

    public static PrintLoggersState() {
        const infoState = Object.getOwnPropertyNames(Logger.allowedLoggers)
            .filter((name) => name !== INTERNAL_RADIX)
            .map((name) => `${Logger.allowedLoggers[name] ? "<SPEAK>" : ">MUTE<"}\t${name}`)
            .join("\n");

        Logger.internal_logger.warn("\n" + infoState);
    }

    constructor(radix: string, staticLogger?: boolean) {
        this.radix = radix;
        this.spaces = " ";

        if (staticLogger) return;

        Logger.allowedLoggers[radix] = true;
        Logger.loggerMap[radix] = this;

        if (radix.length + 1 > Logger.maxSpaces) {
            Logger.maxSpaces = radix.length + 1;
            Logger.recalcSpaces();
        }
    }

    public mute() {
        Logger.Mute(this.radix);
        return this;
    }

    public unmute() {
        Logger.Unmute(this.radix);
        return this;
    }

    public shift() {
        this.curShift++;
        return this;
    }

    public unshift() {
        if (this.curShift === 0) Logger.internal_logger.error(`${this.radix} - can't be UNSHIFTED, cus shift is already 0`);
        else this.curShift--;
        return this;
    }

    private get time(): string {
        switch (Logger.TIME_PRINT_TYPE) {
            case TimePrintType.None:
                return "";
            case TimePrintType.Datetime:
                return new Date().toLocaleDateString();
            case TimePrintType.Time:
                return new Date().toLocaleTimeString();
            case TimePrintType.Timemark:
                return new Date().getTime().toString();
            default:
                return "";
        }
    }

    private get prefix(): string {
        return (
            this.time +
            " " +
            `[${this.radix}]` +
            this.spaces +
            Array(this.curShift)
                .fill(0)
                .map(() => "....")
                .join("")
        );
    }

    public debug(...params: unknown[]) {
        if (this.allowed) console.debug(this.prefix, ...params);
        return this;
    }

    public log(...params: unknown[]) {
        if (this.allowed) console.log(this.prefix, ...params);
        return this;
    }

    public warn(...params: unknown[]) {
        if (this.allowed) console.warn(this.prefix, ...params);
        return this;
    }

    public error(...params: unknown[]) {
        if (this.allowed) console.error(this.prefix, ...params);
        return this;
    }
}

/** @ts-ignore for logging control */
window.logger = Logger;
