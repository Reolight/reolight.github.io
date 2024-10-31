import { expect, test } from "vitest";
import { maskSynthetizer, maskSynthetizerIncludeEither } from "./common";
import { MaskFormat } from "../MaskedEngine/types";

// Короче
// 1. Регенерация маски заключается в возможности её восстановления после удаления.
// 2. Допущения: удаляется только сплошной непрерывный блок.
// 3. Нужно найти этот блок и восстановить участок маски
// 4. В оригинале, если маска такая: 000LL00, удаление символов т.о,
//    что при перемещении символов оные двигаются не в свою зону, невозможно.
//    Т.е. регенерация маски должна приводить к полному восстановлению её значения, если удаление инвалидно
test("Регенерирует кусок простой маски", () => {
    maskSynthetizerIncludeEither.generate("9999");
    maskSynthetizerIncludeEither.putSymbols("198", 0);
    maskSynthetizerIncludeEither.regenerate("18_");
    const regenerated = maskSynthetizerIncludeEither.toString((s) => s.textMaskFormat);

    expect(regenerated).toBe("18__");
});


test("Регенерирует кусок маски c литералом", () => {
    maskSynthetizerIncludeEither.generate("99.99");
    maskSynthetizerIncludeEither.putSymbols("198", 0); // 19.8_
    maskSynthetizerIncludeEither.regenerate("18_");
    const regenerated = maskSynthetizerIncludeEither.toString(() => MaskFormat.IncludePromptAndLiterals);

    expect(regenerated).toBe("18.__");
});

test("Регенерирует маску, потому что цифровой символ попадает на цифровой", () => {
    maskSynthetizer.generate("99L99");
    maskSynthetizer.putSymbols("19a4", 0); // 19
    maskSynthetizer.regenerate("14_");
    const regenerated = maskSynthetizer.toString((s) => s.textMaskFormat);

    expect(regenerated).toBe("14   ");
});

test("Откатывает к исходному состоянию, потому что новый вариант не подходит под маску", () => {
    maskSynthetizer.generate("99L99");
    maskSynthetizer.putSymbols("19a4", 0); // 19
    maskSynthetizer.regenerate("1a4_");
    const regenerated = maskSynthetizer.toString((s) => s.textMaskFormat);

    expect(regenerated).toBe("19a4 ");
});

test("Регенерирует маску и принимает изменнеия, потому что символы подходят, в новом месте торчит литерал", () => {
    maskSynthetizer.generate("99L.L99LL");
    maskSynthetizer.putSymbols("19aa68dd", 0); // 19a.a68dd
    maskSynthetizer.regenerate("68dd");
    const regenerated = maskSynthetizer.toString(() => MaskFormat.IncludePromptAndLiterals);

    expect(regenerated).toBe("68d.d____");
});

test("Регенерирует маску и принимает изменения, в старом месте литералы", () => {
    maskSynthetizer.generate("99L.L99.L.L");
    maskSynthetizer.putSymbols("19aa68dd", 0); // 19a.a68.d.d
    maskSynthetizer.regenerate("68.d.d");
    const regenerated = maskSynthetizer.toString(() => MaskFormat.IncludePromptAndLiterals);

    expect(regenerated).toBe("68d.d__._._");
})

test("Регенерирует как гидра.. ЕМУ СНЕСЛО БОШКУ, А ОНА ОТРОСЛА!!!1", () => {
    maskSynthetizer.generate("99L.L99.L.L");
    maskSynthetizer.putSymbols("19aa68dd", 0); // 19a.a68.d.d
    maskSynthetizer.regenerate("19a.a");
    const regenerated = maskSynthetizer.toString(() => MaskFormat.IncludePromptAndLiterals);

    expect(regenerated).toBe("19a.a__._._");
})

test("Правильно регенерирует маску со смесью обязательных и необязательных символов: удаление и смещение возможно", () => {
    maskSynthetizer.generate("00.900");
    maskSynthetizer.putSymbols("42.13", 0);
    maskSynthetizer.regenerate("4.13_");
    const regenerated = maskSynthetizer.toString(() => MaskFormat.IncludePromptAndLiterals);

    expect(regenerated).toBe("41.3__")
})

test("регенерирует маску, когда удалён последний символ", () => {
    maskSynthetizer.generate("00.99");
    maskSynthetizer.putSymbols("8", 0);
    maskSynthetizer.regenerate("_.__");
    const regenerated = maskSynthetizer.toString(() => MaskFormat.IncludePromptAndLiterals);

    expect(regenerated).toBe("__.__")
})