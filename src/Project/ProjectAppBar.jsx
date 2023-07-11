import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { Fragment } from "react";
import { Link, useParams } from "react-router-dom"
import { Settings as SettingsIcon, Hub as HubIcon, Grid4x4 as GridIcon } from "@mui/icons-material"
const ProjectAppBar = () => {
    const {project_id} = useParams()
    return (<Fragment>
        <AppBar component="nav">
            <Toolbar>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ flexGrow: 1 }}
                >{project_id}</Typography>
                <Box>
                    <Link to={`/project/${encodeURIComponent(project_id)}/setup`} style={{color:"inherit"}}><SettingsIcon /></Link>
                    <Link to={`/project/${encodeURIComponent(project_id)}/matrix`} style={{color:"inherit"}}><GridIcon /></Link>
                    <Link to={`/project/${encodeURIComponent(project_id)}/component`} style={{color:"inherit"}}><HubIcon /></Link>
                </Box>
            </Toolbar>
        </AppBar>
    </Fragment >)
}

export default ProjectAppBar