import { Box, Button, Card, CardActions, CardContent, CardHeader, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Radio, Slider, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { Add as AddIcon, Block as BlockIcon, Delete as DeleteIcon, Settings as SettingsIcon, Check as YesIcon, Close as NoIcon, Sync as SyncIcon } from "@mui/icons-material"
import { useParams } from "react-router"
import useWebSocket from "react-use-websocket"
import WSBaseURL from './../WSBaseURL'
const WS_URL = WSBaseURL + 'project/'
const DialogSetCountIOLine = ({ open = true, io = 1, line = 1, onSetCountClick = (data = { io: 1, line: 1 }) => { }, onClose = () => { } }) => {
    const [internalCountIOLine, setInternalCountIOLine] = useState({ io: 1, line: 1 })
    useEffect(() => setInternalCountIOLine({ io: io ?? 1, line: line ?? 1 }), [io, line])
    return (<Dialog
        open={open === true}
        onClose={onClose}>
        <DialogTitle>Pengaturam jumlah I/O dan Jalur</DialogTitle>
        <DialogContent dividers>
            <TextField label="Jumlah I/O" margin="normal" autoComplete="off" variant="outlined" fullWidth
                value={((internalCountIOLine?.io ?? 1) === 0) ? '' : internalCountIOLine?.io ?? 1}
                onChange={e => setInternalCountIOLine(c => ({ ...c, io: e.target.value === '' ? 0 : ((isNaN(e.target.value) || parseInt(e.target.value) < 1) ? 1 : parseInt(e.target.value)) }))}
            />
            <TextField label="Jumlah Jalur" margin="normal" autoComplete="off" variant="outlined" fullWidth
                value={((internalCountIOLine?.line ?? 1) === 0) ? '' : internalCountIOLine?.line ?? 1}
                onChange={e => setInternalCountIOLine(c => ({ ...c, line: e.target.value === '' ? 0 : (isNaN(e.target.value) || parseInt(e.target.value) < 1) ? 1 : parseInt(e.target.value) }))}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button
                onClick={() => {
                    if (typeof onSetCountClick == 'function')
                        onSetCountClick(internalCountIOLine)
                }}
            >Simpan</Button>
        </DialogActions>
    </Dialog>)
}

const TableIOLine = ({ IOLineArray = [], ADCRefs = [], ADCSetups = [], newADCSetup = false, disabledSave = false,
    onAddClick = (data = { main_io: null, main_line: null }) => { },
    onDeleteClick = (data = { main_start_io: null, main_start_line: null }) => { },
    onADCReferenceClick = (data = { main_io: null, block_id: null, block_internal_id: null, block_io: null }) => { },
    onADCSetupClick = (data = { main_io: null, can_read: false, margin_adc: 0, margin_t_ms: 0 }) => { },
    onCountIOLineClick = () => { },
    onSaveSetupClick = () => { },
    onNewADCSetupClick = () => { },
}) => {
    const count = {
        io: (IOLineArray ?? []).length,
        line: ((IOLineArray ?? [])?.[0] ?? []).length
    }
    const i_count = { io: [...Array(count.io).keys()], line: [...Array(count.line).keys()] }
    return (<Grid item xs={12}>
        <Card elevation={3}>
            <CardHeader
                title="Pengaturan I/O dan Jalur"
                action={(<IconButton
                    onClick={onCountIOLineClick}
                >
                    <SettingsIcon />
                </IconButton>)}
            />
            <Divider />
            <CardContent>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Line\IO</TableCell>
                                {i_count.io.map(io => (<TableCell key={`header_io_${io}`}>{io}</TableCell>))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    ADC
                                    {newADCSetup === true && (<IconButton onClick={onNewADCSetupClick}><SyncIcon /></IconButton>)}
                                </TableCell>
                                {i_count.io.map(io => (<TableCell key={`adc_io_${io}`}>
                                    {ADCSetups?.[io]?.can_read === true ? (<YesIcon />) : (<NoIcon />)}
                                    <div>
                                        <Typography variant="subtitle2" display="inline">Margin ADC </Typography>
                                        <Typography variant="body2" display="inline">{ADCSetups?.[io]?.margin_adc ?? 0}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="subtitle2" display="inline">Margin t (ms) </Typography>
                                        <Typography variant="body2" display="inline">{ADCSetups?.[io]?.margin_t_ms ?? 0}</Typography>
                                    </div>
                                    <IconButton
                                        onClick={() => {
                                            if (typeof onADCSetupClick == 'function')
                                                onADCSetupClick({
                                                    main_io: io,
                                                    can_read: ADCSetups?.[io]?.can_read === true,
                                                    margin_adc: ADCSetups?.[io]?.margin_adc ?? 0,
                                                    margin_t_ms: ADCSetups?.[io]?.margin_t_ms ?? 0,
                                                })
                                        }}
                                    ><SettingsIcon /></IconButton>
                                    <div>
                                        <span>
                                            <Radio
                                                checked={ADCRefs?.[io] === null}
                                                onChange={() => {
                                                    if (typeof onADCReferenceClick == 'function')
                                                        onADCReferenceClick({ main_io: io, block_id: null, block_internal_id: null, block_io: null })
                                                }}
                                            />
                                            <Typography variant="caption" display="inline">Auto Reference</Typography>
                                        </span>
                                    </div>
                                </TableCell>))}
                            </TableRow>
                            {i_count.line.map(line => (<TableRow key={`row_l_${line}`}>
                                <TableCell>{line}</TableCell>
                                {i_count.io.map(io => (<TableCell key={`col_l_${line}_io_${io}`}>
                                    {
                                        (typeof IOLineArray?.[io]?.[line] !== 'object' || IOLineArray?.[io]?.[line] === null) && (<Fragment>
                                            <div>
                                                <Typography variant="subtitle2" display="inline">IO </Typography>
                                                <Typography variant="body2" display="inline">{io} </Typography>
                                            </div>
                                            <div>
                                                <Typography variant="subtitle2" display="inline">L </Typography>
                                                <Typography variant="body2" display="inline">{line}</Typography>
                                            </div>
                                            <IconButton
                                                onClick={() => { if (typeof onAddClick == 'function') onAddClick({ main_io: io, main_line: line }) }}
                                            ><AddIcon /></IconButton>
                                        </Fragment>) ||
                                        (<Fragment>
                                            <Typography variant="body1">
                                                {IOLineArray?.[io]?.[line]?.block_id}
                                                {IOLineArray?.[io]?.[line]?.block_internal_id !== undefined && IOLineArray?.[io]?.[line]?.block_internal_id !== null && IOLineArray?.[io]?.[line]?.block_internal_id !== '' && (` (${IOLineArray?.[io]?.[line]?.block_internal_id})`)}
                                            </Typography>
                                            <div>
                                                <Typography variant="subtitle2" display="inline">IO </Typography>
                                                <Typography variant="body2" display="inline">{IOLineArray?.[io]?.[line]?.block_io} </Typography>
                                            </div>
                                            <div>
                                                <Typography variant="subtitle2" display="inline">L </Typography>
                                                <Typography variant="body2" display="inline">{IOLineArray?.[io]?.[line]?.block_line}</Typography>
                                            </div>

                                            <div>
                                                <span>
                                                    <Radio checked={
                                                        ADCRefs?.[io]?.block_id === IOLineArray?.[io]?.[line]?.block_id &&
                                                        ADCRefs?.[io]?.block_internal_id === IOLineArray?.[io]?.[line]?.block_internal_id &&
                                                        ADCRefs?.[io]?.block_io === IOLineArray?.[io]?.[line]?.block_io
                                                    }
                                                        onChange={() => {
                                                            if (typeof onADCReferenceClick == 'function')
                                                                onADCReferenceClick({
                                                                    main_io: io,
                                                                    block_id: IOLineArray?.[io]?.[line]?.block_id,
                                                                    block_internal_id: IOLineArray?.[io]?.[line]?.block_internal_id,
                                                                    block_io: IOLineArray?.[io]?.[line]?.block_io
                                                                })
                                                        }}
                                                    />
                                                    <Typography variant="caption" display="inline">ADC Reference</Typography>
                                                </span>
                                            </div>
                                            <IconButton
                                                onClick={() => {
                                                    if (typeof onDeleteClick === 'function')
                                                        onDeleteClick({ main_start_io: IOLineArray?.[io]?.[line]?.main_start_io, main_start_line: IOLineArray?.[io]?.[line]?.main_start_line })
                                                }}
                                            ><DeleteIcon /></IconButton>
                                        </Fragment>)
                                    }
                                </TableCell>))}
                            </TableRow>))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'right' }}>
                <Button onClick={onSaveSetupClick} disabled={disabledSave === true}>Simpan</Button>
            </CardActions>
        </Card>
    </Grid>)
}

const DialogAddBlock = ({ open = false, maxCountIO = 0, maxCountLine = 0, currentIO = 0, currentLine = 0,
    onCountIOChange = (count_io = 1) => { },
    onSaveClick = (data = { count_io: 0, count_line: 0, block_id: null, block_internal_id: null, block_start_io: 0, block_start_line: 0 }) => { },
    onClose = () => { }
}) => {
    const [internalData, setInternalData] = useState({ count_io: 0, count_line: 0, block_id: null, block_internal_id: null, block_start_io: 0, block_start_line: 0 })
    useEffect(() => {
        setInternalData({ count_io: 0, count_line: 0, block_id: null, block_internal_id: null, block_start_io: 0, block_start_line: 0 })
    }, [open])
    const onOKClick = () => {
        if (
            internalData?.count_io === undefined || internalData?.count_io === null || isNaN(internalData?.count_io) || parseInt(internalData?.count_io) < 1 ||
            (maxCountIO !== undefined && maxCountIO !== null && !isNaN(maxCountIO) && parseInt(internalData?.count_io) > parseInt(maxCountIO)) ||
            internalData?.count_line === undefined || internalData?.count_line === null || isNaN(internalData?.count_line) || parseInt(internalData?.count_line) < 1 ||
            (maxCountLine !== undefined && maxCountLine !== null && !isNaN(maxCountLine) && parseInt(internalData?.count_line) > parseInt(maxCountLine)) ||
            internalData?.block_id === undefined || internalData?.block_id === null || internalData?.block_id === '' ||
            internalData?.block_start_io === undefined || internalData?.block_start_io === null || isNaN(internalData?.block_start_io) || parseInt(internalData?.block_start_io) < 0 ||
            internalData?.block_start_line === undefined || internalData?.block_start_line === null || isNaN(internalData?.block_start_line) || parseInt(internalData?.block_start_line) < 0
        )
            return
        if (typeof onSaveClick == 'function')
            onSaveClick({
                count_io: parseInt(internalData.count_io),
                count_line: parseInt(internalData.count_line),
                block_id: internalData.block_id,
                block_internal_id: isNaN(internalData?.block_internal_id) || internalData?.block_internal_id === null ? (internalData?.block_internal_id ?? null) : parseInt(internalData.block_internal_id),
                block_start_io: parseInt(internalData.block_start_io),
                block_start_line: parseInt(internalData.block_start_line),
            })
    }
    return (<Dialog
        open={open === true}
        onClose={onClose}
    >
        <DialogTitle>Atur I/O {currentIO} dan Jalur {currentLine}</DialogTitle>
        <DialogContent dividers>
            <Grid container>
                <Grid item xs={6}>
                    <TextField label="Jumlah I/O" value={(internalData?.count_io ?? 0) === 0 ? '' : internalData.count_io} autoComplete="off" variant="outlined" margin="dense" fullWidth
                        helperText={maxCountIO !== undefined && maxCountIO !== null && !isNaN(maxCountIO) ? `Jumlah IO maksimum : ${maxCountIO}` : undefined}
                        onChange={e => setInternalData(d => {
                            d.count_io = (e.target.value === '' ? 0 : (isNaN(e.target.value) || parseInt(e.target.value) < 0) ? 0 : parseInt(e.target.value))
                            if (maxCountIO !== undefined && maxCountIO !== null && !isNaN(maxCountIO) && d.count_io > maxCountIO)
                                d.count_io = maxCountIO
                            if (typeof onCountIOChange == 'function')
                                onCountIOChange((d.count_io < 1) ? 1 : d.count_io)
                            return { ...d }
                        })}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Jumlah Jalur" value={(internalData?.count_line ?? 0) === 0 ? '' : internalData.count_line} autoComplete="off" variant="outlined" margin="dense" fullWidth
                        helperText={maxCountLine !== undefined && maxCountLine !== null && !isNaN(maxCountLine) ? `Jumlah jalur maksimum : ${maxCountLine}` : undefined}
                        onChange={e => setInternalData(d => {
                            d.count_line = (e.target.value === '' ? 0 : (isNaN(e.target.value) || parseInt(e.target.value) < 0) ? 0 : parseInt(e.target.value))
                            if (maxCountLine !== undefined && maxCountLine !== null && !isNaN(maxCountLine) && d.count_line > maxCountLine)
                                d.count_line = maxCountLine
                            return { ...d }
                        })}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField label="ID Block" value={internalData?.block_id ?? ''} autoComplete="off" variant="outlined" margin="dense" fullWidth
                        onChange={e => setInternalData(d => ({ ...d, block_id: e.target.value }))}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField label="ID Internal Block" value={internalData?.block_internal_id ?? ''} autoComplete="off" variant="outlined" margin="dense" fullWidth
                        onChange={e => setInternalData(d => ({ ...d, block_internal_id: e.target.value === '' ? null : (isNaN(e.target.value) ? e.target.value : parseFloat(e.target.value)) }))}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Mulai I/O Block" value={internalData?.block_start_io ?? ''} autoComplete="off" variant="outlined" margin="dense" fullWidth
                        onChange={e => setInternalData(d => ({
                            ...d,
                            block_start_io: (e.target.value === '' ? null : (isNaN(e.target.value) || parseInt(e.target.value) < 0) ? 0 : parseInt(e.target.value))
                        }))}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Mulai Jalur Block" value={internalData?.block_start_line ?? ''} autoComplete="off" variant="outlined" margin="dense" fullWidth
                        onChange={e => setInternalData(d => ({
                            ...d,
                            block_start_line: (e.target.value === '' ? null : (isNaN(e.target.value) || parseInt(e.target.value) < 0) ? 0 : parseInt(e.target.value))
                        }))}
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onOKClick}>Simpan</Button>
        </DialogActions>
    </Dialog>)
}

