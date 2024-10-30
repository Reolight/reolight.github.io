import maskCharactersDefinitions, { EmptyAction } from "./definitions";
import {
    ActionProcessor,
    MaskedInputSettings,
    MaskedCharacterInfo,
    MaskFormat,
} from "./types";
import { createErrorMessage } from "./utils";

/// NOTA BENE!
/// Здесь используется след. термины:
/// На определённый СИМВОЛ МАСКИ в МАССИВЕ СИМВОЛОВ МАСКИ указывает ИНДЕКС в массиве freePositions;
/// На определённый ИНДЕКС из массива freePositions указывает УКАЗАТЕЛЬ
class MaskCharSynthetizer {
    private action: ActionProcessor = EmptyAction;
    private mask: MaskedCharacterInfo[] = [];
    private settings: MaskedInputSettings;
    /** Это позиции, не занятые литералами (содержит ИНДЕКСЫ) */
    private freePositions: number[] = [];

    constructor(settings: MaskedInputSettings) {
        this.settings = settings;
    }

    private applyAction(action: ActionProcessor) {
        this.action = action;
    }

    private literal(char: string): MaskedCharacterInfo {
        return {
            action: this.action,
            actual: undefined,
            required: false,
            replaceable: false,
            visibleAs: char,
        };
    }

    private placeholder(char: string, hidden: boolean): MaskedCharacterInfo {
        return {
            action: this.action,
            actual: undefined,
            required: maskCharactersDefinitions.placeholders[char].required,
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
    ): MaskedCharacterInfo[] {
        const generated: MaskedCharacterInfo[] = [];

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

        this.mask = generated;
        this.freePositions = this.getPurePositions();
        return generated;
    }

    /** Обновляет маску при потере/получении фокуса */
    public updateMaskOnFocusChange(hidden: boolean): MaskedCharacterInfo[] {
        if (!this.settings.hidePromptOnLeave) return this.mask;

        for (const maskedChar of this.mask) {
            if (maskedChar.replaceable) {
                maskedChar.visibleAs = hidden
                    ? " "
                    : this.settings.promptSymbol;
            }
        }

        return this.mask;
    }

    public toString(
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

        return this.mask.reduce((acc, charInfo) => {
            if (charInfo.actual) return acc + charInfo.actual;

            if (charInfo.replaceable)
                return acc + (printPrompt ? charInfo.visibleAs : " ");

            return acc + (printLiterals ? charInfo.visibleAs : " ");
        }, "");
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
    private validateForPositions(
        validated: number[],
        positions: number[],
        shift : number
    ): boolean {
        for (let i = 0; i < validated.length; i += 1) {
            if (i + shift >= positions.length)
                return false;
            
            const position = this.mask[positions[i + shift]];
            const char = this.mask[validated[i]];

            if (!char.actual) {
                if (position.required) return false;
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

        if (startPtr < 0 || endPtr < 0)
            throw new Error("Null Pointers detected");

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
        for (
            let i = startPtr;
            i < this.freePositions.length;
            i += 1, available += 1
        ) {
            const mask = this.getMaskByPtr(i);
            if (!mask) throw new Error("not found");
            if (mask.actual) return available;
        }

        return available;
    }

    /**
     * Создаёт строку, которую можно уместить в заданную позицию без учёта занятости
     * позиций после.
     * @param data помещаемые данные
     * @param position позиция с которой нужно считать
     */
    private getPuttable(data: string, position: number): string[] {
        const chars = data.split("");
        const startPtr = this.getPtr(position);

        const puttable: string[] = [];

        for (
            let maskPtr = startPtr;
            chars.length > 0 && maskPtr < this.freePositions.length;

        ) {
            const char = chars.shift()!;
            const mask = this.getMaskByPtr(maskPtr);

            // если пробел или промпт разрешены для сброса, поступаем как с подходящим символом
            if (
                (char === " " && this.settings.resetOnSpace) ||
                (char === this.settings.promptSymbol &&
                    this.settings.resetOnPrompt)
            ) {
                puttable.push(char);
                maskPtr += 1;
            }

            if (mask.rule) {
                if (mask.rule.test(char)) {
                    puttable.push(char);
                    maskPtr += 1;
                } else {
                    if (!this.settings.rejectInputOnFirstFailure) continue;
                    else throw new Error(createErrorMessage(mask, char));
                }
            }
        }

        return puttable;
    }

    /** Восстанавливает утраченную часть маски после удаления */
    public regenerate() {}

    private putInternal(dataChars: string[], position: number) {
        const chars = dataChars.slice();
        const startPtr = this.getPtr(position);
        for (let i = startPtr; chars.length > 0; i += 1) {
            const mask = this.getMaskByPtr(i);
            mask.actual = chars.shift();
        }
    }

    /** Вставляет N символов в zero-based позицию */
    public putSymbols(data: string, position: number) {
        let puttable = this.getPuttable(data, position);
        let availablePlace = this.countAvailablePlaceFor(position);

        if (availablePlace < puttable.length) {
            availablePlace += this.shiftOccupiedRight(
                position + availablePlace,
                puttable.length - availablePlace
            );

            if (availablePlace < puttable.length) {
                puttable = puttable.slice(0, availablePlace);
            }
        }

        this.putInternal(puttable, position);
    }
}

export default MaskCharSynthetizer;
