import { expect, test } from "vitest";
import MaskCharSynthetizer from "../MaskedEngine/maskSynthetizer";
import { MaskFormat } from "../MaskedEngine/types";

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
})