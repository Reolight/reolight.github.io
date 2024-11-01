import React from "react";
import MaskCharSynthetizer from "./maskSynthetizer";
import { MaskedInputSettings } from "./types";

class MaskProcessor2 {
    private ref: React.MutableRefObject<HTMLInputElement>;
    private synthetizer: MaskCharSynthetizer;
    private settings: MaskedInputSettings;

    /** callback to update displayable value at higher level */
    private updateSrcValue: ((maskedValue: string) => void) | undefined =
        undefined;

    public get value(): string {
        return this.synthetizer.value;
    }

    constructor(
        mask: string,
        settings: MaskedInputSettings,
        ref: React.MutableRefObject<HTMLInputElement>,
        valueUpdate?: (maskedValue: string) => void
    ) {
        this.ref = ref;
        this.settings = settings;
        this.synthetizer = new MaskCharSynthetizer(settings);
        this.synthetizer.generate(mask);

        this.synthetizer.hidden =
            settings.hidePromptOnLeave &&
            ref.current !== document.activeElement;

        this.updateSrcValue = valueUpdate;

        this.invokeUpdate();
    }

    public applyValue(value: string) {
        const lastPuttedIdx = this.synthetizer.putSymbols(value, 0);
        this.invokeUpdate(lastPuttedIdx);
    }

    private invokeUpdate(caretStart?: number, caretEnd?: number) {
        const value = this.synthetizer.value;
        const start = caretStart ?? value.length;
        const end = caretEnd ?? start;
        this.ref.current.value = value;
        this.ref.current.selectionStart = start;
        this.ref.current.selectionEnd = end;

        if (this.updateSrcValue) {
            this.updateSrcValue(value);
        }
    }

    private hidePrompts() {
        this.synthetizer.hidden = true;
        this.invokeUpdate();
    }

    private showPrompts() {
        if (this.settings.hidePromptOnLeave) this.synthetizer.hidden = false;
        this.invokeUpdate();
        const actualIdx = this.synthetizer.lastActualIdx;
        this.ref.current.selectionStart = actualIdx;
        this.ref.current.selectionEnd = actualIdx;
    }

    private get selectionStartIdx(): number {
        return this.ref.current.selectionStart ?? 1;
    }

    private get selectionEndIdx(): number {
        return this.ref.current.selectionEnd ?? 1;
    }

    private set selectionStartIdx(value: number) {
        this.ref.current.selectionStart = value;
    }

    private set selectionEndIdx(value: number) {
        this.ref.current.selectionEnd = value;
    }

    private onBeforeInput(e: Event) {
        const event = e as InputEvent;
        console.debug("onBeforeInput launched");
        if (event.inputType.startsWith("insert")) {
            event.preventDefault();
            const data = event.data;

            const startIdx = this.selectionStartIdx,
                endIdx = this.selectionEndIdx;
            if (startIdx !== endIdx) {
                const value = this.synthetizer.value;
                const newValue = value.substring(startIdx, endIdx);
                this.synthetizer.regenerate(newValue, startIdx);
            }

            try {
                const lastPuttedIdx = data
                    ? this.synthetizer.putSymbols(data, startIdx)
                    : 0;

                this.invokeUpdate(lastPuttedIdx);
            } catch (e) {
                const error = e as Error;
                console.error(error.message);
            }

            console.debug(
                "\tInput data:",
                event.data,
                "event type: ",
                event.inputType
            );
        }
    }

    private onInput() {
        const currentValue = this.ref.current.value;
        const storedValue = this.synthetizer.value;
        console.debug("onInput: ", currentValue, "stored: ", storedValue);
        if (currentValue.length !== storedValue.length) {
            const diffIdx = this.synthetizer.regenerate(currentValue);
            console.debug(
                "\tregenerated: ",
                this.synthetizer.value,
                "idx:",
                diffIdx
            );
            this.invokeUpdate(diffIdx);
        }
    }

    private onCopy(e: Event) {
        const event = e as ClipboardEvent;
        const copied = this.synthetizer.toString(
            (settings) => settings.cutCopyMaskFormat
        );
        event.clipboardData?.setData("text/plain", copied);
        event.preventDefault();
    }

    public get output(): string {
        return this.synthetizer.toString((settings) => settings.textMaskFormat);
    }

    private hidePromptsBound = this.hidePrompts.bind(this);
    private showPromptsBound = this.showPrompts.bind(this);
    private onInputBound = this.onInput.bind(this);
    private onBeforeInputBound = this.onBeforeInput.bind(this);
    private onCopyBound = this.onCopy.bind(this);

    public attachListeners() {
        if (this.settings.hidePromptOnLeave) {
            this.ref.current.addEventListener("blur", this.hidePromptsBound);
        }

        this.ref.current.addEventListener("focus", this.showPromptsBound);
        this.ref.current.addEventListener("input", this.onInputBound);
        this.ref.current.addEventListener(
            "beforeinput",
            this.onBeforeInputBound
        );
        this.ref.current.addEventListener("copy", this.onCopyBound);
    }

    public deattachListeners() {
        if (this.settings.hidePromptOnLeave) {
            this.ref.current.removeEventListener("blur", this.hidePromptsBound);
        }

        this.ref.current.removeEventListener("focus", this.showPromptsBound);
        this.ref.current.removeEventListener("input", this.onInputBound);
        this.ref.current.removeEventListener(
            "beforeinput",
            this.onBeforeInputBound
        );
        this.ref.current.removeEventListener("copy", this.onCopyBound);
    }
}

export default MaskProcessor2;
