import { Box, Button, ButtonGroup, Card, CardActions, CardContent, CardHeader, Checkbox, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Switch, Typography, Slider, Snackbar, CircularProgress } from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { Add as AddIcon, Delete as DeleteIcon, Settings as SettingsIcon, Check as YesIcon, Close as NoIcon, SignalWifiBad as NoSignalIcon, Send as SendIcon } from "@mui/icons-material"
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket"
import WSBaseURL from "./WSBaseURL"
const WS_URL = WSBaseURL + 'block/'
const SNACKBAR_AUTOHIDE_MS = 200
const SNACKBAR_DLYHIDE_MS = 500
const DialogAddInternalBlock = ({ open = false, errorIDs = [], onClose = () => { }, onSaveClick = (id) => { } }) => {
    const [IDBlock, setIDBlock] = useState("")
    useEffect(() => setIDBlock(''), [open])
    const onOKClick = () => {
        if (typeof onSaveClick != 'function' || IDBlock === undefined || IDBlock === null || IDBlock === '')
            return
        let sendID = isNaN(IDBlock) ? IDBlock : parseFloat(IDBlock)
        if (errorIDs.includes(sendID))
            return
        onSaveClick(sendID)
    }

    return (<Dialog
        open={open === true}
        onClose={onClose}
    >
        <DialogTitle>Tambah Internal Block</DialogTitle>
        <DialogContent>
            <TextField label="ID Internal Block" variant="outlined" autoComplete="off" margin="normal" fullWidth
                error={IDBlock.length == 0 || (Array.isArray(errorIDs) && errorIDs.includes(isNaN(IDBlock) ? IDBlock : parseFloat(IDBlock)))}
                value={IDBlock}
                onChange={e => setIDBlock(e.target.value)}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onOKClick}>Tambah</Button>
        </DialogActions>
    </Dialog>)
}

const DialogChangeADC = ({ open = true, io = null, canRead = false, marginADC = 0, marginTms = 0, value = 0,
    onClose = () => { },
    onSaveClick = (data = { io: null, e: false, m_adc: 0, m_t_ms: 0, val: 0 }) => { }
}) => {
    const [internalADCSetup, setInternalADCSetup] = useState({ io: null, can_read: false, margin_adc: 0, margin_t_ms: 0, value: 0 })
    useEffect(() => setInternalADCSetup({ io: io ?? null, can_read: canRead === true, margin_adc: marginADC ?? 0, margin_t_ms: marginTms ?? 0, value: value ?? 0 }), [io, canRead, marginADC, marginTms, value])
    const onOKClick = () => {
        if (
            typeof onSaveClick != 'function' ||
            internalADCSetup?.io === undefined || internalADCSetup?.io === null || isNaN(internalADCSetup?.io) || internalADCSetup?.io < 0 ||
            internalADCSetup?.margin_adc === undefined || internalADCSetup?.margin_adc === null || isNaN(internalADCSetup?.margin_adc) || internalADCSetup?.margin_adc < 0 || internalADCSetup?.margin_adc >= 4096 ||
            internalADCSetup?.value === undefined || internalADCSetup?.value === null || isNaN(internalADCSetup?.value) || internalADCSetup?.value < 0 || internalADCSetup?.value >= 4096 ||
            internalADCSetup?.margin_t_ms === undefined || internalADCSetup?.margin_t_ms === null || isNaN(internalADCSetup?.margin_t_ms) || internalADCSetup?.margin_t_ms < 0 ||
            internalADCSetup?.can_read === undefined || internalADCSetup?.can_read === null || typeof internalADCSetup?.can_read != 'boolean'
        ) return

        onSaveClick({
            io: parseInt(internalADCSetup.io),
            m_adc: parseInt(internalADCSetup.margin_adc),
            m_t_ms: parseInt(internalADCSetup.margin_t_ms),
            e: internalADCSetup.can_read === true,
            val: parseInt(internalADCSetup.value)
        })
    }
    return (<Dialog
        open={open === true}
        onClose={onClose}
    >
        <DialogTitle>Pengaturan ADC IO {internalADCSetup?.io}</DialogTitle>
        <DialogContent dividers>
            <div>
                <span>
                    <Switch
                        checked={internalADCSetup?.can_read === true}
                        onChange={e => setInternalADCSetup(d => e.target.checked === true ? { ...d, can_read: e.target.checked } : { ...d, can_read: false, margin_adc: 0, margin_t_ms: 0 })}
                    />
                    <Typography display="inline">Aktifkan Pembacaan ADC</Typography>
                </span>
            </div>
            <Box sx={{ paddingX: 2 }}>
                <Typography>Margin ADC (4095 12-bit ADC ESP32)</Typography>
                <Slider
                    value={internalADCSetup?.margin_adc ?? 0}
                    min={0} max={4095}
                    valueLabelDisplay="auto"
                    onChange={(e, val) => setInternalADCSetup(d => ({ ...d, margin_adc: val }))}
                    disabled={internalADCSetup?.can_read !== true}
                />
            </Box>
            <TextField label="Margin Waktu (ms)" margin="normal" autoComplete="off" variant="outlined" fullWidth
                value={(internalADCSetup?.margin_t_ms ?? 0) == 0 ? '' : internalADCSetup?.margin_t_ms}
                onChange={e => setInternalADCSetup(d => ({
                    ...d,
                    margin_t_ms: e.target.value === '' || isNaN(e.target.value) || e.target.value < 0 ? 0 : parseInt(e.target.value)
                }))}
                disabled={internalADCSetup?.can_read !== true}
            />
            <Box sx={{ paddingX: 2 }}>
                <Typography>Nilai ADC (4095 12-bit ADC ESP32)</Typography>
                <Slider
                    value={internalADCSetup?.value ?? 0}
                    min={0} max={4095}
                    valueLabelDisplay="auto"
                    onChange={(e, val) => setInternalADCSetup(d => ({ ...d, value: val }))}
                />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onOKClick}>Simpan</Button>
        </DialogActions>
    </Dialog>)
}

