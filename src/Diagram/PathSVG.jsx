import properties from "./DiagramProperties"
// const properties = {
//     outerRectStrokeWidth: 5,
//     nodeSize: 20,
//     nodeManyPinsSize: 15,
//     nodeManyPinsFill: 'lightgrey',
//     nodeManyPinsStrokeWidth: 2,
//     nodeManyPinsStrokeColor: 'black',
//     nodeManyPinsStrokeDashArray: [2],
//     nodeNamePadding: 10,
//     nodeNameFill: 'grey',
//     nodeNameTextColor: 'white',
//     nodeNameStrokeColor: 'lightgrey',
//     nodeNameStrokeWidth: 2,
//     defaultNodeNamePinMargin: 20,
//     measureTextCanvasFactor: 2,
//     rbltControlPoint: 100,
//     bendFactor: 0.3,
//     bendControlPointFactor: 0.1,
//     controlPointRadius: 7,
//     controlPointStrokeWidth: 1
// }
const getLinesName = ({ lines, pins }) => {
    const tmpLines = []
    const tmpPins = []
    const doneLineIDs = []
    const donePinIDs = []
    const doneLineName = []
    const sameLineName = []

    //Check one pin many lines
    for (const line of lines ?? []) {
        if (line?.id === undefined || line?.id === null || doneLineIDs.includes(line?.id))
            continue
        doneLineIDs.push(line.id)
        const tmpLine = {
            id: line.id,
            pins: [],
            line_name_str: null,
            line_name_pins: []
        }
        for (const pin_id of line?.pins_id) {
            const pin = (pins ?? []).find(p => p?.id == pin_id)
            if (pin === undefined)
                continue
            if (!donePinIDs.includes(pin.id)) {
                donePinIDs.push(pin.id)
                if (pin?.line_name !== undefined && pin?.line_name !== null) {
                    if (doneLineName.includes(pin.line_name)) {
                        if (!sameLineName.includes(pin.line_name)) sameLineName.push(pin.line_name)
                    } else
                        doneLineName.push(pin.line_name)
                }
            }
            tmpLine.pins.push({ id: pin_id, rblt: pin?.rblt ?? 0 })
            const currentPinsLength = tmpPins.length
            for (let i = 0; i <= currentPinsLength; i++) {
                if (i === currentPinsLength)
                    tmpPins.push({ id: pin_id, rblt: pin?.rblt ?? 0, line_name: pin?.line_name, many_line: false })
                else if (tmpPins[i].id == pin_id) {
                    tmpPins[i].many_line = true
                    break;
                }
            }
        }
        if (tmpLine.pins.length > 0)
            tmpLines.push(tmpLine)
    }

    //Name lines
    for (let i = 0; i < tmpLines.length; i++) {
        const line_names = []
        for (const pin of tmpLines[i].pins) {
            const pin_name = tmpPins.find(p => p.id == pin.id)
            if (pin_name?.line_name !== undefined && pin_name?.line_name !== null) {
                let tmpLineName = sameLineName.includes(pin_name.line_name) ? `${pin_name.line_name} (${pin_name.id})` : pin_name.line_name
                line_names.push(pin_name.many_line === true ? `${tmpLineName} ${tmpLines[i].id}` : tmpLineName)
                tmpLines[i].line_name_pins.push({ id: pin_name.id, line_name: pin_name.line_name })
            }
        }
        if (line_names.length > 0)
            tmpLines[i].line_name_str = line_names.join(' , ')
    }
    return tmpLines
}

