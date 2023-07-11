import { Card, CardHeader, Switch, Typography, Divider, CardContent, Grid, Container, TableContainer, Table, TableHead, TableCell, TableRow, TableBody, Checkbox, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, CardActions, IconButton, Radio, Box } from "@mui/material"
import { Block as BlockIcon, ArrowBack as PreviousIcon, ArrowForward as NextIcon, Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon, Search as SearchIcon, Sync as SyncIcon } from "@mui/icons-material"
import { Fragment, useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import useWebSocket from "react-use-websocket"
import WSBaseURL from './../WSBaseURL'
const WS_URL = WSBaseURL + 'project/'

const getVoltageADC = (adc, adc_reference) => {
    const fixADC = adc === undefined || adc === null || isNaN(adc) || parseInt(adc) < 0 ? 0 : (parseInt(adc) > 4095 ? 4095 : parseFloat(adc))
    const voltage = (fixADC / 4095.0) * (5.0 * (2.0 / 3.0)) * (2.2 / 1.2)
    const fixADCRef = adc_reference === undefined || adc_reference === null || isNaN(adc_reference) || parseInt(adc_reference) < 0 ? 0 : (parseInt(adc_reference) > 4095 ? 4095 : parseFloat(adc_reference))
    const voltageRef = (fixADCRef / 4095.0) * (5.0 * (2.0 / 3.0)) * (2.2 / 1.2)
    return `${(voltage - voltageRef).toFixed(2)} V`
}

const CardIOLineState = ({
    IOLineState = [], LineIOs = [], withSteps = false,
    onChangeWithSteps = (e, checked = false) => { },
    onChangeCheck = (e, checked, data = { main_io: null, main_line: null }) => { },
    disableSync = false, onSyncClick = () => { }
}) => {
    const count = {
        io: (IOLineState ?? []).length,
        line: ((IOLineState ?? [])?.[0] ?? []).length
    }
    const i_count = { io: [...Array(count.io).keys()], line: [...Array(count.line).keys()] }
    return (<Card>
        <CardHeader
            title={<span>
                <IconButton
                    onClick={onSyncClick}
                    disabled={disableSync === true}
                ><SyncIcon /></IconButton>
                Status IO dan Jalur
            </span>}
            action={(<span>
                <Switch checked={withSteps === true} onChange={onChangeWithSteps} />
                <Typography display="inline">Setelah Steps</Typography>
            </span>)} />
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
                        {
                            i_count.line.map(line => (<TableRow key={`row_l_${line}`}>
                                <TableCell>{line}</TableCell>
                                {i_count.io.map(io => (<TableCell
                                    key={`state_io_${io}_l_${line}`}>
                                    {typeof IOLineState?.[io]?.[line] == 'boolean' ?
                                        (<Checkbox
                                            checked={IOLineState?.[io]?.[line] === true}
                                            onChange={(e, checked) => {
                                                if (typeof onChangeCheck == 'function')
                                                    onChangeCheck(e, checked, { main_io: io, main_line: line })
                                            }}
                                        />) :
                                        (<BlockIcon />)}
                                </TableCell>))}
                            </TableRow>))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </CardContent>
    </Card>)
}

const DialogAddSteps = ({ open = false, mainIO = null, mainLine = null, firstChecked = false, onSaveClick = ({ send_immediately = false, io = null, l = null, b_us = 0, st = false, a_us = 0 }) => { }, onClose = () => { } }) => {
    const [internalData, setInternalData] = useState({ b_us: 0, s: false, a_us: 0 })
    useEffect(() => setInternalData({ b_us: 0, a_us: 0, s: firstChecked === true }), [open, mainIO, mainLine, firstChecked])
    return (<Dialog
        open={open === true}
        onClose={onClose}
        fullWidth
        maxWidth="sm">
        <DialogTitle>Tambah Step IO {mainIO} Jalur {mainLine}</DialogTitle>
        <DialogContent dividers>
            <TextField label="Tunggu Sebelum Perubahan (us)" autoComplete="off" variant="outlined" margin="dense" fullWidth
                value={(internalData?.b_us ?? 0) === 0 ? "" : internalData?.b_us}
                onChange={(e) => setInternalData(d => ({
                    ...d,
                    b_us: e.target.value === '' || isNaN(e.target.value) || parseInt(e.target.value) < 0 ? 0 : parseInt(e.target.value)
                }))}
            />
            <div>
                <span>
                    <Checkbox checked={internalData?.s === true} onChange={(e, checked) => setInternalData(d => ({ ...d, s: checked === true }))} />
                    <Typography display="inline">Sambungkan</Typography>
                </span>
            </div>
            <TextField label="Tunggu Setelah Perubahan (us)" autoComplete="off" variant="outlined" margin="dense" fullWidth
                value={(internalData?.a_us ?? 0) === 0 ? "" : internalData?.a_us}
                onChange={(e) => setInternalData(d => ({
                    ...d,
                    a_us: e.target.value === '' || isNaN(e.target.value) || parseInt(e.target.value) < 0 ? 0 : parseInt(e.target.value)
                }))}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={() => {
                if (typeof onSaveClick == 'function')
                    onSaveClick({
                        send_immediately: true,
                        io: mainIO, l: mainLine, st: internalData?.s === true,
                        b_us: internalData?.b_us === undefined || internalData?.b_us === null || isNaN(internalData?.b_us) || parseInt(internalData?.b_us) < 0 ? 0 : parseInt(internalData?.b_us),
                        a_us: internalData?.a_us === undefined || internalData?.a_us === null || isNaN(internalData?.a_us) || parseInt(internalData?.a_us) < 0 ? 0 : parseInt(internalData?.a_us)
                    })
            }}>Tambah Dan Kirim</Button>
            <Button onClick={() => {
                if (typeof onSaveClick == 'function')
                    onSaveClick({
                        send_immediately: false,
                        io: mainIO, l: mainLine, st: internalData?.s === true,
                        b_us: internalData?.b_us === undefined || internalData?.b_us === null || isNaN(internalData?.b_us) || parseInt(internalData?.b_us) < 0 ? 0 : parseInt(internalData?.b_us),
                        a_us: internalData?.a_us === undefined || internalData?.a_us === null || isNaN(internalData?.a_us) || parseInt(internalData?.a_us) < 0 ? 0 : parseInt(internalData?.a_us)
                    })
            }}>Tambah</Button>
        </DialogActions>
    </Dialog>)
}

const GridItemSteps = ({ steps = [], onSwapStep = (i0, i1) => { }, onDeleteStep = (i_st) => { } }) => {
    return (<Fragment>
        {Array.isArray(steps) && steps.map((st, i_st) => (<Grid
            key={`step_${i_st}`}
            item
            xs={12} sm={4} md={6}>
            <Card>
                <CardContent>
                    <div><span>
                        <Typography display="inline" variant="subtitle2">Tunggu Sebelum </Typography>
                        <Typography display="inline" variant="body2">{st?.b_us ?? 0}</Typography>
                        <Typography display="inline" variant="subtitle2"> us</Typography>
                    </span></div>
                    <div><span>
                        <Checkbox disabled checked={st?.st === true} />
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
                <CardActions>
                    {i_st > 0 && (<IconButton
                        onClick={() => {
                            if (typeof onSwapStep == 'function')
                                onSwapStep(i_st, i_st - 1)
                        }}
                    ><PreviousIcon /></IconButton>)}
                    <IconButton><DeleteIcon
                        onClick={() => {
                            if (typeof onDeleteStep == 'function')
                                onDeleteStep(i_st)
                        }}
                    /></IconButton>
                    {i_st < steps.length - 1 && (<IconButton
                        onClick={() => {
                            if (typeof onSwapStep == 'function')
                                onSwapStep(i_st, i_st + 1)
                        }}
                    ><NextIcon /></IconButton>)}
                </CardActions>
            </Card>
        </Grid>))
        }
    </Fragment>)
}

const DialogAddIO = ({ open = false, onClose = () => { }, onSaveClick = ({ io = null, name = '' }) => { } }) => {
    const [internalData, setInternalData] = useState({ io: null, name: '' })
    useEffect(() => setInternalData({ io: null, name: '' }), [open])
    const onOKClick = () => {
        if (typeof onSaveClick != 'function' ||
            internalData?.io === undefined || internalData?.io === null || internalData?.io === '' || isNaN(internalData?.io) || parseInt(internalData?.io) < 0)
            return
        onSaveClick({ io: parseInt(internalData.io), name: internalData?.name ?? "" })
    }
    return (<Dialog
        open={open === true}
        onClose={onClose}>
        <DialogTitle>Tambah IO</DialogTitle>
        <DialogContent>
            <TextField label="IO" autoComplete="off" variant="outlined" margin="dense" fullWidth
                value={internalData?.io ?? ""}
                onChange={e => setInternalData(d => ({ ...d, io: e.target.value === '' || isNaN(e.target.value) || parseInt(e.target.value) < 0 ? null : parseInt(e.target.value) }))} />
            <TextField label="Nama" autoComplete="off" variant="outlined" margin="dense" fullWidth
                value={internalData?.name ?? ""} onChange={e => setInternalData(d => ({ ...d, name: e.target.value }))} />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onOKClick}>Simpan</Button>
        </DialogActions>
    </Dialog>)

}

const CardData = ({ IOADCs = [], onClickADC = (io) => { } }) => {
    const [internalIOs, setInternalIOs] = useState([])
    const [internalADCIOs, setInternalADCIOs] = useState([])
    const [virtualGND, setVirtualGND] = useState(null)
    const [openModalAddIO, setOpenModalAddIO] = useState(false)
    const refADC = useRef({ ios: [], adcs: [] })
    refADC.current.ios = internalIOs
    refADC.current.adcs = internalADCIOs
    useEffect(() => {
        try {
            const lastData = JSON.parse(sessionStorage.getItem("last_matrix_data") ?? "{}")
            setInternalADCIOs(lastData?.adcs ?? [])
            setInternalIOs(lastData?.ios ?? [])
        } catch (err) { }
        const pointer_refadc = refADC?.current
        return () => {
            if ((pointer_refadc?.adcs ?? []).length > 0)
                sessionStorage.setItem("last_matrix_data", JSON.stringify(pointer_refadc))
        }
    }, [])
    useEffect(() => {
        if ((refADC?.current.ios ?? []).length > 0 && sessionStorage.getItem("last_matrix_data") !== null)
            sessionStorage.removeItem("last_matrix_data")
    }, [internalIOs])
    const swapIO = (io0, io1) => setInternalIOs(d => {
        if (!Array.isArray(d))
            return []
        if (typeof d?.[io0] != 'object' || typeof d?.[io1] != 'object')
            return [...d]
        const adc0 = JSON.parse(JSON.stringify(d[io0]))
        const adc1 = JSON.parse(JSON.stringify(d[io1]))
        d[io0] = adc1
        d[io1] = adc0
        return [...d]
    })
    const deleteIO = (i) => setInternalIOs(d => {
        if (!Array.isArray(d))
            return []
        if (typeof d?.[i] != 'object')
            return [...d]
        d.splice(i, 1)
        return [...d]
    })
    const saveADCs = () => setInternalADCIOs(d => {
        d.push(JSON.parse(JSON.stringify(IOADCs)))
        return [...d]
    })
    const deleteADC = (i) => setInternalADCIOs(d => {
        if (!Array.isArray(d))
            return []
        if (!Array.isArray(d?.[i]))
            return [...d]
        d.splice(i, 1)
        return [...d]
    })
    const deleteAllADCs = () => setInternalADCIOs([])
    return (<Fragment>
        <Card>
            <CardHeader
                title="Data"
                action={(<Fragment>
                    <IconButton
                        onClick={deleteAllADCs}
                    ><DeleteIcon /></IconButton>
                    <IconButton
                        onClick={() => setOpenModalAddIO(true)}
                    ><AddIcon /></IconButton>
                </Fragment>)} />
            <Divider />
            <CardContent>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    IO
                                    <div><span>
                                        <Radio checked={virtualGND === null} onChange={() => setVirtualGND(null)} />
                                        <Typography display="inline">No GND Reference</Typography>
                                    </span></div>
                                </TableCell>
                                {internalIOs.map((io, i) => (<TableCell key={`header_io_${io?.io}`}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography>{io?.name === undefined || io?.name === null || io?.name === '' ? io?.io : `${io?.name} (${io?.io})`}</Typography>
                                        <div><span>
                                            <Radio checked={virtualGND === io?.io} onChange={() => setVirtualGND(io?.io)} />
                                            <Typography display="inline">GND Reference</Typography>
                                        </span></div>
                                        <div>
                                            {i > 0 && (<IconButton onClick={() => swapIO(i, i - 1)}><PreviousIcon /></IconButton>)}
                                            <IconButton onClick={() => deleteIO(i)}><DeleteIcon /></IconButton>
                                            {i < (internalIOs.length - 1) && (<IconButton onClick={() => swapIO(i, i + 1)}><NextIcon /></IconButton>)}
                                        </div>
                                    </Box>
                                </TableCell>))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {internalADCIOs.map((ios, i) => (<TableRow key={`data_adc_${i}`}>
                                <TableCell>
                                    <IconButton onClick={() => deleteADC(i)}><DeleteIcon /></IconButton>
                                </TableCell>
                                {internalIOs.map(io => (<TableCell key={`data_adc_${i}_io_${io?.io}`} sx={{ textAlign: 'center' }}>
                                    <Typography>{getVoltageADC(ios?.[io?.io], virtualGND === null ? 0 : ios?.[virtualGND])}</Typography>
                                </TableCell>))}
                            </TableRow>))}
                            <TableRow>
                                <TableCell>
                                    <IconButton
                                        onClick={saveADCs}
                                    ><SaveIcon /></IconButton>
                                </TableCell>
                                {internalIOs.map(io => (<TableCell key={`adc_io_${io?.io}`} sx={{ textAlign: 'center' }}>
                                    <Typography>{getVoltageADC(IOADCs?.[io?.io], virtualGND === null ? 0 : IOADCs?.[virtualGND])}</Typography>
                                    <IconButton
                                        onClick={() => {
                                            if (io?.io === undefined || io?.io === null || isNaN(io?.io) || parseInt(io?.io) < 0 || typeof onClickADC != 'function')
                                                return
                                            onClickADC(io.io)
                                        }}
                                    ><SearchIcon /></IconButton>
                                </TableCell>))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
        <DialogAddIO
            open={openModalAddIO === true}
            onClose={() => setOpenModalAddIO(false)}
            onSaveClick={(data) => setInternalIOs(ios => {
                if (!Array.isArray(ios))
                    return [data]
                ios = ios.filter(io => io?.io !== data.io)
                ios.push(data)
                setOpenModalAddIO(false)
                return [...ios]
            })}
        />
    </Fragment>)
}

const ProjectMatrix = () => {
    const { project_id } = useParams()
    const [internalIOLineState, setInternalIOLineState] = useState([])
    const [currentIOLineState, setCurrentIOLineState] = useState([])
    const [internalADCVals, setInternalADCVals] = useState([])
    const [withSteps, setWithSteps] = useState(true)
    const [internalSteps, setInternalSteps] = useState([])
    const [dataModalAddStep, setDataModalAddStep] = useState({ open: false, main_io: null, main_line: null, checked: false })
    const { readyState, lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL + encodeURIComponent(project_id) + '/matrix', { shouldReconnect: () => true })

    const swapSteps = (i0, i1) => setInternalSteps(d => {
        if (!Array.isArray(d)) return []
        if (typeof d?.[i0] != 'object' || typeof d?.[i1] != 'object') return [...d]
        const d0 = JSON.parse(JSON.stringify(d[i0]))
        const d1 = JSON.parse(JSON.stringify(d[i1]))
        d[i0] = d1
        d[i1] = d0
        return [...d]
    })

    const deleteStep = (i) => setInternalSteps(d => {
        if (!Array.isArray(d)) return []
        if (typeof d?.[i] != 'object') return [...d]
        d.splice(i, 1)
        return [...d]
    })

    useEffect(() => {
        document.title = 'Matrix ' + project_id + ' | Interkoneksi Rangkaian'
        return () => document.title = 'Interkoneksi Rangkaian'
    }, [project_id])

    useEffect(() => {
        const tmpIOLineState = []
        let maxLine = 0
        let needFillNull = false
        for (const [i_io, io] of (Array.isArray(currentIOLineState) ? currentIOLineState : []).entries()) {
            tmpIOLineState[i_io] = []
            if (!Array.isArray(io)) {
                needFillNull = true
                continue
            }
            for (const [i_l, l] of io.entries()) {
                if (i_io === 0) maxLine = i_l
                else if (i_l > maxLine) {
                    needFillNull = true
                    maxLine = i_l
                }
                tmpIOLineState[i_io][i_l] = typeof l != 'boolean' ? null : l === true
            }
        }
        if (needFillNull === true) {
            for (let io = 0; io < currentIOLineState.length; io++) {
                for (let l = 0; l <= maxLine; l++)
                    tmpIOLineState[io][l] = tmpIOLineState?.[io]?.[l] ?? null
            }
        }
        if (withSteps === true && Array.isArray(internalSteps)) {
            for (const step of internalSteps) {
                if (
                    step?.io === undefined || step?.io === null || isNaN(step?.io) || parseInt(step?.io) < 0 ||
                    step?.l === undefined || step?.l === null || isNaN(step?.l) || parseInt(step?.l) < 0 ||
                    typeof tmpIOLineState?.[step?.io]?.[step?.l] != 'boolean'
                )
                    continue
                tmpIOLineState[step.io][step.l] = step?.st === true
            }
        }
        setInternalIOLineState(tmpIOLineState)
    }, [withSteps, currentIOLineState, internalSteps])

    useEffect(() => {
        if (lastJsonMessage?.req === 'io_change') {
            setCurrentIOLineState(lastJsonMessage?.io_l_state ?? [])
            setInternalADCVals(lastJsonMessage?.adc_val ?? [])
        }
    }, [lastJsonMessage])

    return (<Fragment>
        <Container fixed>
            <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                    <CardIOLineState
                        IOLineState={internalIOLineState}
                        onChangeCheck={(e, checked, data) => setDataModalAddStep({ open: true, main_io: data.main_io, main_line: data.main_line, checked: checked === true })}
                        withSteps={withSteps === true}
                        onChangeWithSteps={(e, checked) => setWithSteps(checked === true)}
                        disableSync={readyState !== WebSocket.OPEN}
                        onSyncClick={() => {
                            if (Array.isArray(internalSteps) && internalSteps.length > 0)
                                setWithSteps(false)
                            sendJsonMessage({ req: 'sync_block', username: sessionStorage.getItem('name') }, false)
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <Typography variant="h4">Steps</Typography>
                            <Button variant="contained"
                                onClick={() => setInternalSteps(sts => {
                                    if (!Array.isArray(sts) || sts.length === 0)
                                        return []
                                    sendJsonMessage({ req: 'set_states', username: sessionStorage.getItem('name'), steps: sts }, false)
                                    return []
                                })}
                                disabled={readyState !== WebSocket.OPEN}
                            >Kirim</Button>
                        </Grid>
                        <GridItemSteps
                            steps={internalSteps}
                            onSwapStep={swapSteps}
                            onDeleteStep={deleteStep}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <CardData
                        IOADCs={internalADCVals}
                        onClickADC={io => sendJsonMessage({ req: 'read_adc', username: sessionStorage.getItem('name'), io })}
                    />
                </Grid>
            </Grid>
        </Container>
        <DialogAddSteps
            open={dataModalAddStep?.open === true}
            mainIO={dataModalAddStep?.main_io}
            mainLine={dataModalAddStep?.main_line}
            firstChecked={dataModalAddStep?.checked === true}
            onClose={() => setDataModalAddStep({ open: false, main_io: null, main_line: null, checked: false })}
            onSaveClick={(data) => setInternalSteps(s => {
                if (!Array.isArray(s))
                    s = []
                s.push({ io: data.io, l: data.l, st: data.st, b_us: data.b_us, a_us: data.a_us })
                setDataModalAddStep({ open: false, main_io: null, main_line: null, checked: false })
                if (data?.send_immediately === true) {
                    sendJsonMessage({ req: 'set_states', username: sessionStorage.getItem('name'), steps: s }, false)
                    return []
                }
                return [...s]
            })}
        />
    </Fragment>)
}

export default ProjectMatrix