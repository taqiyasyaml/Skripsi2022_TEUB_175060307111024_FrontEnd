import { Fragment, useEffect, useRef, useState } from "react"
import { orderComponents, ComponentSVG } from "./ComponentSVG"
import { getCurves, getLinesName, getPathsNodes, NodeLineName, NodeManyPins, pinToNodeQuadraticCurve } from "./PathSVG"
import properties from "./DiagramProperties"
// const properties = {
//     nodeSize: 20,
//     outerRectStrokeWidth: 5,
//     nodeManyPinsSize: 15,
//     nodeManyPinsStrokeWidth: 2,
//     nodeNamePadding: 10,
//     nodeNameStrokeWidth: 2,
//     lineWidth: 2,
//     lineColor: 'black',
//     controlPointRadius: 7,
//     controlPointStrokeWidth: 1,
//     controlPointStrokeColor: 'black',
//     controlPointColor: 'lightgrey'
// }

const getSVGPosition = ({ cursorPosition, transform }) => ({
    x: (cursorPosition.x - transform.translate.x) / transform.scale,
    y: (cursorPosition.y - transform.translate.y) / transform.scale
})

const getTranslateSVG = ({ cursorPosition, svgPosition, scale }) => ({
    x: cursorPosition.x - (svgPosition.x * scale),
    y: cursorPosition.y - (svgPosition.y * scale)
})

const getDistance = ([{ x: x1, y: y1 }, { x: x2, y: y2 }] = [{ x: 0, y: 0 }, { x: 0, y: 0 }]) =>
    Math.sqrt(
        Math.pow(Math.abs(x2 - x1), 2)
        + Math.pow(Math.abs(y2 - y1), 2)
    )

const isInside = ({ cursor = { x: 0, y: 0 }, obj = { x: 0, y: 0, width: 0, height: 0, strokeWidth: 0 } }) =>
    ((obj?.x ?? 0) <= (cursor?.x ?? 0)) && ((cursor?.x ?? 0) <= ((obj?.x ?? 0) + (obj?.width ?? 0) + (obj?.strokeWidth ?? 0) * 2)) &&
    ((obj?.y ?? 0) <= (cursor?.y ?? 0)) && ((cursor?.y ?? 0) <= ((obj?.y ?? 0) + (obj?.height ?? 0) + (obj?.strokeWidth ?? 0) * 2))