const getPathsNodes = ({ existPaths, existNodes, lines, pins, components }) => {
    const currentPaths = Array.isArray(existPaths) ? JSON.parse(JSON.stringify(existPaths)) : []
    const currentNodes = Array.isArray(existNodes) ? JSON.parse(JSON.stringify(existNodes)) : []
    const currentComponents = Array.isArray(components) ? JSON.parse(JSON.stringify(components)) : []
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    const default_height_font = parseInt(tempCtx.font)
    tempCtx.font = "normal normal bold " + tempCtx.font
    const tempPaths = []
    const tempNodes = []
    for (const line of lines ?? []) {
        const pinLength = (line?.pins ?? []).length
        if (pinLength == 0)
            continue
        else if (line?.line_name_str !== undefined && line?.line_name_str !== null) {
            const lineNameDimension = {
                height: 2 * properties.nodeNamePadding + default_height_font,
                width: 2 * properties.nodeNamePadding + tempCtx.measureText(line.line_name_str).width * properties.measureTextCanvasFactor,
            }
            for (const pin of line?.pins ?? []) {
                const beforeLineNode = currentNodes.find(n => n?.type == 'line_name' && n?.line_id === line?.id && n?.pin_id === pin?.id)
                if (beforeLineNode === undefined || beforeLineNode === null) {
                    const pinFromMap = (pins ?? []).find(p => p?.id === pin?.id)
                    const pinNode = currentComponents?.[pinFromMap?.i_component]?.pins_rblt?.[pinFromMap?.rblt]?.[pinFromMap?.i_rblt]?.node
                    if (pinNode === undefined || pinNode === null)
                        continue
                    const cPos = { x: currentComponents?.[pinFromMap?.i_component]?.x ?? 0, y: currentComponents?.[pinFromMap?.i_component]?.y ?? 0 }
                    const lineNamePos = { x: 0, y: 0 }
                    switch (pin?.rblt) {
                        case 0:
                            //Right
                            lineNamePos.x = cPos.x + (pinNode?.x ?? 0) + properties.nodeSize + properties.outerRectStrokeWidth + properties.defaultNodeNamePinMargin
                            lineNamePos.y = cPos.y + (pinNode?.y ?? 0) + 0.5 * properties.nodeSize - 0.5 * lineNameDimension.height
                            break;
                        case 1:
                            //Bottom
                            lineNamePos.x = cPos.x + (pinNode?.x ?? 0) + 0.5 * properties.nodeSize - 0.5 * lineNameDimension.width
                            lineNamePos.y = cPos.y + (pinNode?.y ?? 0) + properties.nodeSize + properties.outerRectStrokeWidth + properties.defaultNodeNamePinMargin
                            break;
                        case 2:
                            //Left
                            lineNamePos.x = cPos.x + (pinNode?.x ?? 0) - properties.outerRectStrokeWidth - properties.defaultNodeNamePinMargin - lineNameDimension.width
                            lineNamePos.y = cPos.y + (pinNode?.y ?? 0) + 0.5 * properties.nodeSize - 0.5 * lineNameDimension.height
                            break;
                        case 3:
                            //Top
                            lineNamePos.x = cPos.x + (pinNode?.x ?? 0) + 0.5 * properties.nodeSize - 0.5 * lineNameDimension.width
                            lineNamePos.y = cPos.y + (pinNode?.y ?? 0) - properties.outerRectStrokeWidth - properties.defaultNodeNamePinMargin - lineNameDimension.height
                            break;
                    }
                    tempNodes.push({
                        type: 'line_name', pin_id: pin?.id, line_id: line?.id, line_name: line.line_name_str,
                        line_name_height: default_height_font,
                        line_name_length: lineNameDimension.width - 2 * properties.nodeNamePadding,
                        x: lineNamePos.x,
                        width: lineNameDimension.width,
                        y: lineNamePos.y,
                        height: lineNameDimension.height,
                    })
                } else
                    tempNodes.push({
                        type: 'line_name', pin_id: pin?.id, line_id: line?.id, line_name: line.line_name_str,
                        line_name_height: default_height_font,
                        line_name_length: lineNameDimension.width - 2 * properties.nodeNamePadding,
                        x: beforeLineNode.x ?? 0,
                        width: lineNameDimension.width,
                        y: beforeLineNode.y ?? 0,
                        height: lineNameDimension.height,
                    })
                const beforePath = currentPaths
                    .find(p => p?.to?.type == 'line_name' && p?.from?.pin_id === pin?.id && p?.to?.line_id === line?.id)
                tempPaths.push({
                    from: { pin_id: pin?.id, pin_rblt: pin?.rblt },
                    to: { type: 'line_name', line_id: line?.id },
                    control_points: beforePath?.control_points ?? []
                })
            }
        } else if (pinLength == 1)
            continue
        else if (pinLength == 2) {
            const beforePath = currentPaths.find(
                p => p?.to?.type == 'pin' && (
                    (p?.from?.pin_id === line.pins[0]?.id && p?.to?.pin_id === line.pins[1]?.id) ||
                    (p?.from?.pin_id === line.pins[1]?.id && p?.to?.pin_id === line.pins[0]?.id)
                ))
            tempPaths.push({
                from: { pin_id: line.pins[0]?.id, pin_rblt: line.pins[0]?.rblt },
                to: { type: 'pin', pin_id: line.pins[1]?.id, pin_rblt: line.pins[1]?.rblt },
                control_points: beforePath === undefined ? [] : (
                    (beforePath?.from?.pin_id === line.pins[0]?.id && beforePath?.to?.pin_id === line.pins[1]?.id) ?
                        beforePath?.control_points ?? [] :
                        (beforePath?.control_points ?? []).reverse()
                )
            })
        } else {
            const rect = { x_start: null, y_start: null, x_end: null, y_end: null }
            for (const pin of line?.pins ?? []) {
                const pinFromMap = (pins ?? []).find(p => p?.id === pin?.id)
                if (pinFromMap === undefined || pinFromMap === null)
                    continue
                const beforePath = currentPaths
                    .find(p => p?.to?.type == 'many_pins' && p?.from?.pin_id === pin?.id && p?.to?.line_id === line?.id)
                tempPaths.push({
                    from: { pin_id: pin?.id, pin_rblt: pin?.rblt },
                    to: { type: 'many_pins', line_id: line?.id },
                    control_points: beforePath?.control_points ?? []
                })
                const pinNode = currentComponents?.[pinFromMap?.i_component]?.pins_rblt?.[pinFromMap?.rblt]?.[pinFromMap?.i_rblt]?.node
                if (pinNode === undefined || pinNode === null)
                    continue
                const cPos = { x: currentComponents?.[pinFromMap?.i_component]?.x ?? 0, y: currentComponents?.[pinFromMap?.i_component]?.y ?? 0 }
                rect.x_start = (pinNode?.x !== undefined && pinNode?.x !== undefined) &&
                    (rect.x_start == null || (pinNode.x + cPos.x) < rect.x_start) ? pinNode.x : rect.x_start
                rect.x_end = (pinNode?.x !== undefined && pinNode?.x !== undefined) &&
                    (rect.x_end == null || (pinNode.x + cPos.x + properties.nodeSize) > rect.x_end) ? (pinNode.x + cPos.x + properties.nodeSize) : rect.x_end
                rect.y_start = (pinNode?.y !== undefined && pinNode?.y !== undefined) &&
                    (rect.y_start == null || (pinNode.y + cPos.y) < rect.y_start) ? pinNode.y : rect.y_start
                rect.y_end = (pinNode?.y !== undefined && pinNode?.y !== undefined) &&
                    (rect.y_end == null || (pinNode.y + cPos.y + properties.nodeSize) > rect.y_end) ? (pinNode.y + cPos.y + properties.nodeSize) : rect.y_end
            }
            const beforeLineNode = currentNodes.find(n => n?.type == 'many_pins' && n?.line_id === line?.id)
            tempNodes.push({
                type: 'many_pins', pin_id: null, line_id: line?.id, line_name: null, line_name_length: 0, line_name_height: 0,
                x: beforeLineNode?.x ?? (0.5 * ((rect.x_end ?? 0) - (rect.x_start ?? 0)) - 0.5 * properties.nodeManyPinsSize),
                width: properties.nodeManyPinsSize,
                y: beforeLineNode?.y ?? (0.5 * ((rect.y_end ?? 0) - (rect.y_start ?? 0)) - 0.5 * properties.nodeManyPinsSize),
                height: properties.nodeManyPinsSize,
            })
        }
    }
    return {
        nodes: tempNodes,
        paths: tempPaths
    }
}

