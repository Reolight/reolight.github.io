import { defaultSettigns } from "./consts";
import maskCharactersDefinitions, { EmptyAction } from "./definitions";
import { Logger } from "./logger";
import { ActionProcessor, MaskedInputSettings, MaskedCharacterInfo, MaskFormat } from "./types";
import { createErrorMessage } from "./utils";

type PutInfo = { char: string | undefined; idx: number };

/// NOTA BENE!
/// Здесь используется след. термины:
/// На определённый СИМВОЛ МАСКИ в МАССИВЕ СИМВОЛОВ МАСКИ указывает ИНДЕКС в массиве freePositions;
/// На определённый ИНДЕКС из массива freePositions указывает УКАЗАТЕЛЬ
class MaskCharSynthetizer {
    private logger: Logger = new Logger("synthetizer").shift().shift().mute();

    private action: ActionProcessor = EmptyAction;
    private mask: MaskedCharacterInfo[] = [];
    private settings: MaskedInputSettings = defaultSettigns;
    /** Это позиции, не занятые литералами (содержит ИНДЕКСЫ) */
    private freePositions: number[] = [];
    private focused: boolean = false;

    private get actualLength(): number {
        return this.mask.reduce<number>((acc, char): number => {
            return acc + char.visibleAs.length;
        }, 0);
    }

    public set hidden(value: boolean) {
        this.logger.debug("HIDDEN set as", value);
        this.focused = !value;
    }

    public get hidden(): boolean {
        return !this.focused;
    }

    public get lastActualIdx(): number {
        let actualIdx = 0;
        for (let i = 0; i < this.freePositions.length; i += 1) {
            if (this.getMaskByPtr(i).actual) {
                actualIdx = this.freePositions[i] + 1;
            }
        }

        return actualIdx;
    }

    public applySettings(settings: MaskedInputSettings) {
        this.logger.debug("new settings applied", settings);
        this.settings = settings;
    }

    private applyAction(action: ActionProcessor) {
        this.action = action;
    }

    private getLiteral(char: string): MaskedCharacterInfo {
        return {
            action: this.action,
            actual: undefined,
            required: false,
            replaceable: false,
            visibleAs: char,
        };
    }

    private getPlaceholder(char: string): MaskedCharacterInfo {
        return {
            action: this.action,
            actual: undefined,
            required: maskCharactersDefinitions.placeholders[char].required,
            replaceable: true,
            visibleAs: this.settings.hidePromptOnLeave && this.hidden ? " " : this.settings.promptSymbol,
            rule: maskCharactersDefinitions.placeholders[char].rule,
            error: maskCharactersDefinitions.placeholders[char].error,
        };
    }

    private getLocalizedLiterals(char: string): MaskedCharacterInfo {
        return {
            action: this.action,
            actual: undefined,
            replaceable: false,
            required: false,
            visibleAs: maskCharactersDefinitions.localizedLiterals[char].visibleAs(),
        };
    }

    private getPostprocessor(char: string): void {
        this.applyAction(maskCharactersDefinitions.postprocessors[char].action);
    }

    public generate(mask: string): MaskedCharacterInfo[] {
        const generated: MaskedCharacterInfo[] = [];

        let escaped = false;
        for (const char of mask) {
            if (!escaped && char === "\\") {
                escaped = true;
                continue;
            }

            if (!escaped && char in maskCharactersDefinitions.placeholders) {
                generated.push(this.getPlaceholder(char));
                continue;
            }

            if (!escaped && char in maskCharactersDefinitions.postprocessors) {
                this.getPostprocessor(char);
                continue;
            }

            if (!escaped && char in maskCharactersDefinitions.localizedLiterals) {
                generated.push(this.getLocalizedLiterals(char));
                continue;
            }

            generated.push(this.getLiteral(char));
            escaped = false;
        }

        this.mask = generated;
        this.freePositions = this.getPurePositions();
        return generated;
    }