const DialogADCSetup = ({ open = true, io = null, canRead = false, marginADC = 0, marginTms = 0,
    onClose = () => { },
    onSaveClick = (data = { main_io: null, can_read: false, margin_adc: 0, margin_t_ms: 0 }) => { }
}) => {
    const [internalADCSetup, setInternalADCSetup] = useState({ main_io: null, can_read: false, margin_adc: 0, margin_t_ms: 0 })
    useEffect(() => setInternalADCSetup({ main_io: io ?? null, can_read: canRead === true, margin_adc: marginADC ?? 0, margin_t_ms: marginTms ?? 0 }), [io, canRead, marginADC, marginTms])
    const onOKClick = () => {
        if (
            typeof onSaveClick != 'function' ||
            internalADCSetup?.main_io === undefined || internalADCSetup?.main_io === null || isNaN(internalADCSetup?.main_io) || internalADCSetup?.main_io < 0 ||
            internalADCSetup?.margin_adc === undefined || internalADCSetup?.margin_adc === null || isNaN(internalADCSetup?.margin_adc) || internalADCSetup?.margin_adc < 0 || internalADCSetup?.margin_adc >= 4096 ||
            internalADCSetup?.margin_t_ms === undefined || internalADCSetup?.margin_t_ms === null || isNaN(internalADCSetup?.margin_t_ms) || internalADCSetup?.margin_t_ms < 0 ||
            internalADCSetup?.can_read === undefined || internalADCSetup?.can_read === null || typeof internalADCSetup?.can_read != 'boolean'
        ) return
        onSaveClick(internalADCSetup.can_read === true ? {
            main_io: parseInt(internalADCSetup.main_io),
            margin_adc: parseInt(internalADCSetup.margin_adc),
            margin_t_ms: parseInt(internalADCSetup.margin_t_ms),
            can_read: true,
        } : {
            main_io: parseInt(internalADCSetup.main_io),
            margin_adc: 0,
            margin_t_ms: 0,
            can_read: false,
        })
    }
    return (<Dialog
        open={open === true}
        onClose={onClose}
    >
        <DialogTitle>Pengaturan ADC IO {internalADCSetup?.main_io}</DialogTitle>
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
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Batal</Button>
            <Button onClick={onOKClick}>Simpan</Button>
        </DialogActions>
    </Dialog>)
}

