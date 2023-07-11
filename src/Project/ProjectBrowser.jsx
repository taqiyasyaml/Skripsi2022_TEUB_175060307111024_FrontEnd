import { Box, Toolbar } from "@mui/material"
import { Fragment, useEffect, useState } from "react"
import { useNavigate, useParams, Routes, Route, Navigate } from "react-router-dom"
import ProjectAppBar from "./ProjectAppBar"
import ProjectComponent from "./ProjectComponent"
import ProjectMatrix from "./ProjectMatrix"
import ProjectNotification from "./ProjectNotification"
import ProjectSetup from "./ProjectSetup"
const ProjectBrowser = () => {
    const { project_id } = useParams()
    const nav = useNavigate()
    useEffect(() => {
        if (nav !== undefined && (sessionStorage.getItem("name") == "" || sessionStorage.getItem("name") == null || sessionStorage.getItem("name") == undefined))
            nav("/")
        if (sessionStorage.getItem("project_id") !== project_id) {
            sessionStorage.removeItem("last_diagram")
            sessionStorage.removeItem("last_matrix_data")
        }
        sessionStorage.setItem("project_id", project_id)
    }, [project_id])
    return (<Fragment>
        <ProjectAppBar />
        <Box component="main">
            <Toolbar />
            <Routes>
                <Route path="/" element={<ProjectComponent />} />
                <Route path="setup" element={<ProjectSetup />} />
                <Route path="matrix" element={<ProjectMatrix />} />
                <Route path="component" element={<ProjectComponent />} />
                <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
        </Box>
        <ProjectNotification />
    </Fragment>)
}

export default ProjectBrowser