const CardIOLine = ({ IOLineState = [], IOadc = [], disabledSend = false,
    onClickSendState = () => { },
    onClickSendADC = () => { },
    onStateChange = ({ io = 0, l = 0, state = false }) => { },
    onADCChange = (data = { io: 0, can_read: false, margin_adc: 0, margin_t_ms: 0, value: 0, }) => { }
}) => {
    const count = {
        io: (IOLineState ?? []).length,
        line: ((IOLineState ?? [])?.[0] ?? []).length
    }
    const i_count = { io: [...Array(count.io).keys()], line: [...Array(count.line).keys()] }
    return (<Card elevation={3}>
        <CardHeader title="Data State IO dan Jalur" />
        <Divider />
        <CardContent>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Line \ IO</TableCell>
                            {i_count.io.map(io => (<TableCell key={`header_io_${io}`}>{io}</TableCell>))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>ADC</TableCell>
                            {i_count.io.map(io => (<TableCell key={`adc_io_${io}`}>
                                {IOadc?.[io]?.e === true ? (<YesIcon />) : (<NoIcon />)}
                                <div>
                                    <Typography variant="subtitle2" display="inline">Nilai ADC </Typography>
                                    <Typography variant="body2" display="inline">{IOadc?.[io]?.val ?? 0}</Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" display="inline">Margin ADC </Typography>
                                    <Typography variant="body2" display="inline">{IOadc?.[io]?.m_adc ?? 0}</Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" display="inline">Margin t (ms) </Typography>
                                    <Typography variant="body2" display="inline">{IOadc?.[io]?.m_t_ms ?? 0}</Typography>
                                </div>
                                <IconButton
                                    onClick={() => {
                                        if (typeof onADCChange == 'function')
                                            onADCChange({
                                                io: io,
                                                can_read: IOadc?.[io]?.e === true,
                                                margin_adc: IOadc?.[io]?.m_adc ?? 0,
                                                margin_t_ms: IOadc?.[io]?.m_t_ms ?? 0,
                                                value: IOadc?.[io]?.val ?? 0,
                                            })
                                    }}
                                ><SettingsIcon /></IconButton>
                            </TableCell>))}
                        </TableRow>
                        {i_count.line.map(l => (<TableRow key={`row_line_${l}`}>
                            <TableCell>{l}</TableCell>
                            {i_count.io.map(io => (<TableCell
                                key={`state_io_${io}_l_${l}`}
                            >
                                <Checkbox
                                    checked={IOLineState?.[io]?.[l] === true}
                                    onChange={e => {
                                        if (typeof onStateChange == 'function')
                                            onStateChange({ io, l, state: e.target.checked })
                                    }}
                                />
                            </TableCell>))}
                        </TableRow>))}
                    </TableBody>
                </Table>
            </TableContainer>
        </CardContent>
        <CardActions sx={{ justifyContent: 'end' }}>
            <Button onClick={onClickSendADC} disabled={disabledSend === true}>Kirim Server ADC</Button>
            <Button onClick={onClickSendState} disabled={disabledSend === true}>Kirim Server State</Button>
        </CardActions>
    </Card>)
}

const GridItemSteps = ({ steps = [], onNextClick = () => { } }) => {
    return (<Fragment>
        {Array.isArray(steps) && steps.map((st, i_st) => (<Grid
            key={`step_${i_st}`}
            item
            xs={12} sm={4} md={6}>
            <Card>
                {
                    i_st === 0 && (<CardHeader action={
                        st?.expect_timeout === undefined ?
                            (<IconButton onClick={onNextClick}><SendIcon /></IconButton>) : (<CircularProgress />)
                    } />)
                }
                <CardContent>
                    <div><span>
                        <Typography display="inline" variant="subtitle2">Tunggu Sebelum </Typography>
                        <Typography display="inline" variant="body2">{st?.b_us ?? 0}</Typography>
                        <Typography display="inline" variant="subtitle2"> us</Typography>
                    </span></div>
                    <div><span>
                        <Checkbox disabled checked={st?.st === true} />
                        <Typography display="inline" variant="subtitle2">ID </Typography>
                        <Typography display="inline" variant="body2">{st?.i_id} </Typography>
                        <Typography display="inline" variant="subtitle2">IO </Typography>
                        <Typography display="inline" variant="body2">{st?.io} </Typography>
                        <Typography display="inline" variant="subtitle2">L </Typography>
                        <Typography display="inline" variant="body2">{st?.l} </Typography>
                    </span></div>
                    <div><span>
                        <Typography display="inline" variant="subtitle2">Tunggu Setelah </Typography>
                        <Typography display="inline" variant="body2">{st?.a_us ?? 0}</Typography>
                        <Typography display="inline" variant="subtitle2"> us</Typography>
                    </span></div>
                </CardContent>
            </Card>
        </Grid>))
        }
    </Fragment>)
}

const GridItemSyncIDs = ({ syncIDs = [], onClickSendSyncID = (id) => { } }) => {
    return (<Fragment>
        {
            (syncIDs ?? []).map(id => (<Grid
                item
                key={`card_sync_${id}`}
                xs={12} sm={4} md={6}>
                <Card>
                    <CardHeader
                        action={(<IconButton
                            onClick={() => {
                                if (typeof onClickSendSyncID == 'function')
                                    onClickSendSyncID(id)
                            }}
                        // onClick={() => setInternalSyncIDs(ids => {
                        //     sendJsonMessage({ reply_sync_id: id })
                        //     return Array.isArray(ids) ? ids.filter(i => i !== id) : []
                        // })}
                        ><SendIcon /></IconButton>)}
                    />
                    <CardContent>
                        <div><span>
                            <Typography display="inline" variant="subtitle2">Sync ID </Typography>
                            <Typography display="inline" variant="body2">{id}</Typography>
                        </span></div>
                    </CardContent>
                </Card>
            </Grid>))
        }
    </Fragment>)
}

const BlockSimulator = () => {
    const [internalDataBlock, setInternalDataBlock] = useState([])
    const [internalBlockSettings, setInternalBlockSettings] = useState({ id: '', io: 0, line: 0, can_connect: false })
    const [modalAddInternalBlockOpen, setModalAddInternalBlockOpen] = useState(false)
    const [modalChangeADC, setModalChangeADC] = useState({ open: false, io: null, can_read: false, margin_adc: 0, margin_t_ms: 0, value: 0 })
    const [internalPickID, setInternalPickID] = useState(null)
    const [snackbarData, setSnackbarData] = useState({ open: false, data: [] })
    const [internalSteps, setInternalSteps] = useState([])
    const [internalSyncIDs, setInternalSyncIDs] = useState([])
    const [scaleUsToMs, setScaleUsToMs] = useState(100)
    const [runStepsDirectly, setRunStepsDirectly] = useState(true)
    const [targetLoadingMS, setTargetLoading] = useState(0)

    const nextStep = () => setInternalSteps(steps => {
        if (!Array.isArray(internalSteps) || steps.length === 0) {
            if (runStepsDirectly)
                setInternalSyncIDs(ids => {
                    for (const id of Array.isArray(ids) ? ids : [])
                        sendJsonMessage({ reply_sync_id: id })
                    return []
                })
            return []
        }
        if (
            steps[0]?.i_id === undefined || steps[0]?.i_id === null ||
            steps[0]?.io === undefined || steps[0]?.io === null || isNaN(steps[0]?.io) || parseInt(steps[0]?.io) < 0 ||
            steps[0]?.l === undefined || steps[0]?.l === null || isNaN(steps[0]?.l) || parseInt(steps[0]?.l) < 0 ||
            (internalDataBlock ?? []).findIndex(b => b?.id === steps[0]?.i_id) < 0
        ) {
            steps.shift()
            setTimeout(() => nextStep(), 1)
            return [...steps]
        }
        const fixScaleTime = scaleUsToMs === undefined || scaleUsToMs === null || isNaN(scaleUsToMs) || parseInt(scaleUsToMs) < 0 ? 1 : parseInt(scaleUsToMs)
        const before_ms = fixScaleTime * (steps[0]?.a_us === undefined || steps[0]?.a_us === null || isNaN(steps[0]?.a_us) || parseInt(steps[0]?.a_us) < 0 ? 1 : parseInt(steps[0]?.a_us))
        const after_ms = fixScaleTime * (steps[0]?.b_us === undefined || steps[0]?.b_us === null || isNaN(steps[0]?.b_us) || parseInt(steps[0]?.b_us) < 0 ? 1 : parseInt(steps[0]?.b_us))
        if (new Date().getTime() < steps[0]?.expect_timeout ?? 0) {
            setTimeout(() => nextStep(), steps[0].expect_timeout - new Date().getTime())
            return [...steps]
        }
        setInternalPickID(steps[0].i_id)
        steps[0].expect_timeout = new Date().getTime() + before_ms + after_ms + 2
        steps[0].before_timeout = setTimeout(() => {
            onStateChangeIOLineState({
                io: parseInt(steps[0].io),
                l: parseInt(steps[0].l),
                state: steps[0]?.st === true,
                internal_id: steps[0].i_id
            })
            setTimeout(() => {
                setInternalSteps(new_steps => {
                    if (new_steps?.[0]?.expect_timeout === steps[0].expect_timeout)
                        new_steps.shift()
                    if (runStepsDirectly === true)
                        setTimeout(() => nextStep(), 1)
                    return [...new_steps]
                })
            }, after_ms);
        }, before_ms)
        return [...steps]
    })

    const addSnackbarData = ({ message, childrens, props }) => setSnackbarData(d => {
        if (!Array.isArray(d?.data) || (d?.data ?? []).length === 0)
            return { open: true, data: [{ message, childrens, props }] }
        d.data.push({ message, childrens, props })
        return { ...d }
    })

    const { readyState, lastJsonMessage, sendJsonMessage } = useWebSocket(
        WS_URL + encodeURIComponent(internalBlockSettings?.id ?? ''),
        { share: false, shouldReconnect: () => true, onReconnectStop: () => setInternalBlockSettings(d => ({ ...d, can_connect: false })) },
        internalBlockSettings?.can_connect === true
    )

    useEffect(() => {
        if (lastJsonMessage?.req === 'duplicate_block') {
            setInternalBlockSettings(d => ({ ...d, can_connect: false }))
            addSnackbarData({ message: 'ID Block sudah digunakan' })
        } else if (lastJsonMessage?.req === 'get_adc') {
            if (lastJsonMessage?.internal_id === undefined)
                return
            sendADC(lastJsonMessage?.internal_id)
        } else if (lastJsonMessage?.req === 'get_state') {
            if (lastJsonMessage?.internal_id === undefined)
                return
            const tmpData = internalDataBlock.find(d => d?.id === lastJsonMessage?.internal_id)
            if (tmpData === undefined)
                return
            sendJsonMessage({
                req: 'set_state',
                internal_id: lastJsonMessage?.internal_id,
                io_l_state: tmpData?.io_l_state
            }, false);
        } else if (lastJsonMessage?.req === 'set_adc')
            setInternalDataBlock(d => {
                if (!Array.isArray(d))
                    return []
                if (lastJsonMessage?.internal_id === undefined || lastJsonMessage?.internal_id === null || !Array.isArray(lastJsonMessage?.io_adc))
                    return [...d]
                const internalID = isNaN(lastJsonMessage?.internal_id) ? lastJsonMessage?.internal_id : parseFloat(lastJsonMessage?.internal_id)
                const tmpIndex = d.findIndex(p => p?.id === internalID)
                if (tmpIndex < 0)
                    return [...d]
                const tmpADCs = []
                for (let io = 0; io < (d[tmpIndex]?.io_adc ?? []).length; io++) {
                    if (d[tmpIndex]?.io_adc?.[io]?.sent_timeout !== undefined && d[tmpIndex]?.io_adc?.[io]?.sent_timeout !== null)
                        clearTimeout(d[tmpIndex]?.io_adc?.[io]?.sent_timeout)
                    const tmpADC = {
                        e: lastJsonMessage?.io_adc?.[io]?.e === true,
                        m_adc: lastJsonMessage?.io_adc?.[io]?.m_adc === undefined || lastJsonMessage?.io_adc?.[io]?.m_adc === null || isNaN(lastJsonMessage?.io_adc?.[io]?.m_adc) || lastJsonMessage?.io_adc?.[io]?.m_adc < 0 ? 0 : lastJsonMessage?.io_adc?.[io]?.m_adc,
                        m_t_ms: lastJsonMessage?.io_adc?.[io]?.m_t_ms === undefined || lastJsonMessage?.io_adc?.[io]?.m_t_ms === null || isNaN(lastJsonMessage?.io_adc?.[io]?.m_t_ms) || lastJsonMessage?.io_adc?.[io]?.m_t_ms < 0 ? 0 : lastJsonMessage?.io_adc?.[io]?.m_t_ms,
                        val: lastJsonMessage?.io_adc?.[io]?.e !== true ? 0 :
                            (d[tmpIndex]?.io_adc?.[io]?.val === undefined || d[tmpIndex]?.io_adc?.[io]?.val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.val) || d[tmpIndex]?.io_adc?.[io]?.val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.val)
                    }
                    d[tmpIndex].io_adc[io] = {
                        ...tmpADC,
                        sent_timeout: null,
                        last_sent: (new Date()).getTime(),
                        last_val: tmpADC.val,
                        val: (d[tmpIndex]?.io_adc?.[io]?.val === undefined || d[tmpIndex]?.io_adc?.[io]?.val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.val) || d[tmpIndex]?.io_adc?.[io]?.val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.val)
                    }
                    tmpADCs.push(tmpADC)
                }
                const send = {
                    req: 'set_adc',
                    internal_id: internalID,
                    io_adc: tmpADCs
                }
                sendJsonMessage(send, false);
                return [...d]
            })
        else if (lastJsonMessage?.req == 'set_states') {
            setInternalSteps(st => {
                const steps = Array.isArray(lastJsonMessage?.steps) ? lastJsonMessage.steps : []
                if (runStepsDirectly === true)
                    setTimeout(
                        () => nextStep(),
                        (new Date().getTime() < st?.[0]?.expect_timeout ?? 0) ? st[0].expect_timeout - new Date().getTime() : 1
                    )
                return (!Array.isArray(st)) ? [...steps] : [...st, ...steps]
            })
            if (lastJsonMessage?.sync_id !== undefined)
                setInternalSyncIDs(ids => !Array.isArray(ids) ? [lastJsonMessage?.sync_id] :
                    (ids.includes(lastJsonMessage?.sync_id) ? [...ids] : [...ids, lastJsonMessage.sync_id])
                )
        } else if (lastJsonMessage?.req === 'read_adc')
            setInternalDataBlock(d => {
                if (!Array.isArray(d))
                    return []
                if (lastJsonMessage?.internal_id === undefined || lastJsonMessage?.internal_id === null ||
                    lastJsonMessage?.io === undefined || lastJsonMessage?.io === null || isNaN(lastJsonMessage?.io) || parseInt(lastJsonMessage?.io) < 0)
                    return [...d]
                const internalID = isNaN(lastJsonMessage?.internal_id) ? lastJsonMessage?.internal_id : parseFloat(lastJsonMessage?.internal_id)
                const tmpIndex = d.findIndex(p => p?.id === internalID)
                if (tmpIndex < 0)
                    return [...d]
                const tmpADCs = []
                for (let io = 0; io < (d[tmpIndex]?.io_adc ?? []).length; io++) {
                    if (d[tmpIndex]?.io_adc?.[io]?.sent_timeout !== undefined && d[tmpIndex]?.io_adc?.[io]?.sent_timeout !== null)
                        clearTimeout(d[tmpIndex]?.io_adc?.[io]?.sent_timeout)
                    const tmpADC = {
                        e: d[tmpIndex]?.io_adc?.[io]?.e === true,
                        m_adc: d[tmpIndex]?.io_adc?.[io]?.m_adc === undefined || d[tmpIndex]?.io_adc?.[io]?.m_adc === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.m_adc) || d[tmpIndex]?.io_adc?.[io]?.m_adc < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.m_adc,
                        m_t_ms: d[tmpIndex]?.io_adc?.[io]?.m_t_ms === undefined || d[tmpIndex]?.io_adc?.[io]?.m_t_ms === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.m_t_ms) || d[tmpIndex]?.io_adc?.[io]?.m_t_ms < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.m_t_ms,
                        val: io === lastJsonMessage.io || d[tmpIndex]?.io_adc?.[io]?.e === true ?
                            (d[tmpIndex]?.io_adc?.[io]?.val === undefined || d[tmpIndex]?.io_adc?.[io]?.val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.val) || d[tmpIndex]?.io_adc?.[io]?.val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.val) :
                            (d[tmpIndex]?.io_adc?.[io]?.last_val === undefined || d[tmpIndex]?.io_adc?.[io]?.last_val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.last_val) || d[tmpIndex]?.io_adc?.[io]?.last_val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.last_val),
                    }
                    d[tmpIndex].io_adc[io] = {
                        ...tmpADC,
                        sent_timeout: null,
                        last_sent: (new Date()).getTime(),
                        last_val: tmpADC.val,
                        val: d[tmpIndex]?.io_adc?.[io]?.val === undefined || d[tmpIndex]?.io_adc?.[io]?.val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.val) || d[tmpIndex]?.io_adc?.[io]?.val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.val
                    }
                    tmpADCs.push(tmpADC)
                }
                const send = {
                    req: 'set_adc',
                    internal_id: internalID,
                    io_adc: tmpADCs
                }
                sendJsonMessage(send, false);
                return [...d]
            })
    }, [lastJsonMessage])

    if ((internalPickID === undefined || internalPickID === null) &&
        Array.isArray(internalDataBlock) && internalDataBlock.length > 0 &&
        internalDataBlock[0].id !== undefined && internalDataBlock[0].id !== null)
        setInternalPickID(internalDataBlock[0].id)
    const internalIDs = (internalDataBlock ?? []).map(d => d?.id)
    const internalPickIndex = internalPickID === undefined || internalPickID === null ? -1 : (internalDataBlock ?? []).findIndex(v => v?.id === internalPickID)
    if (internalPickID !== undefined && internalPickID !== null && internalPickIndex < 0)
        setInternalPickID(null)
    const internalPickData = internalPickIndex < 0 ? { id: null, io_adc: [], io_l_state: [] } : internalDataBlock[internalPickIndex]
    useEffect(() => {
        let maxIO = (internalDataBlock?.[0]?.io_adc ?? []).length
        let maxLine = (internalDataBlock?.[0]?.io_l_state?.[0] ?? []).length
        let change = false
        for (const data of (internalDataBlock ?? [])) {
            if (data?.id === undefined || data?.id === null) {
                change = true
                continue
            }
            if (!Array.isArray(data?.io_l_state))
                change = true
            else if ((data?.io_l_state ?? []).length !== maxIO) {
                change = true
                if ((data?.io_l_state ?? []).length > maxIO)
                    maxIO = (data?.io_l_state ?? []).length
            } else {
                for (const io of (data?.io_l_state ?? [])) {
                    if (!Array.isArray(io))
                        change = true
                    else if ((io ?? []).length !== maxLine) {
                        change = true
                        if ((io ?? []).length > maxIO)
                            maxLine = (io ?? []).length
                    } else {
                        for (const line of (io ?? [])) {
                            if (typeof line != 'boolean') {
                                change = true
                                break;
                            }
                        }
                    }
                }
            }
            if (!Array.isArray(data?.io_adc))
                change = true
            else if ((data?.io_adc ?? []).length !== maxIO) {
                change = true
                if ((data?.io_adc ?? []).length > maxIO)
                    maxIO = (data?.io_adc ?? []).length
            } else {
                for (const io of (data?.io_adc ?? [])) {
                    if (
                        typeof io?.e !== 'boolean' ||
                        io?.m_adc === undefined || io?.m_adc === null || isNaN(io?.m_adc) || io?.m_adc < 0 ||
                        io?.m_t_ms === undefined || io?.m_t_ms === null || isNaN(io?.m_t_ms) || io?.m_t_ms < 0 ||
                        io?.val === undefined || io?.val === null || isNaN(io?.val) || io?.val < 0 ||
                        io?.last_sent === undefined || io?.last_sent === null || isNaN(io?.last_sent) || io?.last_sent < 0
                    ) {
                        change = true
                        break
                    }
                }
            }
        }
        if (change === true)
            setIOLine({ IOLength: maxIO, LineLength: maxLine })
    }, [internalDataBlock])

    const setIOLine = ({ IOLength = 0, LineLength = 0 }) => {
        const tempDataS = []
        const IDs = []
        if (IOLength === undefined || IOLength === null || isNaN(IOLength) || IOLength < 0 ||
            LineLength === undefined || LineLength === null || isNaN(LineLength) || LineLength < 0) {
            IOLength = 0
            LineLength = 0
        }
        for (const data of internalDataBlock) {
            if (data?.id === undefined || data?.id === null) {
                for (const adc of (data?.io_adc ?? [])) {
                    if (adc?.sent_timeout !== undefined && adc?.sent_timeout !== null)
                        clearTimeout(adc?.sent_timeout)
                }
                continue
            }
            const tempData = {
                id: isNaN(data.id) ? data.id : parseFloat(data.id),
                io_adc: [],
                io_l_state: []
            }
            if (IDs.includes(tempData.id)) continue
            else IDs.push(tempData.id)
            for (let io = 0; io < Math.max(IOLength, (data?.io_adc ?? []).length); io++) {
                if (io < IOLength) {
                    tempData.io_adc.push({
                        e: data?.io_adc?.[io]?.e === true,
                        m_adc: (data?.io_adc?.[io]?.m_adc === undefined || data?.io_adc?.[io]?.m_adc === null || isNaN(data?.io_adc?.[io]?.m_adc) || data?.io_adc?.[io]?.m_adc < 0) ? 0 : parseInt(data?.io_adc?.[io]?.m_adc),
                        m_t_ms: (data?.io_adc?.[io]?.m_t_ms === undefined || data?.io_adc?.[io]?.m_t_ms === null || isNaN(data?.io_adc?.[io]?.m_t_ms) || data?.io_adc?.[io]?.m_t_ms < 0) ? 0 : parseInt(data?.io_adc?.[io]?.m_t_ms),
                        val: (data?.io_adc?.[io]?.val === undefined || data?.io_adc?.[io]?.val === null || isNaN(data?.io_adc?.[io]?.val) || data?.io_adc?.[io]?.val < 0) ? 0 : parseInt(data?.io_adc?.[io]?.val),
                        last_val: data?.io_adc?.[io]?.e !== true ? 0 : (data?.io_adc?.[io]?.last_val === undefined || data?.io_adc?.[io]?.last_val === null || isNaN(data?.io_adc?.[io]?.last_val) || data?.io_adc?.[io]?.last_val < 0) ? 0 : parseInt(data?.io_adc?.[io]?.last_val),
                        last_sent: (data?.io_adc?.[io]?.last_sent === undefined || data?.io_adc?.[io]?.last_sent === null || isNaN(data?.io_adc?.[io]?.last_sent) || data?.io_adc?.[io]?.last_sent < 0) ? 0 : parseInt(data?.io_adc?.[io]?.last_sent),
                        sent_timeout: data?.io_adc?.[io]?.sent_timeout
                    })
                    const tempLine = []
                    for (let line = 0; line < LineLength; line++)
                        tempLine.push(data?.io_l_state?.[io]?.[line] === true)
                    tempData.io_l_state.push(tempLine)
                } else if (data?.io_adc?.[io]?.sent_timeout !== undefined && data?.io_adc?.[io]?.sent_timeout !== null)
                    clearTimeout(data?.io_adc?.[io]?.sent_timeout)
            }
            tempDataS.push(tempData)
        }
        setInternalDataBlock(tempDataS)
    }

    const onClickAddInternalBlock = (id) => setInternalDataBlock(d => {
        if (!Array.isArray(d))
            return []
        id = isNaN(id) ? id : parseFloat(id)
        if (id === undefined || id === null || id === '' || internalIDs.includes(id))
            return [...d]
        const tmp = { id, io_adc: [], io_l_state: [] }
        const maxIO = d.length === 0 ? internalBlockSettings?.io ?? 0 : (d?.[d.length - 1]?.io_adc ?? Array(internalBlockSettings?.io ?? 0)).length
        const maxLine = d.length === 0 ? internalBlockSettings?.line ?? 0 : (d?.[d.length - 1]?.io_l_state?.[0] ?? Array(internalBlockSettings?.line ?? 0)).length
        for (let io = 0; io < maxIO; io++) {
            tmp.io_adc.push({ e: false, m_adc: 0, m_t_ms: 0, val: 0, last_sent: 0 })
            const tmpL = []
            for (let line = 0; line < maxLine; line++)
                tmpL.push(false)
            tmp.io_l_state.push(tmpL)
        }
        d.push(tmp)
        setModalAddInternalBlockOpen(false)
        return [...d]
    })

    const onStateChangeIOLineState = ({ io = 0, l = 0, state = false, internal_id = internalPickID }) => setInternalDataBlock(d => {
        if (!Array.isArray(d))
            return d
        if (internal_id === undefined || internal_id === null ||
            io === undefined || io === null || isNaN(io) || io < 0 ||
            l === undefined || l === null || isNaN(l) || l < 0)
            return [...d]
        const dataIndex = d.findIndex(p => p?.id === internal_id)
        if (dataIndex < 0)
            return [...d]
        d[dataIndex].io_l_state[io][l] = state === true
        return [...d]
    })

    const onClickSendState = () => {
        const send = {
            req: 'set_state',
            internal_id: internalPickID,
            io_l_state: internalPickData?.io_l_state
        }
        sendJsonMessage(send, false);
    }

    const sendADC = (internalID) => setInternalDataBlock(d => {
        if (!Array.isArray(d))
            return []
        if (internalID === undefined || internalID === null)
            return [...d]
        const tmpIndex = d.findIndex(p => p?.id === internalID)
        if (tmpIndex < 0)
            return [...d]
        const tmpADCs = []
        for (let io = 0; io < (d[tmpIndex]?.io_adc ?? []).length; io++) {
            if (d[tmpIndex]?.io_adc?.[io]?.sent_timeout !== undefined && d[tmpIndex]?.io_adc?.[io]?.sent_timeout !== null)
                clearTimeout(d[tmpIndex]?.io_adc?.[io]?.sent_timeout)
            const tmpADC = {
                e: d[tmpIndex]?.io_adc?.[io]?.e === true,
                m_adc: d[tmpIndex]?.io_adc?.[io]?.m_adc === undefined || d[tmpIndex]?.io_adc?.[io]?.m_adc === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.m_adc) || d[tmpIndex]?.io_adc?.[io]?.m_adc < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.m_adc,
                m_t_ms: d[tmpIndex]?.io_adc?.[io]?.m_t_ms === undefined || d[tmpIndex]?.io_adc?.[io]?.m_t_ms === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.m_t_ms) || d[tmpIndex]?.io_adc?.[io]?.m_t_ms < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.m_t_ms,
                val: d[tmpIndex]?.io_adc?.[io]?.e === true ?
                    (d[tmpIndex]?.io_adc?.[io]?.val === undefined || d[tmpIndex]?.io_adc?.[io]?.val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.val) || d[tmpIndex]?.io_adc?.[io]?.val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.val) :
                    (d[tmpIndex]?.io_adc?.[io]?.last_val === undefined || d[tmpIndex]?.io_adc?.[io]?.last_val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.last_val) || d[tmpIndex]?.io_adc?.[io]?.last_val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.last_val),
            }
            d[tmpIndex].io_adc[io] = {
                ...tmpADC,
                sent_timeout: null,
                last_sent: (new Date()).getTime(),
                last_val: tmpADC.val,
                val: d[tmpIndex]?.io_adc?.[io]?.val === undefined || d[tmpIndex]?.io_adc?.[io]?.val === null || isNaN(d[tmpIndex]?.io_adc?.[io]?.val) || d[tmpIndex]?.io_adc?.[io]?.val < 0 ? 0 : d[tmpIndex]?.io_adc?.[io]?.val
            }
            tmpADCs.push(tmpADC)
        }
        const send = {
            req: 'set_adc',
            internal_id: internalID,
            io_adc: tmpADCs
        }
        sendJsonMessage(send, false);
        return [...d]
    })

    const onClickSendADC = () => sendADC(internalPickID)

    const onCloseChangeADC = () => setModalChangeADC({ open: false, io: null, can_read: false, margin_adc: 0, margin_t_ms: 0, value: 0 })
    const onClickChangeADC = (data) => setInternalDataBlock(d => {
        if (internalPickID === undefined || internalPickID === null || internalPickIndex < 0 || d?.[internalPickIndex]?.id !== internalPickID)
            return [...d]
        const tmp = {
            e: data?.e === true,
            m_adc: parseInt(data?.m_adc ?? 0),
            m_t_ms: parseInt(data?.m_t_ms ?? 0),
            val: parseInt(data?.val ?? 0),
        }
        if (d[internalPickIndex]?.io_adc?.[data.io]?.sent_timeout !== undefined && d[internalPickIndex]?.io_adc?.[data.io]?.sent_timeout !== null)
            clearTimeout(d[internalPickIndex].io_adc[data.io].sent_timeout)
        if (
            (tmp.e === true &&
                (Math.abs((d?.[internalPickIndex]?.io_adc?.[data?.io]?.last_val ?? 0) - tmp.val) >= tmp.m_adc ||
                    ((new Date()).getTime() - (d?.[internalPickIndex]?.io_adc?.[data?.io]?.last_sent ?? 0)) >= tmp.m_t_ms)
            ) ||
            (tmp.e !== true && d?.[internalPickIndex]?.io_adc?.[data?.io]?.e === true)
        ) {
            d[internalPickIndex].io_adc[data.io] = { ...tmp, last_val: tmp.e === true ? tmp.val : 0, last_sent: (new Date()).getTime(), sent_timeout: null }
            sendADC(internalPickID)
        } else if (tmp.e === true &&
            Math.abs((d?.[internalPickIndex]?.io_adc?.[data?.io]?.last_val ?? 0) - tmp.val) > 0 &&
            ((new Date()).getTime() - (d?.[internalPickIndex]?.io_adc?.[data?.io]?.last_sent ?? 0)) < tmp.m_t_ms
        ) d[internalPickIndex].io_adc[data.io] = {
            ...tmp,
            last_val: d[internalPickIndex]?.io_adc?.[data.io]?.last_val ?? 0,
            last_sent: d[internalPickIndex]?.io_adc?.[data.io]?.last_sent ?? 0,
            sent_timeout: setTimeout(() => sendADC(internalPickID), ((new Date()).getTime() - (d?.[internalPickIndex]?.io_adc?.[data?.io]?.last_sent ?? 0)))
        }
        else
            d[internalPickIndex].io_adc[data.io] = {
                ...tmp,
                last_val: d[internalPickIndex]?.io_adc?.[data.io]?.last_val ?? 0,
                last_sent: d[internalPickIndex]?.io_adc?.[data.io]?.last_sent ?? 0,
                sent_timeout: null
            }
        onCloseChangeADC()
        return [...d]
    })
    return (<Fragment>
        <Container>
            <Grid container marginY={2}>
                <Grid item xs={12} md={6} lg={4}>
                    <Card elevation={3}>
                        <CardHeader title="Informasi Block" action={internalBlockSettings?.can_connect === true && readyState !== WebSocket.OPEN && (<NoSignalIcon />)} />
                        <Divider />
                        <CardContent>
                            <TextField label="ID Utama" margin="normal" autoComplete="off" variant="outlined" fullWidth
                                error={(internalBlockSettings?.id ?? '').length === 0}
                                value={internalBlockSettings?.id ?? ''}
                                onChange={e => setInternalBlockSettings(s => ({ ...s, id: e.target.value, can_connect: false }))}
                            />
                            <TextField label="Jumlah IO" margin="normal" autoComplete="off" variant="outlined" fullWidth
                                value={(internalBlockSettings?.io ?? 0) === 0 ? '' : internalBlockSettings.io}
                                onChange={e => setInternalBlockSettings(s => ({
                                    ...s,
                                    io: e.target.value === '' || isNaN(e.target.value) || parseInt(e.target.value) < 0 ? 0 : parseInt(e.target.value)
                                }))}
                            />
                            <TextField label="Jumlah Line" margin="normal" autoComplete="off" variant="outlined" fullWidth
                                value={(internalBlockSettings?.line ?? 0) === 0 ? '' : internalBlockSettings.line}
                                onChange={e => setInternalBlockSettings(s => ({
                                    ...s,
                                    line: e.target.value === '' || isNaN(e.target.value) || parseInt(e.target.value) < 0 ? 0 : parseInt(e.target.value)
                                }))}
                            />
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ justifyContent: 'end' }}>
                            <Button onClick={() => setIOLine({ IOLength: internalBlockSettings?.io ?? 0, LineLength: internalBlockSettings?.line ?? 0 })}>Simpan</Button>
                            <Button
                                onClick={() => setInternalBlockSettings(d => ({ ...d, can_connect: d?.can_connect !== true }))}>
                                {internalBlockSettings?.can_connect === true ? 'Putuskan' : 'Hubungkan'}
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
            <Box marginY={2}>
                <ButtonGroup variant="outlined">
                    {internalIDs.map(id => (<Button
                        key={`btn_id_${id}`}
                        variant={id === internalPickID ? 'contained' : undefined}
                        onClick={() => setInternalPickID(id)}
                    >
                        {id}
                    </Button>))}
                    <Button onClick={() => setModalAddInternalBlockOpen(true)} >Tambah Internal Block<AddIcon /></Button>
                </ButtonGroup>
            </Box>
            {internalPickID !== undefined && internalPickID !== null && (<Box><Button
                variant="contained"
                marginY={2}
                onClick={() => setInternalDataBlock(ds => ds.filter(d => d?.id !== internalPickID))}
            >
                Hapus Block {internalPickID} <DeleteIcon />
            </Button></Box>)}
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <Typography variant="h4">Steps</Typography>
                            <div><span>
                                <Switch checked={runStepsDirectly} onChange={(e, c) => setRunStepsDirectly(c === true)} />
                                <Typography display="inline">Otomatis</Typography>
                            </span></div>
                            <TextField label="Skala us ke ms" margin="normal" autoComplete="off" variant="outlined" fullWidth
                                value={(scaleUsToMs ?? 0) == 0 ? '' : scaleUsToMs}
                                onChange={e => setScaleUsToMs(e.target.value === '' || isNaN(e.target.value) || e.target.value < 0 ? 0 : parseInt(e.target.value))}
                            />
                        </Grid>
                        <GridItemSteps
                            steps={internalSteps}
                            onNextClick={nextStep}
                        />
                        <GridItemSyncIDs
                            syncIDs={internalSyncIDs}
                            onClickSendSyncID={(id) => setInternalSyncIDs(ids => {
                                sendJsonMessage({ reply_sync_id: id })
                                return Array.isArray(ids) ? ids.filter(i => i !== id) : []
                            })}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} lg={8}>
                    <CardIOLine
                        IOLineState={internalPickData?.io_l_state ?? []}
                        IOadc={internalPickData?.io_adc ?? []}
                        onStateChange={onStateChangeIOLineState}
                        onClickSendState={onClickSendState}
                        onClickSendADC={onClickSendADC}
                        disabledSend={readyState !== WebSocket.OPEN}
                        onADCChange={(data) => {
                            if (data?.io === undefined || data?.io === null || isNaN(data?.io) || data?.io < 0)
                                return
                            setModalChangeADC({
                                open: true,
                                io: parseInt(data?.io),
                                can_read: data?.can_read === true,
                                margin_adc: parseInt(data?.margin_adc ?? 0),
                                margin_t_ms: parseInt(data?.margin_t_ms ?? 0),
                                value: parseInt(data?.value ?? 0),
                            })
                        }}
                    />
                </Grid>
            </Grid>
        </Container>
        <DialogAddInternalBlock
            open={modalAddInternalBlockOpen === true}
            errorIDs={internalIDs}
            onClose={() => setModalAddInternalBlockOpen(false)}
            onSaveClick={onClickAddInternalBlock}
        />
        <DialogChangeADC
            open={modalChangeADC?.open === true}
            canRead={modalChangeADC?.can_read === true}
            io={modalChangeADC?.io ?? 0}
            marginADC={modalChangeADC?.margin_adc ?? 0}
            marginTms={modalChangeADC?.margin_t_ms ?? 0}
            value={modalChangeADC?.value ?? 0}
            onSaveClick={onClickChangeADC}
            onClose={onCloseChangeADC}
        />
        <Snackbar
            open={snackbarData?.open === true}
            autoHideDuration={2000}
            message={`${(snackbarData?.data ?? []).length > 1 ? `(${snackbarData.data.length})` : ""}${snackbarData?.data?.[0]?.message ?? ""}`}
            {...(snackbarData?.data?.[0]?.props ?? {})}
            onClose={() => {
                setSnackbarData(d => ({ ...d, open: false }))
                setTimeout(() => setSnackbarData(d => {
                    if (!Array.isArray(d?.data))
                        return { open: false, data: [] }
                    d.data.shift()
                    return { ...d, open: d.data.length > 0 }
                }), 500)
            }}
        >{snackbarData?.data?.[0]?.childrens}</Snackbar>
    </Fragment>)
}

export default BlockSimulator