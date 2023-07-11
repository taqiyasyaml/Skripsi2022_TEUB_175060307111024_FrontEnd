import { Close as CloseIcon } from "@mui/icons-material"
import { IconButton, Snackbar, Stack } from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket"

import WSBaseURL from './../WSBaseURL'
const WS_URL = WSBaseURL + 'project/'
const SNACKBAR_AUTOHIDE_MS = 1500
const SNACKBAR_DLYHIDE_MS = 100
const ProjectNotification = () => {
    const { project_id } = useParams()
    const { readyState, lastJsonMessage } = useWebSocket(WS_URL + encodeURIComponent(project_id) + '/notification', { shouldReconnect: () => true })
    const [snackbarData, setSnackbarData] = useState({ open: false, dly_timeout: null, data: [] })
    console.log(WS_URL + encodeURIComponent(project_id) + '/notification', readyState);
    const addSnackbarData = ({ message, childrens, props, check_message_duplicate }) => setSnackbarData(d => {
        if (!Array.isArray(d?.data) || (d?.data ?? []).length === 0)
            return { open: true, data: [{ message, childrens, props }] }
        if (check_message_duplicate !== true || d.data[d.data.length - 1].message !== message)
            d.data.push({ message, childrens, props })
        return { ...d }
    })
    useEffect(() => {
        if (lastJsonMessage?.req === 'new_notification' && lastJsonMessage?.message != null && lastJsonMessage?.message != undefined)
            addSnackbarData({ message: lastJsonMessage.message, check_message_duplicate: true })
    }, [lastJsonMessage])
    useEffect(() => {
        addSnackbarData({ message: `Koneksi ${readyState !== WebSocket.OPEN ? "Terputus" : "Terhubung"}`, check_message_duplicate: true })
    }, [readyState])
    const onSnackBarClose = () => setSnackbarData(d => {
        clearTimeout(d?.dly_timeout)
        d.dly_timeout = setTimeout(() => setSnackbarData(d => {
            if (!Array.isArray(d?.data))
                return { open: false, data: [] }
            d.data.shift()
            return { ...d, open: d.data.length > 0 }
        }), SNACKBAR_DLYHIDE_MS)
        return { ...d, open: false }
    })
    return (<Fragment>
        <Snackbar
            open={snackbarData?.open === true}
            autoHideDuration={SNACKBAR_AUTOHIDE_MS}
            message={`${(snackbarData?.data ?? []).length > 1 ? `(sisa notifikasi : ${snackbarData.data.length - 1}) ` : ""}${snackbarData?.data?.[0]?.message ?? ""}`}
            {...(snackbarData?.data?.[0]?.props ?? {})}
            onClose={onSnackBarClose}
            action={<IconButton
                color="inherit"
                onClick={onSnackBarClose}
            ><CloseIcon />
            </IconButton>}
            anchorOrigin={{horizontal:'right',vertical:'bottom'}}
        >{snackbarData?.data?.[0]?.childrens}</Snackbar>
    </Fragment>)
}

export default ProjectNotification