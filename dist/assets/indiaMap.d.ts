declare const indiaMap: {
    type: string;
    objects: {
        default: {
            type: string;
            geometries: ({
                type: string;
                arcs: number[][][];
                id: string;
                properties: {
                    "hc-group": string;
                    "hc-key": string;
                    "hc-a2": string;
                    name: string;
                    "hc-middle-x"?: undefined;
                    "hc-middle-y"?: undefined;
                };
            } | {
                type: string;
                arcs: number[][][];
                id: string;
                properties: {
                    "hc-group": string;
                    "hc-key": string;
                    "hc-a2": string;
                    name: string;
                    "hc-middle-x": number;
                    "hc-middle-y": number;
                };
            } | {
                type: string;
                arcs: number[][];
                id: string;
                properties: {
                    "hc-group": string;
                    "hc-key": string;
                    "hc-a2": string;
                    name: string;
                    "hc-middle-x"?: undefined;
                    "hc-middle-y"?: undefined;
                };
            } | {
                type: string;
                arcs: number[][];
                id: string;
                properties: {
                    "hc-group": string;
                    "hc-key": string;
                    "hc-a2": string;
                    name: string;
                    "hc-middle-x": number;
                    "hc-middle-y": number;
                };
            } | {
                type: string;
                arcs: number[][];
                id: string;
                properties: {
                    "hc-group": string;
                    "hc-key": string;
                    "hc-a2": string;
                    name: string;
                    "hc-middle-y": number;
                    "hc-middle-x"?: undefined;
                };
            })[];
            "hc-recommended-transform": {
                default: {
                    crs: string;
                    scale: number;
                    jsonres: number;
                    jsonmarginX: number;
                    jsonmarginY: number;
                    xoffset: number;
                    yoffset: number;
                };
            };
        };
    };
    arcs: number[][][];
    bbox: number[];
    transform: {
        scale: number[];
        translate: number[];
    };
};
export default indiaMap;
