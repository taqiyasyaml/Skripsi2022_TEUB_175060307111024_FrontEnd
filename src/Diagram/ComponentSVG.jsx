import { Fragment } from "react"
import properties from "./DiagramProperties"
// const properties = {
//     nodeSize: 20,
//     nodeColor: 'grey',
//     pickedNodeColor: 'black',
//     margin: 10,
//     outerRoundRect: 10,
//     outerRectOpacity: 0.8,
//     outerRectFillColor: 'lightgrey',
//     outerRectStroke: 5,
//     outerRectStrokeColor: 'grey',
//     detailRectPadding: 5,
//     detailRectStroke: 2,
//     detailRectStrokeColor: 'black',
//     detailRectStrokeDash: [2],
//     measureTextCanvasFactor: 2
// }

const centerStart = ({ maxValue = 0, val = 0 }) => {
    if (isNaN(val) || val < 0 || isNaN(maxValue) || maxValue < 0 || maxValue <= val)
        return 0
    else
        return (maxValue - val) / 2.0
}

const getDetailComponent = ({ x = 0, y = 0, componentProperties = {} }) => {
    const originalComponentProperties = typeof componentProperties == 'object' ? JSON.parse(JSON.stringify(componentProperties)) : {
        id: "Component ID (ex: R1, L1, C1)",
        name: "Component Name (ex: RES, CAP)",
        value: "Component Value (ex: 100mH, 100uF)",
        pins_rblt: [[], [], [], []]
    }
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    const default_font = tempCtx.font
    const default_height_font = parseInt(default_font)
    const nodeGrid = { height: 0, font_top: 0, node_top: 0 }
    if (default_height_font > properties.nodeSize) {
        nodeGrid.height = default_height_font
        nodeGrid.node_top = centerStart({ maxValue: default_height_font, val: properties.nodeSize })
    } else {
        nodeGrid.height = properties.nodeSize
        nodeGrid.font_top = centerStart({ val: default_height_font, maxValue: properties.nodeSize })
    }
    const RBLTandDetailHeightWidth = [{ w: properties.margin, h: properties.margin }, { w: properties.margin, h: properties.margin }, { w: properties.margin, h: properties.margin }, { w: properties.margin, h: properties.margin }, { w: properties.margin, h: properties.margin }]
    const tempComponentProperties = {
        x, y,
        width: 2 * (properties.margin + properties.detailRectStroke + properties.detailRectPadding), height: 2 * (properties.margin + properties.detailRectStroke + properties.detailRectPadding),
        detail_rect: {
            x_start: properties.margin, y_start: properties.margin,
            x_stop: properties.margin + 2 * properties.detailRectPadding, y_stop: properties.margin + 2 * properties.detailRectPadding,
            width: 2 * properties.detailRectPadding, height: 2 * properties.detailRectPadding
        },
        id: {
            value: originalComponentProperties?.id ?? "Component ID (ex: R1, L1, C1)",
            text_length: 0, width: 0, height: default_height_font, x: 0, y: 0
        },
        name: {
            value: originalComponentProperties?.name ?? "Component Name (ex: RES, CAP)",
            text_length: 0, width: 0, height: default_height_font, x: 0, y: 0
        },
        value: {
            value: originalComponentProperties?.value ?? "Component Value (ex: 100mH, 100uF)",
            text_length: 0, width: 0, height: default_height_font, x: 0, y: 0
        },
        pins_rblt: [[], [], [], []]
    }

    tempCtx.font = "normal normal bold " + default_font
    tempComponentProperties.id.width = tempComponentProperties.id.text_length = tempCtx.measureText(tempComponentProperties.id.value).width * properties.measureTextCanvasFactor
    tempCtx.font = "normal normal normal " + default_font
    tempComponentProperties.name.width = tempComponentProperties.name.text_length = tempCtx.measureText(tempComponentProperties.name.value).width * properties.measureTextCanvasFactor
    tempCtx.font = "italic normal normal " + default_font
    tempComponentProperties.value.width = tempComponentProperties.value.text_length = tempCtx.measureText(tempComponentProperties.value.value).width * properties.measureTextCanvasFactor
    tempCtx.font = default_font

    RBLTandDetailHeightWidth[4].h = 3 * default_height_font + 4 * properties.margin
    RBLTandDetailHeightWidth[4].w = Math.max(tempComponentProperties.id.width, tempComponentProperties.name.width, tempComponentProperties.value.width) + 2 * properties.margin
    const pinsID = []
    for (let rblt = 0; rblt < 4; rblt++) {
        const tempPinS = originalComponentProperties?.pins_rblt?.[rblt] ?? []
        if (!Array.isArray(tempPinS))
            continue
        for (const pin of tempPinS) {
            const tempPin = {
                id: pin?.id,
                name: pin?.name ?? pin?.id ?? "",
                bracket_name: pin?.bracket_name,
                line_name: pin?.line_name,
                text_length: 0, width: 0, height: 0, x: 0, y: 0, rotate: ([0, 90, 0, 270])[rblt], node: { x: 0, y: 0 }
            }
            if (pinsID.includes(tempPin.id))
                tempPin.id = null
            else if (tempPin.id !== null)
                pinsID.push(tempPin.id)
            if (tempPin.line_name === '')
                tempPin.line_name = null
            tempCtx.font = "normal normal normal " + default_font
            tempPin.text_length = tempCtx.measureText(
                `${pin?.name ?? pin?.id ?? ""}${pin?.bracket_name !== undefined && pin?.bracket_name !== null && pin?.bracket_name !== '' ? ` (${pin.bracket_name})` : ''}`
            ).width * properties.measureTextCanvasFactor
            tempCtx.font = default_font
            if (([1, 3]).includes(rblt)) {
                tempPin.height = tempPin.text_length
                tempPin.width = default_height_font
                RBLTandDetailHeightWidth[rblt].h = Math.max(RBLTandDetailHeightWidth[rblt].h, tempPin.height + properties.margin + properties.nodeSize)
            } else {
                tempPin.width = tempPin.text_length
                tempPin.height = default_height_font
                RBLTandDetailHeightWidth[rblt].w = Math.max(RBLTandDetailHeightWidth[rblt].w, tempPin.width + properties.margin + properties.nodeSize)
            }
            if (([1, 2]).includes(rblt))
                tempComponentProperties.pins_rblt[rblt].unshift(tempPin)
            else
                tempComponentProperties.pins_rblt[rblt].push(tempPin)
        }
        if (([1, 3]).includes(rblt))
            RBLTandDetailHeightWidth[rblt].w = Math.max(RBLTandDetailHeightWidth[rblt].w,
                tempComponentProperties.pins_rblt[rblt].length * nodeGrid.height + (tempComponentProperties.pins_rblt[rblt].length + 1) * properties.margin)
        else
            RBLTandDetailHeightWidth[rblt].h = Math.max(RBLTandDetailHeightWidth[rblt].h,
                tempComponentProperties.pins_rblt[rblt].length * nodeGrid.height + (tempComponentProperties.pins_rblt[rblt].length + 1) * properties.margin)
    }
    const colHeight = [
        RBLTandDetailHeightWidth[2].h,
        RBLTandDetailHeightWidth[1].h + RBLTandDetailHeightWidth[4].h + RBLTandDetailHeightWidth[3].h + 2 * (properties.detailRectStroke + properties.detailRectPadding + properties.margin),
        RBLTandDetailHeightWidth[0].h
    ]
    if (RBLTandDetailHeightWidth[1].w > RBLTandDetailHeightWidth[4].w) {
        colHeight[0] += RBLTandDetailHeightWidth[1].h + properties.margin
        colHeight[2] += RBLTandDetailHeightWidth[1].h + properties.margin
    }
    if (RBLTandDetailHeightWidth[3].w > RBLTandDetailHeightWidth[4].w) {
        colHeight[0] += RBLTandDetailHeightWidth[3].h + properties.margin
        colHeight[2] += RBLTandDetailHeightWidth[3].h + properties.margin
    }
    tempComponentProperties.height = Math.max(...colHeight, tempComponentProperties.height)
    const rowWidth = [
        RBLTandDetailHeightWidth[3].w,
        RBLTandDetailHeightWidth[0].w + RBLTandDetailHeightWidth[4].w + RBLTandDetailHeightWidth[2].w + 2 * (properties.detailRectStroke + properties.detailRectPadding + properties.margin),
        RBLTandDetailHeightWidth[1].w
    ]
    if (RBLTandDetailHeightWidth[0].h > RBLTandDetailHeightWidth[4].h) {
        rowWidth[0] += RBLTandDetailHeightWidth[0].w + properties.margin
        rowWidth[2] += RBLTandDetailHeightWidth[0].w + properties.margin
    }
    if (RBLTandDetailHeightWidth[2].h > RBLTandDetailHeightWidth[4].h) {
        rowWidth[0] += RBLTandDetailHeightWidth[2].w + properties.margin
        rowWidth[2] += RBLTandDetailHeightWidth[2].w + properties.margin
    }
    tempComponentProperties.width = Math.max(...rowWidth, tempComponentProperties.width)

    tempComponentProperties.detail_rect.x_start = properties.margin
    tempComponentProperties.detail_rect.x_stop = tempComponentProperties.width - properties.margin
    tempComponentProperties.detail_rect.y_start = properties.margin
    tempComponentProperties.detail_rect.y_stop = tempComponentProperties.height - properties.margin

    let lastXLeft = 0
    let lastYTop = 0
    //Right
    lastXLeft = 0
    lastYTop = centerStart({ maxValue: tempComponentProperties.height, val: RBLTandDetailHeightWidth[0].h })
    for (let i_r = 0; i_r < tempComponentProperties.pins_rblt[0].length; i_r++) {
        lastYTop += properties.margin
        tempComponentProperties.pins_rblt[0][i_r].node.x = tempComponentProperties.width - properties.nodeSize
        tempComponentProperties.pins_rblt[0][i_r].node.y = lastYTop + nodeGrid.node_top
        tempComponentProperties.pins_rblt[0][i_r].x = tempComponentProperties.pins_rblt[0][i_r].node.x - properties.margin - tempComponentProperties.pins_rblt[0][i_r].width
        tempComponentProperties.pins_rblt[0][i_r].y = lastYTop + nodeGrid.font_top + default_height_font
        tempComponentProperties.detail_rect.x_stop = i_r == 0
            ? (tempComponentProperties.pins_rblt[0][i_r].x - properties.margin)
            : Math.min(tempComponentProperties.detail_rect.x_stop, (tempComponentProperties.pins_rblt[0][i_r].x - properties.margin))
        lastYTop += nodeGrid.height
    }
    //Bottom
    lastXLeft = centerStart({ maxValue: tempComponentProperties.width, val: RBLTandDetailHeightWidth[1].w })
    lastYTop = 0
    for (let i_b = 0; i_b < tempComponentProperties.pins_rblt[1].length; i_b++) {
        lastXLeft += properties.margin
        tempComponentProperties.pins_rblt[1][i_b].node.x = lastXLeft + nodeGrid.node_top
        tempComponentProperties.pins_rblt[1][i_b].node.y = tempComponentProperties.height - properties.nodeSize
        tempComponentProperties.pins_rblt[1][i_b].x = lastXLeft + nodeGrid.font_top
        tempComponentProperties.pins_rblt[1][i_b].y = tempComponentProperties.pins_rblt[1][i_b].node.y - properties.margin - tempComponentProperties.pins_rblt[1][i_b].height
        tempComponentProperties.detail_rect.y_stop = i_b == 0
            ? (tempComponentProperties.pins_rblt[1][i_b].y - properties.margin)
            : Math.min(tempComponentProperties.detail_rect.y_stop, (tempComponentProperties.pins_rblt[1][i_b].y - properties.margin))
        lastXLeft += nodeGrid.height
    }
    //Left
    lastXLeft = 0
    lastYTop = centerStart({ maxValue: tempComponentProperties.height, val: RBLTandDetailHeightWidth[2].h })
    for (let i_l = 0; i_l < tempComponentProperties.pins_rblt[2].length; i_l++) {
        lastYTop += properties.margin
        tempComponentProperties.pins_rblt[2][i_l].node.x = 0
        tempComponentProperties.pins_rblt[2][i_l].node.y = lastYTop + nodeGrid.node_top
        tempComponentProperties.pins_rblt[2][i_l].x = properties.nodeSize + properties.margin
        tempComponentProperties.pins_rblt[2][i_l].y = lastYTop + nodeGrid.font_top + default_height_font
        tempComponentProperties.detail_rect.x_start = Math.max(tempComponentProperties.detail_rect.x_start,
            (tempComponentProperties.pins_rblt[2][i_l].x + tempComponentProperties.pins_rblt[2][i_l].width + properties.margin))
        lastYTop += nodeGrid.height
    }
    //Top
    lastXLeft = centerStart({ maxValue: tempComponentProperties.width, val: RBLTandDetailHeightWidth[3].w })
    lastYTop = 0
    for (let i_t = 0; i_t < tempComponentProperties.pins_rblt[3].length; i_t++) {
        lastXLeft += properties.margin
        tempComponentProperties.pins_rblt[3][i_t].node.x = lastXLeft + nodeGrid.node_top
        tempComponentProperties.pins_rblt[3][i_t].node.y = 0
        tempComponentProperties.pins_rblt[3][i_t].x = lastXLeft + nodeGrid.font_top + default_height_font
        tempComponentProperties.pins_rblt[3][i_t].y = properties.nodeSize + properties.margin + tempComponentProperties.pins_rblt[3][i_t].height
        tempComponentProperties.detail_rect.y_start = Math.max(tempComponentProperties.detail_rect.y_start,
            (tempComponentProperties.pins_rblt[3][i_t].y + properties.margin))
        lastXLeft += nodeGrid.height
    }
    //Detail
    tempComponentProperties.detail_rect.width = tempComponentProperties.detail_rect.x_stop - 2 * properties.detailRectStroke - tempComponentProperties.detail_rect.x_start
    tempComponentProperties.detail_rect.height = tempComponentProperties.detail_rect.y_stop - 2 * properties.detailRectStroke - tempComponentProperties.detail_rect.y_start
    const detailBoxWithPadding = {
        x_start: tempComponentProperties.detail_rect.x_start + properties.detailRectStroke + properties.detailRectPadding,
        y_start: tempComponentProperties.detail_rect.y_start + properties.detailRectStroke + properties.detailRectPadding,
        width: tempComponentProperties.detail_rect.width - 2 * properties.detailRectPadding,
        height: tempComponentProperties.detail_rect.height - 2 * properties.detailRectPadding,
    }
    tempComponentProperties.id.x = detailBoxWithPadding.x_start + centerStart({ maxValue: detailBoxWithPadding.width, val: tempComponentProperties.id.text_length })
    tempComponentProperties.id.y = detailBoxWithPadding.y_start + centerStart({ maxValue: detailBoxWithPadding.height, val: RBLTandDetailHeightWidth[4].h }) + properties.margin + default_height_font
    tempComponentProperties.name.x = detailBoxWithPadding.x_start + centerStart({ maxValue: detailBoxWithPadding.width, val: tempComponentProperties.name.text_length })
    tempComponentProperties.name.y = tempComponentProperties.id.y + default_height_font + properties.margin
    tempComponentProperties.value.x = detailBoxWithPadding.x_start + centerStart({ maxValue: detailBoxWithPadding.width, val: tempComponentProperties.value.text_length })
    tempComponentProperties.value.y = tempComponentProperties.name.y + default_height_font + properties.margin

    return tempComponentProperties
}

