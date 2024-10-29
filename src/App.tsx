import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import useMaskedText from "./MaskedEngine/useMaskedText";
import { MaskedInputSettings, MaskFormat } from "./MaskedEngine/types";
import SettingsView from "./Settings";

function App() {
    const textRef = useRef<HTMLInputElement>(null!);

    const [mask, setMask] = useState<string>("00.99");

    const [stg, setStg] = useState<MaskedInputSettings>(() => {
        const saved = localStorage.getItem("MaskedInputSettings");
        if (!saved)
            return {
                beepOnError: false,
                cutCopyMaskFormat: MaskFormat.ExcludePromptAndLiterals,
                hidePromptOnLeave: false,
                promptSymbol: "_",
                resetOnPrompt: false,
                resetOnSpace: false,
                skipLiterals: false,
                textMaskFormat: MaskFormat.ExcludePromptAndLiterals,
            };

        return JSON.parse(saved);
    });

    useEffect(() => {
        localStorage.setItem("MaskedInputSettings", JSON.stringify(stg));
    }, [stg]);

    const onStgChange = useCallback(
        (
            field: keyof MaskedInputSettings,
            value: MaskedInputSettings[keyof MaskedInputSettings]
        ) => {
            setStg({
                ...stg,
                [field]: value,
            });
        },
        [stg]
    );

    const [visibleMask, value, processed] = useMaskedText(mask, stg, textRef);

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <input value={mask} onChange={(e) => setMask(e.target.value)} />
            <input ref={textRef} id="test" value={value} />
            {visibleMask}
            {processed}

            <SettingsView onChange={onStgChange} settings={stg} />
        </div>
    );
}

export default App;