const pinToPinBezierCurve = ([{ x: x0 = 0, y: y0 = 0, i_rblt: i_rblt0 = null }, { x: x1 = 0, y: y1 = 0, i_rblt: i_rblt1 = null }]) => {
    x0 = (x0 ?? 0) + + 0.5 * properties.nodeSize
    y0 = (y0 ?? 0) + + 0.5 * properties.nodeSize
    x1 = (x1 ?? 0) + + 0.5 * properties.nodeSize
    y1 = (y1 ?? 0) + + 0.5 * properties.nodeSize
    const bezierCurve = [{ x: x0, y: y0 }, { x: null, y: null }, { x: null, y: null }, { x: x1, y: y1 }]
    switch (i_rblt0) {
        case 0:
            //Right
            bezierCurve[1].x = x0 + (x1 < x0 ? properties.rbltControlPoint : (Math.min((x1 - x0), properties.rbltControlPoint)))
            bezierCurve[1].y = y0 + properties.bendFactor * (y1 - y0)
            break;
        case 1:
            //Bottom
            bezierCurve[1].x = x0 + properties.bendFactor * (x1 - x0)
            bezierCurve[1].y = y0 + (y1 < y0 ? properties.rbltControlPoint : (Math.min((y1 - y0), properties.rbltControlPoint)))
            break;
        case 2:
            //Left
            bezierCurve[1].x = x0 - (x1 > x0 ? properties.rbltControlPoint : (Math.min((x0 - x1), properties.rbltControlPoint)))
            bezierCurve[1].y = y0 + properties.bendFactor * (y1 - y0)
            break;
        case 3:
            //Top
            bezierCurve[1].x = x0 + properties.bendFactor * (x1 - x0)
            bezierCurve[1].y = y0 - (y1 > y0 ? properties.rbltControlPoint : (Math.min((y0 - y1), properties.rbltControlPoint)))
            break;
        default:
            bezierCurve[1].x = x0 + properties.bendFactor * (x1 - x0)
            bezierCurve[1].y = y0 + properties.bendFactor * (y1 - y0)
            break;
    }
    switch (i_rblt1) {
        case 0:
            //Right
            bezierCurve[2].x = x1 + (x0 < x1 ? properties.rbltControlPoint : (Math.min((x0 - x1), properties.rbltControlPoint)))
            bezierCurve[2].y = y1 + properties.bendFactor * (y0 - y1)
            break;
        case 1:
            //Bottom
            bezierCurve[2].x = x1 + properties.bendFactor * (x0 - x1)
            bezierCurve[2].y = y1 + (y0 < y1 ? properties.rbltControlPoint : (Math.min((y0 - y1), properties.rbltControlPoint)))
            break;
        case 2:
            //Left
            bezierCurve[2].x = x1 - (x0 > x1 ? properties.rbltControlPoint : (Math.min((x1 - x0), properties.rbltControlPoint)))
            bezierCurve[2].y = y1 + properties.bendFactor * (y0 - y1)
            break;
        case 3:
            //Top
            bezierCurve[2].x = x1 + properties.bendFactor * (x0 - x1)
            bezierCurve[2].y = y1 - (y0 > y1 ? properties.rbltControlPoint : (Math.min((y1 - y0), properties.rbltControlPoint)))
            break;
        default:
            bezierCurve[2].x = x1 + properties.bendFactor * (x1 - x0)
            bezierCurve[2].y = y1 + properties.bendFactor * (y1 - y0)
            break;
    }
    return bezierCurve
}