const orderComponents = ({ existComponents, unorderComponents, maxWidth = 0 }) => {
    const tempComponents = []
    const tempPins = []
    const currentComponents = Array.isArray(unorderComponents) ? JSON.parse(JSON.stringify(unorderComponents)) : []
    const doneComponentIDs = []
    const donePinIDs = []
    let mostBottom = properties.margin

    for (const c of currentComponents) {
        if (c?.id === undefined || c?.id === null || doneComponentIDs.includes(c.id))
            continue
        doneComponentIDs.push(c.id)
        const tempC = getDetailComponent({ componentProperties: c })
        for (const [rblt, pins] of tempC.pins_rblt.entries()) {
            for (const [i_pin, pin] of pins.entries()) {
                if (pin?.id === undefined || pin?.id == null) continue
                if (donePinIDs.includes(pin.id)) tempC.pins_rblt[rblt][i_pin].id = null
                else {
                    donePinIDs.push(pin.id)
                    tempPins.push({ id: pin.id, rblt, i_rblt: i_pin, component_id: c.id, i_component: tempComponents.length, line_name: pin?.line_name })
                }
            }
        }
        const existC = existComponents.find(cp => cp?.id?.value === c.id)
        if (existC !== undefined) {
            tempC.x = existC.x
            tempC.y = existC.y
        } else {
            if (tempComponents.length == 0) {
                tempC.x = properties.margin
                tempC.y = properties.margin
            } else {
                tempC.x = tempComponents[tempComponents.length - 1].x + tempComponents[tempComponents.length - 1].width + 2 * properties.outerRectStroke + properties.margin
                tempC.y = tempComponents[tempComponents.length - 1].y
                if (maxWidth > 0 && (tempC.x + tempC.width) > maxWidth) {
                    tempC.x = properties.margin
                    tempC.y = mostBottom
                }
            }
            if ((tempC.y + tempC.height + 2 * properties.outerRectStroke) > mostBottom)
                mostBottom = tempC.y + tempC.height + 2 * properties.outerRectStroke
        }
        tempComponents.push(tempC)
    }
    return { components: tempComponents, pins: tempPins }
}

