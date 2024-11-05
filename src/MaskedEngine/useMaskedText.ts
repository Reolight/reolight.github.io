import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MaskedInputSettings } from "./types";
import MaskProcessor from "./MaskProcessorEventBased";
import { Logger } from "./logger";

const useMaskedText = (
    mask: string,
    settings: MaskedInputSettings,
    ref: React.MutableRefObject<HTMLInputElement>,
    updateCallback?: (newValue: string) => void,
    initialValue?: string
): [string, string, string[]] => {
    const logger = useMemo(() => new Logger("HOOK"), []);

    const [processor, setProcessor] = useState<MaskProcessor | null>(null);
    const [output, setOutput] = useState<string>("");
    const [errors, setErrors] = useState<string[]>([]);
    const [maskHelper, setMaskHelper] = useState<string>("");

    useEffect(() => {
        if (!ref.current) {
            return undefined;
        }

        const proc = new MaskProcessor(mask, ref);
        setMaskHelper(proc.maskHelper);
        setProcessor(proc);

        if (initialValue) {
            proc.applyValue(initialValue);
        }
    }, [initialValue, mask, ref]);

    useEffect(() => {
        if (processor) processor.applySettings(settings);
    }, [settings, processor]);

    useEffect(() => {
        if (!processor) return;

        processor.applyUpdater((newValue) => {
            setOutput(processor.output);
            setErrors(processor.validate());
            if (updateCallback) updateCallback(newValue);
        });
    }, [processor, updateCallback]);

    const deattach = useCallback(() => {
        if (processor) {
            logger.debug("deattached listeners");
            processor?.deattachListeners();
        }
    }, [logger, processor]);

    const attach = useCallback(() => {
        if (processor) {
            logger.debug("attached listeners");
            processor.attachListeners();
        }
    }, [logger, processor]);

    useEffect(() => {
        attach();
        return deattach;
    }, [attach, deattach, processor, settings]);

    useEffect(() => {
        logger.debug("proc updated");
    }, [logger, processor]);
    useEffect(() => {
        logger.debug("ref updated");
    }, [logger, ref]);

    return [output, maskHelper, errors];
};

export default useMaskedText;