const pinToNodeQuadraticCurve = ({ pin = { x: 0, y: 0, i_rblt: null }, node = { x: 0, y: 0, width: 0, height: 0, strokeWidth: 0 } }) => {
    const x0 = (pin?.x ?? 0) + 0.5 * properties.nodeSize
    const y0 = (pin?.y ?? 0) + 0.5 * properties.nodeSize
    const x1 = (node?.x ?? 0) + (node?.strokeWidth ?? 0) + 0.5 * (node?.width ?? 0)
    const y1 = (node?.y ?? 0) + (node?.strokeWidth ?? 0) + 0.5 * (node?.height ?? 0)
    const quadraticCurve = [{ x: x0, y: y0 }, { x: null, y: null }, { x: x1, y: y1 }]
    switch (pin?.i_rblt) {
        case 0:
            //Right
            quadraticCurve[1].x = x0 + (x1 < x0 ? properties.rbltControlPoint : (Math.min((x1 - x0), properties.rbltControlPoint)))
            quadraticCurve[1].y = y0 + properties.bendFactor * (y1 - y0)
            break;
        case 1:
            //Bottom
            quadraticCurve[1].x = x0 + properties.bendFactor * (x1 - x0)
            quadraticCurve[1].y = y0 + (y1 < y0 ? properties.rbltControlPoint : (Math.min((y1 - y0), properties.rbltControlPoint)))
            break;
        case 2:
            //Left
            quadraticCurve[1].x = x0 - (x1 > x0 ? properties.rbltControlPoint : (Math.min((x0 - x1), properties.rbltControlPoint)))
            quadraticCurve[1].y = y0 + properties.bendFactor * (y1 - y0)
            break;
        case 3:
            //Top
            quadraticCurve[1].x = x0 + properties.bendFactor * (x1 - x0)
            quadraticCurve[1].y = y0 - (y1 > y0 ? properties.rbltControlPoint : (Math.min((y0 - y1), properties.rbltControlPoint)))
            break;
        default:
            quadraticCurve[1].x = x0 + properties.bendFactor * (x1 - x0)
            quadraticCurve[1].y = y0 + properties.bendFactor * (y1 - y0)
            break;
    }
    return quadraticCurve
}