const ComponentSVG = ({ detailComponent, pickedPins = [] }) => {
    return (<Fragment>
        <g transform={`translate(${detailComponent?.x ?? 0},${detailComponent?.y ?? 0})`} key="group_component">
            <rect
                width={detailComponent?.width ?? (2 * (properties.margin + properties.detailRectStroke + properties.detailRectPadding))}
                height={detailComponent?.height ?? (2 * (properties.margin + properties.detailRectStroke + properties.detailRectPadding))}
                stroke={properties.outerRectStrokeColor}
                strokeWidth={properties.outerRectStroke}
                rx={properties.outerRoundRect}
                fill={properties.outerRectFillColor}
                opacity={properties.outerRectOpacity}
                key="main_component"
            />
            <rect
                width={detailComponent?.detail_rect?.width ?? 2 * properties.detailRectPadding}
                height={detailComponent?.detail_rect?.height ?? 2 * properties.detailRectPadding}
                stroke={properties.detailRectStrokeColor}
                strokeWidth={properties.detailRectStroke}
                strokeDasharray={properties.detailRectStrokeDash}
                transform={`translate(${detailComponent?.detail_rect?.x_start ?? properties.margin},${detailComponent?.detail_rect?.y_start ?? properties.margin})`}
                fill="none"
                key="detail_component"
            />
            {
                (detailComponent?.pins_rblt ?? []).map(pins => pins.map((pin, i) => (
                    <Fragment key={`group_${pin?.id ?? i}`}>
                        <rect
                            width={properties.nodeSize}
                            height={properties.nodeSize}
                            fill={pin?.id !== null && Array.isArray(pickedPins) && pickedPins.includes(pin.id) ? properties.pickedNodeColor : properties.nodeColor}
                            transform={`translate(${pin?.node?.x ?? 0},${pin?.node?.y ?? 0})`}
                            key={`node_${pin?.id ?? i}`}
                        />
                        <text
                            textLength={pin.text_length}
                            transform={`translate(${pin?.x ?? 0},${pin?.y ?? 0}) rotate(${pin?.rotate ?? 0})`}
                            key={`name_${pin?.id ?? i}`}
                        >{`${pin?.name ?? pin?.id ?? ""}${pin?.bracket_name !== undefined && pin?.bracket_name !== null && pin?.bracket_name !== '' ? ` (${pin.bracket_name})` : ''}`}</text>
                    </Fragment>
                )))
            }
            <text
                fontWeight="bold"
                textLength={detailComponent?.id?.text_length ?? 0}
                transform={`translate(${detailComponent?.id?.x ?? 0},${detailComponent?.id?.y ?? 0})`}
                key={`component_id`}
            >{detailComponent?.id?.value}</text>
            <text
                textLength={detailComponent?.name?.text_length ?? 0}
                transform={`translate(${detailComponent?.name?.x ?? 0},${detailComponent?.name?.y ?? 0})`}
                key={`component_name`}
            >{detailComponent?.name?.value}</text>
            <text
                fontStyle="italic"
                textLength={detailComponent?.value?.text_length ?? 0}
                transform={`translate(${detailComponent?.value?.x ?? 0},${detailComponent?.value?.y ?? 0})`}
                key={`component_value`}
            >{detailComponent?.value?.value}</text>
        </g>
    </Fragment>)
}

export { getDetailComponent, orderComponents, ComponentSVG }