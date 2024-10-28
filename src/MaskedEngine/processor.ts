import maskCharactersDefinitions, { EmptyAction } from "./definitions";
import {
    ActionProcessor,
    MaskCharacterInfo,
    MaskedInputSettings,
    MaskFormat,
} from "./types";

class MaskCharSynthetizer {
    private action: ActionProcessor = EmptyAction;

    private settings: MaskedInputSettings;

    constructor(settings: MaskedInputSettings) {
        this.settings = settings;
    }

    private applyAction(action: ActionProcessor) {
        this.action = action;
    }

    private literal(char: string): MaskCharacterInfo {
        return {
            action: this.action,
            replaceable: false,
            visibleAs: char,
        };
    }

    private placeholder(char: string, hidden: boolean): MaskCharacterInfo {
        return {
            action: this.action,
            replaceable: true,
            visibleAs:
                this.settings.hidePromptOnLeave && hidden
                    ? " "
                    : this.settings.promptSymbol,
            rule: maskCharactersDefinitions.placeholders[char].rule,
            error: maskCharactersDefinitions.placeholders[char].error,
        };
    }

    private postprocessor(char: string): void {
        this.applyAction(maskCharactersDefinitions.postprocessors[char].action);
    }

    public generate(
        mask: string,
        hidden: boolean = false
    ): MaskCharacterInfo[] {
        const generated: MaskCharacterInfo[] = [];

        for (const char of mask) {
            if (char in maskCharactersDefinitions.placeholders) {
                generated.push(this.placeholder(char, hidden));
                continue;
            }

            if (char in maskCharactersDefinitions.postprocessors) {
                this.postprocessor(char);
                continue;
            }

            generated.push(this.literal(char));
        }

        return generated;
    }

    public combineWithValue(
        mask: MaskCharacterInfo[],
        value: string,
        formatSelector: (settings: MaskedInputSettings) => MaskFormat
    ): string {
        const format = formatSelector(this.settings);

        let printLiterals = false,
            printPrompt = false;

        switch (format) {
            case MaskFormat.ExcludePromptAndLiterals:
                break;
            case MaskFormat.IncludeLiterals:
                printLiterals = true;
                break;
            case MaskFormat.IncludePrompt:
                printPrompt = true;
                break;
            case MaskFormat.IncludePromptAndLiterals:
                printPrompt = true;
                printLiterals = true;
                break;
        }

        for (let i = 0; i < mask.length; i += 1) {
            let result: string = ''
            const mc = mask[i];
            const ch = value[i];
            // if (!mc.replaceable && ) {
            //     result += ch;
            // }
        }
    }
}

class MaskProcessor {
    private mask: string;

    private processedMask: MaskCharacterInfo[];

    private settings: MaskedInputSettings;

    private maskGenerator: MaskCharSynthetizer;

    private ref: React.MutableRefObject<HTMLInputElement>;

    public get visibleMask(): string {
        return this.processedMask.map((mc) => mc.visibleAs).join("");
    }

    constructor(
        mask: string,
        settings: MaskedInputSettings,
        ref: React.MutableRefObject<HTMLInputElement>
    ) {
        this.mask = mask;
        this.settings = settings;
        this.ref = ref;

        this.maskGenerator = new MaskCharSynthetizer(settings);
        this.processedMask = this.maskGenerator.generate(mask);
    }

    private createErrorMessage(
        charMask: MaskCharacterInfo,
        char: string
    ): string {
        return !charMask.error
            ? `Символ ${char} не подходит под правило`
            : charMask.error.indexOf("{0}") >= 0
            ? charMask.error.replace("{0}", char)
            : charMask.error;
    }

    /**
     * Проверяет валидность данных.
     * Не пропускает невалидные данные.
     * Автоматически вставляет литералы
     * @param e событие ввода
     */
    public checkValidity(e: Event): void {
        // кастим общее событие
        const event = e as InputEvent;

        // делим текущее значение (которое уже изменено после ввода)
        const values = this.ref.current.value.split("");
        // создаём массив для обработанных данных
        const processed: string[] = [];

        // здесь определяем в зависимости от типа события условие для цикла:
        // 1. Если это не вставка, тогда нужно будет после вставки последнего символа пробежаться по маске и доставлять литералы
        //  (поэтому неравенство нестрогое)
        // 2. Если это не вставка, тогда равеноство будет строгое и проверка не пойдёт после изменения данных —
        //  если так не сделать, то удаление работать не будет (потому что 0 === 0)
        const checkDataCondition = (dataIndex: number) =>
            event.inputType.startsWith("insert")
                ? dataIndex <= values.length
                : dataIndex < values.length;

        // пройдёмся по маске и по введённой строке
        for (
            let i = 0, di = 0;
            i < this.processedMask.length && checkDataCondition(di);
            i += 1
        ) {
            const mask = this.processedMask[i];
            const symb = values.length === di ? undefined : values[di];

            // если символ маски литерал (не замещается), тогда добавим в обработанную строку и перейдём к другому символу маски без сдвига индекса строки
            if (!mask.replaceable && symb !== mask.visibleAs) {
                processed.push(mask.visibleAs);
                continue;
            }

            // если это условие истинно, значит строка уже обработана и все литералы вставлены, поэтому выходим
            if (!symb) break;

            // проверяем символ на несоответствие правилам.
            if (mask.rule && !mask.rule.test(symb)) {
                throw new Error(this.createErrorMessage(mask, symb));
            }

            // в этом случае правилам соответствует, добавляем символ, прошедший построцессорную обработку
            processed.push(mask.action(symb));
            // сдвигаем индекс строки
            di += 1;
        }

        // сеттим обработанную строку
        this.ref.current.value = processed.join("");
    }
}

export default MaskProcessor;
