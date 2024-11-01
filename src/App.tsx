import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import useMaskedText from "./MaskedEngine/useMaskedText";
import { MaskedInputSettings } from "./MaskedEngine/types";
import SettingsView from "./Settings";
import { defaultSettigns } from "./MaskedEngine/consts";

function App() {
    const textRef = useRef<HTMLInputElement>(null!);

    const [mask, setMask] = useState<string>("00.99");

    const [stg, setStg] = useState<MaskedInputSettings>(() => {
        const saved = localStorage.getItem("MaskedInputSettings");
        if (!saved) return defaultSettigns;
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

    const output = useMaskedText(mask, stg, textRef);

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <input value={mask} onChange={(e) => setMask(e.target.value)} />
            <input ref={textRef} id="test" />
            {output}

            <SettingsView onChange={onStgChange} settings={stg} />
        </div>
    );
}

export default App;