    public get value(): string {
        this.logger.shift().shift();
        const val = this.mask.reduce((acc, charInfo) => {
            if (charInfo.actual) {
                this.logger.debug("contains actual:", charInfo.actual);
                return acc + charInfo.actual;
            }

            if (charInfo.replaceable) {
                const resolved = this.hidden && this.settings.hidePromptOnLeave ? " " : charInfo.visibleAs;

                this.logger.debug("provided placeholder:", resolved, "hidden:", this.hidden, "hidePromptOnLeave:", this.settings.hidePromptOnLeave);

                return acc + resolved;
            }

            this.logger.debug("provided literal:", charInfo.visibleAs);

            return acc + charInfo.visibleAs;
        }, "");

        this.logger.unshift().debug("value synthetized: ", val).unshift();
        return val;
    }

    public toString(formatSelector: (settings: MaskedInputSettings) => MaskFormat): string {
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

        const curmask = this.mask.reduce((acc, charInfo) => {
            if (charInfo.actual) return acc + charInfo.actual;

            if (charInfo.replaceable) return acc + (printPrompt ? charInfo.visibleAs : " ");

            return acc + (printLiterals ? charInfo.visibleAs : " ");
        }, "");

        this.logger.debug("toString invoked", curmask, "type", format);
        return curmask;
    }

    /**
     * Возвращает список позиций, свободных от литералов.
     * Игнорирует занятые места другими символами
     */
    private getPurePositions(from?: number, to?: number): number[] {
        const free: number[] = [];
        for (let index = from ?? 0; index < (to ?? this.mask.length); index += 1) {
            if (from && index < from) return free;
            if (this.mask[index].replaceable) {
                free.push(index);
            }
        }

        return free;
    }

    /**
     * Возвращает УКАЗАТЕЛЬ, наиболее близкий (в большую сторону) к ИНДЕКСУ.
     */
    private getPtr(startIdx: number) {
        return this.freePositions.findIndex((pos) => pos >= startIdx);
    }

    /** "Разыменовывает" указатель на символ маски и возвращает символ маски */
    private getMaskByPtr(ptr: number) {
        return this.mask[this.freePositions[ptr]];
    }