const ProjectSetup = () => {
    const { project_id } = useParams()
    const [modalCountIOLineMain, setModalCountIOLineMain] = useState({ open: false, io: 1, line: 1 })
    const [internalSetupIOLine, setInternalSetupIOLine] = useState([])
    const [internalADCReferences, setInternalADCReferences] = useState([])
    const [currentADCSetup, setCurrentADCSetup] = useState([])
    const [internalADCSetup, setInternalADCSetup] = useState({ changed: false, new_data: false, data: [] })
    const [modalAddIOLine, setModalAddIOLine] = useState({ open: false, main_start_io: 0, main_start_line: 0, max_io: 0, max_line: 0 })
    const [modalSetupADC, setModalSetupADC] = useState({ open: false, main_io: null, can_read: false, margin_adc: 0, margin_t_ms: 0 })
    const { readyState, lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL + encodeURIComponent(project_id) + '/setup', { shouldReconnect: () => true })

    useEffect(() => {
        document.title = 'Pengaturan ' + project_id + ' | Interkoneksi Rangkaian'
        return () => document.title = 'Interkoneksi Rangkaian'
    }, [project_id])

    useEffect(() => {
        if (lastJsonMessage?.req === 'setup_change') {
            setInternalSetupIOLine(lastJsonMessage?.io_l_setup ?? [])
            setInternalADCReferences(lastJsonMessage?.adc_refs ?? [])
            if (typeof onNewADCSetupClick == 'function')
                onNewADCSetupClick()
        } else if (lastJsonMessage?.req === 'io_change')
            setInternalADCSetup(d => {
                if (d?.changed !== true)
                    d = { changed: false, new_data: false, data: lastJsonMessage?.adc_setup ?? [] }
                else
                    d.new_data = true
                setCurrentADCSetup(lastJsonMessage?.adc_setup ?? [])
                return { ...d }
            })
    }, [lastJsonMessage])

    useEffect(() => {
        let change = false
        let maxLine = 0
        if (!Array.isArray(internalSetupIOLine))
            change = true
        for (let io = 0; io < (internalSetupIOLine ?? []).length; io++) {
            if (!Array.isArray(internalSetupIOLine[io]))
                change = true
            else if (io === 0)
                maxLine = internalSetupIOLine[io].length
            else if (internalSetupIOLine[io].length !== maxLine) {
                change = true
                if (internalSetupIOLine[io].length > maxLine)
                    maxLine = internalSetupIOLine[io].length
            } else {
                for (let line = 0; line < internalSetupIOLine[io].length; line++) {
                    const tempData = internalSetupIOLine?.[io]?.[line]
                    if (tempData === null)
                        continue
                    else if (
                        typeof tempData != 'object' ||
                        tempData?.block_id === undefined || tempData?.block_id === null ||
                        tempData?.block_io === undefined || tempData?.block_io === null ||
                        isNaN(tempData?.block_io) || parseInt(tempData?.block_io) < 0 ||
                        tempData?.block_line === undefined || tempData?.block_line === null ||
                        isNaN(tempData?.block_line) || parseInt(tempData?.block_line) < 0 ||
                        tempData?.main_start_io === undefined || tempData?.main_start_io === null ||
                        isNaN(tempData?.main_start_io) || parseInt(tempData?.main_start_io) < 0 ||
                        tempData?.main_start_line === undefined || tempData?.main_start_line === null ||
                        isNaN(tempData?.main_start_line) || parseInt(tempData?.main_start_line) < 0
                    )
                        change = true
                }
            }
        }
        if (change === true) {
            const tempIOLine = []
            for (let io = 0; io < (internalSetupIOLine ?? []).length; io++) {
                const tempLine = []
                for (let line = 0; line < maxLine; line++) {
                    const tempData = internalSetupIOLine?.[io]?.[line]
                    if (tempData === undefined || tempData === null || typeof tempData != 'object' ||
                        tempData?.block_id === undefined || tempData?.block_id === null ||
                        tempData?.block_io === undefined || tempData?.block_io === null ||
                        isNaN(tempData?.block_io) || parseInt(tempData?.block_io) < 0 ||
                        tempData?.block_line === undefined || tempData?.block_line === null ||
                        isNaN(tempData?.block_line) || parseInt(tempData?.block_line) < 0
                    )
                        tempLine.push(null)
                    else
                        tempLine.push({
                            block_id: internalSetupIOLine[io][line].block_id,
                            block_internal_id: internalSetupIOLine[io][line]?.block_internal_id,
                            block_io: parseInt(internalSetupIOLine[io][line].block_io),
                            block_line: parseInt(internalSetupIOLine[io][line].block_line),
                            main_start_io: tempData?.main_start_io,
                            main_start_line: tempData?.main_start_line,
                        })
                }
                tempIOLine.push(tempLine)
            }
            for (let io = 0; io < (tempIOLine ?? []).length; io++) {
                for (let line = 0; line < maxLine; line++) {
                    if (tempIOLine[io][line] !== null && typeof tempIOLine == 'object' && (
                        tempIOLine[io][line]?.main_start_io === undefined || tempIOLine[io][line]?.main_start_io === null || tempIOLine[io][line]?.main_start_io === '' ||
                        isNaN(tempIOLine[io][line]?.main_start_io) || parseInt(tempIOLine[io][line]?.main_start_io) < 0 ||
                        tempIOLine[io][line]?.main_start_line === undefined || tempIOLine[io][line]?.main_start_line === null || tempIOLine[io][line]?.main_start_line === '' ||
                        isNaN(tempIOLine[io][line]?.main_start_line) || parseInt(tempIOLine[io][line]?.main_start_line) < 0
                    )) {
                        let tmpMinLine = maxLine - 1
                        let tmpMaxIO = io
                        for (
                            let main_io = io, block_io = tempIOLine[io][line].block_io;
                            main_io < tempIOLine.length &&
                            block_io === tempIOLine[main_io][line]?.block_io &&
                            tempIOLine[io][line].block_id === tempIOLine[main_io][line]?.block_id &&
                            tempIOLine[io][line].block_internal_id === tempIOLine[main_io][line]?.block_internal_id &&
                            (tempIOLine[main_io][line]?.main_start_io === undefined || tempIOLine[main_io][line]?.main_start_io === null ||
                                tempIOLine[main_io][line]?.main_start_line === undefined || tempIOLine[main_io][line]?.main_start_line === null);
                            main_io++, block_io++
                        ) {
                            tmpMaxIO = main_io
                            let tmpMaxLine = line
                            for (
                                let main_line = line, block_line = tempIOLine[io][line].block_line;
                                main_line < (tmpMinLine + 1) &&
                                block_io === tempIOLine[main_io][main_line]?.block_io &&
                                block_line === tempIOLine[main_io][main_line]?.block_line &&
                                tempIOLine[io][line].block_id === tempIOLine[main_io][main_line]?.block_id &&
                                tempIOLine[io][line].block_internal_id === tempIOLine[main_io][main_line]?.block_internal_id &&
                                (tempIOLine[main_io][main_line]?.main_start_io === undefined || tempIOLine[main_io][main_line]?.main_start_io === null ||
                                    tempIOLine[main_io][main_line]?.main_start_line === undefined || tempIOLine[main_io][main_line]?.main_start_line === null);
                                main_line++, block_line++
                            )
                                tmpMaxLine = main_line
                            if (tmpMaxLine < tmpMinLine)
                                tmpMinLine = tmpMaxLine
                        }
                        for (let main_io = io; main_io <= tmpMaxIO; main_io++) {
                            for (let main_line = line; main_line <= tmpMinLine; main_line++) {
                                tempIOLine[main_io][main_line].main_start_io = io
                                tempIOLine[main_io][main_line].main_start_line = line
                            }
                        }
                    }
                }
            }
            setInternalSetupIOLine(tempIOLine)
        }
        setModalCountIOLineMain(c => ({ open: c?.open === true, io: (internalSetupIOLine ?? []).length, line: maxLine }))
    }, [internalSetupIOLine])

    useEffect(() => {
        const tmpADCRefs = []
        let change = false
        for (let io = 0; io < internalSetupIOLine.length; io++) {
            if (
                internalADCReferences?.[io] === undefined || internalADCReferences?.[io] === null ||
                internalADCReferences?.[io]?.block_id === undefined || internalADCReferences?.[io]?.block_id === null || internalADCReferences?.[io]?.block_id === '' ||
                internalADCReferences?.[io]?.block_io === undefined || internalADCReferences?.[io]?.block_io === null || isNaN(internalADCReferences?.[io]?.block_io) === null ||
                internalADCReferences?.[io]?.block_io < 0 || !Array.isArray(internalSetupIOLine?.[io])
            ) {
                if (internalADCReferences?.[io] !== null)
                    change = true
                tmpADCRefs.push(null)
            } else {
                let correctData = false
                for (let line = 0; line < internalSetupIOLine[io].length && correctData !== true; line++) {
                    if (
                        internalSetupIOLine[io]?.[line]?.block_id === internalADCReferences?.[io]?.block_id &&
                        internalSetupIOLine[io]?.[line]?.block_internal_id === internalADCReferences?.[io]?.block_internal_id &&
                        internalSetupIOLine[io]?.[line]?.block_io === internalADCReferences?.[io]?.block_io
                    )
                        correctData = true
                }
                if (correctData === true)
                    tmpADCRefs.push({
                        block_id: internalADCReferences[io].block_id,
                        block_internal_id: internalADCReferences[io]?.block_internal_id ?? null,
                        block_io: parseFloat(internalADCReferences[io]?.block_io),
                    })
                else {
                    change = true
                    tmpADCRefs.push(null)
                }
            }
        }
        if (change === true)
            setInternalADCReferences(tmpADCRefs)
    }, [internalADCReferences, internalSetupIOLine])

    useEffect(() => {
        let change = !Array.isArray(internalADCSetup?.data)
        change = change || (internalADCReferences ?? []).length !== (internalADCSetup?.data ?? []).length
        const tempADCSetup = []
        for (let io = 0; io < (internalADCReferences ?? []).length; io++) {
            change = change ||
                typeof internalADCSetup?.data?.[io]?.can_read != 'boolean' ||
                (typeof internalADCSetup?.data?.[io]?.margin_adc != 'number' && typeof internalADCSetup?.data?.[io]?.margin_adc != 'bigint') ||
                (typeof internalADCSetup?.data?.[io]?.margin_t_ms != 'number' && typeof internalADCSetup?.data?.[io]?.margin_t_ms != 'bigint')
            tempADCSetup.push({
                can_read: internalADCSetup?.data?.[io]?.can_read === true,
                margin_adc: parseFloat(internalADCSetup?.data?.[io]?.margin_adc ?? 0),
                margin_t_ms: parseFloat(internalADCSetup?.data?.[io]?.margin_t_ms ?? 0)
            })
        }
        if (change)
            setInternalADCSetup(d => ({ ...d, data: tempADCSetup }))
    }, [internalADCReferences, internalADCSetup])

    const getMaxLineNullMainIO = ({ main_start_io = 0, main_start_line = 0, main_end_io = 0 }) => {
        let maxLine = -1
        if (
            main_start_io === undefined || main_start_io === null || isNaN(main_start_io) || main_start_io < 0 ||
            main_start_line === undefined || main_start_line === null || isNaN(main_start_line) || main_start_line < 0 ||
            internalSetupIOLine?.[main_start_io]?.[main_start_line] !== null ||
            main_end_io === undefined || main_end_io === null || isNaN(main_end_io) || main_end_io < 0 || !Array.isArray(internalSetupIOLine?.[main_end_io])
        )
            return maxLine
        for (let main_io = main_start_io; main_io <= main_end_io; main_io++) {
            let tmpMaxLine = -1;
            for (let main_line = main_start_line;
                main_line < internalSetupIOLine[main_io].length && internalSetupIOLine[main_io][main_line] === null;
                main_line++)
                tmpMaxLine = main_line
            if (maxLine < 0 || (tmpMaxLine >= 0 && tmpMaxLine < maxLine))
                maxLine = tmpMaxLine
        }
        return maxLine
    }

    const getMaxIONullMainIO = ({ main_start_io = 0, main_start_line = 0 }) => {
        let maxIO = -1
        if (
            main_start_io === undefined || main_start_io === null || isNaN(main_start_io) || main_start_io < 0 ||
            main_start_line === undefined || main_start_line === null || isNaN(main_start_line) || main_start_line < 0 ||
            internalSetupIOLine?.[main_start_io]?.[main_start_line] !== null
        )
            return maxIO
        maxIO = main_start_io
        for (let main_io = main_start_io;
            main_io < internalSetupIOLine.length && Array.isArray(internalSetupIOLine[main_io]) && internalSetupIOLine[main_io]?.[main_start_line] === null;
            main_io++)
            maxIO = main_io
        return maxIO
    }

    const onCloseCountIOLine = () => setModalCountIOLineMain(d => ({ ...d, open: false }))
    const setCountClick = (data = { io: 1, line: 1 }) => setInternalSetupIOLine(io_l => {
        data = {
            io: (data?.io === undefined || data.io === null || data.io === '') ? 0 : ((isNaN(data.io) || parseInt(data.io) < 1) ? 1 : parseInt(data.io)),
            line: (data?.line === undefined || data?.line === null || data?.line === '') ? 0 : ((isNaN(data.line) || parseInt(data.line) < 1) ? 1 : parseInt(data.line)),
        }
        const tempIOLine = []
        for (let io = 0; io < data?.io ?? 1; io++) {
            const tempLine = []
            for (let line = 0; line < data?.line ?? 1; line++)
                tempLine.push(io_l?.[io]?.[line] ?? null)
            tempIOLine.push(tempLine)
        }
        onCloseCountIOLine()
        return tempIOLine
    })

    const onCloseModalAddIOLine = () => setModalAddIOLine({ open: false, main_start_io: null, main_start_line: null, max_io: null, max_line: null })
    const onAddIconClick = ({ main_io = 0, main_line = 0 }) => {
        if (main_io === undefined || main_io === null || isNaN(main_io) || main_io < 0 ||
            main_line === undefined || main_line === null || isNaN(main_line) || main_line < 0)
            return
        const max_io = getMaxIONullMainIO({ main_start_io: main_io, main_start_line: main_line })
        setModalAddIOLine({
            open: true, main_start_io: main_io, main_start_line: main_line, max_io,
            max_line: getMaxLineNullMainIO({ main_start_io: main_io, main_start_line: main_line, main_end_io: max_io })
        })
    }
    const onSaveModalAddIOLine = ({ count_io = 0, count_line = 0, block_id = '', block_internal_id = null, block_start_io = 0, block_start_line = 0, }) => {
        const main_end_io = (modalAddIOLine?.main_start_io ?? -1) + count_io - 1
        const main_end_line = (modalAddIOLine?.main_start_line ?? -1) + count_line - 1
        let all_null = true
        let tmpIOLine = Array.isArray(internalSetupIOLine) ? JSON.parse(JSON.stringify(internalSetupIOLine)) : []
        set_io_l_new:
        for (let main_io = (modalAddIOLine?.main_start_io ?? 0), block_io = block_start_io, i_io = 0;
            main_io <= main_end_io;
            main_io++, block_io++, i_io++) {
            if (!Array.isArray(tmpIOLine?.[main_io])) {
                all_null = false
                break set_io_l_new;
            }
            for (let main_line = (modalAddIOLine?.main_start_line ?? 0), block_line = block_start_line, i_line = 0;
                main_line <= main_end_line;
                main_line++, block_line++, i_line++) {
                if (tmpIOLine?.[main_io]?.[main_line] !== undefined && tmpIOLine?.[main_io]?.[main_line] !== null) {
                    all_null = false
                    break set_io_l_new;
                }
                tmpIOLine[main_io][main_line] = {
                    block_id, block_internal_id, block_io, block_line,
                    main_start_io: modalAddIOLine?.main_start_io,
                    main_start_line: modalAddIOLine?.main_start_line,
                }
            }
        }
        if (all_null === true)
            setInternalSetupIOLine(tmpIOLine)
        onCloseModalAddIOLine()
    }

    const onADCRefClick = ({ main_io, block_id, block_internal_id, block_io }) => setInternalADCReferences(d => {
        if (main_io === undefined || main_io === null || isNaN(main_io) || main_io < 0 || d?.[main_io] === undefined)
            return [...d]
        d[main_io] = (
            block_id === undefined || block_id === null || block_id === '' ||
            block_io === undefined || block_io === null || isNaN(block_io) || block_io < 0
        ) ? null : {
            block_id,
            block_internal_id: block_internal_id ?? null,
            block_io: parseFloat(block_io)
        }
        return [...d]
    })

    const onCloseSetupADC = () => setModalSetupADC({ open: false, main_io: null, can_read: false, margin_adc: 0, margin_t_ms: 0 })
    const onSaveSetupADC = (data) => setInternalADCSetup(d => {
        if (!Array.isArray(d?.data))
            return { ...d, data: [] }
        if (data?.main_io === undefined || data?.main_io === null || isNaN(data?.main_io) || data?.main_io < 0)
            return { ...d }
        d.changed = true
        d.data[data?.main_io] = {
            can_read: data?.can_read === true,
            margin_adc: parseInt(data?.margin_adc ?? 0),
            margin_t_ms: parseInt(data?.margin_t_ms ?? 0),
        }
        onCloseSetupADC()
        return { ...d }
    })

    const onNewADCSetupClick = () => setInternalADCSetup({ changed: false, new_data: false, data: [...currentADCSetup] })

    return (<Fragment>
        <Container fixed sx={{ p: 2 }}>
            <Grid container spacing={2}>
                <TableIOLine
                    IOLineArray={internalSetupIOLine}
                    onCountIOLineClick={() => setModalCountIOLineMain(c => ({ ...c, open: true }))}
                    onAddClick={onAddIconClick}
                    onADCReferenceClick={onADCRefClick}
                    onADCSetupClick={(data) => {
                        if (data?.main_io === undefined || data?.main_io === null || isNaN(data?.main_io) || data?.main_io < 0)
                            return
                        setModalSetupADC({
                            open: true,
                            main_io: parseInt(data?.main_io),
                            can_read: data?.can_read === true,
                            margin_adc: parseInt(data?.margin_adc ?? 0),
                            margin_t_ms: parseInt(data?.margin_t_ms ?? 0),
                        })
                    }}
                    ADCRefs={internalADCReferences}
                    ADCSetups={internalADCSetup?.data}
                    newADCSetup={internalADCSetup?.new_data === true}
                    onNewADCSetupClick={onNewADCSetupClick}
                    onDeleteClick={({ main_start_io, main_start_line }) => setInternalSetupIOLine(d => {
                        for (let io = 0; io < (d ?? []).length; io++) {
                            for (let line = 0; line < (d?.[io] ?? []).length; line++) {
                                if (d?.[io]?.[line]?.main_start_io === main_start_io && d?.[io]?.[line]?.main_start_line === main_start_line)
                                    d[io][line] = null
                            }
                        }
                        return [...d]
                    })}
                    disabledSave={readyState !== WebSocket.OPEN}
                    onSaveSetupClick={() => sendJsonMessage({ req: 'set_data', username: sessionStorage.getItem('name'), io_l_setup: internalSetupIOLine, adc_refs: internalADCReferences, adc_setup: internalADCSetup?.data ?? [] })}
                />
            </Grid>
        </Container>
        <DialogAddBlock
            open={modalAddIOLine?.open === true}
            currentIO={modalAddIOLine?.main_start_io}
            maxCountIO={1 + (modalAddIOLine?.max_io ?? 0) - (modalAddIOLine?.main_start_io ?? 0)}
            currentLine={modalAddIOLine?.main_start_line}
            maxCountLine={1 + (modalAddIOLine?.max_line ?? 0) - (modalAddIOLine?.main_start_line ?? 0)}
            onCountIOChange={(c_io) => setModalAddIOLine(d => ({
                ...d,
                max_line: getMaxLineNullMainIO({ main_start_io: d?.main_start_io ?? -1, main_start_line: d?.main_start_line ?? -1, main_end_io: (d?.main_start_io ?? -1) + c_io - 1 })
            }))}
            onClose={onCloseModalAddIOLine}
            onSaveClick={onSaveModalAddIOLine}
        />
        <DialogSetCountIOLine
            open={modalCountIOLineMain?.open === true}
            io={modalCountIOLineMain?.io ?? 1}
            line={modalCountIOLineMain?.line ?? 1}
            onSetCountClick={setCountClick}
            onClose={onCloseCountIOLine}
        />
        <DialogADCSetup
            open={modalSetupADC?.open === true}
            canRead={modalSetupADC?.can_read === true}
            io={modalSetupADC?.main_io ?? 0}
            marginADC={modalSetupADC?.margin_adc ?? 0}
            marginTms={modalSetupADC?.margin_t_ms ?? 0}
            onSaveClick={onSaveSetupADC}
            onClose={onCloseSetupADC}
        />
    </Fragment>)
}

export default ProjectSetup