const controlPointsToPinBezierCurve = ({ before_last_control_point = { x: 0, y: 0 }, last_control_point = { x: 0, y: 0 }, pin = { x: 0, y: 0, i_rblt: null } }) => {
    const tempBezierCurve = [
        { x: (last_control_point?.x ?? 0), y: (last_control_point?.y ?? 0) },
        { x: null, y: null }, { x: null, y: null },
        { x: (pin?.x ?? 0) + 0.5 * properties.nodeSize, y: (pin?.y ?? 0) + 0.5 * properties.nodeSize },
    ]
    tempBezierCurve[1].x = (last_control_point?.x ?? 0) + properties.bendControlPointFactor * ((last_control_point?.x ?? 0) - (before_last_control_point?.x ?? 0))
    tempBezierCurve[1].y = (last_control_point?.y ?? 0) + properties.bendControlPointFactor * ((last_control_point?.y ?? 0) - (before_last_control_point?.y ?? 0))
    switch (pin?.i_rblt) {
        case 0:
            //Right
            tempBezierCurve[2].x = tempBezierCurve[3].x + (tempBezierCurve[0].x < tempBezierCurve[3].x ? properties.rbltControlPoint : (Math.min((tempBezierCurve[0].x - tempBezierCurve[3].x), properties.rbltControlPoint)))
            tempBezierCurve[2].y = tempBezierCurve[3].y + properties.bendFactor * (tempBezierCurve[0].y - tempBezierCurve[3].y)
            break;
        case 1:
            //Bottom
            tempBezierCurve[2].x = tempBezierCurve[3].x + properties.bendFactor * (tempBezierCurve[0].x - tempBezierCurve[3].x)
            tempBezierCurve[2].y = tempBezierCurve[3].y + (tempBezierCurve[0].y < tempBezierCurve[3].y ? properties.rbltControlPoint : (Math.min((tempBezierCurve[0].y - tempBezierCurve[3].y), properties.rbltControlPoint)))
            break;
        case 2:
            //Left
            tempBezierCurve[2].x = tempBezierCurve[3].x - (tempBezierCurve[0].x > tempBezierCurve[3].x ? properties.rbltControlPoint : (Math.min((tempBezierCurve[3].x - tempBezierCurve[0].x), properties.rbltControlPoint)))
            tempBezierCurve[2].y = tempBezierCurve[3].y + properties.bendFactor * (tempBezierCurve[0].y - tempBezierCurve[3].y)
            break;
        case 3:
            //Top
            tempBezierCurve[2].x = tempBezierCurve[3].x + properties.bendFactor * (tempBezierCurve[0].x - tempBezierCurve[3].x)
            tempBezierCurve[2].y = tempBezierCurve[3].y - (tempBezierCurve[0].y > tempBezierCurve[3].y ? properties.rbltControlPoint : (Math.min((tempBezierCurve[3].y - tempBezierCurve[0].y), properties.rbltControlPoint)))
            break;
        default:
            tempBezierCurve[2].x = tempBezierCurve[3].x + properties.bendFactor * (tempBezierCurve[3].x - tempBezierCurve[0].x)
            tempBezierCurve[2].y = tempBezierCurve[3].y + properties.bendFactor * (tempBezierCurve[3].y - tempBezierCurve[0].y)
            break;
    }
    return tempBezierCurve
}

const controlPointToNodeQuadraticCurve = ({ before_last_control_point = { x: 0, y: 0 }, last_control_point = { x: 0, y: 0 }, node = { x: 0, y: 0, width: 0, height: 0, strokeWidth: 0 } }) => ([
    { x: (last_control_point?.x ?? 0), y: (last_control_point?.y ?? 0) },
    {
        x: (last_control_point?.x ?? 0) + properties.bendControlPointFactor * ((last_control_point?.x ?? 0) - (before_last_control_point?.x ?? 0)),
        y: (last_control_point?.y ?? 0) + properties.bendControlPointFactor * ((last_control_point?.y ?? 0) - (before_last_control_point?.y ?? 0))
    },
    { x: (node?.x ?? 0) + (node?.strokeWidth ?? 0) + 0.5 * (node?.width ?? 0), y: (node?.y ?? 0) + (node?.strokeWidth ?? 0) + 0.5 * (node?.height ?? 0) },
])

