import MaskCharSynthetizer from "../MaskedEngine/maskSynthetizer";
import { MaskFormat } from "../MaskedEngine/types";

export const maskSynthetizerPrompt = new MaskCharSynthetizer();
maskSynthetizerPrompt.applySettings({
    beepOnError: false,
    cutCopyMaskFormat: MaskFormat.IncludePromptAndLiterals,
    hidePromptOnLeave: false,
    promptSymbol: "_",
    rejectInputOnFirstFailure: false,
    resetOnPrompt: true,
    resetOnSpace: false,
    skipLiterals: false,
    textMaskFormat: MaskFormat.ExcludePromptAndLiterals,
});

describe("Tests for resetting symbols by typing prompt or space", () => {
    it("НЕ сбрасывает символ промптом, потому что нет свободного места", () => {
        maskSynthetizerPrompt.generate("9999");
        maskSynthetizerPrompt.putSymbols("1234", 0);
        maskSynthetizerPrompt.putSymbols("_", 1);

        const actual = maskSynthetizerPrompt.toString((s) => s.textMaskFormat);

        expect(actual).toBe("1234");
    });

    it("Сбрасывает символ промптом и двигает движимое, промпт не попадает в вывод", () => {
        maskSynthetizerPrompt.generate("9999");
        maskSynthetizerPrompt.putSymbols("123", 0);
        maskSynthetizerPrompt.putSymbols("_", 1);

        const actual = maskSynthetizerPrompt.toString((s) => s.textMaskFormat);

        expect(actual).toBe("1 23");
    });
});