    /** Проверяет, подходят ли символы с позиций validated на позиции positions.
     * Позиции positions не включают литералы
     */
    private validateForPositions(validated: number[], positions: number[], shift: number = 0): boolean {
        for (let i = 0; i < validated.length; i += 1) {
            if (i + shift >= positions.length) return false;

            const position = this.mask[positions[i + shift]];
            const char = this.mask[validated[i]];

            if (!char.actual) {
                continue;
            }

            if (position.rule && !position.rule.test(char.actual!)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Определяет длину блока, который можно переместить.
     * Границы блока определяются только введёнными пользовательскими символами после начальной позиции.
     * PS: Возвращённое значение не гарантирует самой возможности того, что блок можно перемещать
     * @param index начало, с которого нужно искать блок
     * @returns Возвращает длину перемещаемого блока. Если отрицательно - значит такого блока перед курсором нет.
     */
    private getShiftableBlockLength(index: number): number {
        for (let i = this.mask.length - 1; i >= index; i -= 1) {
            const char = this.mask[i];
            if (!char.actual) continue;
            else return i + 1 - index;
        }

        return -index;
    }

    /**
     * Считает, на сколько позиций можно передвинуть блок movable, состоящий из индеков перемещаемых символов.
     * Принимает первоначальное максимальное количество за by.
     * @param movable индексы перемещаемых символов
     * @param by на сколько символов было бы хорошо переместить
     * @returns на сколько символов возможно переместить (от 0 до by)
     */
    private getPossibleShiftBy(movable: number[], by: number): number {
        const start = movable[0];
        const free = this.getPurePositions(start);
        for (let i = by; i > 0; i -= 1) {
            if (this.validateForPositions(movable, free, i)) return i;
        }

        return 0;
    }

    /**
     * Перемещает символы по индексам на количество указанных позиций
     * @param actualMovable массив индексов перемещаемых символов
     * @param by количество позиций,
     */
    private shift(actualMovable: number[], by: number) {
        const startMoveFromIdx = actualMovable[0]; // index - указывает на символ this.mask
        const startMoveToPtr = this.getPtr(startMoveFromIdx) + by; // pointer указывает на массив с индексами

        for (let i = actualMovable.length - 1; i >= 0; i -= 1) {
            const from = this.mask[actualMovable[i]];
            const to = this.getMaskByPtr(startMoveToPtr + i);
            to.actual = from.actual;
            from.actual = undefined;
        }
    }

    /**
     * Возвращает индексы символов, которые можно перемещать
     * @param start индекс, с которого искать
     * @param length длина, на протяжении которой искать
     * @returns массив с индексами перемещаемых символов
     */
    private getMovable(start: number, length: number): number[] {
        const startPtr = this.getPtr(start);
        const endPtr = this.getPtr(start + length);

        if (startPtr < 0 || endPtr < 0) throw new Error("Null Pointers detected");

        const movable = this.freePositions.slice(startPtr, endPtr);

        return movable;
    }

    /**
     * Предпринимает попытку подвинуть блок справа от стартового индекса на N позиций.
     * @param start начальная позиция
     * @param by на сколько нужно подвинуть
     * @returns на сколько в итоге подвинуто
     */
    public shiftOccupiedRight(start: number, by: number): number {
        const blockLength = this.getShiftableBlockLength(start);

        if (blockLength < 0) throw new Error("Block length is negative");

        if (blockLength + start >= this.mask.length) return 0;

        const movable = this.getMovable(start, blockLength);
        const possibleBy = this.getPossibleShiftBy(movable, by);
        if (possibleBy) this.shift(movable, possibleBy);
        return possibleBy;
    }

    /**
     * Возвращает сколько символов из указанного блока можно уместить без учёта перемещений
     * @param start начало блока
     * @param length длина блока
     */
    private countAvailablePlaceFor(start: number): number {
        const startPtr = this.getPtr(start);

        let available = 0;
        for (let i = startPtr; i < this.freePositions.length; i += 1, available += 1) {
            const mask = this.getMaskByPtr(i);
            if (!mask) throw new Error("not found");
            if (mask.actual) return available;
        }

        return available;
    }

    private validForNextPlaceholder(char: string, positionIdx: number): { valid: boolean; placeholderIdx: number } {
        const freePtr = this.getPtr(positionIdx);
        if (freePtr >= 0) {
            const mask = this.getMaskByPtr(freePtr);
            if (mask.rule && mask.rule.test(char)) {
                return {
                    placeholderIdx: this.freePositions[freePtr],
                    valid: true,
                };
            }
        }

        return {
            placeholderIdx: freePtr >= 0 ? this.freePositions[freePtr] : freePtr,
            valid: false,
        };
    }

    /**
     * Создаёт строку, которую можно уместить в заданную позицию без учёта занятости
     * позиций после.
     * @param data помещаемые данные
     * @param positionIdx позиция с которой нужно считать
     */
    private getPuttable(data: string, positionIdx: number): PutInfo[] {
        const chars = data.split("");
        const puttable: PutInfo[] = [];

        for (let maskIdx = positionIdx; chars.length > 0 && maskIdx < this.mask.length; ) {
            const char = chars.shift()!;
            const mask = this.mask[maskIdx];

            if (!this.settings.skipLiterals && !mask.replaceable && char === mask.visibleAs) {
                puttable.push({ char, idx: maskIdx });
                continue;
            }

            // если пробел или промпт разрешены для сброса, поступаем как с подходящим символом
            if (
                mask.replaceable &&
                ((char === " " && this.settings.resetOnSpace) || (char === this.settings.promptSymbol && this.settings.resetOnPrompt))
            ) {
                puttable.push({ char, idx: maskIdx });
                maskIdx += 1;
                continue;
            }

            const validationResult = this.validForNextPlaceholder(char, maskIdx);
            if (validationResult.valid) {
                puttable.push({ char, idx: validationResult.placeholderIdx });
                maskIdx = validationResult.placeholderIdx + 1;
            } else {
                if (!this.settings.rejectInputOnFirstFailure) continue;
                else throw new Error(createErrorMessage(mask, char));
            }
        }

        return puttable;
    }

    /** Вставляет символы с начала указанной позиции по указателям (т.е. в свободные строки).
     * Возвращает индекс последнего элемента*/
    private putInternal(dataChars: PutInfo[], positionIdx: number): number {
        for (const { char, idx } of dataChars) {
            const mask = this.mask[idx];
            if (mask.replaceable) {
                mask.actual = !char ? char : mask.action(char);
            }
        }

        return dataChars.at(-1)?.idx ?? positionIdx;
    }

    /** Обрабатывает пробелы и промпты перед вставкой: если ресет разрешён, заменяет на undefined. Мутирует массив */
    private prePutProcess(puttable: PutInfo[]): PutInfo[] {
        for (let index = 0; index < puttable.length; index += 1) {
            if (
                (puttable[index].char === " " && this.settings.resetOnSpace) ||
                (puttable[index].char === this.settings.promptSymbol && this.settings.resetOnPrompt)
            ) {
                puttable[index].char = undefined;
            }
        }

        return puttable;
    }

    /** Вставляет N символов в zero-based позицию, возвращает индекс,
     * соответствующий элементу после вставлненных.
     * Если ничего не вставлено, возвращает тот же индекс */
    public putSymbols(data: string, position: number): number {
        if (position === this.mask.length) return position;

        let puttable = this.getPuttable(data, position);
        let availablePlace = this.countAvailablePlaceFor(position);

        if (availablePlace < puttable.length) {
            availablePlace += this.shiftOccupiedRight(position + availablePlace, puttable.length - availablePlace);

            if (availablePlace < puttable.length) {
                puttable = puttable.slice(0, availablePlace);
            }
        }

        this.prePutProcess(puttable);
        const putted = this.putInternal(puttable, position);
        return !puttable.length ? position : putted + 1;
    }

    /** Обнаруживает индекс в переданном значении, где начинается расхождение с маской */
    private findDifference(value: string): number {
        const chars = value.split("");
        for (let index = 0; index < chars.length; index += 1) {
            const mask = this.mask[index];
            const char = chars[index];

            if (!mask.replaceable && char === mask.visibleAs) continue;

            if (char === mask.actual) continue;

            if (!mask.actual && char === mask.visibleAs) continue;

            return index;
        }

        return value.length;
    }

    private extractActualChars(startPtr?: number, endPtr?: number): PutInfo[] {
        const start = startPtr ?? 0;
        const end = endPtr ?? this.freePositions.length;

        const chars: PutInfo[] = [];

        for (let ptr = start; ptr < end; ptr += 1) {
            chars.push({ char: this.getMaskByPtr(ptr).actual, idx: this.freePositions[ptr] });
        }

        return chars;
    }

    /** Сбрасывает пользовательский ввод, начиная с позиции Start (по умолчанию 0) до позиции End (конец по умолчанию) */
    private resetActualInput(startIdx?: number, endIdx?: number) {
        const start = startIdx ?? 0;
        const end = endIdx ?? this.mask.length;

        for (let index = start; index < end; index += 1) {
            this.mask[index].actual = undefined;
        }
    }

    /** Восстанавливает утраченную часть маски после удаления.
     * @param damaged это значение из самого input. Не скопированнное и не выведенное!
     * @returns индекс начала повреждения или длину строки
     */
    public regenerate(damaged: string, diffPosition?: number): number {
        const lengthDiff = this.actualLength - damaged.length;

        // регенерировать "нечего" (вероятна подмена символа!)
        if (lengthDiff === 0) return damaged.length;

        if (lengthDiff < 0) throw new Error("Not supported (for now?)"); // ???

        const diffStart = diffPosition ?? this.findDifference(damaged);
        const restLength = damaged.length - diffStart;
        const diffStartPtr = this.getPtr(diffStart);

        // индекс несовпадения начинается раньше конца повреждённого фрагмента
        if (restLength) {
            // оригинальная позиция сдвинутого остатка
            const restOriginPtr = this.getPtr(diffStart + lengthDiff);
            const restOriginSize = this.freePositions.length - restOriginPtr;

            const isValid = this.validateForPositions(
                this.freePositions.slice(restOriginPtr, restOriginPtr + restOriginSize),
                this.freePositions.slice(diffStartPtr, diffStartPtr + restLength)
            );

            if (isValid) {
                const actualRest = this.extractActualChars(restOriginPtr, restOriginPtr + restOriginSize);

                this.resetActualInput(diffStart);
                this.putInternal(actualRest, diffStart);
            }
        } else {
            this.resetActualInput(diffStart);
        }

        return diffStart;
    }
}

export default MaskCharSynthetizer;
