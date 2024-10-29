import MaskCharSynthetizer from "./maskSynthetizer";
import {
    MaskedCharacterInfo,
    MaskedInputSettings,
} from "./types";

class MaskProcessor {
    private processedMask: MaskedCharacterInfo[];

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
        this.settings = settings;
        this.ref = ref;

        this.maskGenerator = new MaskCharSynthetizer(settings);
        this.processedMask = this.maskGenerator.generate(mask);
    }

    private createErrorMessage(
        charMask: MaskedCharacterInfo,
        char: string
    ): string {
        return !charMask.error
            ? `Символ ${char} не подходит под правило`
            : charMask.error.indexOf("{0}") >= 0
            ? charMask.error.replace("{0}", char)
            : charMask.error;
    }

    public processValue(value: string): string {
        return this.maskGenerator.combineWithValue(
            this.processedMask,
            value,
            (settings) => settings.textMaskFormat
        );
    }

    public beforeInputHandler(e: Event) {
        const event = e as InputEvent;

        if (!event.inputType.startsWith("insert")) {
            return;
        }


        // const data = event.data + 
    }

    /**
     * Проверяет валидность данных.
     * Не пропускает невалидные данные.
     * Автоматически вставляет литералы
     * @param e событие ввода
     */
    public checkValidity(): void {
        // делим текущее значение (которое уже изменено после ввода)
        const values = this.ref.current.value.split("");
        // создаём массив для обработанных данных
        const processed: string[] = [];

        // пройдёмся по маске и по введённой строке
        for (
            let i = 0, di = 0;
            i < this.processedMask.length && di < values.length;
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
