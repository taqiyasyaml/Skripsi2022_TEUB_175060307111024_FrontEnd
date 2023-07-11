import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Grid, IconButton, Modal, Radio, TextField, Toolbar, Typography } from "@mui/material";
import { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router"
import useWebSocket from "react-use-websocket"
import DiagramSVG from "../Diagram/DiagramSVG";
import {
    Add as AddIcon,
    Save as SaveIcon,
    ArrowUpward as ToTopIcon,
    ArrowDownward as ToBottomIcon,
    ArrowBack as ToLeftIcon,
    ArrowForward as ToRightIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    RotateLeft as CCWIcon,
    RotateRight as CWIcon,
    Loop as Deg180Icon,
    BorderHorizontal as FlipVIcon,
    BorderVertical as FlipHIcon,
    Block as BlockIcon,
    Sync as SyncIcon
} from "@mui/icons-material"
import WSBaseURL from './../WSBaseURL'
const WS_URL = WSBaseURL + 'project/'

const getVoltageADC = (adc) => {
    const fixADC = adc === undefined || adc === null || isNaN(adc) || parseInt(adc) < 0 ? 0 : (parseInt(adc) > 4095 ? 4095 : parseFloat(adc))
    const voltage = (fixADC / 4095.0) * (5.0 * (2.0 / 3.0)) * (2.2 / 1.2)
    return `${voltage.toFixed(2)} V`
}

const checkDuplicateComponentsArrayAndGiveBracketName = (components, adc_val) => {
    const tempComponents = []
    const doneIDs = []
    const donePins = []
    const withGiveBracketName = Array.isArray(adc_val)
    let change = false
    for (const c of components ?? []) {
        if (c?.id === undefined || c?.id === null || c?.id === '' || doneIDs.includes(c?.id)) {
            change = true
            continue
        }
        const tempComponent = { id: c.id, name: c?.name, value: c?.value, pins_rblt: [[], [], [], []] }
        doneIDs.push(c?.id)
        for (const [i_rblt, pins] of (c?.pins_rblt ?? []).entries()) {
            for (const pin of pins ?? []) {
                const tempPin = { id: pin?.id, name: pin?.name, line_name: pin?.line_name, bracket_name: pin?.bracket_name }
                if (pin?.id !== null && !isNaN(pin?.id) && typeof pin?.id != 'number' && typeof pin?.id != 'bigint') {
                    change = true
                    tempPin.id = parseFloat(pin?.id)
                }
                if (pin?.id === undefined || pin?.id === '' || (pin?.id !== null && donePins.includes(pin?.id))) {
                    change = true
                    tempPin.id = null
                    tempPin.bracket_name = null
                }
                if (tempPin.id !== null)
                    donePins.push(tempPin.id)
                if (withGiveBracketName === true) {
                    if (tempPin.id !== null && !isNaN(tempPin.id) && parseInt(tempPin.id) >= 0) {
                        const v_adc = getVoltageADC(adc_val?.[parseInt(tempPin.id)] ?? 0)
                        if (v_adc !== tempPin?.bracket_name) {
                            change = true
                            tempPin.bracket_name = v_adc
                        }
                    } else if (tempPin?.bracket_name !== undefined && tempComponent?.bracket_name !== null) {
                        change = true
                        tempPin.bracket_name = null
                    }
                }
                if (pin?.line_name === undefined || pin?.line_name === '') {
                    change = true
                    tempPin.line_name = null
                }
                tempComponent.pins_rblt[i_rblt].push(tempPin)
            }
        }
        tempComponents.push(tempComponent)
    }

    return { change, components: tempComponents }
}

const checkDuplicatePinsOne = (component) => {
    const checked = checkDuplicateComponentsArrayAndGiveBracketName([{ id: 'tempID', name: component?.name, value: component?.value, pins_rblt: component?.pins_rblt ?? [[], [], [], []] }])
    return {
        change: checked.change,
        component: {
            ...(checked?.components?.[0] ?? { id: component?.id, name: null, value: null, pins_rblt: [[], [], [], []] }),
            id: component?.id ?? null
        }
    }
}

const ModalComponent = ({ component, componentId, reserveIDs = [], open = false, onClose = () => { }, onDeleteClick = (component_id) => { },
    onSaveClick = (data = { id: null, name: null, value: null, pins_rblt: [[], [], [], []] }, componentId) => { },
}) => {
    const [internalComponent, setInternalComponent] = useState({ id: null, name: null, value: null, pins_rblt: [[], [], [], []] })
    const [dataModalPins, setDataModalPins] = useState({ open: false, i_rblt: null, i_pin: null, id: null, name: null, line_name: null })
    useEffect(() => {
        setInternalComponent(checkDuplicatePinsOne({ id: component?.id, name: component?.name, value: component?.value, pins_rblt: component?.pins_rblt ?? [[], [], [], []] }).component)
        setDataModalPins({ open: false, i_rblt: null, i_pin: null, id: null, name: null, line_name: null })
    }, [component])

    const onCloseModalPin = () => {
        setDataModalPins({ open: false, i_rblt: null, i_pin: null, id: null, name: null, line_name: null })
        if (typeof onClose == 'function')
            onClose()
    }

    const onOkComponentClick = () => {
        if ((internalComponent?.id ?? "").length == 0 || (reserveIDs ?? []).includes(internalComponent.id))
            return
        if (typeof onSaveClick == 'function')
            onSaveClick(
                checkDuplicatePinsOne({ id: internalComponent?.id, name: internalComponent?.name, value: internalComponent?.value, pins_rblt: internalComponent?.pins_rblt ?? [[], [], [], []] }).component,
                componentId
            )
    }

    const onOkPinClick = () => setInternalComponent(c => {
        try {
            const currentDataPins = JSON.parse(JSON.stringify(dataModalPins))
            setDataModalPins({ open: false, i_rblt: null, i_pin: null, id: null, name: null, line_name: null })
            if (currentDataPins?.i_rblt === undefined || currentDataPins?.i_rblt === null || !Array.isArray(c?.pins_rblt?.[currentDataPins?.i_rblt]))
                return { ...c }
            if (currentDataPins?.id === undefined || currentDataPins?.id === '')
                currentDataPins.id = null
            else if (currentDataPins?.id !== null) {
                if (!isNaN(currentDataPins.id))
                    currentDataPins.id = parseFloat(currentDataPins.id)
                for (let i_rblt = 0; i_rblt < 4; i_rblt++) {
                    for (let i_pin = 0; i_pin < (c?.pins_rblt?.[i_rblt] ?? []).length; i_pin++) {
                        if (c?.pins_rblt?.[i_rblt]?.[i_pin]?.id === currentDataPins.id) c.pins_rblt[i_rblt][i_pin].id = null
                    }
                }
            }
            if (currentDataPins?.line_name === undefined || currentDataPins?.line_name === '')
                currentDataPins.line_name = null

            if (currentDataPins?.i_pin === undefined || currentDataPins?.i_pin === null) {
                c.pins_rblt[currentDataPins?.i_rblt].push({ id: currentDataPins.id, name: currentDataPins?.name, line_name: currentDataPins.line_name })
            } else {
                if (c?.pins_rblt?.[currentDataPins.i_rblt]?.[currentDataPins?.i_pin] === undefined || c?.pins_rblt?.[currentDataPins.i_rblt]?.[currentDataPins?.i_pin] === null)
                    return { ...c }
                c.pins_rblt[currentDataPins.i_rblt][currentDataPins?.i_pin] = { id: currentDataPins.id, name: currentDataPins?.name, line_name: currentDataPins.line_name }
            }
        } catch (e) { setDataModalPins({ open: false, i_rblt: null, i_pin: null, id: null, name: null, line_name: null }) }
        return { ...c }
    })
    const onPinIdOutFocus = (e, data = { i_rblt: null, i_pin: null }) => setInternalComponent(c => {
        if (data?.i_rblt === undefined || data?.i_rblt === null ||
            data?.i_pin === undefined || data?.i_pin === null ||
            c?.pins_rblt?.[data?.i_rblt]?.[data?.i_pin] === undefined || c?.pins_rblt?.[data?.i_rblt]?.[data?.i_pin] === null
        ) return { ...c }
        const val = e?.target?.value === undefined || e?.target?.value === null || e?.target?.value === '' ? null : (isNaN(e.target.value) ? e.target.value : parseFloat(e.target.value))
        if (val !== null) {
            for (let i_rblt = 0; i_rblt < 4; i_rblt++) {
                for (let i_pin = 0; i_pin < (c?.pins_rblt?.[i_rblt] ?? []).length; i_pin++) {
                    if (c?.pins_rblt?.[i_rblt]?.[i_pin]?.id === val) c.pins_rblt[i_rblt][i_pin].id = null
                }
            }
        }
        c.pins_rblt[data.i_rblt][data.i_pin].id = val
        return { ...c }
    })

    const swapPin = ({ i_rblt, i_pin0, i_pin1 }) => setInternalComponent(c => {
        if (c?.pins_rblt?.[i_rblt]?.[i_pin0] === undefined || c?.pins_rblt?.[i_rblt]?.[i_pin0] === null || c?.pins_rblt?.[i_rblt]?.[i_pin1] === undefined || c?.pins_rblt?.[i_rblt]?.[i_pin1] === null)
            return { ...c }
        const pin0 = JSON.parse(JSON.stringify(c.pins_rblt[i_rblt][i_pin0]))
        const pin1 = JSON.parse(JSON.stringify(c.pins_rblt[i_rblt][i_pin1]))
        c.pins_rblt[i_rblt][i_pin0] = pin1
        c.pins_rblt[i_rblt][i_pin1] = pin0
        return { ...c }
    })

    const deletePin = ({ i_rblt, i_pin }) => setInternalComponent(c => {
        if (c?.pins_rblt?.[i_rblt]?.[i_pin] === undefined || c?.pins_rblt?.[i_rblt]?.[i_pin] === null)
            return { ...c }
        c.pins_rblt[i_rblt] = c.pins_rblt[i_rblt].filter((v, i) => i !== i_pin)
        return { ...c }
    })
    const rotateCW = c => ({
        ...c,
        pins_rblt: [
            c?.pins_rblt?.[3] ?? [],
            c?.pins_rblt?.[0] ?? [],
            c?.pins_rblt?.[1] ?? [],
            c?.pins_rblt?.[2] ?? []
        ]
    })
    const rotateCWPin = () => setInternalComponent(c => rotateCW(c))
    const rotateCCW = c => ({
        ...c,
        pins_rblt: [
            c?.pins_rblt?.[1] ?? [],
            c?.pins_rblt?.[2] ?? [],
            c?.pins_rblt?.[3] ?? [],
            c?.pins_rblt?.[0] ?? []
        ]
    })
    const rotateCCWPin = () => setInternalComponent(c => rotateCCW(c))
    const rotate180 = c => ({
        ...c,
        pins_rblt: [
            c?.pins_rblt?.[2] ?? [],
            c?.pins_rblt?.[3] ?? [],
            c?.pins_rblt?.[0] ?? [],
            c?.pins_rblt?.[1] ?? []
        ]
    })
    const rotate180Pin = () => setInternalComponent(c => rotate180(c))
    const rotateFlipH = c => ({
        ...c,
        pins_rblt: [
            (c?.pins_rblt?.[2] ?? []).reverse(),
            (c?.pins_rblt?.[1] ?? []).reverse(),
            (c?.pins_rblt?.[0] ?? []).reverse(),
            (c?.pins_rblt?.[3] ?? []).reverse()
        ]
    })
    const rotateFlipHPin = () => setInternalComponent(c => rotateFlipH(c))
    const rotateFlipV = c => ({
        ...c,
        pins_rblt: [
            (c?.pins_rblt?.[0] ?? []).reverse(),
            (c?.pins_rblt?.[3] ?? []).reverse(),
            (c?.pins_rblt?.[2] ?? []).reverse(),
            (c?.pins_rblt?.[1] ?? []).reverse()
        ]
    })
    const rotateFlipVPin = () => setInternalComponent(c => rotateFlipV(c))

    return (<Fragment>
        <Dialog
            open={open === true && dataModalPins?.open !== true}
            onClose={onClose}
            maxWidth={false}
            scroll="paper"
        >
            <DialogTitle>{componentId === undefined || componentId === null ? 'Tambah' : 'Ubah'} Komponen</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    {/* above MD */}
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch' }}>
                            {/* Top */}
                            {(internalComponent?.pins_rblt?.[3] ?? []).map((pin, i_pin) => (
                                <Box key={`top_pin_${i_pin}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <IconButton
                                        onClick={() => setDataModalPins({ open: true, i_rblt: 3, i_pin: i_pin, id: pin?.id, name: pin?.name, line_name: pin?.line_name })}
                                    ><EditIcon /></IconButton>
                                    <IconButton
                                        onClick={() => deletePin({ i_rblt: 3, i_pin: i_pin })}
                                    ><DeleteIcon /></IconButton>
                                    <Typography variant="body1" sx={{ flexGrow: 1, writingMode: 'vertical-rl' }}>
                                        {pin?.line_name !== undefined && pin?.line_name !== null && pin?.line_name !== '' && `${pin?.line_name} -> `}
                                        {pin?.name}
                                        {pin?.id !== undefined && pin?.id !== null && pin?.id !== '' && ` (${pin?.id})`}
                                    </Typography>
                                    {internalComponent.pins_rblt[3].length > 1 && (<Fragment>
                                        {i_pin < (internalComponent.pins_rblt[3].length - 1) && (
                                            <IconButton
                                                onClick={() => swapPin({ i_rblt: 3, i_pin0: i_pin, i_pin1: i_pin + 1 })}
                                            ><ToRightIcon /></IconButton>
                                        )}
                                        {i_pin > 0 && (
                                            <IconButton
                                                onClick={() => swapPin({ i_rblt: 3, i_pin0: i_pin, i_pin1: i_pin - 1 })}
                                            ><ToLeftIcon /></IconButton>
                                        )}
                                    </Fragment>)}
                                </Box>
                            ))}
                            <Box component={Button} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                onClick={() => setDataModalPins({ open: true, i_rblt: 3, i_pin: null, id: null, name: null, line_name: null })}
                            >
                                <AddIcon />
                                <Typography variant="body1" sx={{ flexGrow: 1, writingMode: 'vertical-rl' }}>Tambah Pin</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'center' }}>
                                {/* Left */}
                                {(internalComponent?.pins_rblt?.[2] ?? []).map((pin, i_pin) => (
                                    <Box key={`left_pin_${i_pin}`} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <IconButton
                                            onClick={() => setDataModalPins({ open: true, i_rblt: 2, i_pin: i_pin, id: pin?.id, name: pin?.name, line_name: pin?.line_name })}
                                        ><EditIcon /></IconButton>
                                        <IconButton
                                            onClick={() => deletePin({ i_rblt: 2, i_pin: i_pin })}
                                        ><DeleteIcon /></IconButton>
                                        <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                            {pin?.line_name !== undefined && pin?.line_name !== null && pin?.line_name !== '' && `${pin?.line_name} -> `}
                                            {pin?.name}
                                            {pin?.id !== undefined && pin?.id !== null && pin?.id !== '' && ` (${pin?.id})`}
                                        </Typography>
                                        {internalComponent.pins_rblt[2].length > 1 && (<Fragment>
                                            {i_pin < (internalComponent.pins_rblt[2].length - 1) && (
                                                <IconButton
                                                    onClick={() => swapPin({ i_rblt: 2, i_pin0: i_pin, i_pin1: i_pin + 1 })}
                                                ><ToTopIcon /></IconButton>
                                            )}
                                            {i_pin > 0 && (
                                                <IconButton
                                                    onClick={() => swapPin({ i_rblt: 2, i_pin0: i_pin, i_pin1: i_pin - 1 })}
                                                ><ToBottomIcon /></IconButton>
                                            )}
                                        </Fragment>)}
                                    </Box>
                                ))}
                                <Box component={Button} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                                    onClick={() => setDataModalPins({ open: true, i_rblt: 2, i_pin: null, id: null, name: null, line_name: null })}
                                >
                                    <AddIcon />
                                    <Typography variant="body1" sx={{ flexGrow: 1, }}>Tambah Pin</Typography>
                                </Box>

                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <TextField label="ID Komponen" error={(internalComponent?.id ?? "").length == 0 || (reserveIDs ?? []).includes(internalComponent?.id ?? "")} value={internalComponent?.id ?? ""} onChange={e => setInternalComponent(d => ({ ...d, id: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                                <TextField label="Nama Komponen" value={internalComponent?.name ?? ""} onChange={e => setInternalComponent(d => ({ ...d, name: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                                <TextField label="Nilai / Tipe Komponen" value={internalComponent?.value ?? ""} onChange={e => setInternalComponent(d => ({ ...d, value: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexDirection: 'row' }}>
                                    <IconButton onClick={rotateCCWPin}><CCWIcon /></IconButton>
                                    <IconButton onClick={rotateFlipHPin}><FlipHIcon /></IconButton>
                                    <IconButton onClick={rotate180Pin}><Deg180Icon /></IconButton>
                                    <IconButton onClick={rotateFlipVPin}><FlipVIcon /></IconButton>
                                    <IconButton onClick={rotateCWPin}><CWIcon /></IconButton>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {/* Right */}
                                {(internalComponent?.pins_rblt?.[0] ?? []).map((pin, i_pin) => (
                                    <Box key={`right_pin_${i_pin}`} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        {internalComponent.pins_rblt[0].length > 1 && (<Fragment>
                                            {i_pin > 0 && (
                                                <IconButton
                                                    onClick={() => swapPin({ i_rblt: 0, i_pin0: i_pin, i_pin1: i_pin - 1 })}
                                                ><ToTopIcon /></IconButton>
                                            )}
                                            {i_pin < (internalComponent.pins_rblt[0].length - 1) && (
                                                <IconButton
                                                    onClick={() => swapPin({ i_rblt: 0, i_pin0: i_pin, i_pin1: i_pin + 1 })}
                                                ><ToBottomIcon /></IconButton>
                                            )}
                                        </Fragment>)}
                                        <Typography variant="body1" sx={{ flexGrow: 1, textAlign: 'end' }}>
                                            {pin?.line_name !== undefined && pin?.line_name !== null && pin?.line_name !== '' && `${pin?.line_name} -> `}
                                            {pin?.name}
                                            {pin?.id !== undefined && pin?.id !== null && pin?.id !== '' && ` (${pin?.id})`}
                                        </Typography>
                                        <IconButton
                                            onClick={() => deletePin({ i_rblt: 0, i_pin: i_pin })}
                                        ><DeleteIcon /></IconButton>
                                        <IconButton
                                            onClick={() => setDataModalPins({ open: true, i_rblt: 0, i_pin: i_pin, id: pin?.id, name: pin?.name, line_name: pin?.line_name })}
                                        ><EditIcon /></IconButton>
                                    </Box>
                                ))}
                                <Box component={Button} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                                    onClick={() => setDataModalPins({ open: true, i_rblt: 0, i_pin: null, id: null, name: null, line_name: null })}
                                >
                                    <Typography variant="body1" sx={{ flexGrow: 1, textAlign: 'end' }}>Tambah Pin</Typography>
                                    <AddIcon />
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'center' }}>
                            {/* Bottom */}
                            {(internalComponent?.pins_rblt?.[1] ?? []).map((pin, i_pin) => (
                                <Box key={`bottom_pin_${i_pin}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {internalComponent.pins_rblt[1].length > 1 && (<Fragment>
                                        {i_pin > 0 && (
                                            <IconButton
                                                onClick={() => swapPin({ i_rblt: 1, i_pin0: i_pin, i_pin1: i_pin - 1 })}
                                            ><ToRightIcon /></IconButton>
                                        )}
                                        {i_pin < (internalComponent.pins_rblt[1].length - 1) && (
                                            <IconButton
                                                onClick={() => swapPin({ i_rblt: 1, i_pin0: i_pin, i_pin1: i_pin + 1 })}
                                            ><ToLeftIcon /></IconButton>
                                        )}
                                    </Fragment>)}
                                    <Typography variant="body1" sx={{ flexGrow: 1, writingMode: 'vertical-rl', textAlign: 'end' }}>
                                        {pin?.line_name !== undefined && pin?.line_name !== null && pin?.line_name !== '' && `${pin?.line_name} -> `}
                                        {pin?.name}
                                        {pin?.id !== undefined && pin?.id !== null && pin?.id !== '' && ` (${pin?.id})`}
                                    </Typography>
                                    <IconButton
                                        onClick={() => deletePin({ i_rblt: 1, i_pin: i_pin })}
                                    ><DeleteIcon /></IconButton>
                                    <IconButton
                                        onClick={() => setDataModalPins({ open: true, i_rblt: 1, i_pin: i_pin, id: pin?.id, name: pin?.name, line_name: pin?.line_name })}
                                    ><EditIcon /></IconButton>
                                </Box>
                            ))}
                            <Box component={Button} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                onClick={() => setDataModalPins({ open: true, i_rblt: 1, i_pin: null, id: null, name: null, line_name: null })}
                            >
                                <Typography variant="body1" sx={{ flexGrow: 1, writingMode: 'vertical-rl', textAlign: 'end' }}>Tambah Pin</Typography>
                                <AddIcon />
                            </Box>

                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Typography variant="subtitle2">Komponen</Typography>
                    <TextField label="ID Komponen" error={(internalComponent?.id ?? "").length == 0 || (reserveIDs ?? []).includes(internalComponent?.id ?? "")} value={internalComponent?.id ?? ""} onChange={e => setInternalComponent(d => ({ ...d, id: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                    <TextField label="Nama Komponen" value={internalComponent?.name ?? ""} onChange={e => setInternalComponent(d => ({ ...d, name: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                    <TextField label="Nilai / Tipe Komponen" value={internalComponent?.value ?? ""} onChange={e => setInternalComponent(d => ({ ...d, value: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                    <Typography variant="subtitle2">Pin</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', flexDirection: 'row' }}>
                        <IconButton onClick={rotateCCWPin}><CCWIcon /></IconButton>
                        <IconButton onClick={rotateFlipHPin}><FlipHIcon /></IconButton>
                        <IconButton onClick={rotate180Pin}><Deg180Icon /></IconButton>
                        <IconButton onClick={rotateFlipVPin}><FlipVIcon /></IconButton>
                        <IconButton onClick={rotateCWPin}><CWIcon /></IconButton>
                    </Box>
                    {([0, 1, 2, 3]).map(i_rblt => (<Fragment key={`pin_rblt_xs_md_${i_rblt}`}>
                        <Typography variant="subtitle2">{(['Pin Kanan', 'Pin Bawah', 'Pin Kiri', 'Pin Atas'])[i_rblt]}</Typography>
                        <Typography variant="body2">{(['Dari Atas ke Bawah', 'Dari Kanan ke Kiri', 'Dari Bawah ke Atas', 'Dari Kiri ke Kanan'])[i_rblt]}</Typography>
                        {(internalComponent?.pins_rblt?.[i_rblt] ?? []).map((pin, i_pin) => (<Fragment key={`pin_rblt_${i_rblt}_${i_pin}`}>
                            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                                <TextField label="ID / IO Pin" value={pin?.id ?? ""} autoComplete="off" variant="outlined" sx={{ flexGrow: 1 }} margin="dense"
                                    onChange={e => setInternalComponent(c => {
                                        if (c?.pins_rblt?.[i_rblt]?.[i_pin] === undefined || c?.pins_rblt?.[i_rblt]?.[i_pin] === null)
                                            return { ...c }
                                        c.pins_rblt[i_rblt][i_pin].id = e?.target?.value === undefined || e?.target?.value === null || e?.target?.value === '' ? null : (isNaN(e.target.value) ? e.target.value : parseFloat(e.target.value))
                                        return { ...c }
                                    })}
                                    onBlur={e => onPinIdOutFocus(e, { i_rblt, i_pin })}
                                />
                                <IconButton
                                    onClick={() => deletePin({ i_rblt, i_pin })}
                                ><DeleteIcon /></IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                                <TextField label="Nama Pin" value={pin?.name ?? ""} autoComplete="off" variant="outlined" sx={{ flexGrow: 1 }} margin="dense"
                                    onChange={e => setInternalComponent(c => {
                                        if (c?.pins_rblt?.[i_rblt]?.[i_pin] === undefined || c?.pins_rblt?.[i_rblt]?.[i_pin] === null)
                                            return { ...c }
                                        c.pins_rblt[i_rblt][i_pin].name = e?.target?.value
                                        return { ...c }
                                    })}
                                />
                                <TextField label="Nama Jalur Pin" value={pin?.line_name ?? ""} autoComplete="off" variant="outlined" sx={{ flexGrow: 1 }} margin="dense"
                                    onChange={e => setInternalComponent(c => {
                                        if (c?.pins_rblt?.[i_rblt]?.[i_pin] === undefined || c?.pins_rblt?.[i_rblt]?.[i_pin] === null)
                                            return { ...c }
                                        c.pins_rblt[i_rblt][i_pin].line_name = e?.target?.value === undefined || e?.target?.value === null || e?.target?.value === '' ? null : e.target.value
                                        return { ...c }
                                    })}
                                />
                            </Box>
                        </Fragment>))}
                        <Box component={Button} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                            onClick={() => setInternalComponent(c => {
                                c.pins_rblt[i_rblt].push({ id: null, name: '', line_name: null })
                                return { ...c }
                            })}
                        >
                            <Typography variant="body1" sx={{ flexGrow: 1, textAlign: 'end' }}>Tambah Pin</Typography>
                            <AddIcon />
                        </Box>
                    </Fragment>))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Batal</Button>
                {componentId !== undefined && componentId !== null && (
                    <Button onClick={() => {
                        if (typeof onDeleteClick == 'function')
                            onDeleteClick(componentId)
                    }}>Hapus</Button>
                )}
                <Button onClick={onOkComponentClick}>Simpan</Button>
            </DialogActions>
        </Dialog>
        <Dialog
            open={open === true && dataModalPins?.open === true}
            onClose={onCloseModalPin}
        >
            <DialogTitle>Pin</DialogTitle>
            <DialogContent dividers>
                <TextField label="ID / IO Pin" value={dataModalPins?.id ?? ""} onChange={e => setDataModalPins(d => ({ ...d, id: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                <TextField label="Nama Pin" value={dataModalPins?.name ?? ""} onChange={e => setDataModalPins(d => ({ ...d, name: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
                <TextField label="Nama Jalur Pin" value={dataModalPins?.line_name ?? ""} onChange={e => setDataModalPins(d => ({ ...d, line_name: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDataModalPins({ open: false, i_rblt: null, i_pin: null, id: null, name: null, line_name: null })}>Batal</Button>
                <Button onClick={onOkPinClick}>Simpan</Button>
            </DialogActions>
        </Dialog>
    </Fragment>)
}

const ModalConnectedPins = ({
    open = false,
    detailCurrentPin = { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null },
    detailConnectedPins = [],
    onSaveLineName = (data = { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null }) => { },
    onDisconnectPin = (data = { from_pin_id: null, to_pin_id: null }) => { },
    onClose = () => { } }) => {
    const [internalCurrentPin, setInternalCurrentPin] = useState({ i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null })
    useEffect(() => setInternalCurrentPin(JSON.parse(JSON.stringify(detailCurrentPin ?? {}))), [detailCurrentPin])
    const onSaveClick = () => {
        const tempCurrentPin = JSON.parse(JSON.stringify(internalCurrentPin ?? {}))
        if (tempCurrentPin?.pin_line_name === undefined || tempCurrentPin?.pin_line_name === '')
            tempCurrentPin.pin_line_name = null
        if (typeof onSaveLineName == 'function')
            onSaveLineName(tempCurrentPin)
    }
    return (<Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
    >
        <DialogTitle>{`${internalCurrentPin?.component_id} ${internalCurrentPin?.pin_name}`}</DialogTitle>
        <DialogContent dividers>
            <TextField label="Nama Jalur Pin" value={internalCurrentPin?.pin_line_name ?? ""} onChange={e => setInternalCurrentPin(d => ({ ...d, pin_line_name: e.target.value }))} autoComplete="off" variant="outlined" margin="dense" fullWidth />
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Terhubung dengan</Typography>
                {(detailConnectedPins ?? []).length > 0 && (<IconButton
                    onClick={() => {
                        if (typeof onDisconnectPin == 'function')
                            onDisconnectPin({ from_pin_id: internalCurrentPin?.pin_id, to_pin_id: null })
                    }}
                ><BlockIcon />
                </IconButton>)}
            </Box>
            {(detailConnectedPins ?? []).map(p => (<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} key={`pin_${p?.pin_id}`}>
                <Typography variant="body1" sx={{ flexGrow: 1 }}>{`${p?.component_id} ${p?.pin_name}`}</Typography>
                <IconButton
                    onClick={() => {
                        if (typeof onDisconnectPin == 'function')
                            onDisconnectPin({ from_pin_id: internalCurrentPin?.pin_id, to_pin_id: p?.pin_id })
                    }}
                ><BlockIcon /></IconButton>
            </Box>))}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onSaveClick}>Simpan</Button>
        </DialogActions>
    </Dialog>)
}

const ModalNameLines = ({
    open = false,
    detailLines = [],
    onSaveLinesName = (data = []) => { },
    onClose = () => { } }) => {
    const [internalLines, setInternalLines] = useState([])
    useEffect(() => setInternalLines(JSON.parse(JSON.stringify(detailLines))), [detailLines])
    const onSaveClick = () => {
        const tempLines = JSON.parse(JSON.stringify(internalLines ?? []))
        for (let i = 0; i < internalLines.length; i++) {
            if (tempLines?.[i]?.line_name === undefined || tempLines?.[i]?.line_name === '')
                tempLines[i].line_name = null
        }
        if (typeof onSaveLinesName == 'function')
            onSaveLinesName(tempLines)
    }
    return (<Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
    >
        <DialogTitle>Nama Jalur</DialogTitle>
        <DialogContent dividers>
            {(internalLines ?? []).map((l, i) => (
                <TextField
                    key={`line_name_pin_${l?.pin_id}`}
                    label={`Nama Jalur ${l?.component_id ?? ""} ${l?.pin_name ?? ""}`} value={l?.pin_line_name ?? ""}
                    onChange={e => setInternalLines(l_s => {
                        if (l_s?.[i]?.component_id === undefined || l_s?.[i]?.component_id === null ||
                            l_s?.[i]?.pin_id === undefined || l_s?.[i]?.pin_id === null ||
                            l_s?.[i]?.pin_id !== l?.pin_id
                        )
                            return [...l_s]
                        l_s[i].pin_line_name = e.target.value
                        return [...l_s]

                    })} autoComplete="off" variant="outlined" margin="dense" fullWidth />
            ))}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onSaveClick}>Simpan</Button>
        </DialogActions>
    </Dialog>)
}

const ModalConnectedPinsWithLinesName = ({
    open = false,
    detailCurrentPin = { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null },
    detailConnectedPins = [],
    detailLines = [],
    onSaveLinesName = (data = []) => { },
    onDisconnectPin = (data = { from_pin_id: null, to_pin_id: null }) => { },
    onClose = () => { } }) => {

    const [internalCurrentPin, setInternalCurrentPin] = useState({ i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null })
    const [internalLines, setInternalLines] = useState([])
    useEffect(() => setInternalCurrentPin(JSON.parse(JSON.stringify(detailCurrentPin ?? {}))), [detailCurrentPin])
    useEffect(() => setInternalLines(JSON.parse(JSON.stringify(detailLines))), [detailLines])

    const onSaveClick = () => {
        const tempLines = JSON.parse(JSON.stringify(internalLines ?? []))
        for (let i = 0; i < internalLines.length; i++) {
            if (tempLines?.[i]?.line_name === undefined || tempLines?.[i]?.line_name === '')
                tempLines[i].line_name = null
        }
        if (typeof onSaveLinesName == 'function')
            onSaveLinesName(tempLines)
    }

    return (<Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
    >
        <DialogTitle>{`${internalCurrentPin?.component_id} ${internalCurrentPin?.pin_name}`}</DialogTitle>
        <DialogContent dividers>
            <Typography variant="subtitle2">Nama Jalur Pin</Typography>
            {(internalLines ?? []).map((l, i) => (
                <TextField
                    key={`line_name_pin_${l?.pin_id}`}
                    label={`Nama Jalur ${l?.component_id ?? ""} ${l?.pin_name ?? ""}`} value={l?.pin_line_name ?? ""}
                    onChange={e => setInternalLines(l_s => {
                        if (l_s?.[i]?.component_id === undefined || l_s?.[i]?.component_id === null ||
                            l_s?.[i]?.pin_id === undefined || l_s?.[i]?.pin_id === null ||
                            l_s?.[i]?.pin_id !== l?.pin_id
                        )
                            return [...l_s]
                        l_s[i].pin_line_name = e.target.value
                        return [...l_s]

                    })} autoComplete="off" variant="outlined" margin="dense" fullWidth />
            ))}
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Terhubung dengan</Typography>
                {(detailConnectedPins ?? []).length > 0 && (<IconButton
                    onClick={() => {
                        if (typeof onDisconnectPin == 'function')
                            onDisconnectPin({ from_pin_id: internalCurrentPin?.pin_id, to_pin_id: null })
                    }}
                ><BlockIcon />
                </IconButton>)}
            </Box>
            {(detailConnectedPins ?? []).map(p => (<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} key={`pin_${p?.pin_id}`}>
                <Typography variant="body1" sx={{ flexGrow: 1 }}>{`${p?.component_id} ${p?.pin_name}`}</Typography>
                <IconButton
                    onClick={() => {
                        if (typeof onDisconnectPin == 'function')
                            onDisconnectPin({ from_pin_id: internalCurrentPin?.pin_id, to_pin_id: p?.pin_id })
                    }}
                ><BlockIcon /></IconButton>
            </Box>))}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onSaveClick}>Simpan</Button>
        </DialogActions>
    </Dialog>)
}

const ModalConnect = ({
    open = false,
    fromPinID = null, to1PinID = null, to2PinID = null,
    fromPinDetail = null, to1PinDetail = null, to2PinDetail = null,
    onConnect = ({ from_pin_id = null, before_pin_id = null, delay_us = 0, after_pin_id = null, propagation_us }) => { },
    onClose = () => { }
}) => {
    const [internalData, setInternalData] = useState({
        from_pin_id: null, to_1_pin_id: null, to_2_pin_id: null,
        from_pin_detail: null, to_1_pin_detail: null, to_2_pin_detail: null,
        picked_to_1_pin_id: false, picked_to_2_pin_id: false,
        delay_us: 0, propagation_us: 0
    })
    useEffect(() => setInternalData({
        from_pin_id: fromPinID ?? null, from_pin_detail: fromPinDetail ?? null,
        to_1_pin_id: to1PinID ?? null, to_1_pin_detail: to1PinDetail ?? null, picked_to_1_pin_id: null,
        to_2_pin_id: to2PinID ?? null, to_2_pin_detail: to2PinDetail ?? null, picked_to_2_pin_id: null,
        delay_us: 0, propagation_us: 0
    }), [open, fromPinID, fromPinDetail, to1PinID, to1PinDetail, to2PinID, to2PinDetail])
    const onClickConnect = () => {
        if (typeof onConnect != 'function' ||
            internalData?.from_pin_id === undefined || internalData?.from_pin_id === null || isNaN(internalData?.from_pin_id) || parseInt(internalData?.from_pin_id) < 0 ||
            (internalData?.picked_to_1_pin_id === internalData?.from_pin_id && internalData?.picked_to_2_pin_id === internalData?.from_pin_id) ||
            (internalData?.picked_to_1_pin_id === null && (internalData?.delay_us ?? 0) === 0 && internalData?.picked_to_2_pin_id === internalData?.from_pin_id)
        ) return
        onConnect({
            from_pin_id: parseInt(internalData?.from_pin_id),
            before_pin_id: internalData?.picked_to_1_pin_id === undefined || internalData?.picked_to_1_pin_id === null || isNaN(internalData?.picked_to_1_pin_id) || parseInt(internalData?.picked_to_1_pin_id) < 0 ?
                null : parseInt(internalData?.picked_to_1_pin_id),
            delay_us: internalData?.delay_us === undefined || internalData?.delay_us === null || isNaN(internalData?.delay_us) || parseInt(internalData?.delay_us) < 0 ? 0 :
                parseInt(internalData?.delay_us),
            after_pin_id: internalData?.picked_to_2_pin_id === undefined || internalData?.picked_to_2_pin_id === null || isNaN(internalData?.picked_to_2_pin_id) || parseInt(internalData?.picked_to_2_pin_id) < 0 ?
                null : parseInt(internalData?.picked_to_2_pin_id),
            propagation_us: internalData?.propagation_us === undefined || internalData?.propagation_us === null || isNaN(internalData?.propagation_us) || parseInt(internalData?.propagation_us) < 0 ? 0 :
                parseInt(internalData?.propagation_us),
        })
    }
    return (<Dialog
        fullWidth
        maxWidth="sm"
        open={open === true}
        onClose={onClose}
    >
        <DialogTitle>Menghubungkan</DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="subtitle2">Pin Asal</Typography>
                    <Typography variant="body2">{internalData?.from_pin_detail} ({internalData?.from_pin_id})</Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Typography variant="subtitle2">Tekan</Typography>
                    {internalData?.to_1_pin_id !== undefined && internalData?.to_1_pin_id !== null && (<div><span>
                        <Radio
                            checked={
                                internalData?.picked_to_1_pin_id !== undefined && internalData?.picked_to_1_pin_id !== null &&
                                internalData?.picked_to_1_pin_id === internalData?.to_1_pin_id
                            }
                            onChange={() => setInternalData(d => ({ ...d, picked_to_1_pin_id: d?.to_1_pin_id }))}
                        />
                        <Typography display="inline">{internalData?.to_1_pin_detail} ({internalData?.to_1_pin_id})</Typography>
                    </span></div>)}
                    <div><span>
                        <Radio
                            checked={
                                internalData?.picked_to_1_pin_id !== undefined && internalData?.picked_to_1_pin_id !== null &&
                                internalData?.picked_to_1_pin_id === internalData?.from_pin_id
                            }
                            onChange={() => setInternalData(d => ({ ...d, picked_to_1_pin_id: d?.from_pin_id }))}
                        />
                        <Typography display="inline">{internalData?.from_pin_detail} ({internalData?.from_pin_id})</Typography>
                    </span></div>
                    <div><span>
                        <Radio
                            checked={
                                internalData?.picked_to_1_pin_id !== undefined && internalData?.picked_to_1_pin_id === null &&
                                !isNaN(internalData?.delay_us) && parseInt(internalData?.delay_us) > 0
                            }
                            onChange={() => setInternalData(d => ({
                                ...d, picked_to_1_pin_id: null,
                                delay_us: d?.delay_us === undefined || d?.delay_us === null || isNaN(d?.delay_us) || parseInt(d?.delay_us) <= 0 ? 1 : parseInt(d?.delay_us)
                            }))}
                        />
                        <Typography display="inline">Putuskan</Typography>
                    </span></div>
                    <div><span>
                        <Radio
                            checked={
                                internalData?.picked_to_1_pin_id !== undefined && internalData?.picked_to_1_pin_id === null &&
                                !isNaN(internalData?.delay_us) && parseInt(internalData?.delay_us) <= 0
                            }
                            onChange={() => setInternalData(d => ({ ...d, picked_to_1_pin_id: null, delay_us: 0 }))}
                        />
                        <Typography display="inline">Segera Sambungkan</Typography>
                    </span></div>
                </Grid>
                <Grid container item xs={12} md={2} justifyContent="center" alignItems="center">
                    <IconButton
                        onClick={() => setInternalData(d => ({
                            ...d,
                            picked_to_1_pin_id: d?.picked_to_2_pin_id ?? null, to_1_pin_id: d?.to_2_pin_id ?? null, to_1_pin_detail: d?.to_2_pin_detail ?? '',
                            picked_to_2_pin_id: d?.picked_to_1_pin_id ?? null, to_2_pin_id: d?.to_1_pin_id ?? null, to_2_pin_detail: d?.to_1_pin_detail ?? ''
                        }))}
                    ><SyncIcon /></IconButton>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Typography variant="subtitle2">Lepas</Typography>
                    {internalData?.to_2_pin_id !== undefined && internalData?.to_2_pin_id !== null && (<div><span>
                        <Radio
                            checked={
                                internalData?.picked_to_2_pin_id !== undefined && internalData?.picked_to_2_pin_id !== null &&
                                internalData?.picked_to_2_pin_id === internalData?.to_2_pin_id
                            }
                            onChange={() => setInternalData(d => ({ ...d, picked_to_2_pin_id: d?.to_2_pin_id }))}
                        />
                        <Typography display="inline">{internalData?.to_2_pin_detail} ({internalData?.to_2_pin_id})</Typography>
                    </span></div>)}
                    <div><span>
                        <Radio
                            checked={
                                internalData?.picked_to_2_pin_id !== undefined && internalData?.picked_to_2_pin_id !== null &&
                                internalData?.picked_to_2_pin_id === internalData?.from_pin_id
                            }
                            onChange={() => setInternalData(d => ({ ...d, picked_to_2_pin_id: d?.from_pin_id }))}
                        />
                        <Typography display="inline">{internalData?.from_pin_detail} ({internalData?.from_pin_id})</Typography>
                    </span></div>
                    <div><span>
                        <Radio
                            checked={internalData?.picked_to_2_pin_id !== undefined && internalData?.picked_to_2_pin_id === null}
                            onChange={() => setInternalData(d => ({ ...d, picked_to_2_pin_id: null }))}
                        />
                        <Typography display="inline">Putuskan</Typography>
                    </span></div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField label="Lama Tekan (us)" autoComplete="off" variant="outlined" margin="dense" fullWidth
                        value={(internalData?.delay_us ?? 0) === 0 ? '' : internalData?.delay_us}
                        onChange={e => setInternalData(d => ({
                            ...d,
                            delay_us: e.target.value === '' || isNaN(e.target.value) || parseInt(e.target.value) < 0 ? 0 : parseInt(e.target.value)
                        }))}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField label="Waktu Propagasi (us)" autoComplete="off" variant="outlined" margin="dense" fullWidth
                        value={(internalData?.propagation_us ?? 0) === 0 ? '' : internalData?.propagation_us}
                        onChange={e => setInternalData(d => ({
                            ...d,
                            propagation_us: e.target.value === '' || isNaN(e.target.value) || parseInt(e.target.value) < 0 ? 0 : parseInt(e.target.value)
                        }))}
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onClickConnect}>Hubungkan</Button>
        </DialogActions>
    </Dialog>)
}

const ProjectComponent = () => {
    const { project_id } = useParams()
    const [internalComponents, setInternalComponents] = useState({ changed: false, new_data: false, data: [] })
    const [currentComponents, setCurrentComponents] = useState([])
    const [internalLines, setInternalLines] = useState([])
    const [internalADCVals, setInternalADCVals] = useState([])
    const [dataModalComponent, setDataModalComponent] = useState({ open: false, reserveIDs: [], component_id: null, component: { id: null, name: null, value: null, pins_rblt: [[], [], [], []] } })
    const [dataModalPin, setDataModalPin] = useState({ open: false, detailCurrentPin: { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null }, detailConnectedPins: [] })
    const [dataModalLinesName, setDataModalLinesName] = useState({ open: false, detailLines: [] })
    const [dataModalPinLinesName, setDataModalPinLinesName] = useState({ open: false, detailCurrentPin: { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null }, detailConnectedPins: [], detailLines: [] })
    const [dataModalConnect, setDataModalConnect] = useState({ open: false, from_pin_id: null, to_1_pin_id: null, to_2_pin_id: null, from_pin_detail: null, to_1_pin_detail: null, to_2_pin_detail: null })
    const { readyState, lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL + encodeURIComponent(project_id) + '/component', { shouldReconnect: () => true })

    useEffect(() => {
        document.title = 'Komponen ' + project_id + ' | Interkoneksi Rangkaian'
        return () => document.title = 'Interkoneksi Rangkaian'
    }, [project_id])

    useEffect(() => {
        if (lastJsonMessage?.req === 'component_change')
            setInternalComponents(d => {
                if (d?.changed !== true)
                    d = { changed: false, new_data: false, data: lastJsonMessage?.components ?? [] }
                else
                    d.new_data = true
                setCurrentComponents(lastJsonMessage?.components ?? [])
                return { ...d }
            })
        else if (lastJsonMessage?.req === 'io_change') {
            setInternalLines(lastJsonMessage?.line ?? [])
            setInternalADCVals(lastJsonMessage?.adc_val ?? [])
        }
    }, [lastJsonMessage])

    const getLinesName = (line_id) => {
        const tempLinesName = []
        const line = (internalLines ?? []).find(l => l?.id === line_id)
        if (line === undefined || line === null)
            return tempLinesName
        for (const [i_c, c] of (internalComponents?.data ?? []).entries()) {
            for (let i_rblt = 0; i_rblt < 4; i_rblt++) {
                for (const [i_pin, pin] of (c?.pins_rblt?.[i_rblt] ?? []).entries()) {
                    if (pin?.id !== undefined && pin?.id !== null && (line?.pins_id ?? []).includes(pin?.id))
                        tempLinesName.push({ i_component: i_c, component_id: c?.id, i_rblt, i_pin, pin_id: pin?.id, pin_name: pin?.name, pin_line_name: pin?.line_name })
                }
            }
        }
        return tempLinesName
    }

    const getConnectedPins = (pin_id) => {
        const connectedToPinss = []
        const ret = {
            details: { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id, pin_name: null, pin_line_name: null },
            connected_pins: []
        }
        if (pin_id === undefined || pin_id === null)
            return ret
        for (const line of internalLines) {
            if ((line?.pins_id ?? []).includes(pin_id))
                connectedToPinss.push(...line.pins_id.filter(id => id !== pin_id && !connectedToPinss.includes(id)))
        }
        for (const [i_c, c] of (internalComponents?.data ?? []).entries()) {
            for (let i_rblt = 0; i_rblt < 4; i_rblt++) {
                for (const [i_pin, pin] of (c?.pins_rblt?.[i_rblt] ?? []).entries()) {
                    if (pin?.id !== undefined && pin?.id !== null) {
                        if (pin?.id == pin_id)
                            ret.details = { i_component: i_c, component_id: c?.id, i_rblt, i_pin, pin_id: pin?.id, pin_name: pin?.name, pin_line_name: pin?.line_name }
                        else if (connectedToPinss.includes(pin?.id))
                            ret.connected_pins.push({ i_component: i_c, component_id: c?.id, i_rblt, i_pin, pin_id: pin?.id, pin_name: pin?.name, pin_line_name: pin?.line_name })
                    }
                }
            }
        }
        return ret
    }

    useEffect(() => {
        try {
            const checkDuplicateInternal = checkDuplicateComponentsArrayAndGiveBracketName(internalComponents?.data ?? [], internalADCVals ?? [])
            const checkDuplicateCurrent = checkDuplicateComponentsArrayAndGiveBracketName(currentComponents ?? [], internalADCVals ?? [])
            if (checkDuplicateInternal.change)
                setInternalComponents(cs => ({ ...cs, data: checkDuplicateInternal.components }))
            if (checkDuplicateCurrent.change)
                setCurrentComponents(checkDuplicateCurrent.components)
        } catch (e) {
            setInternalComponents({ changed: false, new_data: false, data: [] })
            setCurrentComponents([])
        }
    }, [internalComponents, currentComponents, internalADCVals])

    const onModalComponentClose = () => setDataModalComponent({ open: false, reserveIDs: [], component_id: null, component: { id: null, name: null, value: null, pins_rblt: [[], [], [], []] } })
    const onModalComponentSave = (data, id) => {
        setInternalComponents(c => {
            if (!Array.isArray(c?.data))
                c = { changed: true, new_data: false, data: [] }
            c.changed = true
            const i = id === undefined || id === null ? -1 : c.data.findIndex(d => d?.id == id)
            if (i >= 0)
                c.data.splice(i, 1)
            c.data.unshift(data)
            return { ...c }
        })
        onModalComponentClose()
    }

    const saveManyLinesName = (data = []) => setInternalComponents(c => {
        if (!Array.isArray(c?.data))
            c = { changed: true, new_data: false, data: [] }
        c.changed = true
        for (let i = 0; i < (data ?? []).length; i++) {
            if (data?.[i]?.component_id == undefined || data?.[i]?.component_id == null ||
                data?.[i]?.pin_id == undefined || data?.[i]?.pin_id == null ||
                data?.[i]?.i_component == undefined || data?.[i]?.i_component == null ||
                data?.[i]?.i_rblt == undefined || data?.[i]?.i_rblt == null ||
                data?.[i]?.i_pin == undefined || data?.[i]?.i_pin == null ||
                c.data?.[data?.[i]?.i_component]?.id !== data?.[i]?.component_id ||
                c.data?.[data?.[i]?.i_component]?.pins_rblt?.[data?.[i]?.i_rblt][data?.[i]?.i_pin]?.id !== data?.[i]?.pin_id
            ) continue
            if (data[i]?.pin_line_name === undefined || data[i]?.pin_line_name === '')
                data[i].pin_line_name = null
            c.data[data[i].i_component].pins_rblt[data[i].i_rblt][data[i].i_pin].line_name = data[i].pin_line_name
        }
        return { ...c }
    })

    const onModalPinClose = () => setDataModalPin({ open: false, detailCurrentPin: { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null }, detailConnectedPins: [] })
    const onModalPinSave = (data) => {
        saveManyLinesName([data])
        onModalPinClose()
    }

    const onModalLinesNameClose = () => setDataModalLinesName({ open: false, detailLines: [] })
    const onModalLinesNameSave = (data) => {
        saveManyLinesName(data)
        onModalLinesNameClose()
    }

    const onModalPinLinesNameClose = () => setDataModalPinLinesName({ open: false, detailCurrentPin: { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null }, detailConnectedPins: [], detailLines: [] })
    const onModalPinLinesNameSave = (data) => {
        saveManyLinesName(data)
        onModalPinLinesNameClose()
    }
    const onSVGDoubleClick = (e, data) => {
        if (
            data?.component_id !== undefined && data?.component_id !== null &&
            (data?.pin_id === undefined || data?.pin_id === null) &&
            (data?.line_id === undefined || data?.line_id === null)
        ) {
            const tempDataModalComponent = { open: true, reserveIDs: [], component_id: data?.component_id, component: { id: data?.component_id, name: null, value: null, pins_rblt: [[], [], [], []] } }
            for (const c of internalComponents?.data ?? []) {
                if (c?.id === data?.component_id)
                    tempDataModalComponent.component = c
                else
                    tempDataModalComponent.reserveIDs.push(c?.id ?? "")
            }
            setDataModalComponent(tempDataModalComponent)
        } else if (
            data?.component_id !== undefined && data?.component_id !== null &&
            data?.pin_id !== undefined && data?.pin_id !== null &&
            (data?.line_id === undefined || data?.line_id === null)
        ) {
            const detailPin = getConnectedPins(data.pin_id)
            setDataModalPin({ open: true, detailCurrentPin: detailPin.details, detailConnectedPins: detailPin.connected_pins })
        } else if (
            (data?.component_id === undefined || data?.component_id === null) &&
            (data?.pin_id === undefined || data?.pin_id === null) &&
            data?.line_id !== undefined && data?.line_id !== null
        )
            setDataModalLinesName({ open: true, detailLines: getLinesName(data?.line_id) })
        else if (
            (data?.component_id === undefined || data?.component_id === null) &&
            data?.pin_id !== undefined && data?.pin_id !== null &&
            data?.line_id !== undefined && data?.line_id !== null
        ) {
            const detailPin = getConnectedPins(data.pin_id)
            setDataModalPinLinesName({ open: true, detailCurrentPin: detailPin.details, detailConnectedPins: detailPin.connected_pins, detailLines: getLinesName(data.line_id) })
        }

    }

    const onSVGConnect = (e, data) => {
        if (data?.from_pin_id === undefined || data?.from_pin_id === null || data?.to_pin_id === undefined || data?.to_pin_id === null)
            return
        const detail_from = getConnectedPins(data?.from_pin_id)
        const detail_to = getConnectedPins(data?.to_pin_id)
        setDataModalConnect(c => {
            if (
                (c?.from_pin_id !== undefined && c?.from_pin_id !== null && (c?.from_pin_id === data?.from_pin_id || c?.from_pin_id === data?.to_pin_id)) &&
                ((c?.to_1_pin_id !== undefined && c?.to_1_pin_id !== null && (c?.to_1_pin_id === data?.from_pin_id || c?.to_1_pin_id === data?.to_pin_id)) ||
                    (c?.to_2_pin_id !== undefined && c?.to_2_pin_id !== null && (c?.to_2_pin_id === data?.from_pin_id || c?.to_2_pin_id === data?.to_pin_id)))
            ) return { ...c, open: true }
            const tmp = {
                open: true,
                from_pin_id: data?.from_pin_id,
                from_pin_detail: `${detail_from?.details?.component_id ?? ""} ${detail_from?.details?.pin_name}`,
                to_1_pin_id: null,
                to_1_pin_detail: null,
                to_2_pin_id: data?.to_pin_id,
                to_2_pin_detail: `${detail_to?.details?.component_id ?? ""} ${detail_to?.details?.pin_name}`,
            }
            if (c?.from_pin_id === undefined || c?.from_pin_id === null ||
                (c?.to_1_pin_id !== undefined && c?.to_1_pin_id !== null) ||
                (c?.from_pin_id === data?.from_pin_id && c?.to_2_pin_id === data?.to_2_pin_id) ||
                (c?.from_pin_id === data?.to_2_pin_id && c?.to_2_pin_id === data?.from_pin_id)) { }
            else if (c?.from_pin_id === data?.from_pin_id || c?.to_2_pin_id === data?.from_pin_id) {
                tmp.from_pin_id = data?.from_pin_id
                tmp.from_pin_detail = `${detail_from?.details?.component_id ?? ""} ${detail_from?.details?.pin_name}`
                tmp.to_1_pin_id = data?.to_pin_id
                tmp.to_1_pin_detail = `${detail_to?.details?.component_id ?? ""} ${detail_to?.details?.pin_name}`
                if (c?.to_2_pin_id === data?.from_pin_id) {
                    tmp.to_2_pin_id = c?.from_pin_id
                    tmp.to_2_pin_detail = c?.from_pin_detail
                } else {
                    tmp.to_2_pin_id = c?.to_2_pin_id
                    tmp.to_2_pin_detail = c?.to_2_pin_detail
                }
            } else if (c?.from_pin_id === data?.to_pin_id || c?.to_2_pin_id === data?.to_pin_id) {
                tmp.from_pin_id = data?.to_pin_id
                tmp.from_pin_detail = `${detail_to?.details?.component_id ?? ""} ${detail_to?.details?.pin_name}`
                tmp.to_1_pin_id = data?.from_pin_id
                tmp.to_1_pin_detail = `${detail_from?.details?.component_id ?? ""} ${detail_from?.details?.pin_name}`
                if (c?.from_pin_id === data?.to_pin_id) {
                    tmp.to_2_pin_id = c?.from_pin_id
                    tmp.to_2_pin_detail = c?.from_pin_detail
                } else {
                    tmp.to_2_pin_id = c?.to_2_pin_id
                    tmp.to_2_pin_detail = c?.to_2_pin_detail
                }
            }
            return tmp
        })
    }

    const onModalConnectClose = () => setDataModalConnect(d => (dataModalConnect?.to_1_pin_id !== undefined && dataModalConnect?.to_1_pin_id !== null) ?
        { open: false, from_pin_id: null, from_pin_detail: null, to_1_pin_id: null, to_1_pin_detail: null, to_2_pin_id: null, to_2_pin_detail: null } :
        { ...d, open: false }
    )

    const onConnectClickModal = (data) => {
        if (data?.from_pin_id === undefined || data?.from_pin_id === null || isNaN(data?.from_pin_id) || parseInt(data?.from_pin_id) < 0) return
        sendJsonMessage({
            req: 'connect',
            username: sessionStorage.getItem('name'),
            io_from: parseInt(data.from_pin_id),
            io_press: data?.before_pin_id === undefined || data?.before_pin_id === null || isNaN(data?.before_pin_id) || parseInt(data?.before_pin_id) < 0 ? null : parseInt(data?.before_pin_id),
            io_release: data?.after_pin_id === undefined || data?.after_pin_id === null || isNaN(data?.after_pin_id) || parseInt(data?.after_pin_id) < 0 ? null : parseInt(data?.after_pin_id),
            press_us: data?.delay_us === undefined || data?.delay_us === null || isNaN(data?.delay_us) || parseInt(data?.delay_us) < 0 ? 0 : parseInt(data?.delay_us),
            propagation_us: data?.propagation_us === undefined || data?.propagation_us === null || isNaN(data?.propagation_us) || parseInt(data?.propagation_us) < 0 ? 0 : parseInt(data?.propagation_us),
        }, false)
        setDataModalConnect({ open: false, from_pin_id: null, from_pin_detail: null, to_1_pin_id: null, to_1_pin_detail: null, to_2_pin_id: null, to_2_pin_detail: null })
    }

    const onDisconnectClickModal = data => {
        if (data?.from_pin_id === undefined || data?.from_pin_id === null || isNaN(data?.from_pin_id) || parseInt(data?.from_pin_id) < 0) return
        sendJsonMessage({
            req: 'disconnect',
            username: sessionStorage.getItem('name'),
            io_disconnect: parseInt(data.from_pin_id),
            io_keep: data?.to_pin_id === undefined || data?.to_pin_id === null || isNaN(data?.to_pin_id) || parseInt(data?.to_pin_id) < 0 ? null : parseInt(data?.to_pin_id),
        }, false)
        onModalPinLinesNameClose()
        onModalPinClose()
    }
    return (<Fragment>
        <Box
            sx={{
                position: "fixed",
                left: "0px", top: "0px",
                height: "100vh", width: "100vw",
                display: "flex", flexDirection: "column"
            }}>
            <Toolbar />
            <DiagramSVG
                style={{ flexGrow: 1 }}
                components={[...(internalComponents?.data ?? [])]}
                lines={internalLines}
                onDoubleClick={onSVGDoubleClick}
                onConnect={onSVGConnect}
            />
            <Box sx={{ position: 'absolute', bottom: 10, left: 10 }} >
                {internalComponents?.new_data !== false && (<Box sx={{ marginY: 2 }}>
                    <Fab
                        color="primary"
                        onClick={() => setInternalComponents({ changed: false, new_data: false, data: [...currentComponents] })}
                    >
                        <SyncIcon />
                    </Fab>
                </Box>)}
                <Box sx={{ marginY: 2 }}>
                    <Fab
                        color="primary"
                        onClick={() => setDataModalComponent({ open: true, reserveIDs: (internalComponents?.data ?? []).map(c => c?.id ?? ""), component_id: null, component: { id: null, name: null, value: null, pins_rblt: [[], [], [], []] } })}
                    >
                        <AddIcon />
                    </Fab>
                </Box>
                <Box sx={{ marginY: 2 }}>
                    <Fab
                        color="primary"
                        disabled={readyState !== WebSocket.OPEN}
                        onClick={() => {
                            setInternalComponents(c => ({ ...c, changed: false, new_data: false }))
                            sendJsonMessage({ req: 'set_component', username: sessionStorage.getItem('name'), components: internalComponents?.data ?? [] })
                        }}
                    >
                        <SaveIcon />
                    </Fab>
                </Box>
            </Box>
        </Box>
        <ModalComponent
            open={dataModalComponent?.open ?? false}
            reserveIDs={dataModalComponent?.reserveIDs ?? []}
            componentId={dataModalComponent?.component_id}
            onClose={onModalComponentClose}
            onDeleteClick={(id) => {
                setInternalComponents(c => ({ ...c, changed: true, data: [...c.data.filter(ec => ec?.id !== id)] }))
                onModalComponentClose()
            }}
            onSaveClick={onModalComponentSave}
            component={dataModalComponent?.component ?? { open: false, component_id: null, component: { id: null, name: null, value: null, pins_rblt: [[], [], [], []] } }}
        />
        <ModalConnectedPins
            open={dataModalPin?.open ?? false}
            detailCurrentPin={dataModalPin?.detailCurrentPin ?? { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null }}
            detailConnectedPins={dataModalPin?.detailConnectedPins ?? []}
            onSaveLineName={onModalPinSave}
            onClose={onModalPinClose}
            onDisconnectPin={onDisconnectClickModal}
        />
        <ModalNameLines
            open={dataModalLinesName?.open ?? false}
            detailLines={dataModalLinesName?.detailLines ?? []}
            onClose={onModalLinesNameClose}
            onSaveLinesName={onModalLinesNameSave}
        />
        <ModalConnectedPinsWithLinesName
            open={dataModalPinLinesName?.open ?? false}
            detailCurrentPin={dataModalPinLinesName?.detailCurrentPin ?? { i_component: null, component_id: null, i_rblt: null, i_pin: null, pin_id: null, pin_name: null, pin_line_name: null }}
            detailConnectedPins={dataModalPinLinesName?.detailConnectedPins ?? []}
            detailLines={dataModalPinLinesName?.detailLines ?? []}
            onSaveLinesName={onModalPinLinesNameSave}
            onClose={onModalPinLinesNameClose}
            onDisconnectPin={onDisconnectClickModal}
        />
        <ModalConnect
            open={dataModalConnect?.open === true}
            fromPinID={dataModalConnect?.from_pin_id ?? null}
            fromPinDetail={dataModalConnect?.from_pin_detail ?? ""}
            to1PinID={dataModalConnect?.to_1_pin_id ?? null}
            to1PinDetail={dataModalConnect?.to_1_pin_detail ?? ""}
            to2PinID={dataModalConnect?.to_2_pin_id ?? null}
            to2PinDetail={dataModalConnect?.to_2_pin_detail ?? ""}
            onClose={onModalConnectClose}
            onConnect={onConnectClickModal}
        />
    </Fragment >)
}

export default ProjectComponent