const getControlPointsCurves = ({ i_path = 0, startPin = { x: 0, y: 0, i_rblt: null }, control_points = [] }) => {
    const tempCurves = []
    const coordinates = {
        before: { x: (startPin?.x ?? 0) + 0.5 * properties.nodeSize, y: (startPin?.y ?? 0) + 0.5 * properties.nodeSize },
        current: { x: null, y: null }, next: { x: null, y: null }
    }
    let i_control_point = 0
    if ((control_points ?? []).length > 0) {
        coordinates.current.x = coordinates.before.x
        coordinates.current.y = coordinates.before.y
        coordinates.next.x = (control_points?.[0]?.x ?? 0) + properties.controlPointStrokeWidth + properties.controlPointRadius
        coordinates.next.y = (control_points?.[0]?.y ?? 0) + properties.controlPointStrokeWidth + properties.controlPointRadius
        const tempBezierCurvePin = [
            { x: coordinates.current.x, y: coordinates.current.y },
            { x: null, y: null }, { x: null, y: null },
            { x: coordinates.next.x, y: coordinates.next.y },
        ]
        switch (startPin?.i_rblt) {
            case 0:
                //Right
                tempBezierCurvePin[1].x = coordinates.current.x + (coordinates.next.x < coordinates.current.x ? properties.rbltControlPoint : (Math.min((coordinates.next.x - coordinates.current.x), properties.rbltControlPoint)))
                tempBezierCurvePin[1].y = coordinates.current.y + properties.bendFactor * (coordinates.next.y - coordinates.current.y)
                break;
            case 1:
                //Bottom
                tempBezierCurvePin[1].x = coordinates.current.x + properties.bendFactor * (coordinates.next.x - coordinates.current.x)
                tempBezierCurvePin[1].y = coordinates.current.y + (coordinates.next.y < coordinates.current.y ? properties.rbltControlPoint : (Math.min((coordinates.next.y - coordinates.current.y), properties.rbltControlPoint)))
                break;
            case 2:
                //Left
                tempBezierCurvePin[1].x = coordinates.current.x - (coordinates.next.x > coordinates.current.x ? properties.rbltControlPoint : (Math.min((coordinates.current.x - coordinates.next.x), properties.rbltControlPoint)))
                tempBezierCurvePin[1].y = coordinates.current.y + properties.bendFactor * (coordinates.next.y - coordinates.current.y)
                break;
            case 3:
                //Top
                tempBezierCurvePin[1].x = coordinates.current.x + properties.bendFactor * (coordinates.next.x - coordinates.current.x)
                tempBezierCurvePin[1].y = coordinates.current.y - (coordinates.next.y > coordinates.current.y ? properties.rbltControlPoint : (Math.min((coordinates.current.y - coordinates.next.y), properties.rbltControlPoint)))
                break;
            default:
                tempBezierCurvePin[1].x = coordinates.current.x + properties.bendFactor * (coordinates.next.x - coordinates.current.x)
                tempBezierCurvePin[1].y = coordinates.current.y + properties.bendFactor * (coordinates.next.y - coordinates.current.y)
                break;
        }
        tempBezierCurvePin[2].x = coordinates.next.x - properties.bendControlPointFactor * (coordinates.next.x - coordinates.current.x)
        tempBezierCurvePin[2].y = coordinates.next.y - properties.bendControlPointFactor * (coordinates.next.y - coordinates.current.y)
        tempCurves.push({
            type: 'bezier',
            i_path, i_control_point: i_control_point++,
            coordinates: tempBezierCurvePin
        })
        for (let i = 1; i < control_points.length; i++) {
            coordinates.before.x = coordinates.current.x
            coordinates.before.y = coordinates.current.y
            coordinates.current.x = coordinates.next.x
            coordinates.current.y = coordinates.next.y
            coordinates.next.x = (control_points?.[i]?.x ?? 0) + properties.controlPointStrokeWidth + properties.controlPointRadius
            coordinates.next.y = (control_points?.[i]?.y ?? 0) + properties.controlPointStrokeWidth + properties.controlPointRadius
            const tempBezierCurve = [
                { x: coordinates.current.x, y: coordinates.current.y },
                { x: null, y: null }, { x: null, y: null },
                { x: coordinates.next.x, y: coordinates.next.y },
            ]
            tempBezierCurve[1].x = coordinates.current.x + properties.bendControlPointFactor * (coordinates.current.x - coordinates.before.x)
            tempBezierCurve[1].y = coordinates.current.y + properties.bendControlPointFactor * (coordinates.current.y - coordinates.before.y)
            tempBezierCurve[2].x = coordinates.next.x - properties.bendControlPointFactor * (coordinates.next.x - coordinates.current.x)
            tempBezierCurve[2].y = coordinates.next.y - properties.bendControlPointFactor * (coordinates.next.y - coordinates.current.y)
            tempCurves.push({
                type: 'bezier',
                i_path, i_control_point: i_control_point++,
                coordinates: tempBezierCurve
            })
        }
        coordinates.before.x = coordinates.current.x
        coordinates.before.y = coordinates.current.y
        coordinates.current.x = coordinates.next.x
        coordinates.current.y = coordinates.next.y
        coordinates.next.x = null
        coordinates.next.y = null
    }
    return {
        curves: tempCurves,
        before: coordinates.before,
        current: coordinates.current
    }
}

