import { useState } from "react"
import DiagramSVG from "./Diagram/DiagramSVG"
const TesSVG = () => {
    const [components, setComponents] = useState([
        {
            id: 'R1',
            name: "VAR-RES",
            value: "10k",
            pins_rblt: [
                [{
                    id: 7,
                    name: "3"
                }],
                [{
                    id: 8,
                    name: "2"
                }],
                [{
                    id: 9,
                    name: "1"
                }],
                []
            ]
        },
        {
            id: 'OA1',
            name: "OP AMP",
            value: "LM741",
            pins_rblt: [
                [
                    {
                        id: 0,
                        name: "OUT",
                        line_name: "out"
                    },
                ],
                [
                    {
                        id: 1,
                        name: "Offset -"
                    },
                    {
                        id: 2,
                        name: "V-"
                    }
                ],
                [
                    {
                        id: 3,
                        name: "Inv"
                    },
                    {
                        id: 4,
                        name: "Non-Inv"
                    }
                ],
                [
                    {
                        id: 5,
                        name: "V+"
                    },
                    {
                        id: 6,
                        name: "Offset +"
                    }
                ]
            ]
        },
        {
            id: 'R2',
            name: "RES",
            value: "10k",
            pins_rblt: [
                [{
                    id: 10,
                    name: "",
                    line_name: "tes"
                }],
                [],
                [{
                    id: 11,
                    name: ""
                }],
                []
            ]
        },
        {
            id: 'R3',
            name: "RES",
            value: "2k",
            pins_rblt: [
                [{
                    id: 12,
                    name: ""
                }],
                [],
                [{
                    id: 13,
                    name: ""
                }],
                []
            ]
        }
    ])
    const [lines, setLines] = useState([
        {
            id: 0,
            pins_id: [6, 9]
        },
        {
            id: 1,
            pins_id: [1, 7]
        },
        {
            id: 2,
            pins_id: [8, 4, 12]
        },
        {
            id: 3,
            pins_id: [0, 10]
        },
        {
            id: 4,
            pins_id: [11, 13, 3]
        },
        {
            id: 5,
            pins_id: [0, 11]
        },
    ])
    return (<div
        style={{
            margin: 50,
            border: "1px solid",
            height: '75vh',
            width: '75vw',
            position: 'fixed'
        }}
    >
        <DiagramSVG
            components={components}
            lines={lines}
            onConnect={(e,data)=>console.log('connect',data)}
            onDoubleClick={(e,data)=>console.log('dbl click',data)}
        />
    </div>)
}

export default TesSVG