const DiagramSVG = ({ components, lines, disableInteractive = false,
    onDoubleClick = (e, data = { component_id: null, pin_id: null, line_id: null }) => { },
    onConnect = (e, data = { from_pin_id: null, to_pin_id: null }) => { },
    ...props
}) => {
    const [internalComponents, setInternalComponents] = useState([])
    const [internalPins, setInternalPins] = useState([])
    const [internalLines, setInternalLines] = useState([])
    const [internalNodes, setInternalNodes] = useState([])
    const [internalPaths, setInternalPaths] = useState([])
    const [svgTransform, setSVGTransform] = useState({ translate: { x: 0, y: 0 }, scale: 1 })
    const [svgAction, setSVGAction] = useState(null)
    const [pickedPins, setPickedPins] = useState([])

    const svgRef = useRef(null)
    const internalDataRef = useRef()
    internalDataRef.current = {
        components: internalComponents,
        nodes: internalNodes,
        paths: internalPaths,
        transform: svgTransform
    }

    useEffect(() => {
        try {
            const lastDiagramSVG = JSON.parse(sessionStorage.getItem("last_diagram") ?? "{}")
            setSVGTransform(lastDiagramSVG?.transform ?? { translate: { x: 0, y: 0 }, scale: 1 })
        } catch (err) { }
        return () => {
            if ((internalDataRef?.current?.components ?? []).length > 0)
                sessionStorage.setItem("last_diagram", JSON.stringify(internalDataRef.current))
        }
    }, [])

    useEffect(() => {
        const internalData = {
            components: internalComponents,
            nodes: internalNodes,
            paths: internalPaths,
        }
        if (internalComponents.length == 0) {
            try {
                const lastDiagramSVG = JSON.parse(sessionStorage.getItem("last_diagram") ?? "{}")
                internalData.components = lastDiagramSVG?.components ?? []
                internalData.nodes = lastDiagramSVG?.nodes ?? []
                internalData.paths = lastDiagramSVG?.paths ?? []
            } catch (err) { }
        } else if (sessionStorage.getItem("last_diagram") !== null) {
            sessionStorage.removeItem("last_diagram")
        }
        const orderedComponents = orderComponents({
            existComponents: internalData.components, unorderComponents: components,
            maxWidth: svgRef == null || svgRef.current == null ? 0 : (svgRef.current.getBoundingClientRect().width / svgTransform.scale)
        })
        setInternalComponents(orderedComponents.components);
        setInternalPins(orderedComponents.pins);
        const tempLines = getLinesName({ lines, pins: orderedComponents.pins })
        setInternalLines(tempLines)
        const pathsNodes = getPathsNodes({
            existPaths: internalData.paths, existNodes: internalData.nodes,
            lines: tempLines,
            pins: orderedComponents.pins, components: orderedComponents.components
        })
        setInternalPaths(pathsNodes.paths)
        setInternalNodes(pathsNodes.nodes)
    }, [components, lines])

    const getSelectedObject = (svgPosition = { x: 0, y: 0 }) => {
        const obj = {
            other_component: true,
            i_path: null,
            i_control_point: null,
            i_node: null,
            node_pin_id: null,
            node_line_id: null,
            component_id: null,
            pin_id: null,
        }
        if (svgPosition == undefined || svgPosition?.x == null || isNaN(svgPosition?.x) || svgPosition?.y == null || isNaN(svgPosition?.y))
            return obj

        let mostPercentageCenter = 0
        let lessDistanceCenter = null

        for (const [i_path, path] of internalPaths.entries()) {
            for (const [i_control_point, control_point] of (path?.control_points ?? 0).entries()) {
                if (isInside({
                    cursor: svgPosition,
                    obj: {
                        x: control_point.x, y: control_point.y,
                        strokeWidth: properties.controlPointStrokeWidth, width: 2 * properties.controlPointRadius, height: 2 * properties.controlPointRadius
                    }
                })) {
                    const percentageCenter = getDistance([svgPosition, control_point]) /
                        getDistance([{ x: 0, y: 0 }, {
                            x: properties.controlPointRadius + properties.controlPointStrokeWidth,
                            y: properties.controlPointRadius + properties.controlPointStrokeWidth
                        }])
                    if (percentageCenter > mostPercentageCenter) {
                        mostPercentageCenter = percentageCenter
                        obj.other_component = false
                        obj.i_path = i_path
                        obj.i_control_point = i_control_point
                    }
                }
            }
        }

        mostPercentageCenter = 0
        lessDistanceCenter = null
        for (const [i_node, node] of internalNodes.entries()) {
            if (node?.type == 'many_pins') {
                if (isInside({
                    cursor: svgPosition,
                    obj: { x: node.x, y: node.y, strokeWidth: properties.nodeManyPinsStrokeWidth, width: properties.nodeManyPinsSize, height: properties.nodeManyPinsSize }
                })) {
                    const percentageCenter = getDistance([svgPosition, node]) / getDistance([{ x: 0, y: 0 }, { x: 0.5 * properties.nodeManyPinsSize, y: 0.5 * properties.nodeManyPinsSize }])
                    if (percentageCenter > mostPercentageCenter) {
                        mostPercentageCenter = percentageCenter
                        obj.other_component = false
                        obj.i_node = i_node
                        obj.node_pin_id = null
                        obj.node_line_id = node?.line_id
                    }
                }
            } if (node?.type == 'line_name') {
                if (isInside({
                    cursor: svgPosition,
                    obj: { x: node.x, y: node.y, strokeWidth: properties.nodeNameStrokeWidth, width: node?.width ?? 0, height: node?.height ?? 0 }
                })) {
                    const percentageCenter = getDistance([svgPosition, node]) /
                        getDistance([
                            { x: node.x, y: node.y },
                            { x: node.x + properties.nodeNameStrokeWidth + 0.5 * (node?.width ?? 0), y: node.y + properties.nodeManyPinsStrokeWidth + 0.5 * (node?.height ?? 0) }
                        ])
                    if (percentageCenter > mostPercentageCenter) {
                        mostPercentageCenter = percentageCenter
                        obj.other_component = false
                        obj.i_node = i_node
                        obj.node_pin_id = node?.pin_id
                        obj.node_line_id = node?.line_id
                    }
                }
            }
        }

        mostPercentageCenter = 0
        lessDistanceCenter = null
        for (const c of internalComponents) {
            if (isInside({
                cursor: svgPosition,
                obj: { x: c.x, y: c.y, strokeWidth: properties.outerRectStrokeWidth, height: c.height, width: c.width }
            })) {
                const distanceCenter = getDistance([svgPosition, {
                    x: c.x + properties.outerRectStrokeWidth + (0.5 * c.width),
                    y: c.y + properties.outerRectStrokeWidth + (0.5 * c.height)
                }])
                const percentageCenter = distanceCenter / getDistance([{ x: c.x, y: c.y }, {
                    x: c.x + properties.outerRectStrokeWidth + (0.5 * c.width),
                    y: c.y + properties.outerRectStrokeWidth + (0.5 * c.height)
                }])
                let tmpPinID = null
                find_pin:
                for (const pins of c.pins_rblt) {
                    for (const pin of pins) {
                        if (isInside({
                            cursor: { x: svgPosition.x - c.x, y: svgPosition.y - c.y },
                            obj: { x: pin.node.x, y: pin.node.y, strokeWidth: 0, width: properties.nodeSize, height: properties.nodeSize }
                        })) {
                            tmpPinID = pin.id
                            break find_pin;
                        }
                    }
                }
                if ((obj.pin_id === null && percentageCenter > mostPercentageCenter)
                    || (tmpPinID !== null && (lessDistanceCenter === null || distanceCenter < lessDistanceCenter))) {
                    obj.other_component = false
                    obj.component_id = c.id.value
                    obj.pin_id = tmpPinID
                    mostPercentageCenter = percentageCenter
                    lessDistanceCenter = distanceCenter
                }
            }
        }

        mostPercentageCenter = 0
        lessDistanceCenter = null
        return obj
    }

    const getCursorSVG = ({ clientX, clientY }) => ({
        x: clientX - svgRef.current.getBoundingClientRect().x,
        y: clientY - svgRef.current.getBoundingClientRect().y,
    })

    const extendEMouseSVG = (e, transform) => {
        const cursorPosition = getCursorSVG(e)
        const svgPosition = getSVGPosition({ cursorPosition, transform: transform ?? svgTransform })
        e.svgCursorX = cursorPosition.x
        e.svgCursorY = cursorPosition.y
        e.svgPositionX = svgPosition.x
        e.svgPositionY = svgPosition.y
        return e
    }

    const extendETouchEventSVG = (e, transform) => {
        for (let t = 0; t < e.touches.length; t++) {
            const cursorPosition = getCursorSVG(e.touches[t])
            const svgPosition = getSVGPosition({ cursorPosition, transform: transform ?? svgTransform })
            e.touches[t].svgCursorX = cursorPosition.x
            e.touches[t].svgCursorY = cursorPosition.y
            e.touches[t].svgPositionX = svgPosition.x
            e.touches[t].svgPositionY = svgPosition.y
        }
        return e
    }

    const scaleMouse = (e) => {
        if (svgRef.current == null || disableInteractive === true)
            return
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendEMouseSVG(e, currentTransform)
        const newScale = svgTransform.scale * (e.deltaY == 0 ? 1 : e.deltaY > 0 ? 0.9 : 1.1)
        setSVGTransform({
            translate: getTranslateSVG({
                cursorPosition: { x: e?.svgCursorX ?? 0, y: e?.svgCursorY ?? 0 },
                svgPosition: { x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 },
                scale: newScale
            }),
            scale: newScale
        })
    }

    const dragSVGMainStart = (cursorPosition = { x: 0, y: 0 }, transform) => setSVGAction({
        action: 'drag_main',
        data: {
            startCursor: cursorPosition,
            startTranslate: transform?.translate ?? svgTransform.translate
        }
    })

    const dragSVGMainMove = (cursorPosition = { x: 0, y: 0 }) => setSVGTransform(d => ({
        ...d,
        translate: {
            x: (svgAction?.data?.startTranslate?.x ?? 0) - ((svgAction?.data?.startCursor?.x ?? 0) - (cursorPosition?.x ?? 0)),
            y: (svgAction?.data?.startTranslate?.y ?? 0) - ((svgAction?.data?.startCursor?.y ?? 0) - (cursorPosition?.y ?? 0))
        }
    }))

    const dragSVGComponentStart = ({ component_id, svgPosition = { x: 0, y: 0 } }) => {
        const c = internalComponents.find(tmp => tmp.id.value === component_id)
        setSVGAction({
            action: 'drag_component',
            data: {
                startSVGPosition: svgPosition,
                startComponent: { x: c?.x ?? 0, y: c?.y ?? 0 },
                componentId: c?.id?.value
            }
        })
    }

    const dragSVGComponentMove = (svgPosition) => setInternalComponents(cs => {
        if (svgAction?.data?.componentId === undefined || svgAction?.data?.componentId === null)
            return [...cs]
        for (let i = 0; i < cs.length; i++) {
            if (cs[i].id.value === svgAction?.data?.componentId) {
                cs[i].x = (svgAction?.data?.startComponent?.x ?? 0) - ((svgAction?.data?.startSVGPosition?.x ?? 0) - (svgPosition?.x ?? 0))
                cs[i].y = (svgAction?.data?.startComponent?.y ?? 0) - ((svgAction?.data?.startSVGPosition?.y ?? 0) - (svgPosition?.y ?? 0))
                break;
            }
        }
        return [...cs]
    })

    const dragSVGNodeStart = ({ i_node, svgPosition = { x: 0, y: 0 } }) => {
        setSVGAction({
            action: 'drag_node',
            data: {
                startSVGPosition: svgPosition,
                startNode: { x: internalNodes?.[i_node]?.x ?? 0, y: internalNodes?.[i_node]?.y ?? 0 },
                i_node
            }
        })
    }

    const dragSVGNodeMove = (svgPosition) => setInternalNodes(n => {
        if (svgAction?.data?.i_node === undefined || svgAction?.data?.i_node === null)
            return [...n]
        n[svgAction?.data?.i_node].x = (svgAction?.data?.startNode?.x ?? 0) - ((svgAction?.data?.startSVGPosition?.x ?? 0) - (svgPosition?.x ?? 0))
        n[svgAction?.data?.i_node].y = (svgAction?.data?.startNode?.y ?? 0) - ((svgAction?.data?.startSVGPosition?.y ?? 0) - (svgPosition?.y ?? 0))
        return [...n]
    })

    const dragSVGControlPointStart = ({ i_path, i_control_point, svgPosition = { x: 0, y: 0 } }) => setSVGAction({
        action: 'drag_control_point',
        data: {
            startSVGPosition: svgPosition,
            startControlPoint: { x: internalPaths?.[i_path]?.control_points?.[i_control_point]?.x ?? 0, y: internalPaths?.[i_path]?.control_points?.[i_control_point]?.y ?? 0 },
            i_path, i_control_point
        }
    })

    const dragSVGControlPointMove = (svgPosition) => setInternalPaths(n => {
        if (
            svgAction?.data?.i_path === null || svgAction?.data?.i_path == undefined ||
            svgAction?.data?.i_control_point === null || svgAction?.data?.i_control_point == undefined ||
            n[svgAction?.data?.i_path].control_points[svgAction?.data?.i_control_point] === null || n[svgAction?.data?.i_path].control_points[svgAction?.data?.i_control_point] === undefined
        )
            return [...n]
        n[svgAction?.data?.i_path].control_points[svgAction?.data?.i_control_point].x = (svgAction?.data?.startControlPoint?.x ?? 0) - ((svgAction?.data?.startSVGPosition?.x ?? 0) - (svgPosition?.x ?? 0))
        n[svgAction?.data?.i_path].control_points[svgAction?.data?.i_control_point].y = (svgAction?.data?.startControlPoint?.y ?? 0) - ((svgAction?.data?.startSVGPosition?.y ?? 0) - (svgPosition?.y ?? 0))
        return [...n]
    })

    const findPinConnectSVGStart = ({ pin_id, svgPosition = { x: 0, y: 0 } }) => {
        const pin = internalPins.find(p => p?.id === pin_id)
        const pinNode = internalComponents?.[pin?.i_component]?.pins_rblt?.[pin?.rblt]?.[pin?.i_rblt]?.node
        if (pinNode === undefined || pinNode === null || pin_id === null || pin_id === undefined)
            return
        setSVGAction({
            action: 'find_pin_connect',
            data: {
                from: {
                    pin_id,
                    x: (internalComponents[pin.i_component].x ?? 0) + (pinNode?.x ?? 0),
                    y: (internalComponents[pin.i_component].y ?? 0) + (pinNode?.y ?? 0),
                    rblt: pin?.rblt
                },
                to: { pin_id: null, x: svgPosition?.x ?? 0, y: svgPosition?.y ?? 0 }
            }
        })
    }

    const findPinConnectSVGMove = (svgPosition = { x: 0, y: 0 }) => setSVGAction(a => {
        if (a?.action != 'find_pin_connect' || a?.data?.from?.pin_id == null || a?.data?.from?.pin_id == undefined)
            return null
        const selectedObject = getSelectedObject(svgPosition)
        a.data.to.pin_id = selectedObject.pin_id ?? selectedObject.node_pin_id
        a.data.to.x = svgPosition?.x ?? 0
        a.data.to.y = svgPosition?.y ?? 0
        const pins = [a.data.from.pin_id]
        if (a.data.to.pin_id === a.data.from.pin_id)
            a.data.to.pin_id = null
        else if (a.data.to.pin_id !== null)
            pins.push(a.data.to.pin_id)
        setPickedPins(pins)
        return { ...a }
    })

    const findPinConnectSVGDone = (e) => setSVGAction(a => {
        setPickedPins([])
        if (a?.action != 'find_pin_connect' ||
            a?.data?.from?.pin_id == null || a?.data?.from?.pin_id == undefined ||
            a?.data?.to?.pin_id == null || a?.data?.to?.pin_id == undefined ||
            a?.data?.from?.pin_id === a?.data?.to?.pin_id)
            return null
        if (typeof onConnect === 'function')
            setTimeout(()=>onConnect(e, JSON.parse(JSON.stringify({ from_pin_id: a.data.from.pin_id, to_pin_id: a.data.to.pin_id }))),1)
        return null
    })

    const svgMouseDown = (e) => {
        if (disableInteractive === true)
            return setSVGAction(null)
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendEMouseSVG(e, currentTransform)
        const selectedObject = getSelectedObject({ x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 })
        if (selectedObject.i_path != null && selectedObject.i_control_point != null)
            dragSVGControlPointStart({
                i_path: selectedObject.i_path, i_control_point: selectedObject.i_control_point,
                svgPosition: { x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 }
            })
        else if (selectedObject.i_node !== null)
            dragSVGNodeStart({
                i_node: selectedObject.i_node,
                svgPosition: { x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 }
            })
        else if (selectedObject.component_id !== null && selectedObject.pin_id !== null)
            findPinConnectSVGStart({
                pin_id: selectedObject.pin_id,
                svgPosition: { x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 }
            })
        else if (selectedObject.component_id !== null && selectedObject.pin_id === null)
            dragSVGComponentStart({
                component_id: selectedObject.component_id,
                svgPosition: { x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 }
            })
        else
            dragSVGMainStart({ x: e?.svgCursorX ?? 0, y: e?.svgCursorY ?? 0 }, currentTransform)
    }

    const svgMouseMove = (e) => {
        if (svgAction == null || disableInteractive === true)
            return
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendEMouseSVG(e, currentTransform)

        if (svgAction?.action == 'drag_main')
            dragSVGMainMove({ x: e?.svgCursorX ?? 0, y: e?.svgCursorY ?? 0 })
        else if (svgAction?.action == 'drag_component')
            dragSVGComponentMove({ x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 })
        else if (svgAction?.action == 'drag_node')
            dragSVGNodeMove({ x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 })
        else if (svgAction?.action == 'drag_control_point')
            dragSVGControlPointMove({ x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 })
        else if (svgAction?.action == 'find_pin_connect')
            findPinConnectSVGMove({ x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 })
    }

    const svgMouseUp = (e) => {
        if (svgAction == null)
            return
        if (disableInteractive === true)
            return setSVGAction(null)
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        const cursorPosition = getCursorSVG(e)
        const svgPosition = getSVGPosition({ cursorPosition, transform: currentTransform })

        if (svgAction?.action == 'find_pin_connect')
            findPinConnectSVGDone(e)
        svgMouseLeaveTouchCancel()
    }

    const scaleTouchStart = (e, scale) => setSVGAction({
        action: 'touch_scale',
        data: {
            startDistance: getDistance([{ x: e?.touches?.[0]?.clientX ?? 0, y: e?.touches?.[0]?.clientY ?? 0 }, { x: e?.touches?.[1]?.clientX ?? 0, y: e?.touches?.[1]?.clientY ?? 0 }]),
            startSVGPosition: { x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 },
            startScale: scale ?? 1
        }
    })

    const scaleTouchMove = (e) => {
        const newScale = (svgAction?.data?.startScale ?? 1) * (
            getDistance([{ x: e?.touches?.[0]?.clientX ?? 0, y: e?.touches?.[0]?.clientY ?? 0 }, { x: e?.touches?.[1]?.clientX ?? 0, y: e?.touches?.[1]?.clientY ?? 0 }])
            / (svgAction?.data?.startDistance ?? 1)
        )
        setSVGTransform({
            translate: getTranslateSVG({
                cursorPosition: { x: e?.touches?.[0]?.svgCursorX ?? 0, y: e?.touches?.[0]?.svgCursorY ?? 0 },
                svgPosition: (svgAction?.data?.startSVGPosition ?? { x: 0, y: 0 }),
                scale: newScale
            }),
            scale: newScale
        })
    }
    const svgTouchStart = (e) => {
        if (disableInteractive === true)
            return setSVGAction(null)
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendETouchEventSVG(e, currentTransform)
        if (e.touches.length == 1) {
            const selectedObject = getSelectedObject({ x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 })
            if (selectedObject.i_path != null && selectedObject.i_control_point != null)
                dragSVGControlPointStart({
                    i_path: selectedObject.i_path, i_control_point: selectedObject.i_control_point,
                    svgPosition: { x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 }
                })
            else if (selectedObject.i_node !== null)
                dragSVGNodeStart({
                    i_node: selectedObject.i_node,
                    svgPosition: { x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 }
                })
            else if (selectedObject.component_id !== null && selectedObject.pin_id !== null)
                findPinConnectSVGStart({
                    pin_id: selectedObject.pin_id,
                    svgPosition: { x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 }
                })
            else if (selectedObject.component_id !== null && selectedObject.pin_id === null)
                dragSVGComponentStart({
                    component_id: selectedObject.component_id,
                    svgPosition: { x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 }
                })
            else
                dragSVGMainStart({ x: e.touches[0].svgCursorX, y: e.touches[0].svgCursorY }, currentTransform)
        } else if (e.touches.length == 2)
            scaleTouchStart(e, currentTransform.scale)
        else
            svgMouseLeaveTouchCancel()
    }

    const svgTouchMove = (e) => {
        if (svgAction == null || disableInteractive === true)
            return
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendETouchEventSVG(e, currentTransform)
        if (e.touches.length == 1) {
            if (svgAction?.action == 'drag_main')
                dragSVGMainMove({ x: e?.touches?.[0]?.svgCursorX ?? 0, y: e?.touches?.[0]?.svgCursorY ?? 0 })
            else if (svgAction?.action == 'drag_component')
                dragSVGComponentMove({ x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 })
            else if (svgAction?.action == 'drag_node')
                dragSVGNodeMove({ x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 })
            else if (svgAction?.action == 'drag_control_point')
                dragSVGControlPointMove({ x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 })
            else if (svgAction?.action == 'find_pin_connect')
                findPinConnectSVGMove({ x: e?.touches?.[0]?.svgPositionX ?? 0, y: e?.touches?.[0]?.svgPositionY ?? 0 })
            else
                svgMouseLeaveTouchCancel()
        } else if (e.touches.length == 2 && svgAction?.action == 'touch_scale')
            scaleTouchMove(e)
        else
            svgMouseLeaveTouchCancel()
    }

    const svgTouchEnd = (e) => {
        if (disableInteractive === true)
            return setSVGAction(null)
        if (svgAction == null) {
            svgTouchStart(e)
            return
        }
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendETouchEventSVG(e, currentTransform)
        if (svgAction?.action == 'touch_scale') {
            if (e.touches.length == 1) {
                setSVGAction({
                    action: 'touch_drag_main',
                    data: {
                        startCursor: { x: e.touches[0].svgCursorX, y: e.touches[0].svgCursorY },
                        startTranslate: currentTransform.translate
                    }
                })
                return
            }
        } else if (svgAction?.action == 'find_pin_connect')
            findPinConnectSVGDone(e)
        svgMouseLeaveTouchCancel()
    }

    const onPathDblClick = (e, i_path, i_control_point) => {
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendEMouseSVG(e, currentTransform)
        const selectedObject = getSelectedObject({ x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 })
        if (selectedObject.other_component == true)
            setInternalPaths(p => {
                if (!Array.isArray(p?.[i_path]?.control_points))
                    return [...p]
                const pos = {
                    x: e.svgPositionX - 0.5 * properties.controlPointRadius - properties.controlPointStrokeWidth,
                    y: e.svgPositionY - 0.5 * properties.controlPointRadius - properties.controlPointStrokeWidth
                }
                for (const cp of p[i_path].control_points) {
                    if (isInside({
                        cursor: pos, obj: {
                            x: cp.x, y: cp.y, width: 2 * properties.controlPointRadius, height: 2 * properties.controlPointRadius, strokeWidth: properties.controlPointStrokeWidth
                        }
                    }))
                        return [...p]
                }
                if (i_control_point == null || isNaN(i_control_point))
                    p[i_path].control_points.push(pos)
                else if (p?.[i_path]?.control_points?.[i_control_point] !== undefined && p?.[i_path]?.control_points?.[i_control_point] !== null)
                    p[i_path].control_points.splice(i_control_point, 0, pos)
                return [...p]
            })
    }

    const svgDoubleClick = e => {
        const currentTransform = JSON.parse(JSON.stringify(svgTransform))
        e = extendEMouseSVG(e, currentTransform)
        const selectedObject = getSelectedObject({ x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 })
        if (selectedObject.i_path != null && selectedObject.i_control_point != null)
            setInternalPaths(p => {
                if (p?.[selectedObject.i_path]?.control_points?.[selectedObject.i_control_point] == null)
                    return [...p]
                if (!isInside({
                    cursor: { x: e?.svgPositionX ?? 0, y: e?.svgPositionY ?? 0 },
                    obj: {
                        x: p[selectedObject.i_path].control_points[selectedObject.i_control_point].x, y: p[selectedObject.i_path].control_points[selectedObject.i_control_point].y,
                        width: 2 * properties.controlPointRadius, height: 2 * properties.controlPointRadius, strokeWidth: properties.controlPointStrokeWidth
                    }
                }))
                    return [...p]
                p[selectedObject.i_path].control_points.splice(selectedObject.i_control_point, 1)
                return [...p]
            })
        else if (selectedObject.node_line_id !== null)
            onDoubleClick(e, { component_id: null, pin_id: selectedObject.node_pin_id, line_id: selectedObject.node_line_id })
        else if (selectedObject.component_id !== null)
            onDoubleClick(e, { component_id: selectedObject.component_id, pin_id: selectedObject.pin_id, line_id: null })

    }

    const svgMouseLeaveTouchCancel = () => setSVGAction(null)

    const internalCurves = getCurves({ paths: internalPaths, nodes: internalNodes, components: internalComponents, pins: internalPins })
    if (svgAction?.action == 'find_pin_connect') {
        internalCurves.push({
            type: 'quadratic', i_path: null, i_control_point: null,
            coordinates: pinToNodeQuadraticCurve({
                pin: { x: svgAction?.data?.from?.x ?? 0, y: svgAction?.data?.from?.y ?? 0, i_rblt: svgAction?.data?.from?.rblt },
                node: { x: (svgAction?.data?.to?.x ?? 0), y: (svgAction?.data?.to?.y ?? 0), strokeWidth: 0, height: 0, width: 0 }
            })
        })
    }
    return (
        <svg
            {...props}
            ref={svgRef}
            style={{ ...(props?.style ?? {}), touchAction: "none", userSelect: 'none', }}
            onWheel={scaleMouse}
            onMouseDown={svgMouseDown}
            onMouseMove={svgMouseMove}
            onMouseUp={svgMouseUp}
            onMouseLeave={svgMouseLeaveTouchCancel}
            onTouchStart={svgTouchStart}
            onTouchMove={svgTouchMove}
            onTouchEnd={svgTouchEnd}
            onDoubleClick={svgDoubleClick}
        >
            <g transform={`translate(${svgTransform.translate.x},${svgTransform.translate.y}) scale(${svgTransform.scale})`}>
                {internalCurves.map((c, i) => (<Fragment key={`curve_${i}`}>
                    {c?.type == 'bezier' && (<path d={
                        `M ${c?.coordinates?.[0]?.x ?? 0} ${c?.coordinates?.[0]?.y ?? 0}` +
                        `C ${c?.coordinates?.[1]?.x ?? 0} ${c?.coordinates?.[1]?.y ?? 0} ,` +
                        `${c?.coordinates?.[2]?.x ?? 0} ${c?.coordinates?.[2]?.y ?? 0} ,` +
                        `${c?.coordinates?.[3]?.x ?? 0} ${c?.coordinates?.[3]?.y ?? 0}`
                    }
                        fill="none"
                        stroke={properties.lineColor}
                        strokeWidth={properties.lineWidth}
                        onDoubleClick={e => onPathDblClick(e, c?.i_path, c?.i_control_point)}
                    />)}
                    {c?.type == 'quadratic' && (
                        <path d={
                            `M ${c?.coordinates?.[0]?.x ?? 0} ${c?.coordinates?.[0]?.y ?? 0}` +
                            `Q ${c?.coordinates?.[1]?.x ?? 0} ${c?.coordinates?.[1]?.y ?? 0} ,` +
                            `${c?.coordinates?.[2]?.x ?? 0} ${c?.coordinates?.[2]?.y ?? 0}`
                        }
                            fill="none"
                            stroke={properties.lineColor}
                            strokeWidth={properties.lineWidth}
                            onDoubleClick={e => onPathDblClick(e, c?.i_path, c?.i_control_point)}
                        />
                    )}
                </Fragment>))}
                {internalComponents.map(c => (<ComponentSVG key={`component_${c.id.value}`} detailComponent={c} pickedPins={pickedPins} />))}
                {internalNodes.map(n => (<Fragment key={`node_pin_${n?.pin_id}_line_${n?.line_id}`}>
                    {n?.type == 'many_pins' && (<NodeManyPins x={n?.x ?? 0} y={n?.y ?? 0} />)}
                    {n?.type == 'line_name' && (<NodeLineName
                        x={n?.x ?? 0} y={n?.y ?? 0}
                        width={n?.width ?? 0} height={n?.height ?? 0}
                        text={n?.line_name} textLength={n?.line_name_length ?? 0} textHeight={n?.line_name_height ?? 0}
                    />)}
                </Fragment>))}
                {internalPaths.map((p, i_p) => (p?.control_points ?? []).map((cp, i_cp) => (<circle
                    transform={`translate(${cp?.x ?? 0},${cp?.y ?? 0}) `
                        + `translate(${properties.controlPointRadius + properties.controlPointStrokeWidth}, ${properties.controlPointRadius + properties.controlPointStrokeWidth})`
                    }
                    key={`path_${i_p}_cp_${i_cp}`}
                    r={properties.controlPointRadius}
                    strokeWidth={properties.controlPointStrokeWidth}
                    stroke={properties.controlPointStrokeColor}
                    fill={properties.controlPointColor}
                />)))}
            </g>
        </svg>
    )
}

export default DiagramSVG