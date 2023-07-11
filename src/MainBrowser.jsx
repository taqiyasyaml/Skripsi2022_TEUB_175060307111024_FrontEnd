import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProjectRegister from "./Project/ProjectRegister"
import ProjectBrowser from "./Project/ProjectBrowser"
import BlockSimulator from "./BlockSimulator"
const MainBrowser = () => (<BrowserRouter>
    <Routes>
        <Route path="/" element={<ProjectRegister />} />
        <Route path="/project/:project_id/*" element={<ProjectBrowser />} />
        <Route path="/block_simulator" element={<BlockSimulator/>} />
        <Route path="*" element={(<div>Nyasar</div>)} />
    </Routes>
</BrowserRouter>)

export default MainBrowser