const getCurves = ({ paths, nodes, components, pins }) => {
    const currentPaths = Array.isArray(paths) ? JSON.parse(JSON.stringify(paths)) : []
    const currentNodes = Array.isArray(nodes) ? JSON.parse(JSON.stringify(nodes)) : []
    const currentComponents = Array.isArray(components) ? JSON.parse(JSON.stringify(components)) : []
    const currentPins = Array.isArray(pins) ? JSON.parse(JSON.stringify(pins)) : []
    const tempCurves = []
    for (const [i_path, path] of currentPaths.entries()) {
        const pinFrom = currentPins.find(p => p?.id === path?.from?.pin_id)
        const pinNodeFrom = currentComponents?.[pinFrom?.i_component]?.pins_rblt?.[pinFrom?.rblt]?.[pinFrom?.i_rblt]?.node
        if (pinNodeFrom === undefined || pinNodeFrom === null)
            continue
        const curveControlPoints = getControlPointsCurves({
            i_path,
            startPin: {
                x: (currentComponents?.[pinFrom?.i_component]?.x ?? 0) + (pinNodeFrom?.x ?? 0),
                y: (currentComponents?.[pinFrom?.i_component]?.y ?? 0) + (pinNodeFrom?.y ?? 0),
                i_rblt: pinFrom?.rblt
            },
            control_points: path?.control_points ?? []
        })
        tempCurves.push(...curveControlPoints.curves)
        switch (path?.to?.type) {
            case 'pin':
                const pinTo = currentPins.find(p => p?.id == path?.to?.pin_id)
                const pinNodeTo = currentComponents?.[pinTo?.i_component]?.pins_rblt?.[pinTo?.rblt]?.[pinTo?.i_rblt]?.node
                if (pinNodeTo === undefined || pinNodeTo === null)
                    continue
                tempCurves.push({
                    type: 'bezier',
                    i_path, i_control_point: null,
                    coordinates: (path?.control_points ?? []).length == 0 ?
                        pinToPinBezierCurve(
                            [{
                                x: (currentComponents?.[pinFrom?.i_component]?.x ?? 0) + (pinNodeFrom?.x ?? 0),
                                y: (currentComponents?.[pinFrom?.i_component]?.y ?? 0) + (pinNodeFrom?.y ?? 0),
                                i_rblt: pinFrom?.rblt
                            }, {
                                x: (currentComponents?.[pinTo?.i_component]?.x ?? 0) + (pinNodeTo?.x ?? 0),
                                y: (currentComponents?.[pinTo?.i_component]?.y ?? 0) + (pinNodeTo?.y ?? 0),
                                i_rblt: pinTo?.rblt
                            }]
                        ) :
                        controlPointsToPinBezierCurve({
                            before_last_control_point: curveControlPoints.before,
                            last_control_point: curveControlPoints.current,
                            pin: {
                                x: (currentComponents?.[pinTo?.i_component]?.x ?? 0) + (pinNodeTo?.x ?? 0),
                                y: (currentComponents?.[pinTo?.i_component]?.y ?? 0) + (pinNodeTo?.y ?? 0),
                                i_rblt: pinTo?.rblt
                            }
                        })
                })
                break
            case 'many_pins':
                const nodeManyPinsTo = currentNodes.find(
                    n => n?.type == 'many_pins' &&
                        n?.line_id !== null && n?.line_id !== undefined &&
                        n?.pin_id === null && n?.line_id === path?.to?.line_id
                )
                if (nodeManyPinsTo === undefined || nodeManyPinsTo === null)
                    continue
                tempCurves.push({
                    type: 'quadratic',
                    i_path, i_control_point: null,
                    coordinates: ((path?.control_points ?? []).length == 0) ?
                        pinToNodeQuadraticCurve({
                            pin: {
                                x: (currentComponents?.[pinFrom?.i_component]?.x ?? 0) + (pinNodeFrom?.x ?? 0),
                                y: (currentComponents?.[pinFrom?.i_component]?.y ?? 0) + (pinNodeFrom?.y ?? 0),
                                i_rblt: pinFrom?.rblt
                            },
                            node: {
                                x: (nodeManyPinsTo?.x ?? 0), y: (nodeManyPinsTo?.y ?? 0),
                                strokeWidth: properties.nodeManyPinsStrokeWidth, height: properties.nodeManyPinsSize, width: properties.nodeManyPinsSize
                            }
                        }) :
                        controlPointToNodeQuadraticCurve({
                            before_last_control_point: curveControlPoints.before,
                            last_control_point: curveControlPoints.current,
                            node: {
                                x: (nodeManyPinsTo?.x ?? 0), y: (nodeManyPinsTo?.y ?? 0),
                                strokeWidth: properties.nodeManyPinsStrokeWidth, height: properties.nodeManyPinsSize, width: properties.nodeManyPinsSize
                            }
                        })
                })
                break
            case 'line_name':
                const nodeLineNameTo = currentNodes.find(
                    n => n?.type == 'line_name' &&
                        n?.line_id !== null && n?.line_id !== undefined &&
                        n?.pin_id !== null && n?.pin_id !== undefined &&
                        n?.pin_id === path?.from?.pin_id && n?.line_id === path?.to?.line_id
                )
                if (nodeLineNameTo === undefined || nodeLineNameTo === null)
                    continue
                tempCurves.push({
                    type: 'quadratic',
                    i_path, i_control_point: null,
                    coordinates: ((path?.control_points ?? []).length == 0) ?
                        pinToNodeQuadraticCurve({
                            pin: {
                                x: (currentComponents?.[pinFrom?.i_component]?.x ?? 0) + (pinNodeFrom?.x ?? 0),
                                y: (currentComponents?.[pinFrom?.i_component]?.y ?? 0) + (pinNodeFrom?.y ?? 0),
                                i_rblt: pinFrom?.rblt
                            },
                            node: {
                                x: (nodeLineNameTo?.x ?? 0), y: (nodeLineNameTo?.y ?? 0),
                                strokeWidth: properties.nodeNameStrokeWidth,
                                height: (nodeLineNameTo?.height ?? 0), width: (nodeLineNameTo?.width ?? 0)
                            }
                        }) :
                        controlPointToNodeQuadraticCurve({
                            before_last_control_point: curveControlPoints.before,
                            last_control_point: curveControlPoints.current,
                            node: {
                                x: (nodeLineNameTo?.x ?? 0), y: (nodeLineNameTo?.y ?? 0),
                                strokeWidth: properties.nodeNameStrokeWidth,
                                height: (nodeLineNameTo?.height ?? 0), width: (nodeLineNameTo?.width ?? 0)
                            }
                        })
                })
                break
        }
    }
    return tempCurves
}

const NodeManyPins = ({ x = 0, y = 0 }) => (<rect
    transform={`translate(${x},${y})`}
    width={properties.nodeManyPinsSize}
    height={properties.nodeManyPinsSize}
    fill={properties.nodeManyPinsFill}
    stroke={properties.nodeManyPinsStrokeColor}
    strokeWidth={properties.nodeManyPinsStrokeWidth}
    strokeDasharray={properties.nodeManyPinsStrokeDashArray}
/>)

const NodeLineName = ({ x = 0, y = 0, width = 0, height = 0, text = "", textLength = 0, textHeight = 0 }) => (<g transform={`translate(${x},${y})`}>
    <rect
        width={width}
        height={height}
        fill={properties.nodeNameFill}
        stroke={properties.nodeNameStrokeColor}
        strokeWidth={properties.nodeNameStrokeWidth}
    />
    <text
        textLength={textLength}
        transform={`translate(${properties.nodeNamePadding},${properties.nodeNamePadding + textHeight})`}
        fontWeight="bold"
        fill={properties.nodeNameTextColor}
    >{text}</text>
</g>)

export { getLinesName, getPathsNodes, getCurves, NodeManyPins, NodeLineName, pinToNodeQuadraticCurve }