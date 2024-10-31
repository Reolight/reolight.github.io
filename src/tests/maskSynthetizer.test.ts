import MaskCharSynthetizer from "../MaskedEngine/maskSynthetizer";
import { MaskFormat } from "../MaskedEngine/types";
import { maskEndLetter, maskWithLetterInside } from "./common";

const maskSynthetizer = new MaskCharSynthetizer({
    beepOnError: false,
    cutCopyMaskFormat: MaskFormat.ExcludePromptAndLiterals,
    hidePromptOnLeave: false,
    promptSymbol: "_",
    rejectInputOnFirstFailure: false,
    resetOnPrompt: false,
    resetOnSpace: false,
    skipLiterals: false,
    textMaskFormat: MaskFormat.ExcludePromptAndLiterals,
});

const nonReqMaskWithLiterl = "99.99";
const nonReqMask = "9999";

test("Mask correctly generated", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    const visibleMask = maskSynthetizer.toString(
        (settings) => settings.textMaskFormat
    );

    expect(visibleMask).toBe("     ");
});

test("Количество свободных мест определяется корректно", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    const free = maskSynthetizer["freePositions"];

    expect(free).toStrictEqual([0, 1, 3, 4]);
});
test("Символы реально кладутся на маску", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    maskSynthetizer.putSymbols("25", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("25   ");
});

test("Инвалиды не кладутся в маску (инвалид в начале)", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    maskSynthetizer.putSymbols("a5", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("5    ");
});

test("Инвалиды не кладутся в маску (инвалид последний)", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    maskSynthetizer.putSymbols("2a", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("2    ");
});

test("Корректно пропускается литерал", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    maskSynthetizer.putSymbols("123", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("12 3 ");
});

test("Корректно кладутся все символы с инвалидом в центре", () => {
    maskSynthetizer.generate(nonReqMask);
    maskSynthetizer.putSymbols("2a2", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("22  ");
});

test("Корректно кладутся и двигают движимое", () => {
    maskSynthetizer.generate(nonReqMask);
    maskSynthetizer.putSymbols("2", 2);

    maskSynthetizer.putSymbols("111", 0);
    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("1112");
});

test("Корректно вставляет символы с упором в другую маску: 999  >> 99L", () => {
    maskSynthetizer.generate(maskWithLetterInside);
    maskSynthetizer.putSymbols("123", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("12   ");
});

test("Корректно НЕ вставляет символы, если нет места", () => {
    maskSynthetizer.generate(nonReqMask);
    maskSynthetizer.putSymbols("1111", 0);
    maskSynthetizer.putSymbols("5", 1);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("1111");
});

test("Корректно вставляет символ, если осталось последнее место", () => {
    maskSynthetizer.generate(nonReqMask);
    maskSynthetizer.putSymbols("11", 1);
    maskSynthetizer.putSymbols("5", 1);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe(" 511");
});

test("Корректно вставляется и перемещается через литерал", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    maskSynthetizer.putSymbols("11", 0);
    maskSynthetizer.putSymbols("2", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("21 1 ");
});

test("Корректно вставляется и заполняет всё поле", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);
    maskSynthetizer.putSymbols("1984", 0);

    const output = maskSynthetizer.toString(
        () => MaskFormat.IncludePromptAndLiterals
    );
    expect(output).toBe("19.84");
});

test("Корректно НЕ вставляется, упираясь в другую маску", () => {
    maskSynthetizer.generate(maskWithLetterInside);
    maskSynthetizer.putSymbols("11", 0);
    maskSynthetizer.putSymbols("2", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("11   ");
});

test("Корректно вставляется обрезанное, упирается в конец строки", () => {
    maskSynthetizer.generate(nonReqMask);
    maskSynthetizer.putSymbols("111", 0);
    maskSynthetizer.putSymbols("22", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("2111");
});

test("Корректно вставляется обрезанное, упирается в другую маску", () => {
    maskSynthetizer.generate(maskEndLetter);
    maskSynthetizer.putSymbols("11", 0);
    maskSynthetizer.putSymbols("22", 0);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("211 ");
});

test("Корректно ничего не выводит (Exclude prompts and literals)", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);

    const output = maskSynthetizer.toString((s) => s.textMaskFormat);
    expect(output).toBe("     ");
});

test("Корректно выводит только промпты (Include prompts)", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);

    const output = maskSynthetizer.toString(() => MaskFormat.IncludePrompt);
    expect(output).toBe("__ __");
});

test("Корректно выводит только литералы (Include literals)", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);

    const output = maskSynthetizer.toString(() => MaskFormat.IncludeLiterals);
    expect(output).toBe("  .  ");
});

test("Корректно выводит литералы и промпты (Include prompts and literals)", () => {
    maskSynthetizer.generate(nonReqMaskWithLiterl);

    const output = maskSynthetizer.toString(
        () => MaskFormat.IncludePromptAndLiterals
    );
    expect(output).toBe("__.__");
});
