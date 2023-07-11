import { Button, Card, CardActions, CardContent, CardHeader, Grid, TextField, Typography } from "@mui/material";
import { Box, Container, height, positions } from "@mui/system";
import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import schematic from "./schematic.jpg"

const ProjectRegister = () => {
    const [name, setName] = useState(sessionStorage.getItem("name") ?? "")
    const [projectId, setProjectId] = useState("")
    const nav = useNavigate()
    const onClickMasuk = () => {
        if (name.length > 0 && projectId.length > 0) {
            sessionStorage.setItem("name", name)
            nav("/project/" + encodeURIComponent(projectId))
        }
    }

    useEffect(() => { document.title = 'Interkoneksi Rangkaian' }, [])

    return (<Fragment>
        <Box
            component="main"
            sx={{
                backgroundImage: `url(${schematic})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'left bottom',
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: '0px',
                left: '0px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
            <Container sx={{ opacity: 0.7, margin: "normal" }} maxWidth="sm">
                <Card>
                    <CardHeader
                        title="Interkoneksi Rangkaian Terprogram"
                        subheader="Copyright &copy; 2022 Taqiy Asyam Listyawan"
                    />
                    <CardContent>
                        <TextField label="Nama" value={name} error={name.length === 0} onChange={e => setName(e.target.value)} margin="normal" autoComplete="off" variant="outlined" fullWidth />
                        <TextField label="ID Proyek" error={projectId.length === 0} value={projectId} onChange={e => setProjectId(e.target.value)} margin="normal" autoComplete="off" variant="outlined" fullWidth />
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'right' }}>
                        <Button onClick={onClickMasuk} >Masuk</Button>
                    </CardActions>
                </Card>
            </Container>
        </Box>
    </Fragment>)
}

export default ProjectRegister